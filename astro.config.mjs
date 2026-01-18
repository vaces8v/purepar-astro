// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    site: 'https://purepar.ru',
    output: 'static',
    adapter: node({
        mode: 'standalone'
    }),
    compressHTML: true,
    integrations: [sitemap()],
    prefetch: {
        defaultStrategy: "viewport"
    }
});
