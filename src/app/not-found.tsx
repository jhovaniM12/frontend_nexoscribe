'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">Página no encontrada</p>
        <Button asChild>
          <Link href="/dashboard">Volver al Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

