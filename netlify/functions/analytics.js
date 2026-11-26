/*
 * netlify/functions/analytics.js
 * Ingestion and reporting backend for alif. Atelier Analytics.
 * Captures visitor sessions, exact active engagement dwell seconds,
 * reverse-geocoded addresses, Sahibganj classification, and Google Maps pins.
 */

// In-memory store across warm lambda invocations
let analyticsStore = {
    total_pageviews: 0,
    unique_visitors: new Set(),
    unique_sessions: new Set(),
    visitor_profiles: new Map(),
    pages: {},
    recent_events: []
};

const OWNER_ACCESS_PIN = process.env.ANALYTICS_PIN || 'alif7250';

export async function handler(event) {
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

        if (
            pin !== OWNER_ACCESS_PIN &&
            process.env.NODE_ENV === 'production' &&
            !event.queryStringParameters?.dev
        ) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized. Enter owner PIN.' })
            };
        }

        // Compute unique-visitor location & device breakdowns
        const localities = {};
        const devices = {};
        const sahibganjSplit = { sahibganj: 0, outside: 0, not_shared: 0 };

        for (const profile of analyticsStore.visitor_profiles.values()) {
            const locLabel = profile.city || profile.locality || 'Location Not Shared';
            localities[locLabel] = (localities[locLabel] || 0) + 1;

            const devLabel = profile.device || 'Mobile';
            devices[devLabel] = (devices[devLabel] || 0) + 1;

            if (profile.in_sahibganj === true) {
                sahibganjSplit.sahibganj += 1;
            } else if (profile.in_sahibganj === false) {
                sahibganjSplit.outside += 1;
            } else {
                sahibganjSplit.not_shared += 1;
            }
        }

        // Exact GPS location entries sorted most recent first
        const exactLocations = Array.from(analyticsStore.visitor_profiles.values())
            .filter((p) => p.location_method === 'gps')
            .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
            .slice(0, 100);

        // Accurate dwell calculation across page visits (deduplicating repeated heartbeats)
        let totalDwell = 0;
        let dwellCount = 0;
        const pageList = Object.entries(analyticsStore.pages)
            .map(([path, data]) => {
                let pageTotalSecs = 0;
                for (const secs of data.visitSeconds.values()) {
                    pageTotalSecs += secs;
                }
                totalDwell += pageTotalSecs;
                dwellCount += data.views || 0;
                return {
                    path,
                    views: data.views,
                    avg_seconds: data.views > 0 ? Math.round(pageTotalSecs / data.views) : 0
                };
            })
            .sort((a, b) => b.views - a.views);

        const avgSessionSeconds = dwellCount > 0 ? Math.round(totalDwell / dwellCount) : 0;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                total_pageviews: analyticsStore.total_pageviews,
                unique_visitors_count: analyticsStore.unique_visitors.size,
                unique_sessions_count: analyticsStore.unique_sessions.size,
                avg_dwell_seconds: avgSessionSeconds,
                sahibganj_split: sahibganjSplit,
                localities,
                devices,
                exact_locations: exactLocations,
                top_pages: pageList.slice(0, 20),
                recent_events: analyticsStore.recent_events.slice(0, 40)
            })
        };
    }

    // --- POST REQUEST: Ingest telemetry beacon from client ---
    if (event.httpMethod === 'POST') {
        try {
            const data = event.body ? JSON.parse(event.body) : {};

            const {
                event_type = 'pageview',
                visitor_id = 'unknown',
                session_id = 'unknown',
                page_path = '/',
                active_seconds = 0,
                scroll_depth = 0,
                locality = 'Location Not Shared',
                city = 'Location Not Shared',
                in_sahibganj = null,
                exact_address = '',
                locality_detail = '',
                postcode = '',
                coordinates = '',
                map_link = '',
                gps_accuracy_m = null,
                location_method = 'none',
                device = 'Mobile',
                timestamp = new Date().toISOString()
            } = data;

            if (event_type === 'pageview') {
                analyticsStore.total_pageviews += 1;
            }
            analyticsStore.unique_visitors.add(visitor_id);
            analyticsStore.unique_sessions.add(session_id);

            // Upsert visitor location profile without letting unset beacons erase GPS coordinates
            const prevProfile = analyticsStore.visitor_profiles.get(visitor_id);
            const hasNewLocation = location_method && location_method !== 'none';
            const mergedProfile = {
                visitor_id,
                locality: hasNewLocation || !prevProfile ? locality : prevProfile.locality,
                city: hasNewLocation || !prevProfile ? city : prevProfile.city,
                in_sahibganj: hasNewLocation || !prevProfile ? in_sahibganj : prevProfile.in_sahibganj,
                exact_address: exact_address || (prevProfile ? prevProfile.exact_address : ''),
                locality_detail: locality_detail || (prevProfile ? prevProfile.locality_detail : ''),
                postcode: postcode || (prevProfile ? prevProfile.postcode : ''),
                coordinates: coordinates || (prevProfile ? prevProfile.coordinates : ''),
                map_link: map_link || (prevProfile ? prevProfile.map_link : ''),
                gps_accuracy_m:
                    gps_accuracy_m != null
                        ? gps_accuracy_m
                        : prevProfile
                          ? prevProfile.gps_accuracy_m
                          : null,
                location_method: hasNewLocation || !prevProfile ? location_method : prevProfile.location_method,
                device: device || (prevProfile ? prevProfile.device : 'Mobile'),
                last_seen: timestamp,
                pages_viewed: (prevProfile ? prevProfile.pages_viewed : 0) + (event_type === 'pageview' ? 1 : 0)
            };
            analyticsStore.visitor_profiles.set(visitor_id, mergedProfile);

            // Track max active dwell seconds per (session_id) on each page_path
            if (!analyticsStore.pages[page_path]) {
                analyticsStore.pages[page_path] = {
                    views: 0,
                    visitSeconds: new Map()
                };
            }
            if (event_type === 'pageview') {
                analyticsStore.pages[page_path].views += 1;
            }
            if (active_seconds > 0) {
                const currentMax = analyticsStore.pages[page_path].visitSeconds.get(session_id) || 0;
                if (active_seconds > currentMax) {
                    analyticsStore.pages[page_path].visitSeconds.set(session_id, active_seconds);
                }
            }

            // Append to recent events ring buffer (max 100)
            analyticsStore.recent_events.unshift({
                event_type,
                page_path,
                locality: mergedProfile.locality,
                city: mergedProfile.city,
                in_sahibganj: mergedProfile.in_sahibganj,
                exact_address: mergedProfile.exact_address,
                map_link: mergedProfile.map_link,
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
