// Logout endpoint - clears the session cookie

export async function onRequestGet() {
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/',
            'Set-Cookie': 'feed_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        }
    });
}

export async function onRequestPost() {
    return onRequestGet();
}
