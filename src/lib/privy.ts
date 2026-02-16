/**
 * Privy Configuration
 *
 * Privy enables email/Google login for non-Farcaster users.
 * Each Privy user gets an auto-created smart wallet.
 */

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

export const isPrivyConfigured = () => {
  return Boolean(PRIVY_APP_ID);
};

/**
 * Privy login methods to enable
 */
export const PRIVY_LOGIN_METHODS = ['email', 'google', 'farcaster'] as const;

/**
 * Privy appearance config
 */
export const PRIVY_APPEARANCE = {
  theme: 'dark' as const,
  accentColor: '#DC2626', // Red accent from theme
  logo: '/app-logo.png',
};

/**
 * Privy embedded wallet config
 */
export const PRIVY_WALLET_CONFIG = {
  createOnLogin: 'users-without-wallets' as const,
  noPromptOnSignature: true,
};
