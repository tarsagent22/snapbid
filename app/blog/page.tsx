import { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export const metadata: Metadata = {
  title: 'Home Improvement Cost Guides | SnapBid',
  description: 'Free cost guides and pricing breakdowns for common home improvement projects. Know what to pay before you hire a contractor.',
  other: {
    'fo-verify': 'd9bdd49e-fed0-46ec-bbdb-a4793f4c4ebe',
  },
}

interface PostMeta {
  slug: string
  title: string
  date: string
  description: string
  readTime: string
  author: string
}

function getPosts(): PostMeta[] {
  const blogDir = path.join(process.cwd(), 'content/blog')
  if (!fs.existsSync(blogDir)) return []

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'))

  const posts = files.map(filename => {
    const slug = filename.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(blogDir, filename), 'utf8')
    const { data } = matter(raw)
    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      description: data.description || '',
      readTime: data.readTime || '5 min read',
      author: data.author || 'SnapBid',
    }
  })

  // Only show posts published on or before today, sorted newest first
  const today = new Date().toISOString().slice(0, 10)
  return posts
    .filter(p => p.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export default function BlogIndex() {
  const posts = getPosts()

  return (
    <div className="min-h-screen" style={{ background: 'var(--background, #faf8f5)' }}>


      {/* Hero */}
      <div className="bg-[#1C1917] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-amber-900/40 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-amber-800/40">
            📋 Cost Guides
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Home Improvement Cost Guides
          </h1>
          <p className="text-stone-400 text-lg max-w-xl leading-relaxed">
            Real cost breakdowns for common home projects — so you know what's fair before you hire a contractor.
          </p>
        </div>
      </div>

      {/* Post list */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#991b1b] bg-red-50 px-2 py-0.5 rounded-full">
                      Cost Guide
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#991b1b] transition-colors flex-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </span>
                    <span className="text-xs font-semibold text-[#991b1b] group-hover:underline">
                      Read guide →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-[#1C1917] rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Get an instant estimate for your project</h2>
          <p className="text-stone-400 text-sm mb-5 max-w-sm mx-auto">
            Skip the guesswork. Get a free itemized cost breakdown tailored to your location.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-[#991b1b] hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            Get my estimate →
          </Link>
        </div>
      </div>

    </div>
  )
}
