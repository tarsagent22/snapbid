'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Cost Guides', href: '/blog' },
  { label: 'Upgrade', href: '/upgrade' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Hide on pages that have their own header
  if (/^\/blog\/.+/.test(pathname) || pathname === '/pinterest-demo') {
    return null
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close menu on route change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#faf8f5]/90 backdrop-blur-md shadow-sm border-b border-[#ece8e1]'
          : 'bg-[#faf8f5]',
      ].join(' ')}
      style={{ height: 'var(--header-h, 64px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
        {/* Logo */}
        <Link href="/" aria-label="SnapBid home" className="flex items-center shrink-0">
          <Image
            src="/logo.svg"
            alt="SnapBid"
            width={120}
            height={32}
            style={{ height: 32, width: 'auto' }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-6"
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={[
                'text-sm font-medium transition-colors duration-150',
                isActive(href)
                  ? 'text-[#991b1b] underline underline-offset-4 decoration-[#991b1b]'
                  : 'text-[#1C1917] hover:text-[#991b1b]',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/"
            className="ml-2 px-4 py-2 rounded-lg bg-[#991b1b] text-white text-sm font-semibold transition-colors duration-150 hover:bg-[#7f1d1d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991b1b] focus-visible:ring-offset-2"
          >
            Get Estimate
          </Link>
        </nav>

        {/* Hamburger (mobile) */}
        <button
          ref={buttonRef}
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991b1b]"
        >
          <span
            className={[
              'block w-5 h-0.5 bg-[#1C1917] transition-all duration-300 origin-center',
              menuOpen ? 'translate-y-[6.5px] rotate-45' : '',
            ].join(' ')}
          />
          <span
            className={[
              'block w-5 h-0.5 bg-[#1C1917] transition-all duration-300',
              menuOpen ? 'opacity-0 scale-x-0' : '',
            ].join(' ')}
          />
          <span
            className={[
              'block w-5 h-0.5 bg-[#1C1917] transition-all duration-300 origin-center',
              menuOpen ? '-translate-y-[6.5px] -rotate-45' : '',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Mobile slide-down menu */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={[
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          scrolled || menuOpen
            ? 'bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#ece8e1]'
            : 'bg-[#faf8f5]',
          menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
        aria-hidden={!menuOpen}
      >
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col px-4 pb-4 pt-2 gap-3"
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={[
                'text-sm font-medium py-1 transition-colors duration-150',
                isActive(href)
                  ? 'text-[#991b1b] underline underline-offset-4 decoration-[#991b1b]'
                  : 'text-[#1C1917] hover:text-[#991b1b]',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="mt-1 px-4 py-2 rounded-lg bg-[#991b1b] text-white text-sm font-semibold text-center transition-colors duration-150 hover:bg-[#7f1d1d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991b1b] focus-visible:ring-offset-2"
          >
            Get Estimate
          </Link>
        </nav>
      </div>
    </header>
  )
}
