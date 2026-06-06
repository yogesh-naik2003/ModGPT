import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse, { streamGeminiAPIResponse } from "../utils/gemini.js";

const router = express.Router();

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"});
    }
});

//Get all threads
router.get("/thread", async(req, res) => {
    try {
        const threads = await Thread.find({}).sort({pinned: -1, updatedAt: -1});
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.delete("/thread", async (req, res) => {
    try {
        const result = await Thread.deleteMany({});
        res.status(200).json({
            success: "All threads deleted successfully",
            deletedCount: result.deletedCount
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to clear chats"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        const thread = await Thread.findOne({threadId});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({threadId});

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});

router.patch("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;
    const {title, pinned} = req.body;
    const trimmedTitle = title?.trim();

    if(title !== undefined && !trimmedTitle) {
        return res.status(400).json({error: "Thread title cannot be empty"});
    }

    try {
        const update = {updatedAt: new Date()};

        if (trimmedTitle) {
            update.title = trimmedTitle;
        }

        if (typeof pinned === "boolean") {
            update.pinned = pinned;
        }

        const thread = await Thread.findOneAndUpdate(
            {threadId},
            update,
            {new: true}
        );

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({
            threadId: thread.threadId,
            title: thread.title,
            pinned: thread.pinned
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to rename thread"});
    }
});

const prepareThreadForGeneration = async ({
    threadId,
    message,
    replaceFromIndex,
    regenerate
}) => {
    let thread = await Thread.findOne({threadId});

    if (!thread) {
        if (!message) {
            throw new Error("Message is required");
        }

        thread = new Thread({
            threadId,
            title: message,
            messages: []
        });
    }

    if (Number.isInteger(replaceFromIndex)) {
        if (!message) {
            throw new Error("Edited message is required");
        }

        thread.messages = thread.messages.slice(0, replaceFromIndex);
        thread.messages.push({role: "user", content: message});
        return thread;
    }

    if (regenerate) {
        const lastUserIndex = thread.messages
            .map((chat, index) => ({chat, index}))
            .filter(item => item.chat.role === "user")
            .at(-1)?.index;

        if (lastUserIndex === undefined) {
            throw new Error("No user message to regenerate from");
        }

        thread.messages = thread.messages.slice(0, lastUserIndex + 1);
        return thread;
    }

    if (!message) {
        throw new Error("Message is required");
    }

    thread.messages.push({role: "user", content: message});
    return thread;
};

const sendEvent = (res, event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

router.post("/chat", async(req, res) => {
    const {threadId, message, model, temperature, maxOutputTokens, replaceFromIndex, regenerate} = req.body;

    if(!threadId) {
        return res.status(400).json({error: "missing required fields"});
    }

    try {
        const thread = await prepareThreadForGeneration({
            threadId,
            message,
            replaceFromIndex,
            regenerate
        });
        const assistantReply = await getGeminiAPIResponse(thread.messages.slice(-12), {
            model,
            temperature,
            maxOutputTokens
        });

        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply: assistantReply});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: err.message || "Failed to generate response"});
    }
});

router.post("/chat/stream", async(req, res) => {
    const {threadId, message, model, temperature, maxOutputTokens, replaceFromIndex, regenerate} = req.body;

    if(!threadId) {
        return res.status(400).json({error: "missing required fields"});
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
        const thread = await prepareThreadForGeneration({
            threadId,
            message,
            replaceFromIndex,
            regenerate
        });

        sendEvent(res, "user", {
            messages: thread.messages
        });

        const assistantReply = await streamGeminiAPIResponse(
            thread.messages.slice(-12),
            {model, temperature, maxOutputTokens},
            (text) => sendEvent(res, "chunk", {text})
        );

        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        sendEvent(res, "done", {
            reply: assistantReply,
            messages: thread.messages
        });
        res.end();
    } catch(err) {
        console.log(err);
        sendEvent(res, "error", {error: err.message || "Failed to generate response"});
        res.end();
    }
});




export default router;
