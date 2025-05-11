import type React from "react"
import "@/app/globals.css"
import { Buenard as Pretendard, Roboto } from "next/font/google"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"

const pretendard = Pretendard({
  subsets: ["latin"],
  variable: "--font-pretendard",
})

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "껀덕지 - 공통 관심사 찾기",
  description: "30초 설문으로 공통 관심사를 찾고 대화를 시작하세요",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${roboto.variable}`}>
      <body className="font-pretendard">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
