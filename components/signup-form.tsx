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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const strongPasswordMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' })
    setSuccess('')

    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()

    const nextErrors = {
      name: !name ? 'Full name is required.' : name.length < 2 ? 'Full name must be at least 2 characters long.' : '',
      email: !email ? 'Email is required.' : !emailPattern.test(email) ? 'Enter a valid email address.' : '',
      password: !formData.password ? 'Password is required.' : !passwordPattern.test(formData.password) ? strongPasswordMessage : '',
      confirmPassword: !formData.confirmPassword ? 'Confirm your password.' : formData.password !== formData.confirmPassword ? 'Passwords do not match.' : '',
    }

    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      setFieldErrors(nextErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to dashboard...')
        await signIn('credentials', {
          email,
          password: formData.password,
          redirect: false,
          callbackUrl: '/dashboard',
        })
        setTimeout(() => {
          router.replace('/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Failed to create account')
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
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
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
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={handleChange}
                />
                {fieldErrors.name && <FieldDescription className="text-red-600">{fieldErrors.name}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {fieldErrors.email && <FieldDescription className="text-red-600">{fieldErrors.email}</FieldDescription>}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input 
                      id="password" 
                      type="password" 
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {fieldErrors.password && <FieldDescription className="text-red-600">{fieldErrors.password}</FieldDescription>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {fieldErrors.confirmPassword && <FieldDescription className="text-red-600">{fieldErrors.confirmPassword}</FieldDescription>}
                  </Field>
                </Field>
                <FieldDescription>
                  Use 8+ characters with uppercase, lowercase, number, and special character.
                </FieldDescription>
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
