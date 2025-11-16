import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SATistics',
  description: 'SATistics - SAT practice games and analytics dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${roboto.className} h-full overflow-hidden`}>{children}</body>
    </html>
  )
}

