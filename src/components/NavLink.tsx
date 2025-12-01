'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

interface NavLinkProps extends Omit<ComponentProps<typeof Link>, 'className'> {
  className?: string
  activeClassName?: string
  pendingClassName?: string
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, href, children, ...props }, ref) => {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

NavLink.displayName = "NavLink"

