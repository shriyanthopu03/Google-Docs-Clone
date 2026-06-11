# Google Docs Clone

A full-stack collaborative document editor with authentication, document sharing, live collaboration, autosave, and history tracking.

## Features

- User signup and login
- Create, edit, and delete documents
- Share documents with other users
- Owner-only collaboration management
- Live editing support with Yjs / WebSocket collaboration
- Socket.IO-based notifications and presence updates
- Document history with last saved timestamp and user

## Project Structure

```text
backend/
	APIs/
	config/
	middleware/
	models/
	server.js
	y-websocket-server.js
frontend/
	src/
		components/
		utils/
		App.jsx
```

## Packages Used

### Backend

- `express` - API server and routing
- `mongoose` - MongoDB models and database access
- `dotenv` - environment variable loading
- `cors` - cross-origin requests from the frontend
- `jsonwebtoken` - auth token generation and verification
- `bcryptjs` - password hashing
- `cookie-parser` - cookie parsing for auth support
- `multer` - file upload handling
- `cloudinary` - media upload storage
- `socket.io` - realtime notifications and presence
- `y-websocket` - collaborative editing endpoint

### Frontend

- `react` and `react-dom` - UI rendering
- `react-router-dom` - client-side routing
- `axios` - API requests
- `socket.io-client` - realtime socket communication
- `yjs` - collaborative document state
- `y-websocket` - collaboration transport provider
- `@tiptap/react` - rich text editor integration
- `@tiptap/starter-kit` - base editor extensions
- `@tiptap/extension-collaboration` - Yjs collaboration extension
- `dotenv` - optional frontend env loading during local development

## Workflow

1. The user opens the frontend in the browser.
2. The frontend checks local storage for a saved auth token.
3. If the user logs in or signs up, the frontend sends credentials to the backend API.
4. The backend validates the user, creates a JWT token, and returns the user profile.
5. The frontend stores the token and uses it for authenticated API requests.
6. The dashboard requests `/api/documents` and shows owned and shared documents.
7. When a document is opened, the frontend fetches its full content and metadata.
8. The editor autosaves changes to the backend.
9. The backend persists the latest document state and stores who last saved it.
10. If collaboration is enabled by the owner, the frontend also connects to the realtime layer for shared updates.

## How It Runs

### Backend startup

1. `npm start` runs `node server.js` in the backend folder.
2. `dotenv` loads `backend/.env`.
3. Express starts on the configured port, usually `5000`.
4. MongoDB connects using `mongob_url` if it exists, otherwise it falls back to `MONGO_URL`.
5. Socket.IO and the Yjs websocket endpoint are attached to the same server.
6. CORS only accepts the origins listed in `FRONTEND_URL` and `BACKEND_URL`.

### Frontend startup

1. `npm run dev` starts the Vite dev server.
2. React loads the app in the browser.
3. The app sends API calls to `http://localhost:5000/api` by default.
4. Realtime requests go to the configured Socket.IO and Yjs endpoints.



## Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the App

### Start the backend

```bash
cd backend
npm start
```


### Start the frontend

```bash
cd frontend
npm run dev
```


## Available Scripts

### Backend

- `npm start` - start the API server

### Frontend

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

## Notes

- Keep `.env` files out of Git. The repo already ignores them.
- The backend requires a valid MongoDB connection before document features work.
- Collaboration features use both Socket.IO and Yjs endpoints.



