import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kkondeokji - Find Your Common Ground",
  description: "Connect with people who share your interests",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserProvider>{children}</UserProvider>
          </AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "white",
                color: "black",
                border: "1px solid #E3E3E3",
              },
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
