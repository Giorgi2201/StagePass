# 🎟️ StagePass — Live Concert Setlist to Spotify PWA

> Transform real live concert setlists into verified Spotify playlists and commemorative digital ticket stubs. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **100% free, database-free stateless architecture**.

---

## ⚡ Core Features

- **Pre-Concert Rehearsal Mode**: Analyzes recent tour shows from Setlist.fm and predicts the tour consensus tracklist in emotional concert pacing order so you can study the songs before attending.
- **Post-Concert Memory Mode**: Relives an exact tour date you attended, filtering out soundscape/tape tracks and capturing encores and special covers.
- **Automated Spotify Track Matching**: High-performance 3-tier fallback search engine resolving live track titles to official Spotify catalog tracks with concurrent batch processing and 100-track chunk playlist insertion.
- **Digital Ticket Stub Studio**: Retro-meets-modern concert pass customizer with 3 aesthetic themes (*Spotify Neon*, *Vintage Paper*, *Cyber Midnight*), vanity seating details, and high-res retina PNG client-side export ($0 server cost).
- **Native Web Share API Level 2**: Direct one-tap sharing to Instagram Stories, WhatsApp, Photos, and AirDrop on iOS and Android with desktop clipboard and download fallbacks.
- **Stadium-Ready Offline PWA**: Installable standalone web app with service worker caching, Android deferred install banner, iOS Safari step-by-step guidance modal, and arena offline connection alerts.
- **Tactile Micro-Haptics**: Responsive micro-vibrations across mode toggles, artist picks, track selections, and celebratory playlist completions.
- **100% Free & Zero-Database**: Stateless AES-256-GCM JWE session encryption stored in secure HTTP-only cookies. $0 hosting cost on Vercel Hobby tier.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 (App Router) | Server components, edge caching, serverless API routes |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | Tailwind CSS v4 | Spotify design system (`#121212`, `#1DB954`, pill badges) |
| **Security & Auth** | Jose (JWE AES-256-GCM) | Encrypted stateless session cookies (zero database) |
| **External APIs** | Spotify Web API & Setlist.fm | Music catalog, OAuth 2.0, verified concert setlists |
| **Graphics & Export**| HTML5 Canvas / `html-to-image` | Client-side 3x retina PNG ticket rendering |
| **PWA & Offline** | `@ducanh2912/next-pwa` (Workbox) | Offline service worker caching & standalone install |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.0.0` or newer
- **Spotify Developer Account**: [developer.spotify.com](https://developer.spotify.com/dashboard)
- **Setlist.fm API Key**: [setlist.fm/settings/api](https://www.setlist.fm/settings/api)

### 2. Clone & Install
```bash
git clone https://github.com/your-username/stagepass.git
cd stagepass
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Spotify Developer Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Setlist.fm API Key
SETLIST_FM_API_KEY=your_setlist_fm_api_key

# 32+ character random string for AES-256-GCM JWE encryption
SESSION_SECRET=your_random_32_character_secret_key_here

# Local Development Base URL (Spotify OAuth requires explicit 127.0.0.1 for HTTP)
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3000
```

> **Note on Spotify OAuth & Loopback addresses:** Spotify requires either HTTPS or explicit IPv4 loopback addresses (`http://127.0.0.1:<port>`). In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), add:
> `http://127.0.0.1:3000/api/auth/callback` to your App's **Redirect URIs**.

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://127.0.0.1:3000`** in your browser.

---

## 🌐 $0 Free Vercel Deployment Guide

StagePass is designed to run completely free on the Vercel Hobby plan.

### Step 1: Push Repository to GitHub
```bash
git add .
git commit -m "feat: complete StagePass production build"
git push origin main
```

### Step 2: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Select your `stagepass` GitHub repository and click **Import**.

### Step 3: Add Environment Variables in Vercel
In the Vercel project configuration screen under **Environment Variables**, add:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `SPOTIFY_CLIENT_ID` | `...` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | `...` | From Spotify Developer Dashboard |
| `SETLIST_FM_API_KEY` | `...` | From Setlist.fm API settings |
| `SESSION_SECRET` | `...` | 32+ character key (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` | Your production Vercel URL (without trailing slash) |

Click **Deploy**.

### Step 4: Update Spotify Developer Dashboard
1. Go to your app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Settings**.
3. Under **Redirect URIs**, add your production callback URL:
   ```
   https://your-project.vercel.app/api/auth/callback
   ```
4. Click **Save**.

Your StagePass app is now live in production at zero monthly hosting cost!

---

## 📱 Mobile PWA Installation

### iOS (Safari)
1. Open your StagePass deployment in Safari on iPhone or iPad.
2. Tap the **Share** button in Safari's bottom toolbar.
3. Scroll down and select **"Add to Home Screen"**.
4. Tap **"Add"** in the top right.
5. Launch StagePass directly from your Home Screen for full-screen stadium access.

### Android (Chrome)
1. Open StagePass in Chrome on Android.
2. Tap the **"Install App"** button on the bottom prompt (or tap the three-dot menu and select **"Install app"**).
3. Confirm installation. The app will be added to your app drawer and home screen.

---

## 🔒 Security Architecture

- **Stateless Tokens**: Spotify access and refresh tokens are encrypted using `A256GCM` JWE via `jose` and stored exclusively in HTTP-only, `SameSite=Lax` cookies. No database is required and tokens are never exposed to clientside JavaScript.
- **Secrets Isolation**: `SPOTIFY_CLIENT_SECRET`, `SETLIST_FM_API_KEY`, and `SESSION_SECRET` are strictly loaded in server routes and never bundled into the client build.
- **Production Headers**: Attached automatically on all responses:
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🧪 Available Scripts

- `npm run dev`: Starts the Next.js development server on `127.0.0.1:3000`.
- `npm run build`: Generates an optimized production build with Webpack and PWA service workers.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint with zero-tolerance rules.
- `npx tsc --noEmit`: Runs full TypeScript type verification.

---

## 📄 License
MIT License. Created with ❤️ for live music fans.
