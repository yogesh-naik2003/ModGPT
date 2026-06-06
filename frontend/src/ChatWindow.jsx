import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";
import { apiRequest } from "./api.js";

function ChatWindow() {
    const {
        prompt, setPrompt, prevChats, setError, isGenerating,
        settings, setSettings, sendMessage, stopGenerating, clearAllChats
    } = useContext(MyContext);
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const getReply = async () => {
        if (isGenerating) {
            return;
        }

        sendMessage(prompt);
    };


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    const exportThread = (format) => {
        if (!prevChats.length) {
            setError("No chat to export.");
            return;
        }

        const markdown = prevChats.map(chat => (
            `## ${chat.role === "user" ? "You" : "SigmaGPT"}\n\n${chat.content}`
        )).join("\n\n");
        const blob = new Blob([markdown], {type: format === "txt" ? "text/plain" : "text/markdown"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sigmagpt-chat.${format === "txt" ? "txt" : "md"}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        window.print();
    };

    const clearChats = async () => {
        try {
            await apiRequest("/api/thread", {method: "DELETE"});
            clearAllChats();
            setError("");
        } catch (err) {
            console.log(err);
            setError(err.message || "Failed to clear chats.");
        }
    };

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>ModGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    <button className="dropDownItem" type="button" onClick={() => setShowSettings(true)}>
                        <i className="fa-solid fa-gear"></i> Settings
                    </button>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            }
            {
                showSettings &&
                <div className="settingsPanel" role="dialog" aria-label="Settings">
                    <div className="settingsHeader">
                        <h2>Settings</h2>
                        <button type="button" onClick={() => setShowSettings(false)} aria-label="Close settings">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <label>
                        Theme
                        <select
                            value={settings.theme}
                            onChange={(e) => setSettings(prev => ({...prev, theme: e.target.value}))}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </label>
                    <label>
                        Model
                        <select
                            value={settings.model}
                            onChange={(e) => setSettings(prev => ({...prev, model: e.target.value}))}
                        >
                            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        </select>
                    </label>
                    <label>
                        Temperature
                        <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => setSettings(prev => ({...prev, temperature: e.target.value}))}
                        />
                    </label>
                    <label>
                        Max output tokens
                        <input
                            type="number"
                            min="128"
                            max="8192"
                            step="128"
                            value={settings.maxOutputTokens}
                            onChange={(e) => setSettings(prev => ({...prev, maxOutputTokens: e.target.value}))}
                        />
                    </label>
                    <div className="settingsActions">
                        <button type="button" onClick={() => exportThread("md")}>Export MD</button>
                        <button type="button" onClick={() => exportThread("txt")}>Export TXT</button>
                        <button type="button" onClick={exportPdf}>Export PDF</button>
                        <button type="button" className="dangerButton" onClick={clearChats}>Clear chats</button>
                    </div>
                </div>
            }
            <Chat></Chat>
            
            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                    >
                           
                    </input>
                    <button
                        className={isGenerating ? "submitButton stopButton" : "submitButton"}
                        type="button"
                        onClick={isGenerating ? stopGenerating : getReply}
                        aria-label={isGenerating ? "Stop generating" : "Send message"}
                    >
                        <i className={isGenerating ? "fa-solid fa-stop" : "fa-solid fa-paper-plane"}></i>
                    </button>
                </div>
                <p className="info">
                    ModGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;
