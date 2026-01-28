// Cloudflare KV-based feed presets
// Stores feed URLs (not content) for the dropdown

// GET /api/feed-presets - List all feed presets for dropdown
export async function onRequestGet(context) {
    const { env } = context;

    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({ presets: [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const presets = await env.EXCLUSIONS.get('feed_presets', 'json') || [];
        return new Response(JSON.stringify({ presets }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/feed-presets - Add a new preset
export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({ error: 'KV not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { clientName, feedName, feedUrl } = await request.json();

        if (!clientName || !feedName || !feedUrl) {
            return new Response(JSON.stringify({ error: 'clientName, feedName, and feedUrl required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let presets = await env.EXCLUSIONS.get('feed_presets', 'json') || [];

        // Check if this URL already exists
        const existingIndex = presets.findIndex(p => p.feedUrl === feedUrl);
        if (existingIndex >= 0) {
            // Update existing
            presets[existingIndex] = { clientName, feedName, feedUrl, updatedAt: new Date().toISOString() };
        } else {
            // Add new
            presets.push({ clientName, feedName, feedUrl, addedAt: new Date().toISOString() });
        }

        await env.EXCLUSIONS.put('feed_presets', JSON.stringify(presets));

        return new Response(JSON.stringify({ success: true, presets }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/feed-presets - Remove a preset
export async function onRequestDelete(context) {
    const { request, env } = context;

    if (!env.EXCLUSIONS) {
        return new Response(JSON.stringify({ error: 'KV not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { feedUrl } = await request.json();

        if (!feedUrl) {
            return new Response(JSON.stringify({ error: 'feedUrl required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let presets = await env.EXCLUSIONS.get('feed_presets', 'json') || [];
        presets = presets.filter(p => p.feedUrl !== feedUrl);
        await env.EXCLUSIONS.put('feed_presets', JSON.stringify(presets));

        return new Response(JSON.stringify({ success: true, presets }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
