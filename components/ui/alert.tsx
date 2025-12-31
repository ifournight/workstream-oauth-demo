import React from 'react'

interface AlertProps {
  variant?: 'error' | 'warning' | 'success' | 'info'
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const variantStyles = {
    error: 'bg-error-secondary border-error text-error-primary',
    warning: 'bg-warning-secondary border-warning text-warning-primary',
    success: 'bg-success-secondary border-success text-success-primary',
    info: 'bg-brand-primary_alt border-brand text-brand-secondary',
  }

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}
