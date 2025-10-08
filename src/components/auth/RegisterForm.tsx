"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import Link from "next/link";

const registerSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력해주세요"),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
    confirmPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  redirectUrl?: string | null;
  qrCode?: string | null;
}

export function RegisterForm({ redirectUrl, qrCode }: RegisterFormProps) {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await signUp(data.email, data.password);
      // 회원가입 완료 후 현재 페이지에서 프로필 입력 단계로 이동
      // (이미 온보딩 페이지에 있으므로 리다이렉션 불필요)
      console.log("회원가입 완료 - 프로필 입력 단계로 이동");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">회원가입</CardTitle>
        <CardDescription className="text-center">
          새로운 껀덕지 계정을 만들어보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600"
            disabled={isLoading}
          >
            {isLoading ? "가입 중..." : "가입하기"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-primary-500 hover:underline">
            로그인하기
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
