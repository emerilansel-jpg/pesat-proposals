import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  site: 'https://proposal.pesat.ai',
  integrations: [
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});
