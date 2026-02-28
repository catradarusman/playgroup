'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent, H3 } from '@neynar/ui';
import { useAuth } from '@/hooks/use-auth';
import { NowPlayingTab } from './components/now-playing-tab';
import { VoteTab } from './components/vote-tab';
import { ArchiveTab } from './components/archive-tab';
import { ProfileView } from './components/profile-view';
import { UserButton } from './components/login-modal';

// Supports routing by FID (Farcaster users) or userId (Privy users)
interface ProfileTarget {
  fid?: number;
  userId?: string;
}

export function MiniApp() {
  const { user } = useAuth();
  const [viewingProfile, setViewingProfile] = useState<ProfileTarget | null>(null);

  // Profile view overlay
  if (viewingProfile !== null) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden bg-black">
        <header className="shrink-0 p-4 border-b border-gray-800">
          <H3 className="text-white text-center">Profile</H3>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <ProfileView
            fid={viewingProfile.fid}
            userId={viewingProfile.userId}
            onBack={() => setViewingProfile(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-black">
      {/* Fixed header with profile icon */}
      <header className="shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="w-8" /> {/* Spacer for centering */}
          <H3 className="text-white text-center">Playgroup</H3>
          <UserButton
            onProfileClick={() => {
              if (user?.fid) {
                // Farcaster user — route by FID
                setViewingProfile({ fid: user.fid });
              } else if (user?.id) {
                // Privy user — route by userId (fid is null)
                setViewingProfile({ userId: user.id });
              }
            }}
          />
        </div>
      </header>

      {/* Tab navigation fills remaining space */}
      <Tabs defaultValue="now" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 w-full justify-start border-b border-gray-800 rounded-none bg-gray-900/50">
          <TabsTrigger value="now" className="flex-1">
            Now
          </TabsTrigger>
          <TabsTrigger value="vote" className="flex-1">
            Vote
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex-1">
            Archive
          </TabsTrigger>
        </TabsList>

        {/* Tab content - each fills available space */}
        <TabsContent value="now" className="flex-1 overflow-y-auto p-4 mt-0">
          <NowPlayingTab onViewProfile={(fid) => setViewingProfile({ fid })} />
        </TabsContent>
        <TabsContent value="vote" className="flex-1 overflow-y-auto p-4 mt-0">
          <VoteTab onViewProfile={(fid) => setViewingProfile({ fid })} />
        </TabsContent>
        <TabsContent value="archive" className="flex-1 overflow-y-auto p-4 mt-0">
          <ArchiveTab onViewProfile={(fid) => setViewingProfile({ fid })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
