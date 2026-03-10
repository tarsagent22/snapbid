import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_URL = 'https://snapbid.app'
const SITE_NAME = 'SnapBid'
const TITLE = 'SnapBid — AI Quote Generator for Contractors'
const DESCRIPTION =
  'Generate professional, itemized contractor quotes in 60 seconds. Calibrated to your hourly rate, region, and trade. Free to try — no credit card needed.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'contractor quote generator',
    'AI estimate software',
    'contractor estimating app',
    'plumbing estimate generator',
    'electrical estimate software',
    'roofing quote tool',
    'HVAC estimate generator',
    'painting estimate app',
    'contractor invoice generator',
    'job quoting software for contractors',
    'free contractor estimate tool',
  ],
  authors: [{ name: 'SnapBid', url: SITE_URL }],
  creator: 'SnapBid',
  publisher: 'SnapBid',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'SnapBid — AI Quote Generator for Contractors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
    creator: '@snapbidapp',
    site: '@snapbidapp',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'technology',
}

// JSON-LD structured data for the SaaS product
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SnapBid',
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier — 3 quotes included',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body>
          {children}
          <footer className="border-t border-gray-100 py-6 bg-[#faf8f5]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400">© 2026 SnapBid · Built for tradespeople</p>
              <nav className="flex items-center gap-4 text-xs text-gray-400">
                {userId && (
                  <a href="/profile" className="hover:text-gray-600 transition-colors">Profile</a>
                )}
                <a href="/upgrade" className="hover:text-gray-600 transition-colors">Upgrade</a>
                <a href="mailto:hello@snapbid.app" className="hover:text-gray-600 transition-colors">Contact</a>
              </nav>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
