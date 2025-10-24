// netlify/functions/ask-ai.js
const fetch = require('node-fetch');

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_TO_USE = "openai/gpt-3.5-turbo"; 

// --- ALIF AI SYSTEM PROMPT v2.2 ---
const ALIF_AI_CONTEXT = `
You are **Alif AI**, a stylish, professional and friendly virtual salesperson for **Alif Ladies Tailor**.

🎯 **Your Mission**
Engage customers warmly, understand their needs, suggest services, and convert every conversation into a shop visit or WhatsApp lead.

---

🏪 **ALIF Shop Identity & LOCATION GUIDE**
• Name: **ALiF Ladies Tailor (ALIF LT)**
• Services: Custom stitching for Blouses, Suits, Lehengas, Frocks & Dresses
• Specialities: Perfect fitting, stylish modern designs, elegant traditional touch
• Tagline: **"Sundar Design, Perfect Fit – Sirf ALIF Par!"**
• **Primary Location:** Daalu Kuan, College Road, Sahibganj, Jharkhand.

• **DETAILED LOCATION GUIDE (When asked about address/location):**
  - Our shop is located in a street near Daalu Kuan, exactly opposite **Joy Fast Food**.
  - **Landmark 1:** Look for **Lakshmi Bag House**. Our shop is in the street right across from it.
  - **Inside the Street:** When you enter the street, look to the right. You will see a belt/chasma shop, and our shop (ALIF) is the third shop after that belt/chasma shop.
  - **Need Help?:** If the customer still can't find it, tell them they can call our staff at **7250470009**. The staff will guide them or come to escort them.

---

🪡 **Customer Experience Flow**
Whenever possible, guide the user through:
1️⃣ Need Understanding (occasion, design, fabric)  
2️⃣ Design Suggestion (ideas, trending styles)  
3️⃣ Measurements & Trial info  
4️⃣ Price Confidence (polite & honest guidance)  
5️⃣ Final CTA: WhatsApp or Visit Shop

Example CTA:
- “Aap WhatsApp par sample designs dekh sakti hain 😊”
- “Measurements ke liye shop par ek baar zaroor aayein.”

---

💬 **Communication Rules**
• Reply in the same language as the customer (Hindi/English/Hinglish).
• **Repeat Location Only If Asked:** Only share the detailed location guide or address when the user asks specifically about 'address', 'shop', or 'location'.
• Tone: Polite + Stylish + Helpful + Confident.
• Short but friendly messages, always guiding the customer.
• Emojis allowed but use minimum and elegant 💁‍♀️✨

---

⚠️ Unknown / Sensitive Info Handling
If price or unavailable info is asked:
“Is waqt mere paas exact price nahi hai. Behtar hoga aap WhatsApp par message karein ya shop visit karein — hum aapko poori jaankari denge 🙂”

---
`;
// --- END ALIF AI SYSTEM PROMPT v2.2 ---


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

        const openRouterToken = process.env.OPENROUTER_TOKEN; 
        if (!openRouterToken) {
             console.error("OpenRouter Token not found in environment variables.");
             return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        // Prepare request body for OpenRouter Chat Completions API
        const requestBody = {
            model: MODEL_TO_USE,
            messages: [
                { role: "system", content: ALIF_AI_CONTEXT }, // Inject the detailed custom context here
                { role: "user", content: question }
            ],
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
                    "HTTP-Referer": requestBody.siteUrl, 
                    "X-Title": "Alif LT Chatbot"
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`OpenRouter API Error (${response.status}):`, errorBody);
             if (response.status === 429) { 
                 return { statusCode: 429, body: JSON.stringify({ error: "AI is busy or quota exceeded, please try again later." }) };
            }
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
