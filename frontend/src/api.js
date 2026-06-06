const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "object" ? data.error : data;
        throw new Error(message || "Request failed");
    }

    return data;
}

export async function streamRequest(path, options = {}, handlers = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const {done, value} = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, {stream: true});
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
            const lines = eventBlock.split("\n");
            const event = lines.find(line => line.startsWith("event:"))?.replace("event:", "").trim();
            const dataLine = lines.find(line => line.startsWith("data:"))?.replace("data:", "").trim();

            if (!event || !dataLine) {
                continue;
            }

            const data = JSON.parse(dataLine);
            handlers[event]?.(data);
        }
    }
}
