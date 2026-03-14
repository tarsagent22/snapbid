import { NextRequest, NextResponse } from 'next/server'

/**
 * Pinterest OAuth Callback Handler
 *
 * Pinterest redirects here after the user authorizes the SnapBid app.
 * URL format: /api/pinterest/callback?code=<auth_code>&state=<optional>
 *
 * In production, this handler would:
 * 1. Exchange the `code` for an access token via Pinterest's token endpoint
 * 2. Store the access token securely (associated with the user's account)
 * 3. Use the token to call the Pinterest API (create pins, list boards, etc.)
 *
 * For the API review demo, we render a success page showing the code was received.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // --- In production: exchange code for token ---
  // const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     Authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
  //   },
  //   body: new URLSearchParams({
  //     grant_type: 'authorization_code',
  //     code: code ?? '',
  //     redirect_uri: 'https://snapbid.app/api/pinterest/callback',
  //   }),
  // })
  // const tokenData = await tokenResponse.json()
  // const accessToken = tokenData.access_token
  // await saveTokenForUser(accessToken) // store in DB

  if (error) {
    return new NextResponse(
      buildPage({
        success: false,
        title: 'Authorization Declined',
        message: errorDescription ?? 'The Pinterest authorization was cancelled or denied.',
        code: null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  return new NextResponse(
    buildPage({
      success: true,
      title: 'Connected!',
      message: 'SnapBid is now linked to your Pinterest account.',
      code: code,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

function buildPage({
  success,
  title,
  message,
  code,
}: {
  success: boolean
  title: string
  message: string
  code: string | null
}) {
  const accentColor = success ? '#16a34a' : '#991b1b'
  const bgColor = success ? '#f0fdf4' : '#fef2f2'
  const borderColor = success ? '#86efac' : '#fca5a5'

  const icon = success
    ? `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`

  const codeBlock = code
    ? `
      <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:left;">
        <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px 0;">Authorization Code Received</p>
        <p style="font-family:monospace;font-size:12px;color:#475569;word-break:break-all;margin:0;background:#fff;padding:10px;border-radius:8px;border:1px solid #e2e8f0;">${code}</p>
        <p style="font-size:11px;color:#94a3b8;margin:10px 0 0 0;">In production, this code is immediately exchanged for an access token server-side and never exposed to the client.</p>
      </div>
    `
    : ''

  const nextSteps = success
    ? `
      <div style="margin-top:24px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:left;">
        <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px 0;">What happens next (in production)</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[
            'Access token is stored securely in our database',
            'SnapBid reads your Pinterest boards to find the best match',
            'When a blog post publishes, a pin is created automatically',
            'The pin links back to the full cost guide on snapbid.app',
          ].map((step, i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;">
              <span style="width:20px;height:20px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:white;">${i + 1}</span>
              <span style="font-size:13px;color:#475569;">${step}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — SnapBid Pinterest</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #faf8f5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #991b1b;
      padding: 16px 24px;
    }
    .header-inner {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }
    .header-sep {
      color: rgba(255,255,255,0.4);
      font-size: 20px;
    }
    .p-icon { color: rgba(255,255,255,0.8); font-size: 14px; }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }
    .card {
      background: white;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      padding: 40px;
      max-width: 520px;
      width: 100%;
      text-align: center;
    }
    .icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      background: ${bgColor};
      border: 1px solid ${borderColor};
    }
    h1 { font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 12px; }
    .subtitle { font-size: 16px; color: #6b7280; line-height: 1.6; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${bgColor};
      border: 1px solid ${borderColor};
      color: ${accentColor};
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .back-link {
      display: inline-block;
      margin-top: 28px;
      color: #991b1b;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
    footer {
      border-top: 1px solid #f0f0f0;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <span class="logo-text">SnapBid</span>
      <span class="header-sep">×</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" class="p-icon">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
      <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:4px;">Pinterest</span>
    </div>
  </header>

  <main>
    <div class="card">
      <div class="icon-wrap">
        ${icon}
      </div>

      <div class="status-badge">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="${accentColor}"><circle cx="5" cy="5" r="5"/></svg>
        ${success ? 'Authorization Successful' : 'Authorization Failed'}
      </div>

      <h1>${title}</h1>
      <p class="subtitle">${message}</p>

      ${codeBlock}
      ${nextSteps}

      <a href="/pinterest-demo" class="back-link">← Back to demo page</a>
    </div>
  </main>

  <footer>
    © 2026 SnapBid · snapbid.app · Pinterest OAuth Demo
  </footer>
</body>
</html>`
}
