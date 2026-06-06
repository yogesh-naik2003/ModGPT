import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import {MyContext} from "./MyContext.jsx";
import { useRef, useState } from 'react';
import { createThreadId } from "./id.js";
import { streamRequest } from "./api.js";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(createThreadId());
  const [prevChats, setPrevChats] = useState([]); //stores all chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [settings, setSettings] = useState({
    theme: "dark",
    model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash",
    temperature: 0.7,
    maxOutputTokens: 1024
  });
  const abortControllerRef = useRef(null);

  const runStream = async (payload, optimisticMessages) => {
    if (isGenerating) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setError("");
    setReply(null);
    setStreamingReply("");
    setIsGenerating(true);
    setNewChat(false);

    if (optimisticMessages) {
      setPrevChats(optimisticMessages);
    }

    try {
      await streamRequest("/api/chat/stream", {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify({
          ...payload,
          threadId: currThreadId,
          model: settings.model,
          temperature: settings.temperature,
          maxOutputTokens: settings.maxOutputTokens
        })
      }, {
        user: (data) => setPrevChats(data.messages || []),
        chunk: (data) => setStreamingReply(prev => `${prev}${data.text || ""}`),
        done: (data) => {
          setPrevChats(data.messages || []);
          setReply(data.reply || "");
          setStreamingReply("");
        },
        error: (data) => {
          setError(data.error || "Failed to generate response.");
        }
      });
    } catch (err) {
      console.log(err);
      if (err.name === "AbortError") {
        setError("Response stopped.");
      } else if (err instanceof TypeError) {
        setError("Backend not running or unreachable.");
      } else {
        setError(err.message || "Failed to generate response.");
      }
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const sendMessage = async (message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    await runStream(
      {message: trimmedMessage},
      [...prevChats, {role: "user", content: trimmedMessage}]
    );
    setPrompt("");
  };

  const regenerateResponse = async () => {
    const lastUserIndex = prevChats.map((chat, index) => ({chat, index}))
      .filter(item => item.chat.role === "user")
      .at(-1)?.index;

    if (lastUserIndex === undefined) {
      setError("No user message to regenerate from.");
      return;
    }

    await runStream(
      {regenerate: true},
      prevChats.slice(0, lastUserIndex + 1)
    );
  };

  const editMessageAndRegenerate = async (messageIndex, message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Message cannot be empty.");
      return;
    }

    await runStream(
      {replaceFromIndex: messageIndex, message: trimmedMessage},
      [...prevChats.slice(0, messageIndex), {role: "user", content: trimmedMessage}]
    );
  };

  const stopGenerating = () => {
    abortControllerRef.current?.abort();
  };

  const clearAllChats = async () => {
    setAllThreads([]);
    setPrevChats([]);
    setReply(null);
    setStreamingReply("");
    setNewChat(true);
    setCurrThreadId(createThreadId());
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    error, setError,
    isGenerating, setIsGenerating,
    streamingReply, setStreamingReply,
    settings, setSettings,
    sendMessage,
    regenerateResponse,
    editMessageAndRegenerate,
    stopGenerating,
    clearAllChats
  }; 

  return (
    <div className={`app ${settings.theme === "light" ? "lightTheme" : ""}`}>
      <MyContext.Provider value={providerValues}>
          <Sidebar></Sidebar>
          <ChatWindow></ChatWindow>
        </MyContext.Provider>
    </div>
  )
}

export default App
