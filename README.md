# 🎟️ StagePass — Live Concert Setlist to Spotify & YouTube PWA

Transform real live concert setlists into verified Spotify & YouTube playlists and commemorative digital ticket stubs. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, **Tailwind CSS v4**, and a **100% stateless, database-free architecture**.

---

## ✨ Features

### 🎧 Interactive Audio Preview Player
- **Real-Time 30-Second Previews**: Listen to 30-second studio audio previews of any track directly in the review step before saving playlists.
- **Desktop Minimized Player Bar**: Bottom Spotify-styled playback bar with playback controls (Previous, Play/Pause, Next), clickable scrubber timeline, elapsed/total timestamps, and dismiss button.
- **Mobile Liquid Glass Player**: Floating mini-player docked seamlessly into the top of the mobile Liquid Glass navigation dock. Features a translucent Spotify green progress fill sweeping 0% to 100%, squircle album artwork, and tap-to-expand gesture.
- **Full-Screen Vinyl Record Mode**: On mobile, expanding the mini-player reveals an immersive full-screen player with a photorealistic spinning vinyl record, vinyl grooves, spinning center label, haptic scrubber controls, and audio queue navigation.

### 🪄 4-Step Concert Creation Wizard
1. **Step 1 — Search & Discovery**:
   - Multi-source search bar supporting artist names, venues, and cities with instant debounced results.
   - **Featured Artists**: Responsive grid scaling from 2 up to 6 columns on widescreen displays.
   - **"Popular" Quick Tags**: Instant filter chips with pinned label and dynamic edge scroll fades.
   - **"Jump Back In" Shelf**: Quick access to recently generated concert stubs.
   - **"Trending on Tour" Shelf**: High-profile world stadium tours with live status badges and 1-tap rehearsal actions.
   - **"Local Concert Radar" Shelf**: Live city concert discovery with quick city selector pills (London, New York, Los Angeles, Paris, Tokyo, Berlin, Nashville, Austin).
2. **Step 2 — Show Selection (Memory Mode)**:
   - Chronological list of verified past tour stops from Setlist.fm with date, venue, city, country, and song count.
   - City search input to pinpoint specific tour stops across long global runs.
   - 1-tap "Rehearse Tour Consensus" option if fans prefer an aggregated tour setlist.
3. **Step 3 — Setlist Review & Audio Preview**:
   - Song-by-song checklist displaying play probabilities (e.g., `100% (5/5 shows)`), opener/encore labels, and track durations.
   - 1-tap audio preview button on every track with loading spinners and active playback indicators.
   - Exclude / include toggle for any song with live track count updates.
   - Auto-generated 640x640 Tour Poster artwork preview with toggle to upload directly as the Spotify playlist cover.
   - Customizable playlist title and public / private visibility switch.
4. **Step 4 — Dual Export & Digital Stubs**:
   - Step-by-step live generation progress tracker.
   - 1-tap launch buttons for Spotify, YouTube, and YouTube Music.
   - 1-tap Universal Plain Text tracklist copy for SongShift / TuneMyMusic (Apple Music, Tidal, Amazon Music).
   - Unmatched tracks inspector detailing songs not found in streaming catalogs.
   - Direct launch into the Commemorative Digital Ticket Stub Studio.

### 🎯 Pre-Concert Rehearsal Mode
- **Predictive Tour Consensus Engine**: Analyzes an artist's 5 most recent completed tour stops from Setlist.fm and calculates track play probabilities and frequencies.
- **Concert Flow & Pacing**: Reconstructs the emotional pacing of live concerts (openers, main set staples, acoustic interludes, and encores) so fans can study the setlist before the show.
- **Intelligent Deduplication**: Merges song title variations, handles medley groupings, and filters out non-musical stage banter.

### 🏟️ Post-Concert Memory Mode
- **Exact Tour Date Reliving**: Looks up the precise setlist played on a specific date at a specific arena, stadium, or club worldwide.
- **Encore & Cover Detection**: Accurately captures encore sets, guest appearances, and unexpected cover songs.
- **Live Soundscape Filtering**: Strips out walk-on intro tapes and recorded interludes to keep playlists focused on actual musical performances.

### 💿 Studio Essentials Mode (Top Tracks Fallback)
- **Automatic Fallback for Studio Discographies**: When an artist has no recorded live setlists on Setlist.fm, StagePass seamlessly routes to Spotify's catalog to assemble an "Essential Hits & Fan Favorites" tracklist.
- **Studio Ticket Stubs**: Commemorative ticket passes styled with "Studio Discography • Global Essentials" venue designations and vanity credentials.

### 🚀 Dual-Platform Playlist Generation (Spotify & YouTube)
- **Spotify Web API Integration**: 3-tier resolution engine matching live track titles against official Spotify releases:
  1. *Direct search*: Exact track title + artist name.
  2. *Cleaned query*: Strips special characters, acoustic/live annotations, and punctuation.
  3. *Catalog fallback*: Studio album version matching if live/single recordings are unavailable.
- **Custom Playlist Cover Art Upload**: Automatically renders and attaches a 640x640 JPEG tour poster as the official Spotify playlist cover artwork upon creation.
- **1-Tap YouTube & YouTube Music Export**: Resolves setlist tracks into shareable YouTube anonymous video series playlists (`watch_videos?video_ids=...`) and YouTube Music links without requiring Spotify authentication, premium accounts, or third-party API keys.
- **Universal Text Export**: Copies clean, formatted tracklists ready for instant 1-click import into Apple Music, Tidal, and Amazon Music via SongShift or TuneMyMusic.

### 🎫 Digital Ticket Stub Studio
- **Retro-Meets-Modern Collectibles**: Commemorative concert ticket pass generator created in real-time on the client side.
- **Curated Visual Themes**:
  - **Spotify Neon**: Sleek dark slate with signature Spotify green accents, holographic badge overlays, and barcode styling.
  - **Vintage Paper**: Distressed parchment texture, stamp styling, crimson ink accents, and retro serif typography.
  - **Cyber Midnight**: Futuristic synthwave gradients, neon cyan glow, and geometric accents.
- **Vanity Seating Details**: Customizable section, row, and seat vanity information with instant live updates.
- **High-Res Retina Export**: Generates ultra high-resolution 3x retina PNG images directly in the browser via client-side DOM-to-canvas rendering (`html-to-image`).
- **Square Tour Poster Export**: Automatically composes and exports official 640x640 square tour poster artwork (JPEG) for playlist covers and social media.
- **Native Web Share API**: 1-tap mobile sharing directly to Instagram Stories, WhatsApp, Photos, and AirDrop on iOS and Android.

### 📂 "My Ticket Box" Stubs Archive
- **Persistent Local Shoebox**: Automatically collects and archives every generated concert stub in browser storage (`localStorage`).
- **Lifetime Concert Stats**: Live summary counters tracking Total Concerts Prepped, Live Tracks Saved, and Unique Artists.
- **Quick Re-Export & Customization**: Re-open any past ticket to customize seating vanity details, re-download high-res images, or re-launch the playlist.

### 🌍 Curated World Tours & Local Concert Radar (`ToursView`)
- **Active World Tours**: High-profile global stadium and arena runs (Kendrick Lamar, Coldplay, Billie Eilish, Oasis, Taylor Swift, Sabrina Carpenter, Dua Lipa) with tour dates, average song counts, genre badges, and 1-tap rehearsal playlist generation.
- **Local Concert Radar**: Live city concert discovery connected to `/api/setlist/city` showcasing recent live gigs across major music capitals (London, New York, Los Angeles, Paris, Tokyo, Berlin, Nashville, Austin).
- **City Search & Quick-Tap Chips**: Search any global city or tap popular hub pills to explore recent live gigs.

### 🌊 Dynamic Smooth-Animated Scroll Fades (`useScrollFade`)
- **Boundary-Aware Two-Sided Edge Fades**: Dynamic CSS gradient masks (`scroll-fade-both`) powered by CSS typed properties (`@property --fade-left-size`, `@property --fade-right-size`) with smooth 0.3s cubic-bezier transitions.
- **Smart Edge Detection**: Automatically hides the left fade when at the start (`scrollLeft <= 3`), hides the right fade at the end, and disables fades entirely when content fits without scrolling.
- **Pinned `"Popular:"` Labels**: Pinned firmly in place on the left while items/chips scroll horizontally underneath smooth edge fades.

### 🖥️ Widescreen Desktop Architecture (`max-w-[1600px]`)
- **Full-Width Edge-to-Edge Navbar**: Brand logo anchored on the left, segmented navigation pills in the center, and user profile badge on the right.
- **Expansive Multi-Column Grids**: Responsive scaling up to 6 columns for Featured Artists, up to 5 columns for Stubs and Tours, and multi-column concert card feeds.
- **Balanced 2-Column Dashboards**: Step 4 Success screen and Profile Settings formatted into spacious 2-column concert command centers on widescreen displays.
- **Zero Box-in-a-Box Constraints**: Content integrates seamlessly directly into the page canvas without heavy outer enclosing card wrappers.

### 📱 Mobile Liquid Glass Dock Navigation
- **Translucent Floating Dock**: Docked at the bottom of the screen with backdrop-blur, subtle borders, tactile haptic feedback, integrated mini-player, and tab switcher (Setlists / Tours / Stubs / Profile).

### ⚡ Progressive Web App (PWA) & Stadium Offline Resilience
- **Installable Standalone App**: Native application experience on iOS, Android, macOS, and Windows without app store downloads.
- **Service Worker Caching**: Pre-caches app shells and static assets using Workbox for lightning-fast loads.
- **Arena Offline Resilience**: Live network listener with an offline alert banner when cellular reception drops inside crowded concert stadiums.
- **In-App Installation Guides**: Visual step-by-step installation instructions for iOS Safari and Android Chrome in Profile Settings.

### 📳 Tactile Micro-Haptics
- **Physical Feedback Loops**: Integrated vibration feedback for mobile devices across search selections, tab switches, mode changes, theme selections, and playlist generation milestones.

### 🔒 Stateless & Zero-Database Architecture
- **Complete User Privacy**: No user credentials, database records, or listening histories are logged or stored on any server.
- **Encrypted Session Cookies**: Spotify OAuth tokens are encrypted with AES-256-GCM JWE and sealed strictly inside HTTP-only, secure cookies.
- **Developer Mode & Quota Handling**: In-app guidance modal (`BetaAccessModal`) for Spotify Web API sandbox limitations with instant email request templates.

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
| [Tailwind CSS v4](https://tailwindcss.com/) | Next-generation utility-first styling engine with CSS `@property` animations |
| [Lucide React](https://lucide.dev/) | Clean, consistent icons across all views and navigation bars |
| [Framer Motion](https://www.framer.com/motion/) | Smooth layout animations for modals, mini-player docks, and vinyl transitions |
| `clsx` & `tailwind-merge` | Conditional class composition and deduplication |

### Audio & Media
| Technology | Description |
| :--- | :--- |
| HTML5 Audio API | Client-side audio preview playback with timeline scrubbing and volume controls |
| Spotify & iTunes Preview APIs | 30-second studio audio preview tracks via iTunes and Spotify search endpoints |
| [`youtube-sr`](https://github.com/DevSnowflake/youtube-sr) | YouTube music video resolution with duration checks and anti-junk filtering |

### Cryptography & Security
| Technology | Description |
| :--- | :--- |
| [Jose](https://github.com/panva/jose) | Universal JavaScript library for JSON Web Encryption (AES-256-GCM JWE) and secure cookie tokens |

### Image Generation & Canvas
| Technology | Description |
| :--- | :--- |
| [`html-to-image`](https://github.com/bubkoo/html-to-image) | Client-side DOM-to-raster image generation for ticket stubs and tour posters |
| HTML5 Canvas API | High-DPI 3x retina bitmap scaling and JPEG/PNG export |

### Progressive Web App (PWA)
| Technology | Description |
| :--- | :--- |
| [`@ducanh2912/next-pwa`](https://github.com/ducanh2912/next-pwa) | Zero-config PWA plugin powered by Google Workbox for offline service workers and asset caching |
| Web App Manifest | Standalone display mode, theme colors, and adaptive app icons |

### External APIs & Data Sources
| Service | Purpose |
| :--- | :--- |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api) | OAuth 2.0 user authentication, catalog search, user profile, and playlist creation |
| [Setlist.fm REST API](https://api.setlist.fm/docs/1.0/index.html) | Verified live concert setlists, tour dates, venues, cities, and song metadata |

---

## 📡 API Reference

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `GET` | — | Initiates Spotify OAuth 2.0 PKCE flow |
| `/api/auth/callback` | `GET` | `code`, `state` | Exchanges authorization code, sets AES-256-GCM JWE cookie |
| `/api/auth/logout` | `POST` | — | Clears authenticated session cookie |
| `/api/auth/me` | `GET` | — | Returns current user profile from encrypted session |
| `/api/setlist/artist` | `GET` | `artistName` | Searches Setlist.fm for artist MusicBrainz ID (MBID) |
| `/api/setlist/shows` | `GET` | `mbid`, `page` | Returns verified concert history for an artist |
| `/api/setlist/city` | `GET` | `city` | Discovers verified live concert setlists in a specific city |
| `/api/setlist/parse` | `GET` | `mode=rehearsal&mbid=...` | Computes 5-show tour consensus setlist with play frequencies |
| `/api/setlist/parse` | `GET` | `mode=memory&setlistId=...` | Parses verified setlist for a specific concert date/venue |
| `/api/spotify/artist-top-tracks` | `GET` | `artistName`, `artistId?` | Fallback fetching Spotify top tracks for Studio Essentials mode |
| `/api/spotify/create-playlist` | `POST` | `title`, `description`, `trackUris`, `isPublic`, `coverImageDataUrl?` | Creates Spotify playlist, adds tracks, uploads custom cover artwork |
| `/api/youtube/create` | `POST` | `artistName`, `tourName`, `tracks` | Resolves music videos and generates YouTube / YouTube Music playlist links |
| `/api/audio/preview` | `GET` | `artist`, `track` | Resolves 30-second studio audio preview URL |

---

## 📂 Project Structure

```
StagePass/
├── public/                       # Static icons, favicons, and PWA manifest
├── src/
│   ├── app/                      # Next.js App Router routes & API endpoints
│   │   ├── api/
│   │   │   ├── audio/preview/    # 30-second track audio preview resolver
│   │   │   ├── auth/             # Spotify OAuth login, callback, logout, me
│   │   │   ├── setlist/          # Setlist.fm artist, city, shows, and parse routes
│   │   │   ├── spotify/          # Spotify playlist creation and top-tracks fallback
│   │   │   └── youtube/          # YouTube playlist resolution engine
│   │   ├── globals.css           # Design tokens, CSS @property masks, glassmorphism
│   │   ├── layout.tsx            # Root layout with PWA metadata & providers
│   │   └── page.tsx              # Dynamic tab orchestrator
│   ├── components/
│   │   ├── brand/                # StagePass SVG logo and branding marks
│   │   ├── modals/               # Beta access & Spotify privacy/cover modals
│   │   ├── navigation/           # Mobile Liquid Glass bottom dock
│   │   ├── player/               # Desktop mini-player & mobile vinyl record player
│   │   ├── pwa/                  # Offline stadium detection banner
│   │   ├── ticket/               # Digital ticket stub, cover art canvas & modal
│   │   ├── views/                # ToursView, StubsView, ProfileView
│   │   └── wizard/               # 4-step concert setlist creation workflow
│   ├── context/                  # Audio, Auth, Navigation, and Wizard state providers
│   ├── hooks/                    # useScrollFade dynamic edge fade observer
│   ├── lib/                      # Setlist parsing, Spotify API, YouTube resolution, JWE auth, haptics, storage
│   └── types/                    # TypeScript domain models and API schemas
├── .env.local                    # Environment variables (Spotify, Setlist.fm, Session)
├── next.config.ts                # Next.js & PWA plugin configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** installed
- **Spotify Developer Account** (for `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`)
- **Setlist.fm API Key** (for `SETLIST_FM_API_KEY`)

### Environment Variables
Create a `.env.local` file in the project root:

```env
# Spotify Developer App Credentials (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Setlist.fm API Key (https://www.setlist.fm/settings/api)
SETLIST_FM_API_KEY=your_setlist_fm_api_key

# 32+ character secret key for AES-256-GCM JWE session cookie encryption
SESSION_SECRET=your_32_character_long_secret_key_here

# App Canonical URL (default: http://localhost:3000)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> [!NOTE]
> In your Spotify Developer Dashboard, ensure the redirect URI is registered:
> `http://localhost:3000/api/auth/callback` (or your production domain).

### Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to start creating concert playlists.

---

## 🛡️ Security & Privacy Design

- **Stateless Tokens**: Spotify access and refresh tokens are encrypted using `A256GCM` JWE and stored exclusively in HTTP-only, `SameSite=Lax` cookies. Client-side JavaScript cannot access raw authentication tokens.
- **Zero Database**: No database server or cloud data store is utilized; no user data, search histories, or tokens persist beyond the user's active session.
- **Environment Isolation**: API secrets (`SPOTIFY_CLIENT_SECRET`, `SETLIST_FM_API_KEY`, `SESSION_SECRET`) are strictly consumed by server-side Route Handlers and never leaked into client bundles.
- **Hardened HTTP Headers**: Automatic protection against clickjacking, MIME-type sniffing, and permission exploits via `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 📄 License

MIT License. Designed and built for live music fans.
