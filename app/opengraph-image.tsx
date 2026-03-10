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
        {/* Background accent — warm amber glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, #fef3c7 0%, #ffffff 70%)',
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
            width: '320px',
            height: '320px',
            opacity: 0.12,
            background: 'radial-gradient(circle, #991b1b 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '44px' }}>
          {/* Clipboard icon */}
          <div style={{ position: 'relative', width: '64px', height: '76px', display: 'flex' }}>
            {/* clip tab */}
            <div style={{
              position: 'absolute', top: '4px', left: '22px',
              width: '20px', height: '10px',
              background: '#991b1b', borderRadius: '4px',
            }} />
            {/* clipboard body dark */}
            <div style={{
              position: 'absolute', top: '12px', left: '4px',
              width: '56px', height: '64px',
              background: '#1C1917', borderRadius: '8px',
            }} />
            {/* clipboard face amber */}
            <div style={{
              position: 'absolute', top: '20px', left: '10px',
              width: '44px', height: '52px',
              background: '#991b1b', borderRadius: '4px',
            }} />
            {/* line 1 */}
            <div style={{
              position: 'absolute', top: '28px', left: '14px',
              width: '28px', height: '3px',
              background: '#1C1917', borderRadius: '2px', opacity: 0.35,
            }} />
            {/* line 2 */}
            <div style={{
              position: 'absolute', top: '35px', left: '14px',
              width: '20px', height: '3px',
              background: '#1C1917', borderRadius: '2px', opacity: 0.35,
            }} />
            {/* checkmark — approximated as two divs rotated */}
            <svg
              width="64" height="76"
              viewBox="0 0 64 76"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path
                d="M13 57 L22 68 L51 42"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginLeft: '12px' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: '#991b1b', letterSpacing: '-2px', lineHeight: 1 }}>Snap</span>
            <span style={{ fontSize: '48px', fontWeight: 800, color: '#1C1917', letterSpacing: '-2px', lineHeight: 1 }}>Bid</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#1C1917',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            maxWidth: '700px',
            marginBottom: '24px',
          }}
        >
          Professional quotes
          <br />
          <span style={{ color: '#991b1b' }}>in 60 seconds.</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: '26px',
            color: '#78716C',
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
                background: '#faf8f5',
                border: '1.5px solid #fcd34d',
                borderRadius: '100px',
                padding: '10px 22px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#7f1d1d',
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
            color: '#A8A29E',
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
