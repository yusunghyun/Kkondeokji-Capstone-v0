"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { MoonStar, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // hydration 문제 해결을 위한 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 테마 전환 함수
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // hydration 전에는 아무것도 렌더링하지 않음
  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative">
      <motion.button
        onClick={toggleTheme}
        className={cn(
          "relative flex h-10 w-20 items-center justify-between px-2 rounded-full transition-colors duration-300",
          isDark
            ? "bg-slate-800 border border-slate-700"
            : "bg-blue-50 border border-blue-100"
        )}
        whileTap={{ scale: 0.95 }}
        aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      >
        {/* 아이콘 컨테이너 */}
        <div className="z-10 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.5 : 1 }}
          >
            <Sun
              className={cn(
                "h-4 w-4",
                isDark ? "text-slate-500" : "text-amber-500"
              )}
            />
          </motion.div>
        </div>

        <div className="z-10 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 1 : 0.5 }}
          >
            <MoonStar
              className={cn(
                "h-4 w-4",
                isDark ? "text-indigo-300" : "text-slate-400"
              )}
            />
          </motion.div>
        </div>

        {/* 동그라미 스위치 - 부모 컨테이너 밖으로 빼서 구현 */}
        <motion.div
          className={cn(
            "absolute h-8 w-8 rounded-full shadow-md",
            isDark ? "bg-slate-700" : "bg-white"
          )}
          initial={false}
          animate={{
            left: isDark ? "calc(100% - 34px)" : "2px",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        />
      </motion.button>
    </div>
  );
}
