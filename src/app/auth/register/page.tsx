"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // QR 코드 및 리디렉션 URL 가져오기
  const qrCode = searchParams.get("qr_code");
  const redirectUrl = searchParams.get("redirect");

  console.log("🔍 회원가입 페이지 파라미터:", { qrCode, redirectUrl });

  useEffect(() => {
    if (!loading && user) {
      // 회원가입 성공 후 온보딩 페이지로 이동
      console.log("✅ 회원가입 성공, 온보딩 페이지로 이동");

      // QR 코드가 있으면 해당 정보를 온보딩 페이지로 전달
      const onboardingUrl = qrCode
        ? `/onboarding?qr_code=${qrCode}${
            redirectUrl ? `&redirect=${redirectUrl}` : ""
          }`
        : "/onboarding";

      router.push(onboardingUrl);
    }
  }, [user, loading, router, qrCode, redirectUrl]);

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
        <RegisterForm redirectUrl={redirectUrl} qrCode={qrCode} />
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © 2023 껀덕지. All rights reserved.
      </footer>
    </div>
  );
}
