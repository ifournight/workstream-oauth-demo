// components/env-var.tsx
import React from 'react';

interface EnvVarProps {
  name: 'DEMO_URL' | 'UMS_BASE_URL' | 'PUBLIC_API_URL';
  fallback?: string;
  asLink?: boolean;
}

// Default values
const DEFAULT_VALUES: Record<string, string> = {
  DEMO_URL: 'https://your-demo-app.vercel.app',
  UMS_BASE_URL: 'https://ums.example.com',
  PUBLIC_API_URL: 'https://api.workstream.is',
};

// Read environment variables at module load time (build time)
// Next.js will replace these with actual values during build
const ENV_VALUES: Record<string, string> = {
  DEMO_URL: process.env.NEXT_PUBLIC_DEMO_URL || DEFAULT_VALUES.DEMO_URL,
  UMS_BASE_URL: process.env.NEXT_PUBLIC_UMS_BASE_URL || DEFAULT_VALUES.UMS_BASE_URL,
  PUBLIC_API_URL: process.env.NEXT_PUBLIC_PUBLIC_API_URL || DEFAULT_VALUES.PUBLIC_API_URL,
};

export function EnvVar({ name, fallback, asLink = false }: EnvVarProps) {
  const value = ENV_VALUES[name] || fallback || DEFAULT_VALUES[name] || `{{${name}}}`;
  
  if (asLink) {
    return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
  }
  
  return <code>{value}</code>;
}

