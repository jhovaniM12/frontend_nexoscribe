import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/providers/providers"
import { fontVariables, jakartaSans } from "@/lib/fonts"

export const metadata: Metadata = {
  title: "NexoScribe",
  description: "Plataforma de productividad para equipos modernos",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <body className={`${jakartaSans.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
