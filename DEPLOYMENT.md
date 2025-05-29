# Deployment Guide - Shopping Feed Viewer

## 🚀 **Free Deployment Options**

### **Option 1: Render.com (Recommended - Solves CORS Issues)**

**Why Render?** It's free and supports both frontend + backend, solving the CORS problem completely.

1. **Push your code to GitHub** (you've already done this!)

2. **Go to [render.com](https://render.com)** and sign up (free)

3. **Create a new Web Service:**
   - Connect your GitHub repository
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Plan:** Free

4. **Deploy!** Render will give you a URL like: `https://your-app-name.onrender.com`

5. **Share the URL** - Anyone can now load real feed URLs without CORS issues!

---

### **Option 2: Railway.app (Alternative)**

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy automatically
4. Get live URL

---

### **Option 3: Static Hosting (GitHub Pages/Netlify)**

**Pros:** Super simple, instant
**Cons:** Only file upload works (no live feed URLs due to CORS)

**Best for:** Quick demos where users can upload XML files

---

## 📋 **What Each Option Gives You**

| Option | Live Feed URLs | File Upload | Ease | Cost |
|--------|---------------|-------------|------|------|
| **Render/Railway** | ✅ Works | ✅ Works | Medium | Free |
| **GitHub Pages** | ❌ CORS Issues | ✅ Works | Easy | Free |
| **Local Only** | ❌ CORS Issues | ✅ Works | Easy | Free |

---

## 🎯 **Recommended Approach**

1. **For quick sharing:** Use GitHub Pages + tell users to upload XML files
2. **For production use:** Deploy to Render.com for full functionality
3. **For local testing:** Run `npm install && npm start` locally

---

## 💡 **Instructions for Users**

### **If deployed with backend (Render/Railway):**
"Just paste your feed URL and click Load Feed - it works with any public XML feed!"

### **If static hosting only (GitHub Pages):**
"Click 'Upload XML File' and upload your feed's XML file directly. Live URLs won't work due to browser security restrictions."

---

## 🔧 **Local Development**

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open browser to http://localhost:3000
```

The backend proxy will handle CORS issues when running locally too! 