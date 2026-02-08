// ===========================================
// PLAYGROUP - MOCK DATA
// ===========================================

import type {
  CycleState,
  Submission,
  Review,
  PastAlbum,
} from '@/features/app/types';

/**
 * Current cycle state - simulating voting phase (Wednesday during voting week)
 */
export const MOCK_CYCLE_STATE: CycleState = {
  phase: 'voting',
  currentAlbum: {
    id: 4,
    title: 'OK Computer',
    artist: 'Radiohead',
    coverUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=okcomputer&backgroundColor=1a1a2e',
    spotifyUrl: 'https://open.spotify.com/album/...',
    weekNumber: 12,
    avgRating: 4.2,
    totalReviews: 14,
    mostLovedTrack: 'Paranoid Android',
    mostLovedTrackVotes: 7,
    submittedBy: 'jordan_curator',
  },
  daysLeftInPhase: 2,
  hoursLeft: 14,
  minutesLeft: 23,
  listenersCount: 47,
  votingEndsAt: 'Friday 10pm WIB',
  userSubmissionsThisCycle: 1,
  maxSubmissionsPerCycle: 3,
};

/**
 * Current voting submissions
 */
export const MOCK_SUBMISSIONS: Submission[] = [
  { id: 1, title: 'Titanic Rising', artist: 'Weyes Blood', votes: 42, submitter: 'alice', hasVoted: false, daysAgo: 2 },
  { id: 2, title: 'Vespertine', artist: 'Björk', votes: 38, submitter: 'bob', hasVoted: true, daysAgo: 1 },
  { id: 3, title: 'Dummy', artist: 'Portishead', votes: 31, submitter: 'carol', hasVoted: false, daysAgo: 3 },
  { id: 4, title: 'Blonde', artist: 'Frank Ocean', votes: 27, submitter: 'dan', hasVoted: false, daysAgo: 1 },
];

/**
 * Reviews for the current album
 */
export const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    user: 'alex_musichead',
    displayName: 'Alex',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=alex',
    rating: 4,
    text: 'This album still sounds futuristic 25 years later. The production on Paranoid Android is insane...',
    favoriteTrack: 'Paranoid Android',
    daysAgo: 2,
  },
  {
    id: 2,
    user: 'jordan_curator',
    displayName: 'Jordan',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=jordan',
    rating: 5,
    text: "Radiohead's masterpiece. Every track flows perfectly. The themes of technology anxiety feel more relevant now than in 1997...",
    favoriteTrack: 'Let Down',
    daysAgo: 1,
  },
  {
    id: 3,
    user: 'vinyllover',
    displayName: 'Vinyl Lover',
    pfp: 'https://api.dicebear.com/9.x/lorelei/svg?seed=vinyl',
    rating: 3,
    text: "Gorgeous textures throughout. Not my favorite Radiohead but I get why it's a classic.",
    favoriteTrack: 'No Surprises',
    daysAgo: 3,
  },
];

/**
 * Past albums in the archive
 */
export const MOCK_PAST_ALBUMS: PastAlbum[] = [
  { id: 1, title: 'Loveless', artist: 'My Bloody Valentine', avgRating: 4.4, reviews: 23, weekNumber: 11 },
  { id: 2, title: 'Remain in Light', artist: 'Talking Heads', avgRating: 4.6, reviews: 31, weekNumber: 10 },
  { id: 3, title: 'Homogenic', artist: 'Björk', avgRating: 4.2, reviews: 19, weekNumber: 9 },
  { id: 4, title: 'Kind of Blue', artist: 'Miles Davis', avgRating: 4.7, reviews: 28, weekNumber: 8 },
  { id: 5, title: 'The Epic', artist: 'Kamasi Washington', avgRating: 4.1, reviews: 15, weekNumber: 7 },
];

/**
 * Track listing for OK Computer
 */
export const MOCK_ALBUM_TRACKS: string[] = [
  'Airbag',
  'Paranoid Android',
  'Subterranean Homesick Alien',
  'Exit Music (For a Film)',
  'Let Down',
  'Karma Police',
  'Fitter Happier',
  'Electioneering',
  'Climbing Up the Walls',
  'No Surprises',
  'Lucky',
  'The Tourist',
];

/**
 * Mock preview for album submission flow
 */
export const MOCK_PREVIEW_ALBUM = {
  title: 'Kid A',
  artist: 'Radiohead',
  coverUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=kida&backgroundColor=264653',
};
