import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
              Kkondeokji
            </h1>
            <p className="text-lg text-gray-600">Find your common ground</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 blur opacity-30 rounded-2xl"></div>
            <div className="relative bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 mb-6">
                Connect with people who share your interests, discover new friends, and start meaningful conversations.
              </p>

              <Link href="/onboarding" className="w-full">
                <GradientButton className="w-full py-6">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </GradientButton>
              </Link>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
