'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

const CollectionTracker = dynamic(() => import('../../components/collection/CollectionTracker'), { ssr: false });

// Paste your YouTube video ID here (the part after ?v= in the URL)
const YT_VIDEO_ID = 'REPLACE_WITH_VIDEO_ID';

export default function CollectionPage() {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!YT_VIDEO_ID || YT_VIDEO_ID === 'REPLACE_WITH_VIDEO_ID') return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      new (window as unknown as { YT: { Player: new (el: HTMLDivElement, opts: unknown) => void } }).YT.Player(playerRef.current!, {
        videoId: YT_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: YT_VIDEO_ID,
          controls: 0,
          mute: 0,
        },
        events: {
          onReady: (e: { target: { setVolume: (v: number) => void; playVideo: () => void } }) => {
            e.target.setVolume(30);
            e.target.playVideo();
          },
        },
      });
    };

    return () => {
      delete (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
    };
  }, []);

  return (
    <>
      {/* Hidden YouTube player */}
      <div
        ref={playerRef}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      />
      <CollectionTracker />
    </>
  );
}
