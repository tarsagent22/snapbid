import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'SnapBid × Pinterest Integration',
  description: 'See how SnapBid automatically publishes Pinterest pins when blog posts go live — powered by Pinterest OAuth.',
  robots: { index: false, follow: false },
}

const PINTEREST_OAUTH_URL =
  'https://www.pinterest.com/oauth/?client_id=b0c0ad66a8596ea0d6c6dad94430720d9b5ed5a2&redirect_uri=https://snapbid.app/api/pinterest/callback&response_type=code&scope=boards:read,boards:write,pins:read,pins:write,user_accounts:read'

export default function PinterestDemoPage() {
  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      {/* ── HEADER ── */}
      <header style={{ background: '#991b1b' }} className="py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* SnapBid wordmark */}
          <Image src="/logo.svg" alt="SnapBid" width={120} height={36} priority />
          <span className="text-white/40 text-xl font-light">×</span>
          {/* Pinterest P */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-label="Pinterest">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          <span className="text-white/80 text-sm font-medium hidden sm:block ml-1">Pinterest Integration Demo</span>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="py-16 px-6 text-center" style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
            Live OAuth Demo — Pinterest App Review
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            SnapBid × Pinterest Integration
          </h1>
          <p className="text-red-100 text-lg max-w-2xl mx-auto leading-relaxed">
            SnapBid publishes contractor cost-guide content to Pinterest automatically. 
            When a blog post goes live, a branded pin is created and published to the 
            right board — no manual work required.
          </p>
        </div>
      </section>

      {/* ── SECTION 1: HOW IT WORKS ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">The workflow</p>
            <h2 className="text-3xl font-bold text-gray-900">How SnapBid uses Pinterest</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              A simple 3-step flow that turns every blog post into a Pinterest pin automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#991b1b' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#fef2f2' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fill="#991b1b"/>
                </svg>
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Step 01</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Connect your Pinterest account</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Users authorize SnapBid via Pinterest OAuth. We request access to read boards, 
                create pins, and post to relevant boards on your behalf.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['boards:read', 'boards:write', 'pins:write'].map(scope => (
                  <span key={scope} className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: '#fef2f2', color: '#991b1b' }}>
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#d97706' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#fffbeb' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Step 02</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">SnapBid auto-generates pin images</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                When a blog post is published on snapbid.app, our system automatically generates 
                a branded pin image — with title, cost estimate, and SnapBid styling — ready 
                for Pinterest.
              </p>
              <div className="mt-4 text-xs text-gray-400">
                ✓ Optimized 2:3 pin format &nbsp;·&nbsp; ✓ Brand colors &nbsp;·&nbsp; ✓ SEO-friendly
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#16a34a' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#f0fdf4' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Step 03</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pins publish to your relevant boards</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The pin is automatically published to the most relevant board on your Pinterest 
                account — e.g. a "Home Improvement Costs" or "Kitchen Remodel" board — with 
                a direct link back to the blog post.
              </p>
              <div className="mt-4 text-xs text-gray-400">
                ✓ Auto board matching &nbsp;·&nbsp; ✓ Deep link to blog &nbsp;·&nbsp; ✓ Zero manual steps
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: LIVE OAUTH ── */}
      <section className="py-16 px-6" style={{ background: 'white' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Try it live</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect with Pinterest</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Click the button below to go through the real Pinterest OAuth consent screen. 
            After authorizing, you&apos;ll be redirected back to SnapBid — exactly as it works 
            in production.
          </p>

          {/* OAuth Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image src="/logo.svg" alt="SnapBid" width={90} height={28} />
              <span className="text-gray-300 text-2xl">↔</span>
              <svg width="32" height="32" viewBox="0 0 24 24" aria-label="Pinterest">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fill="#e60023"/>
              </svg>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              SnapBid will request permission to read your boards and publish pins on your behalf.
            </p>

            <a
              href={PINTEREST_OAUTH_URL}
              className="block w-full text-center font-semibold py-3.5 px-6 rounded-xl text-white transition-all text-sm hover:opacity-90"
              style={{ background: '#e60023' }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                Connect with Pinterest
              </span>
            </a>

            <p className="text-xs text-gray-400 mt-4">
              You&apos;ll be redirected to Pinterest, then returned to snapbid.app/api/pinterest/callback
            </p>
          </div>

          {/* Permissions list */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
            {[
              { scope: 'boards:read', desc: 'List your existing boards to find the right one' },
              { scope: 'boards:write', desc: 'Create new boards if a matching one doesn\'t exist' },
              { scope: 'pins:read', desc: 'Verify pins were successfully published' },
              { scope: 'pins:write', desc: 'Publish new pins to your boards automatically' },
              { scope: 'user_accounts:read', desc: 'Identify your account to link it to SnapBid' },
            ].map(item => (
              <div key={item.scope} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ background: '#fef2f2', color: '#991b1b' }}>
                  {item.scope}
                </span>
                <span className="text-xs text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: WHAT WE PUBLISH ── */}
      <section className="py-16 px-6" style={{ background: '#faf8f5' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Sample content</p>
            <h2 className="text-3xl font-bold text-gray-900">What we publish to Pinterest</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Every SnapBid blog post generates a branded pin with the cost headline, city, and a 
              direct link back to the full guide.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10 justify-center">
            {/* Sample Pin Mockup */}
            <div className="w-64 rounded-2xl overflow-hidden shadow-xl border border-gray-200 flex-shrink-0">
              {/* Pin image area */}
              <div className="h-80 flex flex-col items-center justify-center px-6 text-white text-center" style={{ background: 'linear-gradient(160deg, #991b1b 0%, #7f1d1d 60%, #d97706 100%)' }}>
                {/* Category badge */}
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-4">
                  Home Improvement
                </span>
                <h3 className="text-xl font-bold leading-tight mb-3">
                  How Much Does a Kitchen Remodel Cost in Austin?
                </h3>
                <div className="bg-white/20 rounded-xl px-4 py-2 mb-3">
                  <p className="text-3xl font-bold">$18,500</p>
                  <p className="text-xs text-white/80">avg. Austin, TX · 2026</p>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Cabinets · countertops · appliances · labor — itemized breakdown inside.
                </p>
              </div>
              {/* Pin footer */}
              <div className="bg-white px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#991b1b' }}>
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">SnapBid</span>
                </div>
                <p className="text-xs text-gray-500 truncate">snapbid.app/blog/kitchen-remodel-cost-austin</p>
              </div>
            </div>

            {/* Description */}
            <div className="max-w-sm space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">City-specific cost guides</p>
                  <p className="text-sm text-gray-500">Every pin is tied to a specific city and trade — so it reaches the right audience searching for real cost data.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fffbeb' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Published at post time</p>
                  <p className="text-sm text-gray-500">Pins go live the moment a blog post publishes — no scheduler, no manual step, no delay.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Deep links to the full article</p>
                  <p className="text-sm text-gray-500">Every pin links directly to the full cost guide on snapbid.app — driving referral traffic from Pinterest searchers.</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href={PINTEREST_OAUTH_URL}
                  className="inline-flex items-center gap-2 font-semibold py-3 px-5 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
                  style={{ background: '#e60023' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                  Try the OAuth flow →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-6 px-6" style={{ background: '#faf8f5' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© 2026 SnapBid · snapbid.app</p>
          <p className="text-xs text-gray-400">Pinterest API Review Demo Page</p>
        </div>
      </footer>
    </div>
  )
}
