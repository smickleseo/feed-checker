# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
npm install

# Start the development server
npm start
# or
npm run dev

# Server runs on http://localhost:3000
```

## Architecture Overview

This is a Shopping Feed Viewer application for previewing and managing Meta/Facebook shopping feeds with exclusion capabilities. The codebase consists of:

### Core Components
- **Frontend**: Single-page application (`index.html`, `script.js`, `styles.css`) using vanilla JavaScript with a FeedViewer class that manages feed loading, filtering, and exclusion tracking
- **Backend**: Express.js server (`server.js`) that serves static files and provides a proxy endpoint (`/api/fetch-feed`) to bypass CORS restrictions when fetching external XML feeds
- **Feed Processing**: XML parser that handles Google Shopping/Meta catalog feeds with `<item>` elements containing product data (id, title, price, image_link, availability, etc.)

### Key Features Implementation
- **Feed Loading**: Supports URL input, file upload, and sample feeds. The app attempts both direct fetch and server proxy for CORS handling
- **Exclusion System**: Items can be marked as excluded, tracked in a Set, and exported/imported as JSON with timestamps and metadata
- **Variant Handling**: Detects and groups product variants by `item_group_id`, allows bulk operations on variant groups
- **Filtering**: Real-time search and category filtering with stats tracking for total/excluded/visible items
- **Modals**: Custom modal system for variant operations, export format selection, and import preview

### Data Flow
1. Feed URL/file → XML parsing → Item objects with normalized fields
2. Items → Filter/search → Visible items rendered as cards
3. Exclusions → Export as JSON with customizable format (IDs only, with details, or CSV)
4. Import → Preview and merge exclusions with conflict resolution