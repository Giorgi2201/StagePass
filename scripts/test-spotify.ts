import { sanitizeTrackTitle } from "../src/lib/spotify.ts";

function testSanitizeTrackTitle() {
  console.log("=== Testing sanitizeTrackTitle ===");

  const cases = [
    { input: "Creep (Acoustic)", expected: "Creep" },
    { input: "Karma Police [Live]", expected: "Karma Police" },
    { input: "Free Bird (Solo)", expected: "Free Bird" },
    { input: "Higher Power (Snippet)", expected: "Higher Power" },
    { input: "Midnight City (Extended)", expected: "Midnight City" },
    { input: "\"Heroes\"", expected: "Heroes" },
    { input: "‘Billie Jean’", expected: "Billie Jean" },
    { input: "Stay feat. Justin Bieber", expected: "Stay" },
    { input: "Under Pressure with Queen", expected: "Under Pressure" },
    { input: "Fix You - ", expected: "Fix You" },
    { input: "  Everlong   (Acoustic Version)  ", expected: "Everlong" },
  ];

  for (const { input, expected } of cases) {
    const result = sanitizeTrackTitle(input);
    console.log(`'${input}' -> '${result}'`);
    if (result !== expected) {
      throw new Error(`Sanitization failed: expected '${expected}', got '${result}'`);
    }
  }

  console.log("✓ sanitizeTrackTitle PASSED all test cases!\n");
}

testSanitizeTrackTitle();
