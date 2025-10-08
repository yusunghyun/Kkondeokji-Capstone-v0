"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // QR 코드 및 리디렉션 URL 가져오기
  const qrCode = searchParams.get("qr_code");
  const redirectUrl = searchParams.get("redirect");

  console.log("🔍 로그인 페이지 파라미터:", { qrCode, redirectUrl });

  useEffect(() => {
    if (user) {
      // 리디렉션 URL이 있으면 해당 URL로 이동
      if (redirectUrl) {
        console.log("✅ 로그인 성공, 리디렉션:", redirectUrl);
        router.push(redirectUrl);
      } else {
        console.log("✅ 로그인 성공, 홈으로 이동");
        router.push("/");
      }
    }
  }, [user, loading, router, redirectUrl]);

  // if (loading) {
  //   return (
  //     <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 justify-center items-center">
  //       <p>로딩 중...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary-500">
          껀덕지
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <LoginForm redirectUrl={redirectUrl} qrCode={qrCode} />
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © 2023 껀덕지. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 justify-center items-center">
          <p>로딩 중...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
