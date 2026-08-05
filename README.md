# Pesat Proposal CMS

Astro-based proposal management system with Decap CMS for creating and sharing client proposals.

## 🎯 Features

- **Decap CMS Admin** at `/admin` — user-friendly interface to create/edit proposals
- **Structured Data** — frontmatter schema ensures consistent proposal format
- **Dynamic Routing** — `/proposal/[slug]` for each client
- **Hybrid Pricing Display** — shows both Performance & Fixed models side-by-side
- **Print-Friendly** — built-in print styles + PDF export
- **Share URLs** — copy proposal link to clipboard
- **Dark Mode** — auto theme toggle
- **Responsive** — mobile/tablet optimized
- **SEO Ready** — sitemap, Open Graph, meta tags

## 🚀 Deployment (Cloudflare Pages)

### Option 1: Wrangler CLI (Recommended)

```bash
# Install Wrangler globally if not installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from project directory
cd proposal-cms
wrangler pages deploy dist --project-name=pesat-proposals
```

### Option 2: Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → Create a project
3. Connect to Git (if using Git) or upload directly
4. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `18`
5. Deploy!

### Custom Domain Setup

1. In Cloudflare Dashboard → Pages → your project
2. Custom domains → Add domain
3. Enter `proposals.pesat.ai` (or your preferred subdomain)
4. Update DNS if needed (CNAME to Pages)

## 📝 CMS Admin Access

### Enable Decap CMS (Git Gateway)

Since Decap CMS uses Git Gateway for authentication, you have two options:

#### Option A: Use GitHub for Auth (Easiest)

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate new token (classic) with `repo` scope
3. Add to your repository secrets:
   - `GITHUB_TOKEN`: your GitHub personal access token
4. Update `public/admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: your-username/pesat-proposals
     branch: main
   ```

#### Option B: Use Netlify Identity (Alternative)

1. Deploy to Netlify temporarily to set up Identity
2. Enable Git Gateway in Netlify
3. Use that token for your Cloudflare deployment

#### Option C: Local File System (Development)

```bash
# Run locally with file-based CMS
npx decap-cms-server
```

## 📂 Project Structure

```
proposal-cms/
├── src/
│   ├── content/
│   │   └── proposals/
│   │       └── bestink-geo-seo.md    # Sample proposal
│   ├── layouts/
│   │   └── Main.astro                 # Base layout
│   ├── pages/
│   │   ├── index.astro                # Landing page
│   │   ├── proposals/
│   │   │   └── index.astro            # All proposals listing
│   │   └── proposal/
│   │       └── [slug].astro           # Dynamic proposal pages
│   └── meta/
│       └── site.ts                    # Site metadata
├── public/
│   └── admin/
│       ├── config.yml                 # Decap CMS config
│       └── index.html                 # CMS entry point
├── astro.config.mjs                   # Astro configuration
├── wrangler.toml                      # Cloudflare Pages config
├── package.json                       # Dependencies
└── README.md                          # This file
```

## 🎨 Customization

### Adding New Fields to Proposals

1. Update `src/content/config.ts` schema
2. Update `public/admin/config.yml` CMS fields
3. Update `src/pages/proposal/[slug].astro` to display new fields

### Styling

- Global styles: `src/layouts/Main.astro` `<style is:global>`
- Component styles: Within each `.astro` file
- Theme: CSS variables in `:root` (light) and `.dark` (dark mode)

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Sample Data

The `bestink-geo-seo.md` file includes a complete example with:
- Hybrid pricing model (Performance + Fixed)
- Delivery phases
- Success metrics
- Add-ons
- Recommendations
- Contact info

Duplicate and modify this file for new clients.

## 🌐 URL Structure

- `/` — Landing page with latest proposal
- `/proposals/` — All published proposals
- `/proposal/bestink-geo-seo/` — Individual proposal
- `/admin/` — CMS admin (requires auth)

## 🔐 Security Notes

- Draft proposals (`draft: true`) are hidden from public
- CMS requires authentication (GitHub token or Netlify Identity)
- Add `/admin/` to robots.txt to prevent indexing
- Use environment variables for sensitive data

## 📞 Support

For questions or customization requests, contact the development team.

---

**Built with:** Astro + Decap CMS + Cloudflare Pages  
**Domain:** proposals.pesat.ai  
**Last Updated:** 2026-08-04
