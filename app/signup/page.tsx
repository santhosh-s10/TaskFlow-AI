"use client"

import { SignupForm } from "@/components/signup-form"
import { BrandLogo } from "@/components/brand-logo"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLogo href="/signup" />
        <SignupForm />
      </div>
    </div>
  )
}
