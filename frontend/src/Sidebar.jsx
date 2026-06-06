import "./Sidebar.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { createThreadId } from "./id.js";
import logoUrl from "./assets/blacklogo.png";
import { apiRequest } from "./api.js";

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, setError} = useContext(MyContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingThreadId, setEditingThreadId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);

    const getAllThreads = useCallback(async () => {
        try {
            const res = await apiRequest("/api/thread");
            const filteredData = res.map(thread => ({
                threadId: thread.threadId,
                title: thread.title,
                pinned: Boolean(thread.pinned)
            }));
            //console.log(filteredData);
            setAllThreads(filteredData);
        } catch(err) {
            console.log(err);
            setError(err.message || "Failed to load chats.");
        }
    }, [setAllThreads, setError]);

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, getAllThreads])


    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setError("");
        setCurrThreadId(createThreadId());
        setPrevChats([]);
    }

    const changeThread = async (newThreadId) => {
        if (editingThreadId) {
            return;
        }

        setCurrThreadId(newThreadId);
        setError("");

        try {
            const res = await apiRequest(`/api/thread/${newThreadId}`);
            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch(err) {
            console.log(err);
            setError(err.message || "Failed to load chat.");
        }
    }   

    const deleteThread = async (threadId) => {
        try {
            const res = await apiRequest(`/api/thread/${threadId}`, {method: "DELETE"});
            console.log(res);

            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));
            setPendingDelete(null);

            if(threadId === currThreadId) {
                createNewChat();
            }

        } catch(err) {
            console.log(err);
            setError(err.message || "Failed to delete chat.");
        }
    }

    const startRenaming = (thread) => {
        setEditingThreadId(thread.threadId);
        setEditingTitle(thread.title);
        setPendingDelete(null);
    };

    const cancelRenaming = () => {
        setEditingThreadId(null);
        setEditingTitle("");
    };

    const renameThread = async (threadId) => {
        const trimmedTitle = editingTitle.trim();

        if (!trimmedTitle) {
            setError("Thread title cannot be empty.");
            return;
        }

        try {
            const updatedThread = await apiRequest(`/api/thread/${threadId}`, {
                method: "PATCH",
                body: JSON.stringify({title: trimmedTitle})
            });

            setAllThreads(prev => prev.map(thread => (
                thread.threadId === threadId ? updatedThread : thread
            )));
            cancelRenaming();
            setError("");
        } catch(err) {
            console.log(err);
            setError(err.message || "Failed to rename chat.");
        }
    };

    const togglePinned = async (thread) => {
        try {
            const updatedThread = await apiRequest(`/api/thread/${thread.threadId}`, {
                method: "PATCH",
                body: JSON.stringify({pinned: !thread.pinned})
            });

            setAllThreads(prev => prev.map(item => (
                item.threadId === thread.threadId ? updatedThread : item
            )).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
        } catch(err) {
            console.log(err);
            setError(err.message || "Failed to pin chat.");
        }
    };

    const filteredThreads = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return allThreads;
        }

        return allThreads.filter(thread => thread.title.toLowerCase().includes(query));
    }, [allThreads, searchQuery]);

    return (
        <section className="sidebar">
            <button className="newChatButton" type="button" onClick={createNewChat}>
                <img src={logoUrl} alt="gpt logo" className="logo"></img>
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>

            <div className="searchBox">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats"
                    aria-label="Search chats"
                />
            </div>

            <ul className="history">
                {
                    filteredThreads?.map((thread) => (
                        <li key={thread.threadId} 
                            onClick={() => changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted": " "}
                        >
                            {editingThreadId === thread.threadId ? (
                                <form
                                    className="renameForm"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        renameThread(thread.threadId);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                                cancelRenaming();
                                            }
                                        }}
                                    />
                                    <button type="submit" aria-label="Save title">
                                        <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button type="button" onClick={cancelRenaming} aria-label="Cancel rename">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <span className="threadTitle">{thread.title}</span>
                                    <div className="threadActions">
                                        <button
                                            type="button"
                                            aria-label={thread.pinned ? "Unpin chat" : "Pin chat"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePinned(thread);
                                            }}
                                        >
                                            <i className={thread.pinned ? "fa-solid fa-thumbtack pinnedIcon" : "fa-solid fa-thumbtack"}></i>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Rename chat"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startRenaming(thread);
                                            }}
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Delete chat"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingDelete(thread);
                                            }}
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))
                }
            </ul>

            {pendingDelete && (
                <div className="confirmDelete" role="dialog" aria-label="Confirm delete">
                    <p>Delete "{pendingDelete.title}"?</p>
                    <div>
                        <button type="button" onClick={() => deleteThread(pendingDelete.threadId)}>
                            Delete
                        </button>
                        <button type="button" onClick={() => setPendingDelete(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
 
            <div className="sign">
                <p>By Yogesh Naik &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar;
