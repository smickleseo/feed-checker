// Cloudflare Pages Function - CORS proxy for fetching XML feeds
// Replaces the Express.js server.js endpoint

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');

    // Validate URL parameter exists
    if (!feedUrl) {
        return new Response(
            JSON.stringify({ error: 'URL parameter is required' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Validate URL format
    let parsedUrl;
    try {
        parsedUrl = new URL(feedUrl);
    } catch {
        return new Response(
            JSON.stringify({ error: 'Invalid URL format' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Only allow HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return new Response(
            JSON.stringify({ error: 'Only HTTP/HTTPS URLs are allowed' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Fetch with timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        console.log('Fetching feed:', feedUrl);

        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Shopping-Feed-Viewer/2.2.0 (Cloudflare)',
                'Accept': 'application/xml, text/xml, application/rss+xml, */*'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return new Response(
                JSON.stringify({
                    error: 'Failed to fetch feed',
                    message: `HTTP ${response.status}: ${response.statusText}`
                }),
                {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const xmlText = await response.text();

        // Return with appropriate headers including caching
        return new Response(xmlText, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min browser, 10min edge
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        const errorMessage = error.name === 'AbortError'
            ? 'Request timed out'
            : error.message;

        console.error('Error fetching feed:', errorMessage);

        return new Response(
            JSON.stringify({
                error: 'Failed to fetch feed',
                message: errorMessage
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
