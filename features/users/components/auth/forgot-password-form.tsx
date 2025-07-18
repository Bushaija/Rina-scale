"use client"

import { LogoIcon } from '@/features/users/components/auth/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

interface ForgotPasswordFormProps {
    onSubmit?: (email: string) => Promise<void> | void
    logoHref?: string
    loginHref?: string
    className?: string
}

export function ForgotPasswordForm({
    onSubmit,
    logoHref = '/',
    loginHref = '/sign-in',
    className = '',
}: ForgotPasswordFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const email = formData.get('email') as string
            
            if (onSubmit) {
                await onSubmit(email)
            }
        } catch (err) {
            setError('Failed to send reset link. Please try again.')
            console.error('Form submission error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={`bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)] ${className}`}>
            <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                <div className="text-center">
                    <Link
                        href={logoHref}
                        aria-label="go home"
                        className="mx-auto block w-fit">
                        <LogoIcon />
                    </Link>
                    <h1 className="mb-1 mt-4 text-xl font-semibold">Recover Password</h1>
                    <p className="text-sm">Enter your email to receive a reset link</p>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className="block text-sm">
                            Email
                        </Label>
                        <Input
                            type="email"
                            required
                            name="email"
                            id="email"
                            placeholder="name@example.com"
                            disabled={isLoading}
                            aria-describedby={error ? "error-message" : undefined}
                        />
                        {error && (
                            <p id="error-message" className="text-destructive text-sm mt-1">
                                {error}
                            </p>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-muted-foreground text-sm">We'll send you a link to reset your password.</p>
                </div>
            </div>

            <div className="p-3">
                <p className="text-accent-foreground text-center text-sm">
                    Remembered your password?
                    <Button
                        asChild
                        variant="link"
                        className="px-2"
                        disabled={isLoading}>
                        <Link href={loginHref}>Log in</Link>
                    </Button>
                </p>
            </div>
        </form>
    )
} 