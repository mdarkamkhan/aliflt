// netlify/functions/ask-ai.js

const fetch = require('node-fetch');

// ✅ Define the model URL properly
const MODEL_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2b-it";

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { question } = JSON.parse(event.body || "{}");

        if (!question) {
            return { statusCode: 400, body: JSON.stringify({ error: "Question is required." }) };
        }

        const hfToken = process.env.HUGGINGFACE_TOKEN;
        if (!hfToken) {
            console.error("❌ Token missing!");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        const response = await fetch(MODEL_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${hfToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: question
            })
        });

        const resultText = await response.text();

        if (!response.ok) {
            console.error(`HF API Error (${response.status}):`, resultText);
            return { statusCode: response.status, body: resultText };
        }

        let parsed;
        try {
            parsed = JSON.parse(resultText);
        } catch (e) {
            parsed = [{ generated_text: "Parsing Error: " + resultText }];
        }

        const answer =
            parsed?.generated_text ||
            parsed?.[0]?.generated_text ||
            "Sorry, I could not generate a response.";

        return {
            statusCode: 200,
            body: JSON.stringify({ answer })
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
