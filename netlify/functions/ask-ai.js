/*
 * netlify/functions/ask-ai.js
 * This is the backend for your chatbot.
 * It receives a message, adds a system prompt,
 * and gets a reply from the Google Gemini API.
 */

// This is the "personality" of your AI assistant.
const systemPrompt = `
You are "Alif AI", a friendly and helpful assistant for ALiF Ladies Tailor, a custom clothing store in Sahibganj, Jharkhand.
Your personality is: Warm, polite, and professional.
Your location: Daal Kuan, College Road, Sahibganj.

Your goal is to:
1.  Answer user questions about our services (stitching, blouses, lehengas, gowns, etc.), products (lace, fabric, etc.), and location.
2.  Be helpful and provide information about fashion, tailoring, and fabric care.
3.  Politely encourage users to visit the store for a personal consultation.
4.  If you don't know an answer, say so politely and suggest they "visit the store for the latest details."
5.  Keep your answers concise and easy to read (max 2-3 sentences).
`;

exports.handler = async (event) => {
    // --- Handle CORS Preflight (required for Netlify functions) ---
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow requests from your site
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // --- Handle non-POST requests ---
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // --- Main Logic ---
    try {
        const { message } = JSON.parse(event.body);

        // Get the API Key from Netlify Environment Variables
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error('API key is not set.');
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                // Set safety settings to be less restrictive if needed
                // (e.g., for fashion terms)
            }
        };

        // Call the Gemini API
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        const result = await apiResponse.json();

        // Extract the reply text
        const reply = result.candidates[0].content.parts[0].text;

        // --- Send the successful reply back to the frontend ---
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reply: reply })
        };

    } catch (error) {
        console.error('Function Error:', error);
        // --- Send an error message back to the frontend ---
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: error.message || 'An internal error occurred.' })
        };
    }
};
