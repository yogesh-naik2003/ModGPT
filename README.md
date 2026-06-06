# ModGPT 🤖

A full-stack AI chat application built with modern web technologies, featuring real-time streaming responses, persistent thread management, and customizable AI model settings.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

ModGPT is a conversational AI application that allows users to interact with AI models through an intuitive chat interface. The application supports multiple AI models (including Google's Gemini), thread-based conversation management, and customizable settings for AI behavior. It features real-time streaming of responses, message editing and regeneration capabilities, and a modern, responsive UI with dark/light theme support.

## ✨ Features

### Core Features
- **Real-time Streaming**: Stream AI responses in real-time as they're being generated
- **Thread Management**: Create and manage multiple independent conversation threads
- **Message Editing**: Edit previous messages and regenerate responses from that point
- **Response Regeneration**: Regenerate the last AI response with the same or modified context
- **Stop Generation**: Abort ongoing AI response generation at any time
- **Chat History**: Persistent storage of conversations with thread-based organization

### UI/UX Features
- **Dual Theme Support**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Syntax Highlighting**: Code blocks in responses are highlighted using Highlight.js
- **Markdown Support**: Full markdown rendering for formatted responses
- **Loading States**: Visual indicators for generating, loading, and error states

### AI Customization
- **Model Selection**: Choose between different AI models
- **Temperature Control**: Adjust response creativity and randomness
- **Token Limit Configuration**: Set maximum output tokens for responses
- **Extensible Settings**: Easy-to-extend settings system for future configurations

## 🛠 Tech Stack

### Frontend
- **React 19.2.6**: Modern UI framework with hooks
- **Vite 8.0.12**: Lightning-fast build tool and dev server
- **React Markdown**: Markdown rendering for AI responses
- **Highlight.js**: Syntax highlighting for code blocks
- **ESLint**: Code quality and consistency

### Backend
- **Node.js**: JavaScript runtime
- **Express.js 5.2.1**: Minimalist web framework
- **MongoDB**: NoSQL database for storing conversations
- **Mongoose 9.6.3**: MongoDB object modeling
- **Nodemon**: Development tool for auto-restarting server
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Languages
- **JavaScript**: 44,745 bytes (primary language)
- **CSS**: 14,113 bytes (styling)
- **HTML**: 627 bytes (markup)

## 📁 Project Structure

```
ModGPT/
├── Backend/
│   ├── Server.js              # Express server setup and routes
│   ├── package.json           # Backend dependencies
│   ├── routes/
│   │   └── chat.js           # Chat API routes
│   ├── models/               # Mongoose schemas
│   └── controllers/          # Request handlers
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css           # Main styles
│   │   ├── Sidebar.jsx       # Thread/chat history sidebar
│   │   ├── ChatWindow.jsx    # Main chat interface
│   │   ├── MyContext.jsx     # React Context for state management
│   │   ├── api.js            # API client with streaming support
│   │   └── id.js             # Thread ID generation utility
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── .eslintrc.cjs         # ESLint configuration
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16 or higher (v18+ recommended)
- **npm** or **yarn**: Package manager
- **MongoDB**: Local installation or MongoDB Atlas connection string
- **API Key**: Google Gemini API key (or your preferred AI service API key)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yogesh-naik2003/ModGPT.git
cd ModGPT
```

### 2. Install Backend Dependencies

```bash
cd Backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `Backend/` directory with the following variables:

```env
# Server Configuration
PORT=8000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/modgpt
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/modgpt

# API Configuration
OPENAI_API_KEY=your_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_GEMINI_MODEL=gemini-2.5-flash
```

## 🏃 Running the Application

### Option 1: Development Mode (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```
The backend will start on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### Option 2: Production Build

**Build Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Start Backend:**
```bash
cd Backend
npm start
```

## 📡 API Documentation

### Chat Endpoint

**Streaming Chat Response**

```
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Your message here",
  "threadId": "unique-thread-id",
  "model": "gemini-2.5-flash",
  "temperature": 0.7,
  "maxOutputTokens": 1024
}
```

**Response Format (Server-Sent Events):**

```json
// User message confirmation
{"type": "user", "messages": [...]}

// Streaming chunks
{"type": "chunk", "text": "..."}

// Completion
{"type": "done", "messages": [...], "reply": "..."}

// Error
{"type": "error", "error": "..."}
```

### Supported Query Parameters

- **message**: User's input message (string)
- **threadId**: Unique thread identifier (string)
- **regenerate**: Boolean flag to regenerate last response
- **replaceFromIndex**: Index to replace message and regenerate (number)
- **model**: AI model to use (string)
- **temperature**: Response randomness 0-1 (number)
- **maxOutputTokens**: Maximum response length (number)

## 💬 Usage Guide

### Starting a New Conversation

1. Open the application in your browser
2. Type your message in the input field at the bottom
3. Press Enter or click Send to submit
4. Watch the AI response stream in real-time

### Managing Threads

- **Sidebar**: View all previous conversation threads
- **New Chat**: Click the "New Chat" button to start a fresh thread
- **Switch Thread**: Click any thread to view its history
- **Delete Thread**: (If implemented) Remove old conversations

### Customizing AI Behavior

1. Open Settings (gear icon)
2. Adjust the following options:
   - **Model**: Choose your preferred AI model
   - **Temperature**: Higher = more creative, Lower = more focused
   - **Max Tokens**: Control response length
3. Changes apply to new messages immediately

### Advanced Message Actions

- **Regenerate**: Click regenerate icon to create a new response
- **Edit**: Click edit icon to modify your message and regenerate
- **Stop**: Press the stop button during generation to cancel

### Theme Toggle

- Click the theme toggle in the header to switch between light and dark modes
- Preference is stored in local state

## 🏗 Architecture

### Frontend Architecture

**State Management:**
- React Context API (`MyContext`) for global state
- Local component state for UI interactions
- useRef for uncontrolled components (abort controller)

**Key Components:**
- `App.jsx`: Main orchestrator managing all state and logic
- `Sidebar.jsx`: Thread list and navigation
- `ChatWindow.jsx`: Message display and input handling
- `MyContext.jsx`: Context provider setup

**Data Flow:**
1. User input → `sendMessage()`
2. Message added to `prevChats`
3. API call to backend with streaming
4. Chunks received and accumulated in `streamingReply`
5. On completion, moved to `prevChats` as full message

### Backend Architecture

**Express Server Setup:**
- CORS enabled for frontend communication
- JSON body parser middleware
- MongoDB connection on startup
- Chat routes mounted at `/api` prefix

**Request Handling:**
- Receive user message and thread context
- Call AI API (Google Gemini, OpenAI, etc.)
- Stream response back using Server-Sent Events
- Save conversation to MongoDB

**Database Schema:**
```
Thread
├── _id: ObjectId (thread ID)
├── messages: Array
│   ├── role: "user" | "assistant"
│   └── content: String
└── createdAt: Date
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Use meaningful variable and function names
- Comment complex logic
- Test new features before submitting PR
- Update this README for significant changes

## 📝 Future Enhancements

- [ ] User authentication and authorization
- [ ] Multiple AI provider integration (OpenAI, Claude, etc.)
- [ ] Image upload and processing
- [ ] Voice input/output support
- [ ] Export conversations as PDF
- [ ] Conversation search and filtering
- [ ] Collaborative chats
- [ ] Plugin/extension system
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration

## 🐛 Troubleshooting

### Backend won't connect to MongoDB
- Verify MongoDB is running locally or check your connection string
- Ensure `.env` has correct `MONGODB_URI`

### Frontend can't reach backend
- Check if backend is running on port 8000
- Verify `VITE_API_URL` in `.env.local` is correct
- Check CORS configuration in `Server.js`

### API Key errors
- Ensure your API keys are correctly set in `.env`
- Check API provider's rate limits
- Verify API key has necessary permissions

### Streaming not working
- Check browser console for errors
- Verify backend is sending proper SSE format
- Ensure fetch API supports AbortController

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Yogesh Naik**
- GitHub: [@yogesh-naik2003](https://github.com/yogesh-naik2003)

---

**Happy Chatting! 🚀**

For questions or issues, please open a GitHub issue on the repository.
