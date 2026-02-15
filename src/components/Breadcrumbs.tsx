'use client'

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

const routeMap: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Proyectos",
    tasks: "Mis Tareas",
    notes: "Notas",
    board: "Pizarra",
    settings: "Configuración",
    admin: "Panel Admin",
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const paths = pathname.split('/').filter(Boolean)

    if (paths.length === 0) return null

    return (
        <Breadcrumb className="hidden sm:block">
            <BreadcrumbList className="text-sm">
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Home className="h-3.5 w-3.5 shrink-0" />
                            <span>Inicio</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {paths.map((path, index) => {
                    const href = `/${paths.slice(0, index + 1).join('/')}`
                    const isLast = index === paths.length - 1
                    const label = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1)

                    return (
                        <React.Fragment key={path}>
                            <BreadcrumbSeparator className="text-muted-foreground/60" />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-foreground">
                                        {label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {label}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
