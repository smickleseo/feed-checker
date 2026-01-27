// Password protection middleware for Cloudflare Pages
// Set your password in Cloudflare Pages environment variables as SITE_PASSWORD

const LOGIN_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Shopping Feed Viewer</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
        }
        h1 {
            color: #333;
            margin-bottom: 8px;
            font-size: 24px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e1e1;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .error {
            background: #fee;
            color: #c00;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Shopping Feed Viewer</h1>
        <p class="subtitle">Enter the team password to continue</p>
        {{ERROR}}
        <form method="POST">
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autofocus>
            </div>
            <button type="submit">Sign In</button>
        </form>
    </div>
</body>
</html>
`;

// Generate a simple session token
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Parse cookies from request
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
    }
    return cookies;
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // Get password from environment variable
    const SITE_PASSWORD = env.SITE_PASSWORD || 'changeme';

    // Parse session cookie
    const cookies = parseCookies(request.headers.get('Cookie'));
    const sessionToken = cookies['feed_session'];

    // Validate session (simple token check - in production you'd verify against a store)
    // For simplicity, we encode the password hash in the token
    const validTokenPrefix = await generatePasswordHash(SITE_PASSWORD);

    if (sessionToken && sessionToken.startsWith(validTokenPrefix.substring(0, 16))) {
        // Valid session - continue to the app
        return next();
    }

    // Handle login form submission
    if (request.method === 'POST') {
        try {
            const formData = await request.formData();
            const password = formData.get('password');

            if (password === SITE_PASSWORD) {
                // Correct password - set session cookie and redirect
                const token = validTokenPrefix.substring(0, 16) + generateToken();

                return new Response(null, {
                    status: 302,
                    headers: {
                        'Location': url.pathname,
                        'Set-Cookie': `feed_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
                    }
                });
            } else {
                // Wrong password
                const html = LOGIN_HTML.replace('{{ERROR}}', '<div class="error">Incorrect password. Please try again.</div>');
                return new Response(html, {
                    status: 401,
                    headers: { 'Content-Type': 'text/html' }
                });
            }
        } catch (e) {
            // Form parsing error
            const html = LOGIN_HTML.replace('{{ERROR}}', '<div class="error">An error occurred. Please try again.</div>');
            return new Response(html, {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }
    }

    // Show login page
    const html = LOGIN_HTML.replace('{{ERROR}}', '');
    return new Response(html, {
        status: 401,
        headers: { 'Content-Type': 'text/html' }
    });
}

// Simple password hash for token validation
async function generatePasswordHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'feed-viewer-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
