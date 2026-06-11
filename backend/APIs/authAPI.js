const router = require('express').Router();

const User = require('../models/UserModel');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');



const findUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return Promise.resolve(null);
  }

  return User.findOne({
    email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i'),
  });
};

const safeUser = (user) => {
  if (!user) {
    return null;
  }

  const plainUser = user.toObject ? user.toObject() : { ...user };
  delete plainUser.password;
  return plainUser;
};




router.post("/signup", async (req, res) => {

  try {

    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }


    // CHECK USER EXISTS
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }


    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // CREATE USER
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });


    // GENERATE TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    res.status(201).json({
      message: "Signup successful",
      token,
      user: safeUser(user),
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });

  }

});





router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }


    // FIND USER
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }


    // CHECK PASSWORD
    let isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch && user.password === password) {
      isMatch = true;
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }


    // GENERATE TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser(user),
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });

  }

});


module.exports = router;