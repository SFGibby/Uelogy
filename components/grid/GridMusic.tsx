'use client';

// YouTube IFrame audio toggle for The Grid. Same shape as the Collection
// page's KH2 toggle, swapped colors (Tron cyan, square button), swapped
// video ID to the Tron Legacy soundtrack loop.

import { useEffect, useRef, useState } from 'react';

const YT_VIDEO_ID = 'UOYk5qT3ffo';

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
};

export default function GridMusic() {
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
      <div
        ref={playerDivRef}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      />
      <button
        onClick={toggle}
        title={playing ? 'Pause music' : 'Play music'}
        style={{
          position: 'fixed',
          bottom: 28,
          left: 28,
          zIndex: 50,
          width: 44,
          height: 44,
          borderRadius: 0,
          background: playing ? 'rgba(0,240,255,0.14)' : 'rgba(0,0,0,0.75)',
          border: `1px solid ${playing ? '#00f0ff' : 'rgba(0,240,255,0.35)'}`,
          color: playing ? '#00f0ff' : 'rgba(0,240,255,0.55)',
          fontSize: 18,
          cursor: ready ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: playing ? '0 0 14px rgba(0,240,255,0.5)' : 'none',
          opacity: ready ? 1 : 0.4,
          fontFamily: 'inherit',
        }}
      >
        ♪
      </button>
    </>
  );
}
