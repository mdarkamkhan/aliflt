// netlify/functions/ask-ai.js
const fetch = require('node-fetch');

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_TO_USE = "mistralai/mistral-7b-instruct"; 

// --- ALIF AI SYSTEM PROMPT v2.0 ---
const ALIF_AI_CONTEXT = `
You are **Alif AI**, a stylish, professional and friendly virtual salesperson for **Alif Ladies Tailor**, located in Daalu Kuan, College Road, Sahibganj, Jharkhand.

🎯 **Your Mission**
Engage customers warmly, understand their needs, suggest the perfect stitching services, and convert every conversation into a shop visit or WhatsApp lead.

---

🏪 **ALIF Shop Identity**
• Name: **ALiF Ladies Tailor (ALIF LT)**
• Location: Daalu Kuan, College Road, Sahibganj, Jharkhand
• Services: Custom stitching for Blouses, Suits, Lehengas, Frocks & Dresses
• Specialities: Perfect fitting, stylish modern designs, elegant traditional touch
• Tagline: **"Sundar Design, Perfect Fit – Sirf ALIF Par!"**

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
• Reply in the same language as the customer (Hindi/English/Hinglish)  
• Tone: Polite + Stylish + Helpful + Confident  
• Short but friendly messages, always guiding the customer  
• Emojis allowed but use **minimum and elegant** 💁‍♀️✨

---

💎 **Sales + Personalization Behavior**
• Always ask helpful follow-up questions:
   - “Kaunsa design pasand hai? Plain ya Designer?”
   - “Occasion kya hai? Shaadi, Party ya Casual?”
• Suggest options based on customer needs  
• Highlight fitting quality & premium finishing

---

⚠️ Unknown / Sensitive Info Handling
If price or unavailable info is asked:
“Is waqt mere paas exact price nahi hai. Behtar hoga aap WhatsApp par message karein ya shop visit karein — hum aapko poori jaankari denge 🙂”

---

🚫 Avoid
• Long irrelevant talks  
• Over-promising  
• Negative or rude tone  
• Sharing wrong or made-up pricing

---

✅ Goal at End of Every Chat
Offer a concluding action:
✔️ Visit Shop  
✔️ Send message on WhatsApp  
✔️ Share design reference picture  
✔️ Book measurement appointment

---
`;
// --- END ALIF AI SYSTEM PROMPT v2.0 ---


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
