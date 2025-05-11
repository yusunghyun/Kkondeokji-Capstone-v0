"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 현재 세션 확인
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // 인증이 필요한 페이지에 대한 리디렉션 처리
        handleAuthRedirection(session?.user ?? null);
      } catch (error) {
        console.error("세션 확인 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      handleAuthRedirection(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // 인증 상태에 따른 리디렉션 처리
  const handleAuthRedirection = (currentUser: User | null) => {
    const authPaths = ["/login", "/signup"];
    const isAuthPath = authPaths.includes(pathname);

    if (
      !currentUser &&
      !isAuthPath &&
      pathname !== "/" &&
      !pathname.startsWith("/auth/") &&
      pathname !== "/onboarding"
    ) {
      // 비로그인 상태에서 보호된 경로 접근 시 로그인으로 리디렉션
      router.push("/login");
    } else if (currentUser && isAuthPath) {
      // 이미 로그인된 상태에서 인증 페이지 접근 시 홈으로 리디렉션
      router.push("/");
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
