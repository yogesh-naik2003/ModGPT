import "./Chat.css";
import "highlight.js/styles/github-dark.css";
import { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { MyContext } from "./MyContext";

const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
};

function MessageContent({ content }) {
    return (
        <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
                pre({ children }) {
                    const codeText = String(children?.props?.children || "");

                    return (
                        <div className="codeBlockWrapper">
                            <button type="button" onClick={() => copyText(codeText)}>
                                Copy code
                            </button>
                            <pre>{children}</pre>
                        </div>
                    );
                }
            }}
        >
            {String(content || "")}
        </ReactMarkdown>
    );
}

function Chat() {
    const {
        newChat, prevChats, error, setError, isGenerating, streamingReply,
        regenerateResponse, editMessageAndRegenerate
    } = useContext(MyContext);
    const [editingMessageIndex, setEditingMessageIndex] = useState(null);
    const [editingMessage, setEditingMessage] = useState("");
    const chatsRef = useRef(null);

    useEffect(() => {
        chatsRef.current?.scrollTo({
            top: chatsRef.current.scrollHeight,
            behavior: "smooth"
        });
    }, [prevChats, streamingReply, isGenerating, error]);

    const startEditing = (index, content) => {
        setEditingMessageIndex(index);
        setEditingMessage(content);
    };

    const submitEdit = async (index) => {
        await editMessageAndRegenerate(index, editingMessage);
        setEditingMessageIndex(null);
        setEditingMessage("");
    };

    return (
        <main className="chatMain">
            {newChat && <h1 className="emptyTitle">Start a New Chat!</h1>}
            <div className="chats" ref={chatsRef}>
                {error && (
                    <div className="errorBanner" role="alert">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError("")}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                )}

                {prevChats?.map((chat, idx) => (
                    <div
                        className={chat.role === "user" ? "userDiv messageRow" : "gptDiv messageRow"}
                        key={`${idx}-${chat.timestamp || chat.content}`}
                    >
                        {editingMessageIndex === idx ? (
                            <form
                                className="editMessageForm"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submitEdit(idx);
                                }}
                            >
                                <textarea
                                    value={editingMessage}
                                    onChange={(e) => setEditingMessage(e.target.value)}
                                    autoFocus
                                />
                                <div>
                                    <button type="submit">Save</button>
                                    <button type="button" onClick={() => setEditingMessageIndex(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {chat.role === "user" ? (
                                    <p className="userMessage">{chat.content}</p>
                                ) : (
                                    <MessageContent content={chat.content} />
                                )}
                                <div className="messageActions">
                                    <button type="button" onClick={() => copyText(chat.content)} aria-label="Copy message">
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                    {chat.role === "user" && (
                                        <button type="button" onClick={() => startEditing(idx, chat.content)} aria-label="Edit message">
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                    )}
                                    {chat.role === "assistant" && (
                                        <button type="button" onClick={regenerateResponse} aria-label="Regenerate response">
                                            <i className="fa-solid fa-rotate-right"></i>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {streamingReply && (
                    <div className="gptDiv messageRow">
                        <MessageContent content={streamingReply} />
                    </div>
                )}

                {isGenerating && !streamingReply && (
                    <div className="gptDiv thinkingBubble">
                        <span>Thinking</span>
                        <span className="thinkingDots" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Chat;
