import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chatbot with Memory',
  description: 'A production-ready conversational AI application with persistent memory, department agents, and request tracing',
  openGraph: {
    title: 'Chatbot with Memory',
    description: 'A production-ready conversational AI application with persistent memory, department agents, and request tracing',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Chatbot with Memory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatbot with Memory',
    description: 'A production-ready conversational AI application with persistent memory, department agents, and request tracing',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
