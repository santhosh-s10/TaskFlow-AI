"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GalleryVerticalEndIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const strongPasswordMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!token || !email) {
      setError("The reset link is invalid.")
      setIsLoading(false)
      return
    }

    if (!passwordPattern.test(password)) {
      setError(strongPasswordMessage)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, confirmPassword }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password.")
      }

      setSuccess("Password reset successfully. Redirecting to login...")
      setTimeout(() => router.replace("/login"), 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reset password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create a new password</CardTitle>
        <CardDescription>
          Enter and confirm your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FieldDescription>
                Use 8+ characters with uppercase, lowercase, number, and special character.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Field>

            {error && (
              <FieldDescription className="text-center text-red-600">
                {error}
              </FieldDescription>
            )}

            {success && (
              <FieldDescription className="text-center text-green-600">
                {success}
              </FieldDescription>
            )}

            <Field>
              <Button type="submit" disabled={isLoading || !token || !email}>
                {isLoading ? "Saving..." : "Reset password"}
              </Button>
              <FieldDescription className="text-center">
                <Link href="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/login" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          TaskFlow AI
        </Link>
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Loading reset form...
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
