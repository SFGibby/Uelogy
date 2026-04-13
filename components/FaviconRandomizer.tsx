'use client';
import { useEffect } from 'react';

const FAVICONS = ['/favicon-s.png', '/favicon-u.png', '/favicon-e.png', '/favicon-l.png'];

export default function FaviconRandomizer() {
  useEffect(() => {
    const pick = FAVICONS[Math.floor(Math.random() * FAVICONS.length)];
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = pick;
  }, []);
  return null;
}
