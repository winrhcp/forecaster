import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Forecaster',
  description: 'Predict the future, one cast at a time.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}

