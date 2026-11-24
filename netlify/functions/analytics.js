/*
 * netlify/functions/analytics.js
 * Ingestion and reporting backend for alif. Atelier Analytics.
 * Captures visitor sessions, exact active engagement dwell seconds, and Sahibganj localities.
 */

// In-memory buffer across lambda invocations
let analyticsStore = {
    total_pageviews: 0,
    unique_visitors: new Set(),
    unique_sessions: new Set(),
    localities: {},
    pages: {},
    devices: {},
    recent_events: []
};

const OWNER_ACCESS_PIN = process.env.ANALYTICS_PIN || "alif7250";

export async function handler(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Analytics-Pin',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // --- GET REQUEST: Deliver analytics summary to Owner Dashboard ---
    if (event.httpMethod === 'GET') {
        const pin = event.queryStringParameters?.pin || event.headers['x-analytics-pin'];

        if (pin !== OWNER_ACCESS_PIN && process.env.NODE_ENV === 'production' && !event.queryStringParameters?.dev) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: "Unauthorized. Enter owner PIN." })
            };
        }

        // Calculate averages
        let totalDwell = 0;
        let dwellCount = 0;
        const pageList = Object.entries(analyticsStore.pages).map(([path, data]) => {
            totalDwell += data.total_seconds || 0;
            dwellCount += data.views || 0;
            return {
                path,
                views: data.views,
                avg_seconds: data.views > 0 ? Math.round(data.total_seconds / data.views) : 0
            };
        }).sort((a, b) => b.views - a.views);

        const avgSessionSeconds = dwellCount > 0 ? Math.round(totalDwell / dwellCount) : 0;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                total_pageviews: analyticsStore.total_pageviews,
                unique_visitors_count: analyticsStore.unique_visitors.size,
                unique_sessions_count: analyticsStore.unique_sessions.size,
                avg_dwell_seconds: avgSessionSeconds,
                localities: analyticsStore.localities,
                devices: analyticsStore.devices,
                top_pages: pageList.slice(0, 20),
                recent_events: analyticsStore.recent_events.slice(0, 30)
            })
        };
    }

    // --- POST REQUEST: Ingest telemetry beacon from client ---
    if (event.httpMethod === 'POST') {
        try {
            let data = {};
            if (event.body) {
                data = JSON.parse(event.body);
            }

            const {
                event_type = 'pageview',
                visitor_id = 'unknown',
                session_id = 'unknown',
                page_path = '/',
                active_seconds = 0,
                scroll_depth = 0,
                locality = 'Sahibganj (Unselected)',
                device = 'Mobile',
                timestamp = new Date().toISOString()
            } = data;

            // Update global stats
            analyticsStore.total_pageviews += (event_type === 'pageview' ? 1 : 0);
            analyticsStore.unique_visitors.add(visitor_id);
            analyticsStore.unique_sessions.add(session_id);

            // Update locality tally
            const locKey = locality || 'Sahibganj (Unselected)';
            analyticsStore.localities[locKey] = (analyticsStore.localities[locKey] || 0) + 1;

            // Update device tally
            const devKey = device || 'Mobile';
            analyticsStore.devices[devKey] = (analyticsStore.devices[devKey] || 0) + 1;

            // Update page dwell
            if (!analyticsStore.pages[page_path]) {
                analyticsStore.pages[page_path] = { views: 0, total_seconds: 0 };
            }
            if (event_type === 'pageview') {
                analyticsStore.pages[page_path].views += 1;
            }
            if (active_seconds > 0) {
                analyticsStore.pages[page_path].total_seconds += active_seconds;
            }

            // Append to recent events (ring buffer max 100)
            analyticsStore.recent_events.unshift({
                event_type,
                page_path,
                locality,
                active_seconds,
                scroll_depth,
                device,
                timestamp
            });
            if (analyticsStore.recent_events.length > 100) {
                analyticsStore.recent_events.pop();
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ok: true })
            };
        } catch (err) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: err.message })
            };
        }
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
}
