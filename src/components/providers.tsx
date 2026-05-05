'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './error-fallback'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: {
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
