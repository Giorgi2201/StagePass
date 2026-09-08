/**
 * Setlist.fm Raw API Schema Types
 */

export interface RawArtist {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
}

export interface RawCity {
  id?: string;
  name: string;
  state?: string;
  stateCode?: string;
  country: {
    code: string;
    name: string;
  };
  coords?: {
    lat: number;
    long: number;
  };
}

export interface RawVenue {
  id?: string;
  name: string;
  city?: RawCity;
  url?: string;
}

export interface RawTour {
  name: string;
}

export interface RawSong {
  name: string;
  with?: {
    mbid?: string;
    name?: string;
  };
  cover?: {
    mbid?: string;
    name?: string;
    sortName?: string;
  };
  info?: string;
  tape?: boolean;
}

export interface RawSet {
  name?: string;
  encore?: number;
  song?: RawSong[] | RawSong;
}

export interface RawSetlist {
  id: string;
  versionId?: string;
  eventDate: string; // "DD-MM-YYYY"
  lastUpdated?: string;
  artist: RawArtist;
  venue?: RawVenue;
  tour?: RawTour;
  sets?: {
    set?: RawSet[] | RawSet;
  } | string;
  info?: string;
  url?: string;
}

export interface RawArtistSearchResponse {
  type?: string;
  itemsPerPage?: number;
  page?: number;
  total?: number;
  artist?: RawArtist[];
}

export interface RawSetlistsResponse {
  type?: string;
  itemsPerPage?: number;
  page?: number;
  total?: number;
  setlist?: RawSetlist[];
}

/**
 * Clean, Normalized Domain Models for Frontend Consumption
 */

export interface NormalizedArtist {
  id: string; // MusicBrainz ID (mbid)
  name: string;
  disambiguation?: string;
  imageUrl?: string | null;
}

export interface NormalizedShow {
  id: string;
  eventDate: string;
  artistName: string;
  venueName: string;
  cityName: string;
  countryName: string;
  tourName?: string;
  songCount: number;
}

export interface NormalizedTrack {
  name: string;
  originalArtist?: string;
  isCover: boolean;
  isEncore: boolean;
  setNumber: number;
  info?: string;
  confidenceScore?: number; // 0-100 percentage for rehearsal consensus
}

export interface SetlistParseResult {
  mode: "memory" | "rehearsal" | "essential";
  artistName: string;
  tourName?: string;
  venueInfo?: string;
  eventDate?: string;
  tracks: NormalizedTrack[];
  totalTracks: number;
}
