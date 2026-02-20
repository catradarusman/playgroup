'use client';

import { Card, CardContent, H2, P, Button } from '@neynar/ui';
import { useAuth } from '@/hooks/use-auth';

interface LoginModalProps {
  onClose?: () => void;
}

/**
 * Multi-provider login modal
 * Shows email/Google/Farcaster login options via Privy
 */
export function LoginModal({ onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth();

  const handleLogin = () => {
    login(); // Opens Privy modal with all login options
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <H2 className="text-center mb-2">Join Playgroup</H2>
          <P className="text-center text-gray-400 text-sm mb-6">
            Sign in to submit albums, vote, and write reviews
          </P>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Continue with Email'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-900 text-gray-500">or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleLogin}
              disabled={isLoading}
            >
              Continue with Farcaster
            </Button>
          </div>

          <P className="text-center text-gray-500 text-xs mt-6">
            By continuing, you agree to our terms of service
          </P>

          {onClose && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact login button for header/inline use
 */
export function LoginButton({ className }: { className?: string }) {
  const { login, isLoading } = useAuth();

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={login}
      disabled={isLoading}
    >
      {isLoading ? '...' : 'Sign In'}
    </Button>
  );
}

/**
 * User avatar button that shows login or profile
 */
export function UserButton({
  onProfileClick,
}: {
  onProfileClick?: () => void;
}) {
  const { user, isAuthenticated, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
      >
        <P className="text-xs text-gray-400">?</P>
      </button>
    );
  }

  return (
    <button
      onClick={onProfileClick}
      className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-white/20 transition-all"
    >
      {user?.pfpUrl ? (
        <img
          src={user.pfpUrl}
          alt={user.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          <P className="text-xs text-white">
            {user?.displayName?.charAt(0).toUpperCase() || '?'}
          </P>
        </div>
      )}
    </button>
  );
}
