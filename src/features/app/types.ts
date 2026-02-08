// ===========================================
// PLAYGROUP - TYPE DEFINITIONS
// ===========================================

/**
 * Cycle phase - either voting for next album or listening to current
 */
export type CyclePhase = 'voting' | 'listening';

/**
 * The current cycle state
 */
export interface CycleState {
  phase: CyclePhase;
  currentAlbum: Album;
  daysLeftInPhase: number;
  hoursLeft: number;
  minutesLeft: number;
  listenersCount: number;
  votingEndsAt: string;
  userSubmissionsThisCycle: number;
  maxSubmissionsPerCycle: number;
}

/**
 * An album in the system
 */
export interface Album {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string;
  weekNumber: number;
  avgRating: number;
  totalReviews: number;
  mostLovedTrack: string;
  mostLovedTrackVotes: number;
  submittedBy: string;
}

/**
 * An album submission for voting
 */
export interface Submission {
  id: number;
  title: string;
  artist: string;
  votes: number;
  submitter: string;
  hasVoted: boolean;
  daysAgo: number;
}

/**
 * A user review of an album
 */
export interface Review {
  id: number;
  user: string;
  displayName: string;
  pfp: string;
  rating: number;
  text: string;
  favoriteTrack: string | null;
  daysAgo: number;
}

/**
 * A past album in the archive
 */
export interface PastAlbum {
  id: number;
  title: string;
  artist: string;
  avgRating: number;
  reviews: number;
  weekNumber: number;
}

/**
 * Preview data when submitting an album
 */
export interface AlbumPreview {
  title: string;
  artist: string;
  coverUrl: string;
}

/**
 * Countdown time structure
 */
export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}
