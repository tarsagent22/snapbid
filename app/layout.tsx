import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
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
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <footer className="bg-gray-50 border-t border-gray-200 py-4 text-center text-xs text-gray-400">
            © 2026 SnapBid · Built for tradespeople
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
