// src/scripts/locationStore.js
// Canonical Location Store, Reverse-Geocoding & Sahibganj Boundary Classifier

export const LOCATION_STORAGE_KEY = 'alif_location_v2';
export const NUDGE_DISMISS_KEY = 'alif_loc_nudge_dismissed_at';

// Sahibganj Town Center reference point
const SAHIBGANJ_CENTER = { lat: 25.2425, lng: 87.6417 };

/**
 * Haversine distance in kilometers between two lat/lng points.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Read saved location profile. Returns null if visitor has not shared/selected location yet.
 */
export function getLocationProfile() {
    if (typeof window === 'undefined') return null;
    try {
        // Remove legacy v1 keys so first-time users never see stale zone defaults
        if (localStorage.getItem('alif_user_locality')) {
            localStorage.removeItem('alif_user_locality');
            localStorage.removeItem('alif_user_coords');
        }
        const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.display_city || parsed.method !== 'gps') {
            localStorage.removeItem(LOCATION_STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Update the header pill UI safely.
 */
export function syncHeaderLocationBadge(profile) {
    if (typeof document === 'undefined') return;
    const labelEl = document.getElementById('headerLocalityName');
    const btnEl = document.getElementById('headerLocalityBtn');
    if (labelEl) {
        labelEl.textContent = profile ? profile.display_city : 'Location';
    }
    if (btnEl) {
        if (profile) {
            btnEl.setAttribute('data-loc-state', profile.in_sahibganj ? 'sahibganj' : 'outside');
            btnEl.setAttribute(
                'title',
                profile.in_sahibganj
                    ? 'Sahibganj: Doorstep Tailoring & Free Delivery Available'
                    : `${profile.display_city}: Pan-India Shipping Available`
            );
        } else {
            btnEl.setAttribute('data-loc-state', 'unset');
            btnEl.setAttribute('title', 'Check Delivery & Tailoring Availability');
        }
    }
}

/**
 * Persist location profile, sync UI, and broadcast event to PostHog & Analytics.
 */
export function saveLocationProfile(profile) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(profile));
    syncHeaderLocationBadge(profile);
    window.dispatchEvent(
        new CustomEvent('alif:locality-changed', {
            detail: profile
        })
    );
}

/**
 * Build consistent telemetry properties for PostHog and Netlify Analytics.
 * Never fabricates "Sahibganj" when location has not been shared.
 */
export function getLocationTelemetryProps(profile) {
    if (!profile) {
        return {
            locality: 'Location Not Shared',
            city: 'Location Not Shared',
            in_sahibganj: null,
            exact_address: '',
            locality_detail: '',
            postcode: '',
            coordinates: '',
            lat: null,
            lng: null,
            gps_accuracy_m: null,
            map_link: '',
            location_method: 'none'
        };
    }

    const hasCoords = profile.lat != null && profile.lng != null;
    return {
        locality: profile.display_city,
        city: profile.city || profile.display_city,
        in_sahibganj: Boolean(profile.in_sahibganj),
        exact_address: profile.exact_address || '',
        locality_detail: profile.locality_detail || '',
        postcode: profile.postcode || '',
        coordinates: hasCoords
            ? `${Number(profile.lat).toFixed(6)}, ${Number(profile.lng).toFixed(6)}`
            : '',
        lat: hasCoords ? Number(profile.lat) : null,
        lng: hasCoords ? Number(profile.lng) : null,
        gps_accuracy_m: profile.accuracy_m != null ? Math.round(profile.accuracy_m) : null,
        map_link: profile.map_link || '',
        location_method: profile.method || 'manual'
    };
}

function fetchJsonWithTimeout(url, timeoutMs = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
    })
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .finally(() => clearTimeout(timer));
}

function normalizeText(val) {
    return String(val || '').trim().toLowerCase();
}

function isSahibganjSpelling(str) {
    const s = normalizeText(str);
    return s.includes('sahibganj') || s.includes('sahebganj');
}

function deduplicateParts(parts) {
    const seen = new Set();
    const clean = [];
    for (const part of parts) {
        const trimmed = String(part || '').trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            clean.push(trimmed);
        }
    }
    return clean;
}

/**
 * Reverse-geocode exact GPS coordinates into granular street/mohalla/city address
 * and accurately classify whether user is in Sahibganj or outside.
 */
export async function reverseGeocodeAndClassify(lat, lng, accuracy = null) {
    const distToTownKm = calculateDistanceKm(lat, lng, SAHIBGANJ_CENTER.lat, SAHIBGANJ_CENTER.lng);
    const mapLink = `https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18&accept-language=en`;
    const bigDataUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;

    const [nomRes, bdcRes] = await Promise.allSettled([
        fetchJsonWithTimeout(nominatimUrl, 4000),
        fetchJsonWithTimeout(bigDataUrl, 4000)
    ]);

    const nom = nomRes.status === 'fulfilled' ? nomRes.value : null;
    const bdc = bdcRes.status === 'fulfilled' ? bdcRes.value : null;
    const addr = nom && nom.address ? nom.address : {};

    // Extract fine address components
    const streetOrSub =
        addr.road ||
        addr.pedestrian ||
        addr.neighbourhood ||
        addr.suburb ||
        addr.residential ||
        addr.quarter ||
        addr.hamlet ||
        '';
    const subArea =
        addr.neighbourhood ||
        addr.suburb ||
        addr.city_district ||
        addr.village ||
        (bdc && bdc.locality) ||
        '';
    const rawCity =
        addr.city ||
        addr.town ||
        addr.village ||
        (bdc && bdc.city) ||
        (bdc && bdc.locality) ||
        '';
    const district = addr.state_district || addr.county || '';
    const state = addr.state || (bdc && bdc.principalSubdivision) || '';
    const postcode = addr.postcode || '';

    // Determine whether actually inside Sahibganj
    const stateNorm = normalizeText(state);
    const cityNorm = normalizeText(rawCity);
    const districtNorm = normalizeText(district);
    const displayNorm = normalizeText(nom && nom.display_name);

    let inSahibganj = false;
    const isAcrossRiverBihar =
        stateNorm.includes('bihar') ||
        cityNorm.includes('manihari') ||
        cityNorm.includes('katihar') ||
        cityNorm.includes('bhagalpur');

    if (!isAcrossRiverBihar) {
        if (isSahibganjSpelling(rawCity) || isSahibganjSpelling(subArea)) {
            inSahibganj = true;
        } else if (
            (isSahibganjSpelling(district) || isSahibganjSpelling(displayNorm)) &&
            distToTownKm <= 20
        ) {
            inSahibganj = true;
        } else if (!nom && !bdc) {
            // Network reverse-geocoding unavailable: strict town south-of-Ganga bounds check
            inSahibganj =
                lat >= 25.2 &&
                lat <= 25.265 &&
                lng >= 87.58 &&
                lng <= 87.71 &&
                distToTownKm <= 10;
        }
    }

    const detailParts = deduplicateParts([
        addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road,
        addr.neighbourhood,
        addr.suburb,
        addr.hamlet,
        addr.village !== rawCity ? addr.village : ''
    ]);
    const localityDetail = detailParts.join(', ') || subArea || streetOrSub;

    const fullParts = deduplicateParts([
        ...detailParts,
        rawCity,
        district && !isSahibganjSpelling(rawCity) ? district : '',
        state,
        postcode
    ]);
    const exactAddress =
        fullParts.join(', ') ||
        (nom && nom.display_name) ||
        `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;

    // Customer-facing display city: strictly "Sahibganj" if inside Sahibganj, otherwise detected city
    const displayCity = inSahibganj
        ? 'Sahibganj'
        : rawCity || subArea || district || 'Outside Sahibganj';

    return {
        display_city: displayCity,
        in_sahibganj: inSahibganj,
        exact_address: exactAddress,
        locality_detail: localityDetail,
        city: inSahibganj ? 'Sahibganj' : rawCity || displayCity,
        postcode,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        accuracy_m: accuracy != null ? Math.round(accuracy) : null,
        map_link: mapLink,
        method: 'gps',
        updated_at: new Date().toISOString()
    };
}
