import { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked, Renderer } from 'marked'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

function getPost(slug: string) {
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { frontmatter: data, content }
}

function getAllSlugs(): string[] {
  const blogDir = path.join(process.cwd(), 'content/blog')
  if (!fs.existsSync(blogDir)) return []
  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md') && f !== 'keyword-tracker.md')
    .map(f => f.replace(/\.md$/, ''))
}

function extractFaqEntries(content: string): Array<{ question: string; answer: string }> {
  const lines = content.split('\n')
  const entries: Array<{ question: string; answer: string }> = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const h2Match = line.match(/^##\s+(.+)$/)
    if (h2Match) {
      const question = h2Match[1].trim()
      let answer = ''
      let j = i + 1
      while (j < lines.length) {
        const candidate = lines[j].trim()
        if (candidate.startsWith('#')) break
        if (candidate.length > 0) {
          if (!candidate.startsWith('###') && !candidate.startsWith('|') && !candidate.startsWith('>') && !candidate.startsWith('-') && !candidate.startsWith('*')) {
            answer = candidate.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
            break
          } else {
            answer = candidate.replace(/^[-*>]\s*/, '').replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
            break
          }
        }
        j++
      }
      if (question && answer) entries.push({ question, answer })
    }
    i++
  }
  return entries
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRenderer(): any {
  const renderer = new Renderer()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.heading = (token: any) => {
    const { text, depth } = token
    if (depth === 1) return `<h1 style="font-size:2rem;font-weight:800;color:#111827;line-height:1.2;margin:2rem 0 1rem">${text}</h1>`
    if (depth === 2) return `<h2 style="font-size:1.35rem;font-weight:700;color:#111827;margin:2.5rem 0 0.75rem;padding-bottom:0.5rem;border-bottom:2px solid #f3f0eb">${text}</h2>`
    if (depth === 3) return `<h3 style="font-size:1.1rem;font-weight:700;color:#991b1b;margin:1.75rem 0 0.5rem">${text}</h3>`
    return `<h${depth} style="font-weight:700;margin:1.5rem 0 0.5rem">${text}</h${depth}>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.paragraph = (token: any) => {
    return `<p style="color:#374151;line-height:1.8;margin:0 0 1.1rem;font-size:1rem">${token.text}</p>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.strong = (token: any) => {
    return `<strong style="font-weight:700;color:#111827">${token.text}</strong>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.em = (token: any) => {
    return `<em style="color:#6b7280;font-style:italic">${token.text}</em>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.link = (token: any) => {
    const { href, text } = token
    const isExternal = href?.startsWith('http')
    return `<a href="${href}" style="color:#991b1b;font-weight:600;text-decoration:none;border-bottom:1px solid #fca5a5"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.list = (token: any) => {
    const tag = token.ordered ? 'ol' : 'ul'
    const style = token.ordered
      ? 'margin:0 0 1.25rem;padding-left:1.5rem;list-style:decimal'
      : 'margin:0 0 1.25rem;padding-left:0;list-style:none'
    let body = ''
    for (const item of token.items) {
      body += renderer.listitem(item)
    }
    return `<${tag} style="${style}">${body}</${tag}>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.listitem = (token: any) => {
    // Get rendered text — handle nested tokens
    const text = token.tokens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? token.tokens.map((t: any) => {
          if (t.type === 'text') return t.text
          if (t.type === 'strong') return `<strong style="font-weight:700;color:#111827">${t.text}</strong>`
          if (t.type === 'link') return `<a href="${t.href}" style="color:#991b1b;font-weight:600;text-decoration:none;border-bottom:1px solid #fca5a5">${t.text}</a>`
          return t.raw || ''
        }).join('')
      : token.text
    return `<li style="color:#374151;line-height:1.75;margin-bottom:0.5rem;padding-left:1.5rem;position:relative"><span style="position:absolute;left:0;color:#991b1b;font-weight:700">→</span>${text}</li>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.blockquote = (token: any) => {
    const text = token.text || token.raw || ''
    return `<blockquote style="margin:1.5rem 0;padding:1rem 1.25rem;background:#fef9f0;border-left:4px solid #d97706;border-radius:0 8px 8px 0;color:#374151;font-style:normal">${text}</blockquote>`
  }

  renderer.hr = () => {
    return `<hr style="border:none;border-top:2px solid #f3f0eb;margin:2.5rem 0"/>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.table = (token: any) => {
    let thead = '<thead><tr>'
    for (const cell of token.header) {
      thead += `<th style="text-align:left;padding:0.75rem 1rem;background:#1C1917;color:#e7e5e4;font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em">${cell.text}</th>`
    }
    thead += '</tr></thead>'
    let tbody = '<tbody>'
    for (const row of token.rows) {
      tbody += '<tr style="border-bottom:1px solid #f3f0eb">'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cell of row) {
        tbody += `<td style="padding:0.75rem 1rem;color:#374151;background:#fff">${cell.text}</td>`
      }
      tbody += '</tr>'
    }
    tbody += '</tbody>'
    return `<div style="overflow-x:auto;margin:1.5rem 0;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07)"><table style="width:100%;border-collapse:collapse;font-size:0.95rem">${thead}${tbody}</table></div>`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer.code = (token: any) => {
    return `<code style="background:#f3f0eb;padding:0.15em 0.4em;border-radius:4px;font-size:0.9em;color:#991b1b">${token.text}</code>`
  }

  return renderer
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Not Found' }
  const { frontmatter } = post
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    authors: [{ name: frontmatter.author || 'SnapBid' }],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: 'article',
      publishedTime: frontmatter.date,
      authors: [frontmatter.author || 'SnapBid'],
      siteName: 'SnapBid',
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.description,
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const { frontmatter, content } = post

  marked.use({ renderer: buildRenderer() })
  const htmlContent = await marked(content)

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    dateModified: frontmatter.dateModified || frontmatter.date,
    author: { '@type': 'Organization', name: 'SnapBid' },
    publisher: { '@type': 'Organization', name: 'SnapBid', url: 'https://snapbid.app' },
    url: `https://snapbid.app/blog/${slug}`,
    keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords.join(', ') : frontmatter.keywords,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://snapbid.app/blog/${slug}` },
  }

  const faqEntries = extractFaqEntries(content)
  const faqSchema = faqEntries.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntries.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      }
    : null

  const formattedDate = frontmatter.date
    ? new Date(frontmatter.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Header */}
      <header style={{ background: '#faf8f5', borderBottom: '1px solid #ece8e1', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <img src="/logo.svg" alt="SnapBid" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/blog" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ← All guides
            </Link>
            <Link href="/" style={{ fontSize: '0.875rem', background: '#991b1b', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Get estimate
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.25rem 5rem' }}>

        {/* Article header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', background: '#fef2f2', padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cost Guide
            </span>
            {frontmatter.readTime && (
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{frontmatter.readTime}</span>
            )}
            {formattedDate && (
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Updated {formattedDate}</span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: '1rem' }}>
            {frontmatter.title}
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#4b5563', lineHeight: 1.7, marginBottom: 0 }}>
            {frontmatter.description}
          </p>
        </div>

        {/* Top CTA bar */}
        <div style={{ background: '#1C1917', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>Get a free cost estimate for your project</p>
            <p style={{ color: '#a8a29e', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>Calibrated to your city and project scope · No account required</p>
          </div>
          <Link href="/" style={{ flexShrink: 0, background: '#991b1b', color: '#fff', fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Try it free →
          </Link>
        </div>

        {/* Article body */}
        <article dangerouslySetInnerHTML={{ __html: htmlContent }} />

        {/* Bottom CTA */}
        <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '2px solid #f3f0eb' }}>
          <div style={{ background: 'linear-gradient(135deg, #1C1917 0%, #2c201c 100%)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏠</div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
              Ready to get a real number?
            </h2>
            <p style={{ color: '#a8a29e', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              Enter your project details and get a free itemized estimate calibrated to your city — in seconds.
            </p>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#991b1b', color: '#fff', fontWeight: 700, padding: '0.85rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontSize: '1rem' }}>
              Get my free estimate →
            </Link>
            <p style={{ color: '#78716c', fontSize: '0.78rem', marginTop: '0.75rem' }}>Free · No account · Results in seconds</p>
          </div>
        </div>

      </main>
    </div>
  )
}
