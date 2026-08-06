// Cloudflare Pages Function: POST /api/deploy
// Accepts { slug, content } and pushes to GitHub, triggering Cloudflare Pages rebuild.

export async function onRequestPost(context) {
  const { slug, content } = await context.request.json();

  if (!slug || !content) {
    return new Response(JSON.stringify({ error: 'Missing slug or content' }), { status: 400 });
  }

  const GITHUB_TOKEN = context.env.GITHUB_TOKEN;
  const GITHUB_REPO = 'emerilansel-jpg/pesat-proposals';
  const FILE_PATH = `src/content/proposals/${slug}.md`;

  if (!GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not configured' }), { status: 500 });
  }

  try {
    // Get current file SHA (needed for update)
    let sha = null;
    try {
      const getResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'PesatCMS' }
      });
      if (getResp.ok) {
        const data = await getResp.json();
        sha = data.sha;
      }
    } catch (e) { /* file might not exist yet */ }

    // Create or update file
    const body = {
      message: `Update ${slug} via CMS`,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;

    const putResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PesatCMS',
      },
      body: JSON.stringify(body),
    });

    if (!putResp.ok) {
      const err = await putResp.text();
      return new Response(JSON.stringify({ error: `GitHub API error: ${err}` }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'File updated. Cloudflare Pages will auto-rebuild.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
