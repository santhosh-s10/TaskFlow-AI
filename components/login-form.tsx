'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { cn } from "@/lib/utils"
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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { GoogleIcon } from "@/components/google-icon"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors({ email: '', password: '' })
    setSuccess('')

    try {
      const email = formData.email.trim().toLowerCase()
      const nextErrors = {
        email: !email
          ? 'Email is required.'
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ? 'Enter a valid email address.'
            : '',
        password: !formData.password ? 'Password is required.' : '',
      }

      if (nextErrors.email || nextErrors.password) {
        setFieldErrors(nextErrors)
        setIsLoading(false)
        return
      }

      const callbackUrl =
        new URLSearchParams(window.location.search).get('callbackUrl') || '/dashboard'
      const result = await signIn('credentials', {
        email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      })

      if (result?.ok) {
        setSuccess('Login successful! Redirecting to dashboard...')
        setTimeout(() => {
          router.replace(result.url || callbackUrl)
        }, 1500)
      } else {
        setError('The email or password is incorrect. Please check both and try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with email
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {fieldErrors.email && <FieldDescription className="text-red-600">{fieldErrors.email}</FieldDescription>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                />
                {fieldErrors.password && <FieldDescription className="text-red-600">{fieldErrors.password}</FieldDescription>}
              </Field>
              
              {error && (
                <FieldDescription className="text-red-600 text-center">
                  {error}
                </FieldDescription>
              )}
              
              {success && (
                <FieldDescription className="text-green-600 text-center">
                  {success}
                </FieldDescription>
              )}
              
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
