import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SnapBid — AI Quote Generator for Contractors'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '480px',
            height: '480px',
            background: 'radial-gradient(circle, #eff6ff 0%, #ffffff 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }}
        />

        {/* Dot grid accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '300px',
            height: '300px',
            opacity: 0.15,
            background: 'radial-gradient(circle, #2563eb 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
              <path d="M9 1L3 9h5l-1 6 7-10H9V1z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>
            SnapBid
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            maxWidth: '700px',
            marginBottom: '24px',
          }}
        >
          Professional quotes
          <br />
          <span style={{ color: '#2563EB' }}>in 60 seconds.</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: '26px',
            color: '#6b7280',
            maxWidth: '620px',
            lineHeight: 1.5,
            marginBottom: '48px',
          }}
        >
          AI-powered estimates calibrated to your rates, trade, and region. Built for tradespeople.
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Free to try', 'No credit card', 'PDF download'].map((label) => (
            <div
              key={label}
              style={{
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: '100px',
                padding: '10px 22px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ✓ {label}
            </div>
          ))}
        </div>

        {/* Bottom right: URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '80px',
            fontSize: '20px',
            color: '#9ca3af',
            fontWeight: 500,
          }}
        >
          snapbid.app
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
