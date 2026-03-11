import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | SnapBid',
  description: 'How SnapBid collects, uses, and protects your data.',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  const lastUpdated = 'March 10, 2026'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="bg-[#faf8f5] border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="SnapBid" className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">

          <section>
            <p>
              SnapBid ("we", "our", or "us") operates snapbid.app. This Privacy Policy explains what information we collect,
              how we use it, and the choices you have. By using SnapBid, you agree to the collection and use of information
              in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Account information:</strong> Your email address, collected via Clerk (our authentication provider)
                when you create an account.
              </li>
              <li>
                <strong>Business profile:</strong> Business name, trade type, hourly rate, region, markup, and other
                pricing preferences you provide to calibrate your quotes.
              </li>
              <li>
                <strong>Quote data:</strong> Job descriptions, client names, addresses, and the AI-generated quotes you
                create. This data is stored to power your quote history.
              </li>
              <li>
                <strong>Payment information:</strong> Billing is handled by Stripe. We do not store your card number or
                payment credentials — Stripe processes all payments securely.
              </li>
              <li>
                <strong>Usage data:</strong> Standard server logs including IP address, browser type, and pages visited,
                used to maintain and improve the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and operate the SnapBid quote generation service.</li>
              <li>To calibrate AI-generated quotes to your specific rates and trade.</li>
              <li>To save and display your quote history.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send important service updates (e.g., billing issues, feature changes).</li>
              <li>To improve the service based on usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Clerk</strong> — authentication and user management (
                <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-[#991b1b] hover:underline">clerk.com/privacy</a>).
              </li>
              <li>
                <strong>Stripe</strong> — payment processing (
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-[#991b1b] hover:underline">stripe.com/privacy</a>).
              </li>
              <li>
                <strong>Anthropic</strong> — AI quote generation. Your job descriptions are sent to Anthropic's Claude API
                to generate quotes (
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer"
                  className="text-[#991b1b] hover:underline">anthropic.com/privacy</a>).
              </li>
              <li>
                <strong>Vercel</strong> — hosting and infrastructure (
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                  className="text-[#991b1b] hover:underline">vercel.com/legal/privacy-policy</a>).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Data Retention</h2>
            <p>
              We retain your account and quote data for as long as your account is active. If you delete your account,
              we will delete your associated data within 30 days, except where we're required to retain it for legal or
              accounting purposes (e.g., payment records).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h2>
            <p>You may request to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Delete your account and associated data.</li>
              <li>Export your quote history.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hello@snapbid.app" className="text-[#991b1b] hover:underline">hello@snapbid.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies</h2>
            <p>
              SnapBid uses cookies and similar technologies for authentication (via Clerk) and to maintain your session.
              We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Children's Privacy</h2>
            <p>
              SnapBid is not intended for users under the age of 13. We do not knowingly collect personal information
              from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we'll update the "Last updated" date above.
              Continued use of SnapBid after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>
              Questions about this policy? Email us at{' '}
              <a href="mailto:hello@snapbid.app" className="text-[#991b1b] hover:underline">hello@snapbid.app</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to SnapBid
          </Link>
        </div>
      </main>
    </div>
  )
}
