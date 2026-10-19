/**
 * alif. Reels Recommendation & Personalization Engine
 * 
 * Implements a dynamic, client-side recommendation algorithm:
 * - Anti-fatigue penalty (recently watched reels pushed to bottom)
 * - Implicit engagement signals (watch time, completion rate, loops, audio unmuting)
 * - User category/style affinity scoring
 * - Session-based jitter (fresh order every visit)
 * - Exploration vs. exploitation (diversity interleave to prevent echo chambers)
 */

const STORAGE_KEY_HISTORY = 'alif_reels_history';
const STORAGE_KEY_AFFINITY = 'alif_reels_affinity';
const STORAGE_KEY_SESSION_SEEN = 'alif_reels_session_seen';
const STORAGE_KEY_SESSION_SEED = 'alif_reels_session_seed';

// Safe Storage Helpers
function getLocalStorage(key, fallback = {}) {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (_) {
    return fallback;
  }
}

function setLocalStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function getSessionStorage(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch (_) {
    return fallback;
  }
}

function setSessionStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (_) {}
}

// Simple deterministic hash for session jitter
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Session Seed Generator (changes per tab/session, stable during session)
export function getSessionSeed() {
  let seed = getSessionStorage(STORAGE_KEY_SESSION_SEED);
  if (!seed) {
    seed = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    setSessionStorage(STORAGE_KEY_SESSION_SEED, seed);
  }
  return seed;
}

// Get Session Seen Set
export function getSessionSeenReels() {
  const raw = getSessionStorage(STORAGE_KEY_SESSION_SEEN, '[]');
  try {
    return new Set(JSON.parse(raw));
  } catch (_) {
    return new Set();
  }
}

export function markReelSessionSeen(reelId) {
  if (typeof window === 'undefined') return;
  const seenSet = getSessionSeenReels();
  seenSet.add(reelId);
  setSessionStorage(STORAGE_KEY_SESSION_SEEN, Array.from(seenSet));
}

// Get Current User Affinity Profile
export function getUserAffinityProfile() {
  return getLocalStorage(STORAGE_KEY_AFFINITY, {});
}

// Get Watch History
export function getWatchHistory() {
  return getLocalStorage(STORAGE_KEY_HISTORY, {});
}

/**
 * Update Affinity Score for given keys
 * @param {Array<string>} keys - Categories, styles, or tags
 * @param {number} delta - Positive or negative score
 */
function updateAffinity(keys, delta) {
  if (!keys || !keys.length) return;
  const profile = getUserAffinityProfile();

  keys.forEach((key) => {
    if (!key) return;
    const cleanKey = String(key).toLowerCase().trim();
    const current = profile[cleanKey] || 0;
    // Bound affinity score between -50 and 150
    profile[cleanKey] = Math.max(-50, Math.min(150, current + delta));
  });

  setLocalStorage(STORAGE_KEY_AFFINITY, profile);
}

/**
 * Record Telemetry: Video Watch Progress
 * @param {Object} reel - Reel item
 * @param {number} currentTime - Current seconds
 * @param {number} totalDuration - Total seconds
 */
export function trackWatchProgress(reel, currentTime, totalDuration) {
  if (!reel || !reel.id || !totalDuration || totalDuration <= 0) return;

  const ratio = currentTime / totalDuration;
  const history = getWatchHistory();
  const entry = history[reel.id] || {
    id: reel.id,
    watchCount: 0,
    completedCount: 0,
    totalSeconds: 0,
    lastWatched: Date.now(),
    lastRatio: 0,
    quickSkipped: false
  };

  entry.totalSeconds += 0.5;
  entry.lastRatio = Math.max(entry.lastRatio || 0, ratio);
  entry.lastWatched = Date.now();
  history[reel.id] = entry;
  setLocalStorage(STORAGE_KEY_HISTORY, history);

  // If user reaches 80% of video, count as completion
  if (ratio >= 0.8 && !entry._completedThisRun) {
    entry._completedThisRun = true;
    trackReelComplete(reel);
  }
}

/**
 * Record Telemetry: Reel Fully Watched / Looped
 * @param {Object} reel - Reel item
 */
export function trackReelComplete(reel) {
  if (!reel || !reel.id) return;

  const history = getWatchHistory();
  const entry = history[reel.id] || {
    id: reel.id,
    watchCount: 0,
    completedCount: 0,
    totalSeconds: 0,
    lastWatched: Date.now()
  };

  entry.completedCount = (entry.completedCount || 0) + 1;
  entry.lastWatched = Date.now();
  entry.quickSkipped = false;
  history[reel.id] = entry;
  setLocalStorage(STORAGE_KEY_HISTORY, history);

  // Mark session seen
  markReelSessionSeen(reel.id);

  // Award positive affinity
  const tags = [
    reel.category,
    reel.style,
    ...(reel.tags || [])
  ].filter(Boolean);

  updateAffinity(tags, 12);
}

/**
 * Record Telemetry: Quick Skip (< 2s viewed)
 * @param {Object} reel - Reel item
 * @param {number} watchTimeSec - Seconds watched before swipe
 */
export function trackReelSkip(reel, watchTimeSec) {
  if (!reel || !reel.id) return;

  const history = getWatchHistory();
  const entry = history[reel.id] || {
    id: reel.id,
    watchCount: 0,
    completedCount: 0,
    totalSeconds: 0,
    lastWatched: Date.now()
  };

  entry.watchCount = (entry.watchCount || 0) + 1;
  entry.lastWatched = Date.now();

  // If skipped in less than 2.0 seconds, record negative signal
  if (watchTimeSec < 2.0 && (!entry.completedCount || entry.completedCount === 0)) {
    entry.quickSkipped = true;
    const tags = [reel.category, reel.style].filter(Boolean);
    updateAffinity(tags, -6);
  }

  history[reel.id] = entry;
  setLocalStorage(STORAGE_KEY_HISTORY, history);
}

/**
 * Record Telemetry: User Engagement Event
 * @param {Object} reel - Reel item
 * @param {string} eventType - 'whatsapp' | 'audio_unmute' | 'product_click' | 'share'
 */
export function trackReelInteraction(reel, eventType) {
  if (!reel || !reel.id) return;

  const tags = [reel.category, reel.style, ...(reel.tags || [])].filter(Boolean);

  let delta = 5;
  if (eventType === 'whatsapp') delta = 25;
  else if (eventType === 'product_click') delta = 15;
  else if (eventType === 'audio_unmute') delta = 8;
  else if (eventType === 'share') delta = 10;

  updateAffinity(tags, delta);
  markReelSessionSeen(reel.id);
}

/**
 * Core Algorithm: Rank and Order Reels Feed
 * 
 * Computes a dynamic multi-factor score for every reel:
 * Score = (Base + Affinity + Freshness - QuickSkipPenalty) * FatiguePenalty + SessionJitter
 * 
 * @param {Array<Object>} allReels - Raw list of reels
 * @returns {Array<Object>} Intelligently ordered reels feed
 */
export function rankReelsFeed(allReels) {
  if (!allReels || !allReels.length) return [];
  if (typeof window === 'undefined') return allReels; // SSR fallback

  const history = getWatchHistory();
  const affinity = getUserAffinityProfile();
  const sessionSeen = getSessionSeenReels();
  const sessionSeed = getSessionSeed();
  const now = Date.now();

  // 1. Calculate Individual Scores
  const scoredReels = allReels.map((reel) => {
    const reelId = reel.id;
    const h = history[reelId];

    // Base Score
    const baseScore = 50.0;

    // Affinity Score (Category 1.5x, Style 1.0x, Tags 0.5x)
    let affinityScore = 0;
    if (reel.category && affinity[reel.category.toLowerCase()]) {
      affinityScore += affinity[reel.category.toLowerCase()] * 1.5;
    }
    if (reel.style && affinity[reel.style.toLowerCase()]) {
      affinityScore += affinity[reel.style.toLowerCase()] * 1.0;
    }
    if (reel.tags && Array.isArray(reel.tags)) {
      reel.tags.forEach((tag) => {
        const t = tag.toLowerCase();
        if (affinity[t]) affinityScore += affinity[t] * 0.4;
      });
    }
    // Clamp affinity contribution between -25 and +50
    const clampedAffinity = Math.max(-25, Math.min(50, affinityScore));

    // Freshness & Unseen Bonus
    let freshnessBonus = 0;
    if (!h) {
      // Completely unseen reel -> Big boost so new items are prioritized
      freshnessBonus = 35.0;
    } else if (!h.completedCount || h.completedCount === 0) {
      freshnessBonus = 15.0;
    }

    // Quick-Skip Penalty
    const skipPenalty = (h && h.quickSkipped) ? 20.0 : 0.0;

    // Fatigue Penalty (Anti-Repeat Multiplier)
    let fatiguePenalty = 1.0;
    if (sessionSeen.has(reelId)) {
      // Already seen in this browsing session -> drop to bottom
      fatiguePenalty = 0.08;
    } else if (h && h.lastWatched) {
      const hoursAgo = (now - h.lastWatched) / (1000 * 60 * 60);
      if (hoursAgo < 12) {
        fatiguePenalty = 0.25; // Seen today
      } else if (hoursAgo < 48) {
        fatiguePenalty = 0.60; // Seen recently
      } else if (hoursAgo < 168) {
        fatiguePenalty = 0.85; // Seen last week
      }
    }

    // Session Jitter: deterministic per session so every visit has a unique order
    const hashVal = simpleHash(`${sessionSeed}_${reelId}`);
    const jitter = (hashVal % 20) - 10; // -10 to +9.9

    // Final Composite Formula
    const netCore = baseScore + clampedAffinity + freshnessBonus - skipPenalty;
    const finalScore = Math.max(1, netCore) * fatiguePenalty + jitter;

    return {
      reel,
      score: finalScore,
      isUnseen: !h,
      category: reel.category || 'other'
    };
  });

  // 2. Sort by Composite Score Descending
  scoredReels.sort((a, b) => b.score - a.score);

  // 3. Diversity Interleaving & Anti-Clustering
  // Prevents more than 2 consecutive reels of the same category
  const finalFeed = [];
  const deferred = [];
  let lastCategory = '';
  let secondLastCategory = '';

  for (const item of scoredReels) {
    const cat = item.category;

    // If last two reels were both the same category, defer this one to diversify
    if (cat === lastCategory && cat === secondLastCategory) {
      deferred.push(item);
    } else {
      finalFeed.push(item.reel);
      secondLastCategory = lastCategory;
      lastCategory = cat;

      // If we have deferred items from other categories, try injecting one
      if (deferred.length > 0) {
        const injectIdx = deferred.findIndex((d) => d.category !== cat);
        if (injectIdx !== -1) {
          const [injected] = deferred.splice(injectIdx, 1);
          finalFeed.push(injected.reel);
          secondLastCategory = lastCategory;
          lastCategory = injected.category;
        }
      }
    }
  }

  // Append any remaining deferred items
  deferred.forEach((d) => finalFeed.push(d.reel));

  return finalFeed;
}

/**
 * Reset Reels Personalization Data
 */
export function resetReelsAlgorithm() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_AFFINITY);
    sessionStorage.removeItem(STORAGE_KEY_SESSION_SEEN);
    sessionStorage.removeItem(STORAGE_KEY_SESSION_SEED);
  } catch (_) {}
}
