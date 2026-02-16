import { NextRequest } from "next/server";
import { publicConfig } from "@/config/public-config";
import { getShareImageResponse, parseNextRequestSearchParams } from "@/neynar-farcaster-sdk/nextjs";

// Cache for 1 hour - query strings create separate cache entries
export const revalidate = 3600;

const { appEnv, heroImageUrl, imageUrl } = publicConfig;

const showDevWarning = appEnv !== "production";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  // Extract query params for personalization
  const searchParams = parseNextRequestSearchParams(request);
  const shareType = searchParams.shareType ?? 'default';

  // Different overlays based on share type
  let overlayJSX = null;

  if (shareType === 'album') {
    // Now Playing - current album
    const albumTitle = searchParams.albumTitle ?? 'Album';
    const artist = searchParams.artist ?? 'Artist';
    const weekNumber = searchParams.weekNumber ?? '1';
    const listeners = searchParams.listeners ?? '0';

    overlayJSX = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderRadius: 16,
            padding: '24px 32px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Week {weekNumber} • Now Listening
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {albumTitle}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {artist}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 16,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 8,
            }}
          >
            {parseInt(listeners).toLocaleString()} listening together
          </div>
        </div>
      </div>
    );
  } else if (shareType === 'review') {
    // Album Detail - with stats
    const albumTitle = searchParams.albumTitle ?? 'Album';
    const artist = searchParams.artist ?? 'Artist';
    const weekNumber = searchParams.weekNumber ?? '1';
    const avgRating = searchParams.avgRating ?? '0';
    const totalReviews = searchParams.totalReviews ?? '0';

    overlayJSX = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderRadius: 16,
            padding: '24px 32px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Week {weekNumber}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {albumTitle}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {artist}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {avgRating}/5
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                Rating
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                width: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {parseInt(totalReviews).toLocaleString()}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                Reviews
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (shareType === 'journey') {
    // Archive - community journey
    const year = searchParams.year ?? new Date().getFullYear().toString();
    const albumsCompleted = searchParams.albumsCompleted ?? '0';
    const totalReviews = searchParams.totalReviews ?? '0';
    const avgRating = searchParams.avgRating ?? '0';

    overlayJSX = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderRadius: 16,
            padding: '28px 36px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {year} Journey
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 42,
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {albumsCompleted}/52 Albums
          </div>
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {parseInt(totalReviews).toLocaleString()}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                Reviews
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {avgRating}/5
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                Avg Rating
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return getShareImageResponse(
    { type, heroImageUrl, imageUrl, showDevWarning },
    overlayJSX,
  );
}
