// Cloudflare KV-based exclusions storage
// Requires KV namespace bound as EXCLUSIONS in Cloudflare Pages settings

// Helper to generate a feed key from URL
function getFeedKey(feedUrl) {
    // Create a simple hash/slug from the feed URL
    return feedUrl
        .replace(/https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 100);
}

// GET /api/exclusions?feedUrl=X - Get current exclusions for a feed
// GET /api/exclusions?feedUrl=X&history=true - Get history of saves
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('feedUrl');
    const showHistory = url.searchParams.get('history') === 'true';

    if (!feedUrl) {
        return new Response(JSON.stringify({ error: 'feedUrl parameter required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check if KV is available
    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({
            error: 'KV storage not configured',
            message: 'Please create a KV namespace called EXCLUSIONS and bind it in Cloudflare Pages settings'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const feedKey = getFeedKey(feedUrl);

    try {
        if (showHistory) {
            // Get history list
            const historyKey = `history:${feedKey}`;
            const history = await env.EXCLUSIONS.get(historyKey, 'json') || [];

            return new Response(JSON.stringify({
                feedUrl,
                history: history
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Get current exclusions
            const currentKey = `current:${feedKey}`;
            const data = await env.EXCLUSIONS.get(currentKey, 'json');

            if (!data) {
                return new Response(JSON.stringify({
                    feedUrl,
                    excludedIds: [],
                    savedAt: null,
                    savedBy: null
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/exclusions - Save exclusions
export async function onRequestPost(context) {
    const { request, env } = context;

    // Check if KV is available
    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({
            error: 'KV storage not configured',
            message: 'Please create a KV namespace called EXCLUSIONS and bind it in Cloudflare Pages settings'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { feedUrl, excludedIds, excludedItems, allFeedIds, savedBy } = body;

        if (!feedUrl || !excludedIds) {
            return new Response(JSON.stringify({ error: 'feedUrl and excludedIds required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const feedKey = getFeedKey(feedUrl);
        const timestamp = new Date().toISOString();

        // Create the save record
        const saveRecord = {
            feedUrl,
            excludedIds,
            excludedItems: excludedItems || [],
            allFeedIds: allFeedIds || [],
            savedAt: timestamp,
            savedBy: savedBy || 'Unknown',
            count: excludedIds.length
        };

        // Save as current
        const currentKey = `current:${feedKey}`;
        await env.EXCLUSIONS.put(currentKey, JSON.stringify(saveRecord));

        // Add to history (keep last 50 saves)
        const historyKey = `history:${feedKey}`;
        let history = await env.EXCLUSIONS.get(historyKey, 'json') || [];

        // Add new entry at the beginning
        history.unshift({
            savedAt: timestamp,
            savedBy: savedBy || 'Unknown',
            count: excludedIds.length,
            id: `save_${Date.now()}`
        });

        // Keep only last 50 entries
        history = history.slice(0, 50);

        await env.EXCLUSIONS.put(historyKey, JSON.stringify(history));

        return new Response(JSON.stringify({
            success: true,
            savedAt: timestamp,
            count: excludedIds.length,
            message: `Saved ${excludedIds.length} exclusions`
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Load a specific historical save
export async function onRequestPut(context) {
    const { request, env } = context;

    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({
            error: 'KV storage not configured'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { feedUrl, saveId } = body;

        if (!feedUrl || !saveId) {
            return new Response(JSON.stringify({ error: 'feedUrl and saveId required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const feedKey = getFeedKey(feedUrl);

        // Get the specific save from history storage
        const saveKey = `save:${feedKey}:${saveId}`;
        const saveData = await env.EXCLUSIONS.get(saveKey, 'json');

        if (!saveData) {
            return new Response(JSON.stringify({ error: 'Save not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(saveData), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
