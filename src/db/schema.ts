import { pgTable, text, uuid, integer, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";

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
  winnerId: uuid("winner_id"), // references albums.id when selected
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
  cycleId: uuid("cycle_id").notNull(),
  submittedByFid: integer("submitted_by_fid"), // Legacy - nullable for new users
  submittedByUserId: uuid("submitted_by_user_id"), // New - references users.id
  submittedByUsername: text("submitted_by_username").notNull(),
  status: text("status").notNull(), // 'voting' | 'selected' | 'lost'
  avgRating: real("avg_rating"),
  totalReviews: integer("total_reviews").default(0),
  mostLovedTrack: text("most_loved_track"),
  mostLovedTrackVotes: integer("most_loved_track_votes").default(0),
  tracks: jsonb("tracks"), // string[] of track names (cached from Spotify)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Votes - one per user per album
 */
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  voterFid: integer("voter_fid"), // Legacy - nullable for new users
  voterId: uuid("voter_id"), // New - references users.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Reviews - one per user per album
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").notNull(),
  reviewerFid: integer("reviewer_fid"), // Legacy - nullable for new users
  reviewerId: uuid("reviewer_id"), // New - references users.id
  reviewerUsername: text("reviewer_username").notNull(),
  reviewerPfp: text("reviewer_pfp"),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(), // min 50 chars
  favoriteTrack: text("favorite_track"),
  hasListened: boolean("has_listened").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
