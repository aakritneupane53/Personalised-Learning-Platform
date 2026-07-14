"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, RegisterInput } from "@/lib/validations";
import { useRegisterMutation } from "@/lib/queries/auth";
import { parseServerError } from "@/lib/axios";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterInput) => {
    setApiError(null);
    registerMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (err: unknown) => {
        setApiError(parseServerError(err));
      },
    });
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Mascot logo */}
        <Link href="/" className="mb-6 flex flex-col items-center gap-2 group">
          <svg
            viewBox="0 0 100 100"
            className="w-16 h-16 stroke-[1.5] stroke-ink fill-none transition-transform group-hover:scale-105"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 30,80 L 70,80 L 70,60 L 60,60 L 60,30 C 60,25 55,20 50,20 L 45,20 C 42,20 40,22 40,25 L 40,60 L 30,60 Z" />
            <path d="M 42,20 L 40,10 M 48,20 L 48,8" />
            <circle cx="53" cy="26" r="2" fill="currentColor" />
            <path d="M 60,30 L 65,33" />
            <path d="M 35,80 L 35,95 M 45,80 L 45,95 M 55,80 L 55,95 M 65,80 L 65,95" />
          </svg>
          <span className="heading-md font-semibold text-ink">Create your account</span>
        </Link>

        {/* Card wrapper */}
        <div className="w-full bg-canvas border border-hairline rounded-lg p-8">
          {apiError && (
            // 🌟 FIXED: Changed rounded-full to rounded-md so long error messages wrap correctly without clipping text
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md text-center px-4 leading-relaxed">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="body-sm-strong text-ink px-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                // 🌟 FIXED: Added dynamic error boundary ring color highlight
                className={`w-full h-10 border bg-canvas text-ink text-sm px-4 rounded-full outline-none transition-colors ${
                  errors.name ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.name.message}</p>
              )}
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="body-sm-strong text-ink px-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className={`w-full h-10 border bg-canvas text-ink text-sm px-4 rounded-full outline-none transition-colors ${
                  errors.email ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="body-sm-strong text-ink px-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  {...register("password")}
                  className={`w-full h-10 border bg-canvas text-ink text-sm px-4 pr-10 rounded-full outline-none transition-colors ${
                    errors.password ? "border-red-500 focus:border-red-500" : "border-hairline focus:border-ink"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-body hover:text-ink cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 px-1 font-medium mt-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-10 bg-ink text-white bg-ink-deep disabled:bg-surface-soft disabled:text-mute rounded-full button-md flex items-center justify-center transition-colors mt-4 cursor-pointer"
            >
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* Redirect toggle */}
        <p className="body-sm text-body mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-ink hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}