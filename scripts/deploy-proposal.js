#!/usr/bin/env node

/**
 * Automation script to build, verify, and deploy a proposal.
 * Usage: node scripts/deploy-proposal.js <slug>
 * Or via npm: npm run deploy:proposal <slug>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generatePdf } from './generate-pdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Error: Masukkan slug proposal.');
    console.error('Contoh: npm run deploy:proposal umahan');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  Memulai Otomasi Deploy Proposal: ${slug}`);
  console.log(`======================================================\n`);

  // 1. Periksa keberadaan src/content/proposals/<slug>.md
  const mdPath = path.join(ROOT_DIR, 'src', 'content', 'proposals', `${slug}.md`);
  console.log(`[Step 1/7] Memeriksa file proposal markdown: ${mdPath}`);
  if (!fs.existsSync(mdPath)) {
    console.error(`[deploy-proposal] ERROR: File proposal tidak ditemukan: ${mdPath}`);
    process.exit(1);
  }
  console.log(`[Step 1/7] ✓ File markdown ditemukan.`);

  // 2. Generate PDF otomatis jika belum ada atau markdown lebih baru
  const pdfPath = path.join(ROOT_DIR, 'public', 'pdf', `${slug}.pdf`);
  console.log(`[Step 2/7] Memeriksa status PDF: ${pdfPath}`);
  let shouldGeneratePdf = false;
  if (!fs.existsSync(pdfPath)) {
    console.log(`[Step 2/7] PDF belum ada. Akan men-generate PDF...`);
    shouldGeneratePdf = true;
  } else {
    const mdMtime = fs.statSync(mdPath).mtimeMs;
    const pdfMtime = fs.statSync(pdfPath).mtimeMs;
    if (mdMtime > pdfMtime) {
      console.log(`[Step 2/7] File markdown lebih baru daripada PDF. Mengupdate PDF...`);
      shouldGeneratePdf = true;
    } else {
      console.log(`[Step 2/7] ✓ PDF up-to-date.`);
    }
  }

  if (shouldGeneratePdf) {
    await generatePdf(slug);
  }

  // 3. Periksa slug ada di VALID_PROPOSAL_SLUGS di pesat-app-router.js
  console.log(`[Step 3/7] Memvalidasi router guard di pesat-app-router.js...`);
  const routerCandidates = [
    path.resolve(ROOT_DIR, '..', 'tmp-pesat-app', 'workers', 'pesat-app-router.js'),
    path.resolve(ROOT_DIR, '..', 'workers', 'pesat-app-router.js'),
    'D:/Claude Cowork/Pesat Business Audit/tmp-pesat-app/workers/pesat-app-router.js'
  ];

  let routerPath = routerCandidates.find(p => fs.existsSync(p));
  if (!routerPath) {
    console.error(`[deploy-proposal] ERROR: File pesat-app-router.js tidak ditemukan di jalur yang diketahui.`);
    process.exit(1);
  }

  const routerContent = fs.readFileSync(routerPath, 'utf-8');
  const slugRegex = /VALID_PROPOSAL_SLUGS\s*=\s*new\s+Set\(\[\s*([\s\S]*?)\s*\]\)/;
  const match = routerContent.match(slugRegex);
  if (!match) {
    console.error(`[deploy-proposal] ERROR: Definisi VALID_PROPOSAL_SLUGS tidak ditemukan di ${routerPath}`);
    process.exit(1);
  }

  const parsedSlugs = match[1]
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  if (!parsedSlugs.includes(slug)) {
    console.error(`[deploy-proposal] ERROR: Slug "${slug}" belum terdaftar di VALID_PROPOSAL_SLUGS di ${routerPath}!`);
    console.error(`Slug terdaftar saat ini:`, parsedSlugs);
    console.error(`Silakan tambahkan '${slug}' ke VALID_PROPOSAL_SLUGS dan deploy router terlebih dahulu.`);
    process.exit(1);
  }
  console.log(`[Step 3/7] ✓ Slug "${slug}" terverifikasi dalam whitelist router.`);

  // 4. Menjalankan npm run build dan verifikasi dist/<slug>/index.html serta dist/404.html
  console.log(`[Step 4/7] Menjalankan npm run build...`);
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

  const distSlugHtml = path.join(ROOT_DIR, 'dist', slug, 'index.html');
  const dist404Html = path.join(ROOT_DIR, 'dist', '404.html');

  if (!fs.existsSync(distSlugHtml)) {
    console.error(`[deploy-proposal] ERROR: File build dist/${slug}/index.html tidak ditemukan!`);
    process.exit(1);
  }
  if (!fs.existsSync(dist404Html)) {
    console.error(`[deploy-proposal] ERROR: File build dist/404.html tidak ditemukan!`);
    process.exit(1);
  }
  console.log(`[Step 4/7] ✓ Verifikasi build sukses: dist/${slug}/index.html dan dist/404.html tersedia.`);

  // 5. Git add, commit, dan push ke origin main
  console.log(`[Step 5/7] Melakukan Git add, commit, push...`);
  execSync('git add -A', { cwd: ROOT_DIR, stdio: 'inherit' });
  const gitStatus = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  if (gitStatus) {
    try {
      execSync(`git commit -m "feat(proposal): deploy proposal ${slug} with pdf and 404 guard"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit'
      });
      execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log(`[Step 5/7] ✓ Git commit & push selesai.`);
    } catch (gitErr) {
      console.warn(`[deploy-proposal] Peringatan git: ${gitErr.message}`);
    }
  } else {
    console.log(`[Step 5/7] ✓ Tidak ada perubahan git yang perlu di-commit.`);
  }

  // 6. Fail-safe deploy ke Cloudflare Pages via wrangler
  console.log(`[Step 6/7] Deploy ke Cloudflare Pages (pesat-proposals)...`);
  try {
    execSync('npx wrangler pages deploy dist --project-name=pesat-proposals --commit-dirty=true', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    console.log(`[Step 6/7] ✓ Deploy Cloudflare Pages berhasil.`);
  } catch (deployErr) {
    console.error(`[deploy-proposal] ERROR: Deploy Cloudflare Pages gagal!`, deployErr.message);
    process.exit(1);
  }

  // 7. Health check otomatis via curl
  console.log(`[Step 7/7] Melakukan health check via curl...`);
  const targetUrl = `https://pesat.app/proposal/${slug}/`;
  let attempts = 0;
  const maxAttempts = 3;
  let checkPassed = false;

  while (attempts < maxAttempts && !checkPassed) {
    attempts++;
    console.log(`[Step 7/7] Verifikasi attempt ${attempts}/${maxAttempts}: ${targetUrl}`);
    try {
      const curlOutput = execSync(`curl -sL "${targetUrl}"`, {
        encoding: 'utf-8',
        timeout: 15000
      });

      // Verifikasi title bukan root "<title>Proposal | Pesat AI</title>"
      if (curlOutput.includes('<title>Proposal | Pesat AI</title>')) {
        console.error(`[deploy-proposal] GAGAL: Response mengembalikan root proposal (<title>Proposal | Pesat AI</title>)!`);
      } else if (!curlOutput.includes('<title>') || curlOutput.includes('Proposal Not Found')) {
        console.error(`[deploy-proposal] GAGAL: Response tidak valid atau mengembalikan 404!`);
      } else {
        const titleMatch = curlOutput.match(/<title>([^<]+)<\/title>/i);
        const titleFound = titleMatch ? titleMatch[1] : 'Unknown';
        console.log(`[Step 7/7] ✓ Health check sukses! Title: "${titleFound}"`);
        checkPassed = true;
      }
    } catch (curlErr) {
      console.warn(`[Step 7/7] Curl error pada attempt ${attempts}: ${curlErr.message}`);
    }

    if (!checkPassed && attempts < maxAttempts) {
      console.log(`Menunggu 2 detik sebelum retry...`);
      execSync('sleep 2 || timeout /t 2', { stdio: 'ignore' });
    }
  }

  if (!checkPassed) {
    console.error(`\n[deploy-proposal] CRITICAL ERROR: Health check gagal setelah ${maxAttempts} percobaan!`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  ✓ SUKSES: Proposal ${slug} siap dan terproteksi!`);
  console.log(`  URL: https://pesat.app/proposal/${slug}/`);
  console.log(`  PDF: https://pesat.app/proposal/pdf/${slug}.pdf`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('[deploy-proposal] Fatal Error:', err.message);
  process.exit(1);
});
