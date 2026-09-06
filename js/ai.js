/**
 * ai.js - AI summary generation with llama.cpp
 * 
 * CONFIGURATION: Update the endpoint URL to match your llama.cpp server
 */

// ============================================
// CONFIGURATION - EDIT THESE VALUES
// ============================================

/** 
 * llama.cpp server endpoint
 * Default: http://localhost:8080/completion
 * For llama-server: --port 8080
 */
const DEFAULT_ENDPOINT = 'http://localhost:8080/completion';

/** Request timeout in milliseconds */
const TIMEOUT_MS = 30000;

// ============================================
// AI FUNCTIONS
// ============================================

/**
 * Generate a summary using the local LLM
 * Falls back to a simple local summary if server is unavailable
 * @param {string} text - The note content to summarize
 * @param {string} endpoint - Optional custom endpoint
 * @returns {Promise<string>} The generated summary
 */
export async function generateSummary(text, endpoint = DEFAULT_ENDPOINT) {
    if (!text || text.trim().length === 0) {
        return 'Empty note entry.';
    }

    try {
        // Try to use the LLM server
        const response = await callLlamaServer(endpoint, text);
        if (response) {
            return response.trim();
        }
    } catch (err) {
        console.warn('AI server unavailable, using fallback:', err.message);
        // Fall through to local summary
    }

    // Fallback: local summarizer
    return generateLocalSummary(text);
}

/**
 * Call the llama.cpp server
 * @param {string} endpoint - Server URL
 * @param {string} prompt - The text to summarize
 * @returns {Promise<string>} The response text
 */
async function callLlamaServer(endpoint, prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Summarize this note in 3 sentences.
                Return only the summary.

                Text:
                ${prompt}

                Summary:`,
                temperature: 0.2,
                max_tokens: 100,
                stop: ['\n\n'],
                chat_template_kwargs: {
                    enable_thinking: false
    }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        // llama.cpp returns { content: "...", ... }
        let result;

        if (data.content) {
            result = data.content;
        } else if (data.response) {
            result = data.response;
        } else if (data.text) {
            result = data.text;
        } else if (data.generated_text) {
            result = data.generated_text;
        } else {
            throw new Error('Unexpected response format from AI server');
        }

        return cleanSummary(result);

    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

function cleanSummary(text) {
    if (!text) {
        return '';
    }

    let summary = text.trim();

    summary = summary.replace(/<think>[\s\S]*?<\/think>/gi, '');
    summary = summary.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    const summaryIndex = summary.toLowerCase().lastIndexOf('summary:');

    if (summaryIndex !== -1) {
        summary = summary
            .substring(summaryIndex + 'summary:'.length)
            .trim();
    }

    summary = summary.replace(
        /^(okay|sure|certainly|alright)[,!.]?\s*/i,
        ''
    );

    return summary.trim();
}

/**
 * Test connection to the AI server
 * @param {string} endpoint - Server URL to test
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection(endpoint = DEFAULT_ENDPOINT) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'Hello',
                max_tokens: 5
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Local fallback summarizer
 * Simple extractive summary that works offline
 */
function generateLocalSummary(text) {
    if (!text || text.trim().length === 0) {
        return 'Empty note entry.';
    }

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    if (sentences.length === 1) {
        return text.length > 120 ? text.substring(0, 117) + '...' : text;
    }

    // Pick first and last sentences
    const first = sentences[0].trim();
    const last = sentences.length > 2 ? sentences[sentences.length - 1].trim() : sentences[1].trim();
    let summary = first + ' ' + last;

    if (summary.length > 220) {
        summary = summary.substring(0, 217) + '...';
    }
    return summary;
}