import { parseMemorySetlist, calculateRehearsalConsensus } from "../src/lib/setlist.ts";
import type { RawSetlist } from "../src/types/setlist.ts";

function testMemoryParser() {
  console.log("=== Testing parseMemorySetlist ===");

  const mockShow: RawSetlist = {
    id: "show-1",
    eventDate: "15-08-2024",
    artist: { mbid: "artist-1", name: "Radiohead" },
    venue: {
      name: "Madison Square Garden",
      city: {
        name: "New York",
        country: { code: "US", name: "United States" },
      },
    },
    tour: { name: "A Moon Shaped Pool Tour" },
    sets: {
      set: [
        {
          name: "Main Set",
          song: [
            { name: "Intro Tape", tape: true }, // Should be pruned
            { name: "Burn the Witch" },
            { name: "Daydreaming" },
            {
              name: "The Rip",
              cover: { name: "Portishead", mbid: "cover-mbid" },
            },
            { name: "Ful Stop", info: "With Colin Greenwood bass solo" },
          ],
        },
        {
          encore: 1,
          name: "Encore 1",
          song: [
            { name: "Walk-on Soundscape", tape: true }, // Should be pruned
            { name: "Paranoid Android" },
            { name: "Karma Police" },
          ],
        },
      ],
    },
  };

  const result = parseMemorySetlist(mockShow);

  console.log("Result Mode:", result.mode);
  console.log("Artist:", result.artistName);
  console.log("Tour:", result.tourName);
  console.log("Venue Info:", result.venueInfo);
  console.log("Total Tracks:", result.totalTracks);

  // Assertions (4 in main set + 2 in encore = 6 tracks)
  if (result.totalTracks !== 6) {
    throw new Error(`Expected 6 tracks (tape songs filtered out), got ${result.totalTracks}`);
  }

  const tapeSongs = result.tracks.filter((t) => t.name.includes("Tape") || t.name.includes("Soundscape"));
  if (tapeSongs.length > 0) {
    throw new Error("Tape songs were not properly filtered!");
  }

  const coverTrack = result.tracks.find((t) => t.name === "The Rip");
  if (!coverTrack || !coverTrack.isCover || coverTrack.originalArtist !== "Portishead") {
    throw new Error("Cover attribution failed for 'The Rip'");
  }

  const encoreTrack = result.tracks.find((t) => t.name === "Karma Police");
  if (!encoreTrack || !encoreTrack.isEncore) {
    throw new Error("Encore flag missing for 'Karma Police'");
  }

  console.log("✓ parseMemorySetlist PASSED all assertions!\n");
}

function testRehearsalConsensus() {
  console.log("=== Testing calculateRehearsalConsensus ===");

  // 3 mock shows with realistic setlist rotations
  const mockShows: RawSetlist[] = [
    {
      id: "night-1",
      eventDate: "10-09-2024",
      artist: { mbid: "artist-2", name: "Coldplay" },
      tour: { name: "Music of the Spheres" },
      sets: {
        set: [
          {
            song: [
              { name: "Intro Tape", tape: true },
              { name: "Higher Power" }, // Pos 1
              { name: "Adventure of a Lifetime" }, // Pos 2
              { name: "Paradise" }, // Pos 3
              { name: "The Scientist" }, // Pos 4
              { name: "Viva La Vida" }, // Pos 5
              { name: "Rotating Song A" }, // Pos 6 (only played night 1)
              { name: "Fix You" }, // Pos 7
            ],
          },
          {
            encore: 1,
            song: [
              { name: "Biutyful" }, // Pos 8
            ],
          },
        ],
      },
    },
    {
      id: "night-2",
      eventDate: "12-09-2024",
      artist: { mbid: "artist-2", name: "Coldplay" },
      tour: { name: "Music of the Spheres" },
      sets: {
        set: [
          {
            song: [
              { name: "Higher Power" }, // Pos 1
              { name: "Adventure of a Lifetime" }, // Pos 2
              { name: "Paradise" }, // Pos 3
              { name: "The Scientist" }, // Pos 4
              { name: "Viva La Vida" }, // Pos 5
              { name: "Rotating Song B" }, // Pos 6 (only played night 2)
              { name: "Fix You" }, // Pos 7
            ],
          },
          {
            encore: 1,
            song: [
              { name: "Biutyful" }, // Pos 8
            ],
          },
        ],
      },
    },
    {
      id: "night-3",
      eventDate: "14-09-2024",
      artist: { mbid: "artist-2", name: "Coldplay" },
      tour: { name: "Music of the Spheres" },
      sets: {
        set: [
          {
            song: [
              { name: "Higher Power" }, // Pos 1
              { name: "Adventure of a Lifetime" }, // Pos 2
              { name: "Paradise" }, // Pos 3
              { name: "The Scientist" }, // Pos 4
              { name: "Viva La Vida" }, // Pos 5
              { name: "Rotating Song C" }, // Pos 6 (only played night 3)
              { name: "Fix You" }, // Pos 7
            ],
          },
          {
            encore: 1,
            song: [
              { name: "Biutyful" }, // Pos 8
            ],
          },
        ],
      },
    },
  ];

  const result = calculateRehearsalConsensus(mockShows, 0.5);

  console.log("Rehearsal Mode:", result.mode);
  console.log("Artist:", result.artistName);
  console.log("Tour:", result.tourName);
  console.log("Consensus Tracks Count:", result.totalTracks);
  console.log("Tracks in Order of Emotional Pacing:");
  result.tracks.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} (Confidence: ${t.confidenceScore}%, Encore: ${t.isEncore})`);
  });

  // Opener should be Higher Power
  if (result.tracks[0].name !== "Higher Power") {
    throw new Error(`Expected 'Higher Power' as opener, got '${result.tracks[0].name}'`);
  }

  // Closer should be Biutyful
  const lastTrack = result.tracks[result.tracks.length - 1];
  if (lastTrack.name !== "Biutyful") {
    throw new Error(`Expected 'Biutyful' as closer, got '${lastTrack.name}'`);
  }

  // Confidence for core songs should be 100% (3/3 shows)
  const coreSong = result.tracks.find((t) => t.name === "Viva La Vida");
  if (!coreSong || coreSong.confidenceScore !== 100) {
    throw new Error(`Expected 100% confidence for Viva La Vida, got ${coreSong?.confidenceScore}%`);
  }

  // Rotating songs played in only 1 of 3 shows (33%) should be filtered out by 50% threshold
  const rotatingA = result.tracks.find((t) => t.name === "Rotating Song A");
  if (rotatingA) {
    throw new Error("Rotating Song A should have been filtered out by 50% threshold");
  }

  console.log("✓ calculateRehearsalConsensus PASSED all assertions!\n");
}

testMemoryParser();
testRehearsalConsensus();
