'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export type AuthProvider = 'farcaster' | 'privy';

export interface CreateUserData {
  fid?: number;
  privyId?: string;
  walletAddress?: string;
  email?: string;
  username: string;
  displayName: string;
  pfpUrl?: string;
  authProvider: AuthProvider;
}

export interface UserRecord {
  id: string;
  fid: number | null;
  privyId: string | null;
  walletAddress: string | null;
  email: string | null;
  username: string;
  displayName: string;
  pfpUrl: string | null;
  authProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a DiceBear avatar URL for non-Farcaster users
 */
export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Derive username from email (alice@gmail.com → alice)
 */
export function deriveUsernameFromEmail(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return base || 'user';
}

/**
 * Find user by Farcaster ID
 */
export async function getUserByFid(fid: number): Promise<UserRecord | null> {
  const result = await db.select().from(users).where(eq(users.fid, fid)).limit(1);
  return result[0] ?? null;
}

/**
 * Find user by Privy ID
 */
export async function getUserByPrivyId(privyId: string): Promise<UserRecord | null> {
  const result = await db.select().from(users).where(eq(users.privyId, privyId)).limit(1);
  return result[0] ?? null;
}

/**
 * Find user by wallet address (for account linking)
 */
export async function getUserByWalletAddress(walletAddress: string): Promise<UserRecord | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Find user by internal UUID
 */
export async function getUserById(userId: string): Promise<UserRecord | null> {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<UserRecord> {
  const [newUser] = await db
    .insert(users)
    .values({
      fid: data.fid ?? null,
      privyId: data.privyId ?? null,
      walletAddress: data.walletAddress?.toLowerCase() ?? null,
      email: data.email ?? null,
      username: data.username,
      displayName: data.displayName,
      pfpUrl: data.pfpUrl ?? null,
      authProvider: data.authProvider,
    })
    .returning();

  return newUser;
}

/**
 * Get or create user from Farcaster data
 * - Checks if user exists by FID
 * - If exists with same wallet, returns existing
 * - If new, creates user record
 */
export async function getOrCreateFarcasterUser(data: {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  walletAddress?: string;
}): Promise<UserRecord> {
  // Check if user already exists by FID
  const existingByFid = await getUserByFid(data.fid);
  if (existingByFid) {
    // Update profile info if changed
    if (
      existingByFid.username !== data.username ||
      existingByFid.displayName !== data.displayName ||
      existingByFid.pfpUrl !== data.pfpUrl
    ) {
      await db
        .update(users)
        .set({
          username: data.username,
          displayName: data.displayName,
          pfpUrl: data.pfpUrl ?? existingByFid.pfpUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByFid.id));
    }
    return existingByFid;
  }

  // Check if wallet already exists (account linking scenario)
  if (data.walletAddress) {
    const existingByWallet = await getUserByWalletAddress(data.walletAddress);
    if (existingByWallet && !existingByWallet.fid) {
      // Link Farcaster to existing Privy account
      const [updated] = await db
        .update(users)
        .set({
          fid: data.fid,
          username: data.username,
          displayName: data.displayName,
          pfpUrl: data.pfpUrl ?? existingByWallet.pfpUrl,
          authProvider: 'farcaster', // Upgrade to Farcaster as primary
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByWallet.id))
        .returning();
      return updated;
    }
  }

  // Create new user
  return createUser({
    fid: data.fid,
    walletAddress: data.walletAddress,
    username: data.username,
    displayName: data.displayName,
    pfpUrl: data.pfpUrl,
    authProvider: 'farcaster',
  });
}

/**
 * Get or create user from Privy data
 * - Checks if user exists by Privy ID
 * - Checks wallet address for account linking
 * - If new, creates user record with DiceBear avatar
 */
export async function getOrCreatePrivyUser(data: {
  privyId: string;
  email?: string;
  walletAddress?: string;
  displayName?: string;
}): Promise<UserRecord> {
  // Check if user already exists by Privy ID
  const existingByPrivyId = await getUserByPrivyId(data.privyId);
  if (existingByPrivyId) {
    return existingByPrivyId;
  }

  // Check if wallet already exists (account linking scenario)
  if (data.walletAddress) {
    const existingByWallet = await getUserByWalletAddress(data.walletAddress);
    if (existingByWallet && !existingByWallet.privyId) {
      // Link Privy to existing Farcaster account
      const [updated] = await db
        .update(users)
        .set({
          privyId: data.privyId,
          email: data.email ?? existingByWallet.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByWallet.id))
        .returning();
      return updated;
    }
  }

  // Derive username from email or generate random
  const username = data.email
    ? await ensureUniqueUsername(deriveUsernameFromEmail(data.email))
    : await ensureUniqueUsername('user');

  const displayName = data.displayName || username;
  const pfpUrl = generateAvatarUrl(data.privyId);

  // Create new user
  return createUser({
    privyId: data.privyId,
    email: data.email,
    walletAddress: data.walletAddress,
    username,
    displayName,
    pfpUrl,
    authProvider: 'privy',
  });
}

/**
 * Ensure username is unique by adding number suffix if needed
 * e.g., alice → alice, alice2, alice3
 */
async function ensureUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length === 0) {
      return username;
    }

    counter++;
    username = `${baseUsername}${counter}`;

    // Safety limit
    if (counter > 1000) {
      return `${baseUsername}${Date.now()}`;
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserRecord, 'username' | 'displayName' | 'pfpUrl'>>
): Promise<UserRecord | null> {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}

/**
 * Link Farcaster account to existing Privy user
 */
export async function linkFarcasterToUser(
  userId: string,
  farcasterData: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
  }
): Promise<UserRecord | null> {
  const [updated] = await db
    .update(users)
    .set({
      fid: farcasterData.fid,
      username: farcasterData.username,
      displayName: farcasterData.displayName,
      pfpUrl: farcasterData.pfpUrl,
      authProvider: 'farcaster', // Upgrade to Farcaster
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
}
