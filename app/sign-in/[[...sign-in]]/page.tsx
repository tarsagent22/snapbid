import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-gray-900 text-2xl">SnapBid</span>
        </div>
        <p className="text-gray-500 text-sm">Sign in to save your profile and generate quotes</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-sm border border-gray-100 rounded-2xl',
          }
        }}
        afterSignInUrl="/profile"
        afterSignUpUrl="/profile"
      />
    </main>
  )
}
