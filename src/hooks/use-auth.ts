'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useFarcasterUser } from '@/neynar-farcaster-sdk/mini';
import {
  getOrCreateFarcasterUser,
  getOrCreatePrivyUser,
  type UserRecord,
} from '@/db/actions/user-actions';

export interface UnifiedUser {
  // Internal ID for database references
  id: string;

  // Identity
  username: string;
  displayName: string;
  pfpUrl: string | null;

  // Auth info
  authProvider: 'farcaster' | 'privy';
  fid: number | null; // Farcaster ID (if FC user)
  privyId: string | null; // Privy ID (if Privy user)
  email: string | null; // Email (if Privy user)

  // Wallet
  walletAddress: string | null;

  // Timestamps
  createdAt: Date;
}

export interface UseAuthResult {
  // Current user (null if not logged in)
  user: UnifiedUser | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Auth status
  isAuthenticated: boolean;
  isFarcasterUser: boolean;
  isPrivyUser: boolean;

  // Actions
  login: () => void;
  logout: () => Promise<void>;

  // Raw Privy state (for advanced use)
  privy: {
    ready: boolean;
    authenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
  };
}

/**
 * Unified authentication hook supporting both Farcaster and Privy users
 *
 * Priority:
 * 1. If in Farcaster mini app context → use Farcaster identity
 * 2. If logged in via Privy → use Privy identity
 * 3. Otherwise → not authenticated
 */
export function useAuth(): UseAuthResult {
  const [unifiedUser, setUnifiedUser] = useState<UnifiedUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Farcaster hook
  const { data: farcasterUser, isLoading: fcLoading } = useFarcasterUser();

  // Privy hooks
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
  } = usePrivy();

  const { wallets } = useWallets();

  // Sync user to database and get unified user record
  const syncUser = useCallback(async () => {
    setIsLoading(true);

    try {
      // Priority 1: Farcaster user (if in mini app context)
      if (farcasterUser?.fid) {
        const walletAddress = farcasterUser.custody_address || wallets?.[0]?.address;

        const dbUser = await getOrCreateFarcasterUser({
          fid: farcasterUser.fid,
          username: farcasterUser.username,
          displayName: farcasterUser.display_name || farcasterUser.username,
          pfpUrl: farcasterUser.pfp_url,
          walletAddress,
        });

        setUnifiedUser({
          id: dbUser.id,
          username: dbUser.username,
          displayName: dbUser.displayName,
          pfpUrl: dbUser.pfpUrl,
          authProvider: 'farcaster',
          fid: dbUser.fid,
          privyId: dbUser.privyId,
          email: dbUser.email,
          walletAddress: dbUser.walletAddress,
          createdAt: dbUser.createdAt,
        });
        return;
      }

      // Priority 2: Privy user (web login)
      if (privyAuthenticated && privyUser) {
        const email = privyUser.email?.address;
        const walletAddress = wallets?.[0]?.address;

        // Check if this Privy user has a linked Farcaster account
        const linkedFarcaster = privyUser.linkedAccounts?.find(
          (account) => account.type === 'farcaster'
        );

        if (linkedFarcaster && 'fid' in linkedFarcaster) {
          // User linked Farcaster - treat as Farcaster user
          const dbUser = await getOrCreateFarcasterUser({
            fid: linkedFarcaster.fid as number,
            username: (linkedFarcaster as any).username || email?.split('@')[0] || 'user',
            displayName: (linkedFarcaster as any).displayName || (linkedFarcaster as any).username || 'User',
            pfpUrl: (linkedFarcaster as any).pfp,
            walletAddress,
          });

          setUnifiedUser({
            id: dbUser.id,
            username: dbUser.username,
            displayName: dbUser.displayName,
            pfpUrl: dbUser.pfpUrl,
            authProvider: 'farcaster',
            fid: dbUser.fid,
            privyId: privyUser.id,
            email: dbUser.email,
            walletAddress: dbUser.walletAddress,
            createdAt: dbUser.createdAt,
          });
          return;
        }

        // Pure Privy user (email/Google login)
        const dbUser = await getOrCreatePrivyUser({
          privyId: privyUser.id,
          email,
          walletAddress,
          displayName: privyUser.google?.name,
        });

        setUnifiedUser({
          id: dbUser.id,
          username: dbUser.username,
          displayName: dbUser.displayName,
          pfpUrl: dbUser.pfpUrl,
          authProvider: 'privy',
          fid: dbUser.fid,
          privyId: dbUser.privyId,
          email: dbUser.email,
          walletAddress: dbUser.walletAddress,
          createdAt: dbUser.createdAt,
        });
        return;
      }

      // Not authenticated
      setUnifiedUser(null);
    } catch (error) {
      console.error('Error syncing user:', error);
      setUnifiedUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [farcasterUser, privyAuthenticated, privyUser, wallets]);

  // Sync user when auth state changes
  useEffect(() => {
    // Wait for both providers to be ready
    if (fcLoading || !privyReady) {
      return;
    }

    syncUser();
  }, [farcasterUser, privyAuthenticated, privyUser, privyReady, fcLoading, syncUser]);

  // Login action - opens Privy modal
  const login = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  // Logout action
  const logout = useCallback(async () => {
    if (privyAuthenticated) {
      await privyLogout();
    }
    setUnifiedUser(null);
  }, [privyAuthenticated, privyLogout]);

  return {
    user: unifiedUser,
    isLoading: isLoading || fcLoading || !privyReady,
    isInitialized,
    isAuthenticated: !!unifiedUser,
    isFarcasterUser: unifiedUser?.authProvider === 'farcaster',
    isPrivyUser: unifiedUser?.authProvider === 'privy',
    login,
    logout,
    privy: {
      ready: privyReady,
      authenticated: privyAuthenticated,
      login: privyLogin,
      logout: privyLogout,
    },
  };
}

/**
 * Hook to get current user ID for database operations
 * Returns null if not authenticated
 */
export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}
