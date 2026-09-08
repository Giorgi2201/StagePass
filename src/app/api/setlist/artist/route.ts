import { NextResponse } from "next/server";
import {
  searchArtists,
  normalizeArtistName,
  scoreArtistRelevance,
} from "@/lib/setlist";
import {
  enrichArtistsWithSpotifyImages,
  resolveSpotifyCanonicalArtist,
} from "@/lib/spotify";
import type { NormalizedArtist } from "@/types/setlist";

/**
 * Generate stylistic search variants (e.g. replacing 's' with '$', or vice-versa)
 */
function getQueryExpansionVariants(query: string): string[] {
  const variants = new Set<string>();
  const trimmed = query.trim();
  variants.add(trimmed);

  // Accent-stripped variant
  const unaccented = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (unaccented !== trimmed) {
    variants.add(unaccented);
  }

  // Stylistic symbol substitutions:
  // e.g. "asap ferg" -> "a$ap ferg"
  if (/\basap\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\basap\b/gi, "A$AP"));
  }
  if (/\bkesha\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bkesha\b/gi, "Ke$ha"));
  }
  if (/\bjoey badass\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bjoey badass\b/gi, "Joey Bada$$"));
  }
  if (/\bpink\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bpink\b/gi, "P!nk"));
  }

  // General $ <-> s substitution if query contains $
  if (trimmed.includes("$")) {
    variants.add(trimmed.replace(/\$/g, "s"));
  }

  return Array.from(variants);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' (artist name) is required" },
      { status: 400 }
    );
  }

  const rawQuery = q.trim();

  try {
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 6, 1), 8)
      : 6;

    // 1. Upstream Primary Search with Query Expansion
    const variants = getQueryExpansionVariants(rawQuery);
    const candidateMap = new Map<string, NormalizedArtist>();

    // Search primary query variant
    const primaryArtists = await searchArtists(variants[0], limit);
    for (const a of primaryArtists) {
      candidateMap.set(a.id, a);
    }

    // Check if we already have an exact or alias Tier-1 match
    const normQuery = normalizeArtistName(rawQuery);
    const hasTier1Match = Array.from(candidateMap.values()).some((a) => {
      const normName = normalizeArtistName(a.name);
      const normDis = normalizeArtistName(a.disambiguation || "");
      return normName === normQuery || normDis.includes(normQuery);
    });

    // 2. Query Expansion: If no Tier-1 match, try other variants (e.g. A$AP Ferg, unaccented)
    if (!hasTier1Match && variants.length > 1) {
      for (const variant of variants.slice(1)) {
        const variantArtists = await searchArtists(variant, limit, variant);
        for (const a of variantArtists) {
          if (!candidateMap.has(a.id)) {
            candidateMap.set(a.id, a);
          }
        }
        if (
          Array.from(candidateMap.values()).some((a) => {
            const normName = normalizeArtistName(a.name);
            const normDis = normalizeArtistName(a.disambiguation || "");
            return normName === normQuery || normDis.includes(normQuery);
          })
        ) {
          break;
        }
      }
    }

    // 3. Spotify Smart Resolution Fallback:
    // If Setlist.fm returned 0 candidates, lacks an exact match, or query differs from official casing,
    // query Spotify to resolve typos, slang, and diacritics natively (e.g. "sainte" -> "Sainté", "beyonce" -> "Beyoncé")
    const currentCandidates = Array.from(candidateMap.values());
    const hasExactNameMatch = currentCandidates.some(
      (a) => a.name.toLowerCase() === rawQuery.toLowerCase()
    );

    if (!hasExactNameMatch || currentCandidates.length === 0) {
      const canonicalSpotify = await resolveSpotifyCanonicalArtist(rawQuery);
      if (canonicalSpotify && canonicalSpotify.name) {
        const canonicalName = canonicalSpotify.name;
        // Search Setlist.fm using the canonical Spotify name
        const canonicalArtists = await searchArtists(
          canonicalName,
          limit,
          canonicalName
        );
        for (const a of canonicalArtists) {
          if (!candidateMap.has(a.id)) {
            candidateMap.set(a.id, a);
          } else {
            // Update candidate name with canonical Spotify name if it was an alias or needed proper capitalization
            const existing = candidateMap.get(a.id)!;
            const normExisting = normalizeArtistName(existing.name);
            const normCanonical = normalizeArtistName(canonicalName);
            const normDis = normalizeArtistName(existing.disambiguation || "");
            if (
              normExisting === normCanonical ||
              normDis.includes(normCanonical)
            ) {
              candidateMap.set(a.id, {
                ...existing,
                name: canonicalName,
              });
            }
          }
        }
      }
    }

    // 4. Re-rank all gathered candidates using normalized scoring logic
    const allCandidates = Array.from(candidateMap.values());
    const scoredCandidates = allCandidates.map((artist) => {
      const relevance = scoreArtistRelevance(
        artist.name,
        artist.disambiguation,
        rawQuery
      );
      return { artist, ...relevance };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Filter out Tier 4 (guest features) and Tier 5 (tribute bands) if primary candidates exist
    const primaryCandidates = scoredCandidates.filter((item) => item.tier <= 3);
    const finalSelection = (
      primaryCandidates.length > 0
        ? primaryCandidates
        : scoredCandidates.filter((item) => item.tier <= 4)
    )
      .slice(0, limit)
      .map((item) => item.artist);

    // 5. Enrich with high-resolution Spotify artist images
    const enrichedArtists = await enrichArtistsWithSpotifyImages(finalSelection);

    return NextResponse.json(enrichedArtists, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status = message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
