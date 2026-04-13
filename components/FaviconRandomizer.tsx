'use client';
import { useEffect } from 'react';

const FAVICONS = ['/favicon-s.png', '/favicon-u.png', '/favicon-e.png', '/favicon-l.png'];

export default function FaviconRandomizer() {
  useEffect(() => {
    const pick = FAVICONS[Math.floor(Math.random() * FAVICONS.length)];
    // Remove any existing icon links (Next.js may add multiple)
    document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = pick;
    document.head.appendChild(link);
  }, []);
  return null;
}
