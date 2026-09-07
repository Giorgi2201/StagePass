# 🎟️ StagePass — Live Concert Setlist to Spotify PWA

Transform real live concert setlists into verified Spotify playlists and commemorative digital ticket stubs. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and a **100% stateless, database-free architecture**.

---

## ✨ Features

### 🎯 Pre-Concert Rehearsal Mode
- **Tour Consensus Engine**: Analyzes an artist's most recent tour stops from Setlist.fm and calculates track play frequencies.
- **Pacing & Flow**: Preserves the emotional pacing of live concerts (openers, main set staples, acoustic interludes, and encores) so fans can study the setlist before the show.
- **Intelligent Deduplication**: Merges variations in song titles and handles medley groupings automatically.

### 🏟️ Post-Concert Memory Mode
- **Exact Tour Date Reliving**: Looks up the precise setlist played on a specific date at a specific venue.
- **Encore & Cover Detection**: Accurately captures encore sets, guest appearances, and unexpected cover songs.
- **Tape & Soundscape Filtering**: Strips out walk-on intro tapes, recorded interludes, and stage banter to keep the generated playlist focused on actual musical performances.

### 🔍 Automated Spotify Track Matching Engine
- **3-Tier Search Resolution**: High-accuracy fallback engine matching live track titles against official Spotify catalog releases:
  1. *Direct search*: Exact track title + artist name.
  2. *Cleaned query*: Strips special characters, acoustic/live annotations, and punctuation.
  3. *Catalog fallback*: Studio album version matching if live/single recordings are unavailable.
- **Concurrent Batch Processing**: Parallelized track search with rate-limiting tolerance.
- **Chunked Playlist Insertion**: Handles large setlists with automated 100-track batch insertions into Spotify playlists.

### 🎫 Digital Ticket Stub Studio
- **Retro-Meets-Modern Design**: Commemorative concert pass generator created in real-time on the client side.
- **Curated Visual Themes**:
  - **Spotify Neon**: Sleek `#121212` dark background with signature Spotify green accents and holographic overlays.
  - **Vintage Paper**: Distressed parchment texture, stamp styling, and retro typography.
  - **Cyber Midnight**: Futuristic synthwave gradients and high-contrast glow effects.
- **Vanity Seating Details**: Customizable section, row, and seat numbers for personalization.
- **Retina Export**: Generates ultra high-resolution 3x retina PNG images directly in the browser via client-side DOM-to-canvas rendering.

### 📲 Native Web Share API Level 2
- **One-Tap Mobile Sharing**: Shares the ticket stub image and Spotify playlist link directly to Instagram Stories, WhatsApp, Photos, and AirDrop on iOS and Android.
- **Desktop Fallback**: Graceful degradation with one-click direct PNG download and clipboard copy for desktop browsers.

### ⚡ Progressive Web App (PWA) & Offline Capabilities
- **Installable Standalone App**: Native app feel on mobile and desktop without an app store download.
- **Service Worker Caching**: Pre-caches critical app shells and static assets using Workbox.
- **Custom Branded Splash Screen**: Smooth app launch screen styled to match the dark Spotify aesthetic.
- **Stadium-Ready Offline Resilience**: Live network listener with an offline alert banner when cellular connectivity drops inside crowded concert arenas.

### 📳 Tactile Micro-Haptics
- **Physical Feedback Loops**: Integrated vibration patterns for mobile devices across mode toggles, artist searches, track toggles, theme switching, and playlist generation milestones.

### 🔒 Stateless & Zero-Database Architecture
- **Complete Privacy**: No user accounts, credentials, or listening history stored in any database.
- **Encrypted Session Cookies**: Authentication tokens are encrypted with AES-256-GCM JWE and stored strictly in HTTP-only, secure cookies.

---

## 🛠️ Built With

### Framework & Core
| Technology | Description |
| :--- | :--- |
| [Next.js 16](https://nextjs.org/) | React framework utilizing App Router, Server Components, Route Handlers, and Edge caching |
| [React 19](https://react.dev/) | Core UI rendering library with modern hooks and concurrent features |
| [TypeScript 5](https://www.typescriptlang.org/) | End-to-end static typing for API contracts, models, and UI state |

### Styling & Design System
| Technology | Description |
| :--- | :--- |
| [Tailwind CSS v4](https://tailwindcss.com/) | Next-generation utility-first styling engine |
| [Lucide React](https://lucide.dev/) | Clean, consistent icons across the application |
| `clsx` & `tailwind-merge` | Conditional class composition and deduplication |

### Cryptography & Security
| Technology | Description |
| :--- | :--- |
| [Jose](https://github.com/panva/jose) | Universal JavaScript library for JSON Web Encryption (AES-256-GCM JWE) and secure cookie tokens |

### Image Generation & Canvas
| Technology | Description |
| :--- | :--- |
| [`html-to-image`](https://github.com/bubkoo/html-to-image) | Client-side DOM-to-raster image generation for ticket stubs |
| [Sharp](https://sharp.pixelplumbing.com/) | High-performance server-side image processing |
| HTML5 Canvas API | Client-side bitmap rendering and high-DPI retina scaling |

### Progressive Web App (PWA)
| Technology | Description |
| :--- | :--- |
| [`@ducanh2912/next-pwa`](https://github.com/ducanh2912/next-pwa) | Zero-config PWA plugin powered by Google Workbox for offline service workers and asset caching |
| Web App Manifest | Standalone display mode, theme colors, and adaptive app icons |

### External APIs & Data Sources
| Service | Purpose |
| :--- | :--- |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api) | OAuth 2.0 user authentication, catalog search, user profile, and playlist creation |
| [Setlist.fm REST API](https://api.setlist.fm/docs/1.0/index.html) | Verified live concert setlists, tour dates, venues, and song metadata |

---

## 🛡️ Security & Privacy Design

- **Stateless Tokens**: Spotify access and refresh tokens are encrypted using `A256GCM` JWE and stored exclusively in HTTP-only, `SameSite=Lax` cookies. Client-side JavaScript cannot access raw authentication tokens.
- **Zero Database**: No database server or cloud data store is utilized; no user data, search histories, or tokens persist beyond the user's active session.
- **Environment Isolation**: API secrets (`SPOTIFY_CLIENT_SECRET`, `SETLIST_FM_API_KEY`, `SESSION_SECRET`) are strictly consumed by server-side Route Handlers and never leaked into client bundles.
- **Hardened HTTP Headers**: Automatic protection against clickjacking, MIME-type sniffing, and permission exploits via `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 📄 License

MIT License. Designed and built for live music fans.
