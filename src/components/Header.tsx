'use client'

import { Moon, Sun, User, Menu, ShieldAlert, LogOut, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

import { CommandPalette } from "./CommandPalette"
import { Breadcrumbs } from "./Breadcrumbs"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="h-14 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-30 flex items-center shadow-sm shadow-black/[0.02] dark:shadow-black/20 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="h-full flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 lg:gap-6 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0"
              onClick={onMenuClick}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Breadcrumbs />
        </div>

        <div className="flex-1 min-w-0 max-w-xl flex justify-center px-1 sm:px-4">
          <CommandPalette />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-label={mounted && theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </Button>

          <div className="w-px h-6 bg-border/60 hidden sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-9 gap-2 rounded-lg hover:bg-muted/60 pl-2 pr-2 sm:pr-3",
                  "focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 ring-2 ring-background">
                  {user?.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {user?.name ? getInitials(user.name) : <User className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate text-left">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-lg">
              {/* User Info */}
              {user && (
                <>
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {user.avatar && (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Super Admin Access */}
              {user?.systemRole === 'superadmin' && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push('/admin')}
                    className={cn(
                      "cursor-pointer gap-2 py-2",
                      "text-primary focus:text-primary"
                    )}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Panel de Administración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer gap-2 py-2"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
