# Deployment Guide - Shopping Feed Viewer

## Cloudflare Pages (Recommended)

This app is configured for Cloudflare Pages with Functions for the CORS proxy and password protection.

### Quick Deploy

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Add Cloudflare Pages support"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
   - Click "Create a project" > "Connect to Git"
   - Select your repository
   - Configure build settings:
     - **Build command:** (leave empty - static site)
     - **Build output directory:** `/`

3. **Set the Password**
   - After deployment, go to your Pages project > Settings > Environment variables
   - Add variable:
     - **Name:** `SITE_PASSWORD`
     - **Value:** Your team password (e.g., `YourSecurePassword123`)
   - Click "Save" and redeploy

4. **Share with Team**
   - Your app will be at: `https://your-project.pages.dev`
   - Share the URL and password with your team

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SITE_PASSWORD` | Password for team access | Yes |

### How It Works

```
Team Member → Password Login → Session Cookie → Full App Access
                                                      ↓
                                              /api/fetch-feed
                                                      ↓
                                         AdTribes/WordPress Feeds
```

- Password protection via Cloudflare Function middleware
- Session stored in secure HTTP-only cookie (7 days)
- CORS proxy runs at the edge for fast feed fetching
- Feeds cached for 5 minutes at the edge

---

## Using with AdTribes Product Feed Elite

Your AdTribes feeds are accessed via their public URLs. Common patterns:

```
https://yoursite.com/feed/google/
https://yoursite.com/feed/facebook/
https://yoursite.com/?feed=woosea&channel_hash=XXXXX
```

Just paste these URLs into the Feed Viewer and click "Load Feed".

---

## Local Development

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run locally with Functions
npx wrangler pages dev . --port 3000

# Or use the Express server (no password protection)
npm install
npm start
```

**Note:** For local testing with password, set the environment variable:
```bash
# Windows
set SITE_PASSWORD=testpassword
npx wrangler pages dev .

# Mac/Linux
SITE_PASSWORD=testpassword npx wrangler pages dev .
```

---

## Project Structure

```
feed-checker/
├── functions/
│   ├── _middleware.js      # Password protection
│   └── api/
│       ├── fetch-feed.js   # CORS proxy for XML feeds
│       └── logout.js       # Session logout
├── index.html              # Main app
├── script.js               # Frontend logic
├── styles.css              # Styling
├── server.js               # Legacy Express server (for local dev)
└── package.json
```

---

## Alternative Deployment Options

### Render.com / Railway.app (Express Server)

If you prefer the traditional Node.js server:

1. Push to GitHub
2. Connect to Render.com or Railway.app
3. Set build command: `npm install`
4. Set start command: `npm start`

Note: These don't include password protection by default.

### Static Hosting (GitHub Pages/Netlify)

For static-only hosting (file upload only, no live URL fetching):

1. Remove the `functions/` directory
2. Deploy to GitHub Pages or Netlify
3. Users must upload XML files manually (no CORS proxy)

---

## Troubleshooting

### "Incorrect password" error
- Check that `SITE_PASSWORD` is set in Cloudflare Pages environment variables
- Redeploy after adding the variable

### Feed not loading
- Ensure the feed URL is publicly accessible
- Check that the feed returns valid XML
- Try uploading the XML file directly as a test

### Session expired
- Sessions last 7 days
- Click "Logout" and log back in

### Local development issues
- Make sure Wrangler is installed: `npm install -g wrangler`
- Check you're logged in: `wrangler whoami`
