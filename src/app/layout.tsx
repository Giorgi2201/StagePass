import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { AudioProvider } from "@/context/AudioContext";
import { Navbar } from "@/components/Navbar";
import { LiquidGlassNav } from "@/components/navigation/LiquidGlassNav";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { MaximizedPlayer } from "@/components/player/MaximizedPlayer";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SplashScreen } from "@/components/pwa/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#121212",
};

export const metadata: Metadata = {
  title: {
    default: "StagePass - Concert Setlists",
    template: "%s | StagePass",
  },
  description:
    "Transform concert setlists into Spotify playlists and digital ticket stubs.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StagePass",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased bg-[#121212] text-zinc-100`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <NavigationProvider>
            <AudioProvider>
              <SplashScreen />
              <OfflineBanner />
              <Navbar />
              {children}
              <MiniPlayer />
              <MaximizedPlayer />
              <LiquidGlassNav />
              <InstallPrompt />
            </AudioProvider>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
