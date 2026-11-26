/*
 * netlify/functions/ask-ai.js
 * Auto-synced Couture Concierge Backend for alif.
 * Features:
 *   - Zero-manual-update catalog/services/offers bundled via generated/ai-context.json
 *   - Live Asia/Kolkata offer_end_date expiry validation
 *   - Smart budget, colour, fabric, code, and synonym catalog retrieval
 *   - Page, verified GPS location, and shopping bag context awareness
 *   - Multimodal image analysis (Gemini Vision)
 *   - Deterministic [SHOW_ITEMS: ...] and [BOOK_WHATSAPP: ...] tags
 */

let bundledAiContext = null;
try {
    bundledAiContext = require('./generated/ai-context.json');
} catch {
    bundledAiContext = {
        generatedAt: '',
        counts: { products: 0, services: 0, offers: 0, designs: 0 },
        products: [],
        services: [],
        offers: [],
        designSummary: { total: 0, categories: {}, url: '/designs/' },
        knowledge: ''
    };
}

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from',
    'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please',
    'pls', 'show', 'tell', 'that', 'the', 'this', 'to', 'what', 'with', 'you', 'your',
    'aur', 'batao', 'bataiye', 'chahiye', 'dekhna', 'dikhao', 'dikhaiye', 'ek', 'hai',
    'hain', 'ham', 'hum', 'iska', 'iske', 'isko', 'ka', 'ke', 'ki', 'ko', 'koi',
    'kuch', 'kya', 'liye', 'main', 'mein', 'mujhe', 'nahi', 'par', 'pe', 'se', 'wala', 'wali'
]);

const SYNONYM_MAP = {
    shaadi: ['bridal', 'wedding', 'lehenga', 'zari', 'heavy', 'sequin', 'set'],
    wedding: ['bridal', 'lehenga', 'zari', 'heavy', 'sequin', 'curated'],
    bridal: ['wedding', 'lehenga', 'zari', 'sequin', 'blouse'],
    dulhan: ['bridal', 'lehenga', 'zari', 'heavy', 'red', 'crimson', 'maroon'],
    haldi: ['yellow', 'gold', 'mustard', 'marigold', 'gota'],
    mehendi: ['green', 'teal', 'emerald', 'olive', 'bottle'],
    peela: ['yellow', 'butter', 'sunshine', 'gold'],
    hara: ['green', 'teal', 'emerald', 'mehendi'],
    laal: ['red', 'crimson', 'maroon', 'wine'],
    kala: ['black'],
    safed: ['white', 'off-white', 'ivory', 'pearl'],
    neela: ['blue', 'navy', 'teal', 'royal'],
    gulabi: ['pink', 'rose', 'rani', 'peach'],
    sasta: ['discount', 'offer', 'narrow'],
    offer: ['discount', 'curated', 'set'],
    discount: ['offer', 'curated', 'set'],
    sale: ['discount', 'offer'],
    deal: ['discount', 'offer', 'curated'],
    kapda: ['fabric', 'silk', 'crepe', 'net', 'velvet', 'satin', 'lining', 'aster'],
    aster: ['lining', 'cotton', 'crepe'],
    blouse: ['blouse', 'lace', 'latkan', 'padded', 'princess', 'bridal'],
    saree: ['saree', 'lace', 'blouse', 'fall', 'pico'],
    dupatta: ['dupatta', 'lace', 'latkan', 'cutwork', 'scallop'],
    suit: ['suit', 'curated', 'salwar', 'anarkali', 'sharara', 'gharara', 'pakistani'],
    lehenga: ['lehenga', 'ghagra', 'latkan', 'heavy', 'bridal', 'zari'],
    silai: ['stitching', 'tailoring', 'blouse', 'suit', 'kurti', 'lehenga']
};

function getTodayIST() {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}

function getEffectivePricing(product, todayIST) {
    const mrp = typeof product.price === 'number' ? product.price : null;
    const rawOffer = typeof product.offer_price === 'number' ? product.offer_price : null;
    const endDate = product.offer_end_date ? String(product.offer_end_date).slice(0, 10) : null;
    const notExpired = !endDate || endDate >= todayIST;
    const hasActiveOffer = rawOffer !== null && notExpired && (mrp === null || rawOffer < mrp);

    const activePrice = hasActiveOffer ? rawOffer : mrp;
    const activeDiscountPct =
        hasActiveOffer && mrp && mrp > 0
            ? Math.round(((mrp - rawOffer) * 100) / mrp)
            : null;

    return {
        mrp,
        activePrice,
        activeOfferPrice: hasActiveOffer ? rawOffer : null,
        activeDiscountPct,
        endDate: hasActiveOffer ? endDate : null
    };
}

function extractSearchSignals(queryText, pageContext) {
    const combined = `${queryText || ''} ${(pageContext?.title || '')} ${(pageContext?.slug || '')}`
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ');

    const rawTokens = combined.split(/\s+/).filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
    const expandedTokens = new Set(rawTokens);

    for (const tok of rawTokens) {
        if (SYNONYM_MAP[tok]) {
            for (const syn of SYNONYM_MAP[tok]) {
                expandedTokens.add(syn);
            }
        }
    }

    const qLower = (queryText || '').toLowerCase();
    const wantsDiscount = /\b(discount|offer|offers|sale|deal|deals|off|sasta|saste|cheap|promo|combo|curated)\b/i.test(qLower);

    let maxBudget = null;
    const budgetMatch =
        qLower.match(/(?:under|below|upto|up to|within|less than|max|rs\.?|₹)\s*(\d{2,5})/i) ||
        qLower.match(/(\d{2,5})\s*(?:tak|ke andar|k andar|mein|me|rs|rupees|budget)/i);
    if (budgetMatch) {
        const parsed = Number(budgetMatch[1]);
        if (Number.isFinite(parsed) && parsed >= 10) {
            maxBudget = parsed;
        }
    }

    return {
        tokens: Array.from(expandedTokens),
        rawTokens,
        wantsDiscount,
        maxBudget,
        rawQuery: qLower
    };
}

function scoreCatalogItems(products, signals, pageContext, cartItems, todayIST) {
    const cartIds = new Set((cartItems || []).map((c) => String(c.id || '').toLowerCase()));
    const pageSlug = String(pageContext?.slug || '').toLowerCase();

    const scored = [];
    for (const p of products) {
        const eff = getEffectivePricing(p, todayIST);
        let score = 0;

        const slugLower = String(p.slug || '').toLowerCase();
        const codeLower = String(p.code || '').toLowerCase();
        const titleLower = String(p.title || '').toLowerCase();
        const catLower = String(p.category || '').toLowerCase();
        const searchBlob = `${slugLower} ${codeLower} ${titleLower} ${catLower} ${p.colour || ''} ${p.fabric || ''} ${p.work || ''} ${p.pattern || ''} ${p.ideal_for || ''} ${p.combo_summary || ''}`.toLowerCase();

        // Exact code or slug hit
        if (codeLower && signals.rawQuery.includes(codeLower)) score += 120;
        if (slugLower && signals.rawQuery.includes(slugLower)) score += 100;
        if (pageSlug && slugLower === pageSlug) score += 85;

        for (const tok of signals.tokens) {
            if (titleLower.includes(tok)) score += 14;
            else if (catLower.includes(tok) || String(p.colour || '').toLowerCase().includes(tok) || String(p.fabric || '').toLowerCase().includes(tok)) score += 11;
            else if (searchBlob.includes(tok)) score += 6;
        }

        if (eff.activeDiscountPct) {
            score += signals.wantsDiscount ? 22 + Math.min(20, Math.round(eff.activeDiscountPct / 3)) : 3;
        }

        if (signals.maxBudget !== null && eff.activePrice !== null) {
            if (eff.activePrice <= signals.maxBudget) {
                score += 18;
            } else if (eff.activePrice > signals.maxBudget * 1.2) {
                score -= 25;
            }
        }

        // Cross-sell: if user has items in cart and is NOT searching by exact code, gently deprioritize duplicates
        if (cartIds.has(slugLower) && score < 80) {
            score -= 6;
        }

        scored.push({ product: p, eff, score });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.eff.activeDiscountPct || 0) - (a.eff.activeDiscountPct || 0);
    });

    return scored;
}

function formatProductLine(p, eff) {
    const priceText = eff.activeOfferPrice !== null && eff.mrp !== null
        ? `MRP ₹${eff.mrp} -> Offer ₹${eff.activeOfferPrice} (-${eff.activeDiscountPct}%${eff.endDate ? `, ends ${eff.endDate}` : ''})`
        : eff.activePrice !== null
            ? `₹${eff.activePrice}`
            : 'Price on inquiry';

    const attrs = [p.colour, p.fabric, p.work, p.size].filter(Boolean).join(', ');
    const comboNote = p.combo_summary ? ` | Includes: ${p.combo_summary}` : '';
    return `- [${p.slug}] (${p.code}) ${p.title} | Cat: ${p.category} | ${priceText}${attrs ? ` | ${attrs}` : ''}${comboNote}`;
}

function formatDynamicContext(ctxData, message, clientContext, todayIST) {
    const products = Array.isArray(ctxData.products) ? ctxData.products : [];
    const services = Array.isArray(ctxData.services) ? ctxData.services : [];
    const offers = Array.isArray(ctxData.offers) ? ctxData.offers : [];

    const pageCtx = clientContext?.page || null;
    const locCtx = clientContext?.location || null;
    const cartCtx = Array.isArray(clientContext?.cart) ? clientContext.cart : [];

    const signals = extractSearchSignals(message, pageCtx);
    const ranked = scoreCatalogItems(products, signals, pageCtx, cartCtx, todayIST);

    const topMatched = ranked.slice(0, 15);
    const activeDiscounts = ranked
        .filter((entry) => entry.eff.activeOfferPrice !== null)
        .sort((a, b) => (b.eff.activeDiscountPct || 0) - (a.eff.activeDiscountPct || 0));

    const lines = [];
    lines.push(`=== LIVE INVENTORY SNAPSHOT (Today IST: ${todayIST} | Synced: ${ctxData.generatedAt || 'build'}) ===`);
    lines.push(`Store Totals: ${products.length} retail products/curated sets, ${services.length} tailoring services, ${ctxData.designSummary?.total || 0} styling designs (/designs/), ${activeDiscounts.length} items currently on active discount.`);

    if (offers.length > 0) {
        lines.push(`Promotional Campaigns: ${offers.map((o) => o.title).join(', ')}`);
    }

    lines.push('\n--- CLIENT SESSION CONTEXT ---');
    if (pageCtx?.path) {
        lines.push(`Current Page: ${pageCtx.path}${pageCtx.title ? ` (${pageCtx.title})` : ''}${pageCtx.code ? ` [Code: ${pageCtx.code}]` : ''}`);
    }
    if (locCtx?.shared) {
        if (locCtx.in_sahibganj === true) {
            lines.push(`Verified Location: ${locCtx.city || 'Sahibganj'} (INSIDE Sahibganj -> Doorstep home measurement, shop pickup & ₹20 Sahibganj home delivery available).`);
        } else {
            lines.push(`Verified Location: ${locCtx.city || 'Outside Sahibganj'} (OUTSIDE Sahibganj -> Pan-India parcel delivery for retail items & curated sets available; home-visit measurement/₹20 local delivery are Sahibganj-city only).`);
        }
    } else {
        lines.push('Verified Location: Not shared yet (Do NOT assume customer lives in Sahibganj; clearly distinguish Sahibganj city local service vs Pan-India parcel shipping when asked about delivery).');
    }

    if (cartCtx.length > 0) {
        const cartSummary = cartCtx
            .slice(0, 8)
            .map((c) => `${c.quantity || 1}x ${c.title}${c.code ? ` [${c.code}]` : ''} (₹${c.price || 0})`)
            .join('; ');
        lines.push(`Shopping Bag (${cartCtx.length} line items): ${cartSummary}`);
    } else {
        lines.push('Shopping Bag: Empty');
    }

    lines.push('\n--- TOP MATCHING PRODUCTS FOR THIS QUERY ---');
    if (topMatched.length > 0) {
        for (const entry of topMatched) {
            lines.push(formatProductLine(entry.product, entry.eff));
        }
    } else {
        lines.push('(No specific catalog items indexed)');
    }

    // Ensure top discounted deals are also visible even if query wasn't explicitly discount-keyworded
    const alreadyShown = new Set(topMatched.map((m) => m.product.slug));
    const extraDiscounts = activeDiscounts.filter((d) => !alreadyShown.has(d.product.slug)).slice(0, 8);
    if (extraDiscounts.length > 0) {
        lines.push('\n--- TOP ACTIVE DISCOUNT OFFERS RIGHT NOW ---');
        for (const entry of extraDiscounts) {
            lines.push(formatProductLine(entry.product, entry.eff));
        }
    }

    lines.push('\n--- ALL TAILORING SERVICES (/services/<slug>/) ---');
    for (const s of services) {
        const startText = s.starting_price ? `Starts ₹${s.starting_price}` : 'Custom quote';
        lines.push(`- [${s.slug}] ${s.title} (${s.category}) | ${startText} | ${s.description}`);
    }

    return lines.join('\n');
}

function buildSystemInstruction(knowledgeText, dynamicContextText) {
    return `You are "alif.ai", the executive virtual concierge & personal fashion stylist for alif. ladies tailor & Boutique (Sahibganj, Jharkhand & Pan-India retail).

=== VISUAL PRODUCT CARD TRIGGER RULES (CRITICAL) ===
When recommending or showing specific products, curated sets, fabrics, laces, latkans, or tailoring services from the inventory below:
1. Pick up to 4 BEST matching item slugs from the inventory list and append ONE exact tag at the VERY END of your reply:
   [SHOW_ITEMS: slug1, slug2, slug3]
   Example: [SHOW_ITEMS: curated-set-alif-set-080, antique-gold-arched-scallop-sequin-narrow-lace-9606]
2. Use ONLY exact slugs shown inside brackets [slug] from the LIVE INVENTORY SNAPSHOT below. Never invent slugs or prices.
3. If the user asks for a general category browse where no single slug stands out, you may fallback to [SHOW_CATALOG: lace] or [SHOW_CATALOG: latkan] or [SHOW_CATALOG: blouse] or [SHOW_CATALOG: all].

=== WHATSAPP BOOKING BUILDER TAG ===
ONLY when the user clearly wants to place a custom stitching order, confirm an urgent booking, or finalize shortlisted products on WhatsApp, append ONE JSON tag at the very end (after [SHOW_ITEMS] if present):
[BOOK_WHATSAPP: {"type":"tailoring","title":"Custom Bridal Blouse","items":["ALIF-SET-080"],"notes":"Urgent 48hr, Sahibganj pickup"}]
Do NOT emit [BOOK_WHATSAPP] on normal info questions.

=== IMAGE / OUTFIT PHOTO MATCHING ===
When the customer sends an image of their saree, fabric, or design:
- Identify dominant colour, fabric texture, and embellishment style (sequin, zari, mirror, cutwork, velvet).
- Recommend exact matching laces, latkans, linings, curated sets, or blouse/suit tailoring services from the LIVE INVENTORY SNAPSHOT and include [SHOW_ITEMS: ...].

=== NATURAL PROGRESSIVE LOCATION DISCLOSURE RULES (CRITICAL) ===
When the customer asks about shop location/address, NEVER dump all landmarks at once. Follow this 3-step shopkeeper flow:
- STEP 1 (Initial query like "location", "address", "kahan hai"):
  "alif. Daal Kuan, College Road, Sahibganj me hai, near Joy Fast Food."
- STEP 2 (Follow-up like "samajh nahi aaya", "kon si gali", "nearby landmark"):
  "Daal Kuan wali gali me Lakshmi Bag House ya Joyda Restaurant ke samne hai."
- STEP 3 (Still confused or asks "directions", "kaise aayein"):
  "Aap College Road Daal Kuan pahunch kar 7250470009 par call kar lijiye, hum aapko receive kar lenge."

=== RESPONSE STYLE & STRICT RULES ===
1. NO EMOJIS OR EMOTICONS EVER: Output pure, clean, refined luxury copy with zero emojis.
2. CONCISE & DIRECT: Keep replies crisp (2-4 short sentences max, or neat bullet points when comparing prices/sets). No fluff.
3. ACCURATE DISCOUNTS & EXPIRY: Quote exact MRP and active offer prices shown in LIVE INVENTORY SNAPSHOT. If an item has an offer_end_date, mention it naturally. Never fabricate discounts or expired deals.
4. MULTILINGUAL ADAPTABILITY: Match the customer's language naturally (Hinglish, Hindi, or English).
5. STRICT SCOPE: Answer ONLY questions related to alif. ladies tailor & Boutique (fabrics, laces, latkans, curated sets, tailoring services, rates, fashion matching, timings, delivery, location, policies). For unrelated requests (coding, math, politics, general trivia), reply:
   "Kshama kijiye, main sirf alif. ladies tailor & Boutique se judi jankari aur styling me madad kar sakta hu."

=== CONFIRMED ALIF KNOWLEDGE BASE ===
${knowledgeText || 'Shop: alif. ladies tailor & Boutique, Daal Kuan, College Road, Sahibganj | Phone: 7250470009 | WhatsApp: 7250740009 | Open Daily 10 AM - 9 PM (Friday 2 PM - 9 PM).'}

${dynamicContextText}
`;
}

function sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    const trimmed = history.slice(-14);
    return trimmed
        .map((turn) => {
            const role = turn?.role === 'model' ? 'model' : 'user';
            const textParts = Array.isArray(turn?.parts)
                ? turn.parts
                      .filter((p) => typeof p?.text === 'string' && p.text.trim())
                      .map((p) => ({ text: p.text.trim() }))
                : [];
            return textParts.length > 0 ? { role, parts: textParts } : null;
        })
        .filter(Boolean);
}

exports.handler = async (event) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { message = '', history = [], image = null, context = null } = body;

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY is not configured in Netlify Environment Variables.');
        }

        const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const todayIST = getTodayIST();
        const dynamicContextText = formatDynamicContext(bundledAiContext, message, context, todayIST);
        const systemInstructionText = buildSystemInstruction(bundledAiContext.knowledge, dynamicContextText);

        let contents = sanitizeHistory(history);
        const userParts = [];

        if (message && String(message).trim()) {
            userParts.push({ text: String(message).trim() });
        } else if (image?.data) {
            userParts.push({ text: 'Please inspect this outfit/design photo and suggest matching laces, latkans, fabrics, or tailoring options from alif.' });
        }

        if (image && typeof image.data === 'string' && image.data.length > 0) {
            const cleanBase64 = image.data.replace(/^data:[^;]+;base64,/, '');
            userParts.push({
                inline_data: {
                    mime_type: image.mimeType || 'image/jpeg',
                    data: cleanBase64
                }
            });
        }

        // Ensure current turn includes userParts (and avoid duplicate trailing text turn if client pushed history first)
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1] = { role: 'user', parts: userParts };
        } else {
            contents.push({ role: 'user', parts: userParts });
        }

        const payload = {
            system_instruction: {
                parts: [{ text: systemInstructionText }]
            },
            contents,
            generationConfig: {
                temperature: 0.65
            }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`API error ${apiResponse.status}: ${errorBody}`);
        }

        const result = await apiResponse.json();
        const reply =
            result.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || '')
                .join('\n')
                .trim() || "Sorry, I couldn't process that right now.";

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                reply,
                meta: {
                    catalogUpdatedAt: bundledAiContext.generatedAt || null,
                    todayIST
                }
            })
        };
    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: `Assistant temporarily unavailable: ${error.message}` })
        };
    }
};
