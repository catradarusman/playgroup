import { pgTable, text, uuid, integer, timestamp, real, boolean, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Key-Value Store Table
 *
 * Built-in table for simple key-value storage.
 * Available immediately without schema changes.
 *
 * ⚠️ CRITICAL: DO NOT DELETE OR EDIT THIS TABLE DEFINITION ⚠️
 * This table is required for the app to function properly.
 * DO NOT delete, modify, rename, or change any part of this table.
 * Removing or editing it will cause database schema conflicts and prevent
 * the app from starting.
 *
 * Use for:
 * - User preferences/settings
 * - App configuration
 * - Simple counters
 * - Temporary data
 */
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ===========================================
// PLAYGROUP CUSTOM TABLES
// ===========================================

/**
 * Users - unified identity for Farcaster + Privy users
 * Supports account linking via wallet address
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid"), // Farcaster ID (nullable - only FC users)
  privyId: text("privy_id"), // Privy ID (nullable - only Privy users)
  walletAddress: text("wallet_address"), // Always present (FC embedded or Privy smart wallet)
  email: text("email"), // Privy users only
  username: text("username").notNull(), // FC username OR derived from email
  displayName: text("display_name").notNull(), // Full display name
  pfpUrl: text("pfp_url"), // FC pfp OR DiceBear generated
  authProvider: text("auth_provider").notNull(), // 'farcaster' | 'privy'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Cycles - 1-week listening cycles (52 per year)
 */
export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  phase: text("phase").notNull(), // 'voting' | 'listening'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  votingEndsAt: timestamp("voting_ends_at").notNull(),
  winnerId: uuid("winner_id"), // references albums.id when selected (FK omitted to avoid circular type inference)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Albums - submitted and winning albums
 */
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  spotifyId: text("spotify_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url").notNull(),
  spotifyUrl: text("spotify_url").notNull(),
  cycleId: uuid("cycle_id").notNull().references(() => cycles.id),
  submittedByFid: integer("submitted_by_fid"), // Legacy - nullable for new users
  submittedByUserId: uuid("submitted_by_user_id").references(() => users.id), // New - references users.id
  submittedByUsername: text("submitted_by_username").notNull(),
  status: text("status").notNull(), // 'voting' | 'selected' | 'lost'
  avgRating: real("avg_rating"),
  totalReviews: integer("total_reviews").default(0),
  mostLovedTrack: text("most_loved_track"),
  mostLovedTrackVotes: integer("most_loved_track_votes").default(0),
  tracks: jsonb("tracks"), // string[] of track names (cached from Spotify)
  genres: jsonb("genres"), // string[] of genre tags (from Spotify artist)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Prevent duplicate Spotify ID in same cycle
  uniqueIndex("albums_cycle_spotify_unique").on(table.cycleId, table.spotifyId),
  // Enforce only one winner per cycle
  uniqueIndex("albums_one_winner_per_cycle")
    .on(table.cycleId, table.status)
    .where(sql`${table.status} = 'selected'`),
]);

/**
 * Votes - one per user per album
 */
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull().references(() => albums.id),
  voterFid: integer("voter_fid"), // Legacy - nullable for new users
  voterId: uuid("voter_id").references(() => users.id), // New - references users.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Prevent duplicate votes: one per userId per album (partial — skips NULLs)
  uniqueIndex("votes_album_voter_id_unique")
    .on(table.albumId, table.voterId)
    .where(sql`${table.voterId} IS NOT NULL`),
  // Prevent duplicate votes: one per FID per album (legacy path)
  uniqueIndex("votes_album_voter_fid_unique")
    .on(table.albumId, table.voterFid)
    .where(sql`${table.voterFid} IS NOT NULL`),
]);

/**
 * Reviews - one per user per album
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull().references(() => albums.id),
  reviewerFid: integer("reviewer_fid"), // Legacy - nullable for new users
  reviewerId: uuid("reviewer_id").references(() => users.id), // New - references users.id
  reviewerUsername: text("reviewer_username").notNull(),
  reviewerPfp: text("reviewer_pfp"),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(), // min 50 chars
  favoriteTrack: text("favorite_track"),
  hasListened: boolean("has_listened").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Enforce 1–5 rating at DB level
  check("rating_1_to_5", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  // Prevent duplicate reviews: one per userId per album
  uniqueIndex("reviews_album_reviewer_id_unique")
    .on(table.albumId, table.reviewerId)
    .where(sql`${table.reviewerId} IS NOT NULL`),
  // Prevent duplicate reviews: one per FID per album (legacy path)
  uniqueIndex("reviews_album_reviewer_fid_unique")
    .on(table.albumId, table.reviewerFid)
    .where(sql`${table.reviewerFid} IS NOT NULL`),
]);
