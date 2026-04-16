'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const CollectionTracker = dynamic(() => import('../../components/collection/CollectionTracker'), { ssr: false });

const YT_VIDEO_ID = 'mhrtIYvTKeo';

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
};

export default function CollectionPage() {
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(playerDivRef.current!, {
        videoId: YT_VIDEO_ID,
        playerVars: { loop: 1, playlist: YT_VIDEO_ID, controls: 0, disablekb: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(30);
            setReady(true);
          },
        },
      });
    };

    return () => {
      delete (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
    };
  }, []);

  const toggle = () => {
    if (!ready || !playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
      setPlaying(false);
    } else {
      playerRef.current.playVideo();
      setPlaying(true);
    }
  };

  return (
    <>
      {/* Hidden YouTube player */}
      <div
        ref={playerDivRef}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      />

      <CollectionTracker />

      {/* Music toggle — bottom left */}
      <button
        onClick={toggle}
        title={playing ? 'Pause music' : 'Play music'}
        style={{
          position: 'fixed',
          bottom: 28,
          left: 28,
          zIndex: 50,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: playing ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${playing ? 'rgba(217,119,6,0.5)' : 'rgba(255,255,255,0.15)'}`,
          color: playing ? '#f59e0b' : 'rgba(255,255,255,0.4)',
          fontSize: 16,
          cursor: ready ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s',
          opacity: ready ? 1 : 0.4,
        }}
      >
        ♪
      </button>
    </>
  );
}
