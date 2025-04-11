import 'server-only'
// import { Analytics } from '@/components/Analytics'
// import './globals.css'
import { Inter as FontSans } from 'next/font/google'
import { cn } from '@/lib/utils'
// import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/lib/providers/ThemeProvider'
// import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { Metadata } from 'next'
import React, { PropsWithChildren } from 'react'

import '@/app/globals.scss'
import IconProvider from '@/lib/providers/IconProvider'
import ProgressProvider from '@/lib/providers/ProgressProvider'
import QueryProvider from '@/lib/providers/QueryProvider'
import ToastProvider from '@/lib/providers/ToastProvider'
import PreloadPages from '@/components/misc/PreloadPages'
// import { env } from '@/env.mjs'
// import { siteConfig } from '@/config/site'

const fontSans = FontSans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'samga.nis - Электронный дневник НИШ',
  description: 'Самга (SAMGA) - официальный электронный дневник для школьников НИШ. Удобный дневник для учеников, учителей и родителей. Оценки, домашние задания и уведомления в одном месте.',
  keywords: 'самга, samga, самгау, samgay, электронный дневник, ниш, nis, мектеп, суш, дневник, электронный журнал, школа, suschnazarbaev, eni2, kundelik, электронный дневник, НИШ, samga top, самга',
  icons: [
    { rel: 'icon', url: '/favicon.ico', type: 'image/x-icon' },
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3498db' },
    { rel: 'shortcut icon', url: '/favicon.ico', type: 'image/x-icon' },
  ],
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'samga.nis',
    statusBarStyle: 'black-translucent',
    capable: true,
    startupImage: [
      '/apple-icon-180.png'
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://samga.top/',
    title: 'Самга - Электронный дневник НИШ',
    description: 'Самга (SAMGA) - официальный электронный дневник для школьников. Удобный дневник для учеников, учителей и родителей.',
    siteName: 'Самга - Электронный дневник',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Самга - Электронный дневник НИШ',
    description: 'Самга (SAMGA) - официальный электронный дневник для школьников. Удобный дневник для учеников, учителей и родителей.',
  },
  alternates: {
    canonical: 'https://samga.top/',
  },
}

export const viewport = {
  themeColor: '#3498db',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <div
          vaul-drawer-wrapper=""
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            fontSans.variable,
          )}
        >
          <ProgressProvider>
            <QueryProvider>
              <ThemeProvider>
                <IconProvider>
                  <ToastProvider>
                    <PreloadPages />
                    {children}
                    <div className="fixed bottom-0 left-0 right-0 text-center py-1 bg-background/80 backdrop-blur-sm border-t text-xs text-muted-foreground z-50">
                      *Модель может работать медленно и иногда допускать ошибки.
                    </div>
                  </ToastProvider>
                </IconProvider>
              </ThemeProvider>
            </QueryProvider>
          </ProgressProvider>
        </div>
      </body>
    </html>
  )
}
