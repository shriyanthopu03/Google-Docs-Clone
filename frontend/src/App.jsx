import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import EditorPage from "./components/EditorPage";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";
import { disconnectSocket, getSocket } from "./utils/socket";

const API_BASE = "http://localhost:5000/api/auth";

function AuthRoute({ onAuthenticated }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";

  const fields = isSignup
    ? [
        { name: "name", type: "text", placeholder: "Name" },
        { name: "email", type: "email", placeholder: "Email" },
        { name: "password", type: "password", placeholder: "Password" },
      ]
    : [
        { name: "email", type: "email", placeholder: "Email" },
        { name: "password", type: "password", placeholder: "Password" },
      ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: name === "email" ? value.trimStart() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = isSignup
        ? {
            name: formValues.name,
            email: formValues.email.trim().toLowerCase(),
            password: formValues.password,
          }
        : {
            email: formValues.email.trim().toLowerCase(),
            password: formValues.password,
          };

      const endpoint = isSignup ? "/signup" : "/login";
      const response = await axios.post(`${API_BASE}${endpoint}`, payload);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onAuthenticated(response.data.token, response.data.user);

      setSuccess(response.data.message || `${isSignup ? "Signup" : "Login"} successful`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || "Unable to authenticate. Check your credentials.";
      const normalizedMessage = String(message).toLowerCase();

      if (!isSignup && normalizedMessage.includes("user not found")) {
        try {
          const fallbackName = formValues.name || formValues.email.split("@")[0] || "User";
          const signupResponse = await axios.post(`${API_BASE}/signup`, {
            name: fallbackName,
            email: formValues.email.trim().toLowerCase(),
            password: formValues.password,
          });

          localStorage.setItem("token", signupResponse.data.token);
          localStorage.setItem("user", JSON.stringify(signupResponse.data.user));
          onAuthenticated(signupResponse.data.token, signupResponse.data.user);
          setSuccess("Account created and signed in.");
          navigate("/dashboard", { replace: true });
          return;
        } catch (signupError) {
          setError(signupError?.response?.data?.message || message);
          return;
        }
      }

      setError(err?.response?.data?.message || "Unable to authenticate. Check your credentials.");
    }
  };

  const handleAlternate = () => {
    setError("");
    setSuccess("");
    setMode((current) => (current === "login" ? "signup" : "login"));
  };

  return (
    <AuthForm
      title={isSignup ? "Create account" : "Login"}
      fields={fields}
      submitLabel={isSignup ? "Create account" : "Login"}
      alternateLabel={isSignup ? "Back to sign in" : "Create account"}
      onSubmit={handleSubmit}
      onAlternate={handleAlternate}
      values={formValues}
      onChange={handleChange}
      error={error}
      success={success}
    />
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    const syncToken = () => {
      setToken(localStorage.getItem("token") || "");
    };

    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  useEffect(() => {
    if (token) {
      try {
        getSocket();
      } catch (e) {}
    } else {
      disconnectSocket();
    }
  }, [token]);

  // show realtime notifications (simple alert for now)
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      if (payload && payload.message) {
        // simple UX: alert; replace with toast if desired
        alert(payload.message);
      }
    };
    window.addEventListener('socket:notification', handler);
    return () => window.removeEventListener('socket:notification', handler);
  }, []);

  const handleAuthenticated = (nextToken, user) => {
    setToken(nextToken || "");
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/document/:id"
          element={token ? <EditorPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/dashboard"
          element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />

        <Route
          path="/profile"
          element={token ? <ProfilePage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <AuthRoute onAuthenticated={handleAuthenticated} />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;