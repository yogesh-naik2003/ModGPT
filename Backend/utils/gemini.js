import "dotenv/config";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const createGenerateContentUrl = (model, stream = false) => (
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? "streamGenerateContent?alt=sse" : "generateContent"}`
);

const toGeminiContents = (messages) => messages.map(message => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{text: message.content}]
}));

const buildPayload = (messages, options = {}) => {
    const generationConfig = {};

    if (options.temperature !== undefined) {
        generationConfig.temperature = Number(options.temperature);
    }

    if (options.maxOutputTokens !== undefined) {
        generationConfig.maxOutputTokens = Number(options.maxOutputTokens);
    }

    return {
        contents: toGeminiContents(messages),
        ...(Object.keys(generationConfig).length ? {generationConfig} : {})
    };
};

const extractText = (data) => data.candidates?.[0]?.content?.parts
    ?.map(part => part.text)
    .filter(Boolean)
    .join("") || "";

const parseStreamEvents = (eventBlock) => eventBlock
    .split("\n")
    .filter(line => line.startsWith("data:"))
    .map(line => line.replace(/^data:\s*/, ""))
    .filter(line => line && line !== "[DONE]");

const getEmptyResponseReason = (data) => {
    const candidate = data.candidates?.[0];

    if (data.promptFeedback?.blockReason) {
        return `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`;
    }

    if (!data.candidates?.length) {
        return "Gemini returned no candidates. Check that the selected model is available for your API key.";
    }

    if (candidate?.finishReason) {
        return `Gemini returned no text. Finish reason: ${candidate.finishReason}`;
    }

    return "Gemini returned an empty response";
};

export const getGeminiAPIResponse = async (messages, options = {}) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = options.model || GEMINI_MODEL;
    const normalizedMessages = Array.isArray(messages)
        ? messages
        : [{role: "user", content: messages}];

    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY in backend .env");
    }

    const response = await fetch(createGenerateContentUrl(model), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        },
        body: JSON.stringify(buildPayload(normalizedMessages, options))
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Gemini request failed");
    }

    const reply = extractText(data);

    if (!reply) {
        throw new Error(getEmptyResponseReason(data));
    }

    return reply;
};

export async function streamGeminiAPIResponse(messages, options = {}, onChunk) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = options.model || GEMINI_MODEL;

    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY in backend .env");
    }

    const response = await fetch(createGenerateContentUrl(model, true), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        },
        body: JSON.stringify(buildPayload(messages, options))
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || "Gemini stream request failed");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    const handleEvent = (event) => {
        const dataLines = parseStreamEvents(event);

        for (const line of dataLines) {
            const data = JSON.parse(line);
            const text = data.text || extractText(data);

            if (text) {
                fullText += text;
                onChunk(text);
            }
        }
    };

    for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, {stream: true});
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
            handleEvent(event);
        }
    }

    if (buffer.trim()) {
        handleEvent(buffer);
    }

    if (!fullText) {
        const fallbackText = await getGeminiAPIResponse(messages, options);
        onChunk(fallbackText);
        return fallbackText;
    }

    return fullText;
}

export default getGeminiAPIResponse;
