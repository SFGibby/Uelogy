'use client';

// YouTube IFrame audio toggle for The Grid. Same shape as the Collection
// page's KH2 toggle, swapped colors (Tron cyan, square button), swapped
// video ID to the Tron Legacy soundtrack loop.

import { useEffect, useRef, useState } from 'react';
import { useMute } from '../site/MuteToggle';

const YT_VIDEO_ID = 'UOYk5qT3ffo';
const START_SECONDS = 40; // skip the silent intro on the Tron Legacy soundtrack video

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  unMute: () => void;
  mute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
};

export default function GridMusic() {
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted] = useMute();

  // Respect global mute.
  useEffect(() => {
    if (!muted) return;
    playerRef.current?.pauseVideo();
    setPlaying(false);
  }, [muted]);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(playerDivRef.current!, {
        width: 320,
        height: 180,
        videoId: YT_VIDEO_ID,
        // youtube-nocookie sometimes bypasses embedding restrictions vs. youtube.com
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          loop: 1,
          playlist: YT_VIDEO_ID,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          start: START_SECONDS,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
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
      if (muted) return;
      // Explicit unmute + volume — autoplay policies often force muted=true on load.
      // seekTo skips the silent intro if the player is still at t=0.
      playerRef.current.unMute();
      playerRef.current.setVolume(30);
      if (playerRef.current.getCurrentTime() < 1) {
        playerRef.current.seekTo(START_SECONDS, true);
      }
      playerRef.current.playVideo();
      setPlaying(true);
    }
  };

  return (
    <>
      {/* Off-screen but real dimensions — YouTube blocks audio on 1x1 iframes.
          left: -9999 keeps it audible without visual interference. */}
      <div
        ref={playerDivRef}
        style={{ position: 'fixed', left: -9999, top: -9999, width: 320, height: 180, pointerEvents: 'none' }}
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
