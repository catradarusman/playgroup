'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent, H3 } from '@neynar/ui';
import { NowPlayingTab } from './components/now-playing-tab';
import { VoteTab } from './components/vote-tab';
import { ArchiveTab } from './components/archive-tab';

export function MiniApp() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-black">
      {/* Fixed header */}
      <header className="shrink-0 p-4 border-b border-gray-800">
        <H3 className="text-white text-center">Playgroup</H3>
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
          <NowPlayingTab />
        </TabsContent>
        <TabsContent value="vote" className="flex-1 overflow-y-auto p-4 mt-0">
          <VoteTab />
        </TabsContent>
        <TabsContent value="archive" className="flex-1 overflow-y-auto p-4 mt-0">
          <ArchiveTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
