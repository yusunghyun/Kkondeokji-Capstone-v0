"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 justify-center items-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary-500">
          껀덕지
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <LoginForm />
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © 2023 껀덕지. All rights reserved.
      </footer>
    </div>
  );
}
