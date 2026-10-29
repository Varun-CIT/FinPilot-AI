import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/finpilot/app-shell'
import { FinPilotProvider } from '@/components/finpilot/finpilot-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FinPilot AI — Smarter Advice. Clearer Reasons.',
    template: '%s | FinPilot AI',
  },
  description:
    'A financial intelligence workspace for adviser-led investor profiling, risk assessment, goal planning, fund research, and human-reviewed workflows.',
  applicationName: 'FinPilot AI',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0d2b20',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <FinPilotProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" closeButton richColors />
        </FinPilotProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
