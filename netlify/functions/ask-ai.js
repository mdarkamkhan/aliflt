// netlify/functions/ask-ai.js
const fetch = require('node-fetch');

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Correct Model definition (Only one line)
const MODEL_TO_USE = "mistralai/mistral-7b-instruct"; 

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { question } = JSON.parse(event.body);

        if (!question) {
            return { statusCode: 400, body: JSON.stringify({ error: "Question is required." }) };
        }

        // --- IMPORTANT: Use OPENROUTER_TOKEN now ---
        const openRouterToken = process.env.OPENROUTER_TOKEN; 
        if (!openRouterToken) {
             console.error("OpenRouter Token not found in environment variables.");
             return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        // Prepare request body for OpenRouter Chat Completions API
        const requestBody = {
            model: MODEL_TO_USE,
            messages: [
                { role: "system", content: "You are a helpful assistant for Alif Ladies Tailor." }, // Optional: Give the AI some context
                { role: "user", content: question }
            ],
            // Optional: Add site URL as referer for OpenRouter analytics
            // Replace with your actual site URL if different
            siteUrl: "https://aliflt.netlify.app" 
        };

        // Send the request to OpenRouter API
        const response = await fetch(
            OPENROUTER_API_URL,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterToken}`,
                    "Content-Type": "application/json",
                    // Recommended by OpenRouter: Identify your app
                    "HTTP-Referer": requestBody.siteUrl, 
                    "X-Title": "Alif LT Chatbot" // Optional: Name for analytics
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenRouter API Error (${response.status}):`, errorBody);
             // Handle potential rate limits or other API errors
             if (response.status === 429) { // Too Many Requests / Quota Exceeded
                 return { statusCode: 429, body: JSON.stringify({ error: "AI is busy or quota exceeded, please try again later." }) };
            }
             // Specific handling for 404 from OpenRouter API itself (model not found)
             if (response.status === 404) {
                 return { statusCode: 404, body: JSON.stringify({ error: `AI Model '${MODEL_TO_USE}' not found on OpenRouter.` }) };
             }
            return { statusCode: response.status, body: JSON.stringify({ error: `Failed to get response from AI. Status: ${response.status}` }) };
        }

        const result = await response.json();

        // Extract the generated answer from OpenRouter's response structure
        let answer = "Sorry, I couldn't generate a response.";
        if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
            answer = result.choices[0].message.content.trim();
        } else {
             console.warn("Unexpected response structure from OpenRouter:", result);
        }
        

        return {
            statusCode: 200,
            body: JSON.stringify({ answer: answer }), // Send clean answer back
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal server error occurred." }),
        };
    }
};
