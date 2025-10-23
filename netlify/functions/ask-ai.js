// netlify/functions/ask-ai.js

// Using 'node-fetch' version 2 for Netlify Functions compatibility
const fetch = require('node-fetch');

// Choose a conversational AI model from Hugging Face (e.g., GPT-2 or a smaller fine-tuned model)
// We'll use a relatively small model suitable for the free tier
const MODEL_API_URL = "https://api-inference.huggingface.co/models/distilgpt2";
// Note: DialoGPT is okay for simple chat but might not follow instructions well. 
// We can change the model later.

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { question } = JSON.parse(event.body);

        if (!question) {
            return { statusCode: 400, body: JSON.stringify({ error: "Question is required." }) };
        }

        const hfToken = process.env.HUGGINGFACE_TOKEN;
        if (!hfToken) {
             console.error("Hugging Face Token not found in environment variables.");
             return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        // Send the question to the Hugging Face Inference API
        const response = await fetch(
            MODEL_API_URL,
            {
                headers: { 
                    "Authorization": `Bearer ${hfToken}`,
                    "Content-Type": "application/json" 
                },
                method: "POST",
                body: JSON.stringify({
                    // For DialoGPT, we often provide past conversation turns, 
                    // but for a simple stateless bot, we just send the new input.
                    // Different models might need different input formats.
                    inputs: {
                       text: question 
                    } 
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Hugging Face API Error (${response.status}):`, errorBody);
            // Handle potential rate limits or other API errors
             if (response.status === 429) { // Too Many Requests
                 return { statusCode: 429, body: JSON.stringify({ error: "AI is busy, please try again in a moment." }) };
            }
             // Handle model loading error (common on free tier)
             if (response.status === 503 && errorBody.includes("is currently loading")) {
                 return { statusCode: 503, body: JSON.stringify({ error: "AI model is starting up, please try again in 20-30 seconds." }) };
             }
            return { statusCode: response.status, body: JSON.stringify({ error: `Failed to get response from AI. Status: ${response.status}` }) };
        }

        const result = await response.json();

        // Extract the generated answer (structure depends on the model)
        // For DialoGPT, it's often in 'generated_text'
        const answer = result.generated_text || "Sorry, I couldn't generate a response.";

        return {
            statusCode: 200,
            body: JSON.stringify({ answer: answer }),
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal server error occurred." }),
        };
    }
};
