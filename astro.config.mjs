// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://devon-23.github.io',
  base: '/blog',
  integrations: [react()],
  vite: {
    // 98.css ships a `@media (not(hover))` rule that isn't valid strict CSS
    // syntax — lightningcss (Vite's default CSS minifier) rejects it outright.
    // esbuild's CSS minifier is more lenient and handles it fine.
    build: {
      cssMinify: 'esbuild',
    },
  },
});