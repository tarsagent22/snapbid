import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SnapBid — AI Quote Generator for Contractors',
  description: 'Generate professional contractor quotes in 60 seconds. Powered by AI, calibrated to your rates.',
  keywords: 'contractor quote generator, estimate software, AI quotes, plumbing estimate, electrical estimate',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
        <body>
          {children}
          <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400 bg-white">
            © 2026 SnapBid · Built for tradespeople
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
