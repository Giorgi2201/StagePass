"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("StagePass Global Root Error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0a0a",
          color: "#f4f4f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "440px", padding: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              border: "1px solid rgba(220, 38, 38, 0.4)",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              fontSize: "24px",
            }}
          >
            ⚠
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}
          >
            StagePass Encountered a Fatal Error
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#a1a1aa",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            The application experienced an unexpected startup error. Please
            reload the page to restart your session.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: "9999px",
              backgroundColor: "#1DB954",
              color: "#000000",
              fontWeight: 800,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(29, 185, 84, 0.25)",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
