#!/usr/bin/env node

/**
 * Generate PDF for a proposal using Playwright headless
 * Usage: node scripts/generate-pdf.js <slug>
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export async function generatePdf(slug) {
  if (!slug) {
    throw new Error('Slug proposal harus disertakan (contoh: node scripts/generate-pdf.js umahan)');
  }

  const distHtmlPath = path.join(ROOT_DIR, 'dist', slug, 'index.html');
  const publicPdfDir = path.join(ROOT_DIR, 'public', 'pdf');
  const outputPdfPath = path.join(publicPdfDir, `${slug}.pdf`);

  // Pastikan dist sudah ter-build
  if (!fs.existsSync(distHtmlPath)) {
    console.log(`[generate-pdf] dist/${slug}/index.html belum ada. Menjalankan npm run build...`);
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  }

  if (!fs.existsSync(distHtmlPath)) {
    throw new Error(`File dist/${slug}/index.html tidak ditemukan setelah build.`);
  }

  if (!fs.existsSync(publicPdfDir)) {
    fs.mkdirSync(publicPdfDir, { recursive: true });
  }

  console.log(`[generate-pdf] Merender proposal ${slug} ke PDF...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e2) {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    }
  }

  try {
    const page = await browser.newPage();
    const fileUrl = pathToFileURL(distHtmlPath).href;

    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });

    const stats = fs.statSync(outputPdfPath);
    console.log(`[generate-pdf] ✓ PDF berhasil dibuat: ${outputPdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    return outputPdfPath;
  } finally {
    await browser.close();
  }
}

// Jalankan jika dieksekusi langsung
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const targetSlug = process.argv[2];
  if (!targetSlug) {
    console.error('Usage: node scripts/generate-pdf.js <slug>');
    process.exit(1);
  }

  generatePdf(targetSlug).catch(err => {
    console.error('[generate-pdf] Error:', err.message);
    process.exit(1);
  });
}
