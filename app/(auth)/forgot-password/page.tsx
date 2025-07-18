"use client"

import { ForgotPasswordForm } from '@/features/users/components/auth/forgot-password-form'
import { useState } from 'react'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (email: string) => {
        try {
            setIsLoading(true)
            // TODO: Implement password reset logic here
            console.log('Reset password for:', email)
            // Example API call:
            // await fetch('/api/auth/reset-password', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email })
            // })
        } catch (error) {
            console.error('Failed to send reset link:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <ForgotPasswordForm onSubmit={handleSubmit} />
        </section>
    )
}
