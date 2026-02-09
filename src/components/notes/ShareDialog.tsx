'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Link2, Clock, MessageSquare, Loader2 } from 'lucide-react'
import { notesApi } from '@/lib/api'
import { toast } from 'sonner'

interface ShareDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    noteId: string
    noteTitle: string
    isCurrentlyShared?: boolean
    currentExpiresAt?: string | null
    onShareSuccess?: () => void
}

const DURATION_OPTIONS = [
    { value: '1h', label: '1 hora' },
    { value: '24h', label: '24 horas' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
] as const

export function ShareDialog({
    open,
    onOpenChange,
    noteId,
    noteTitle,
    isCurrentlyShared = false,
    currentExpiresAt,
    onShareSuccess,
}: ShareDialogProps) {
    const [duration, setDuration] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
    const [allowComments, setAllowComments] = useState(true)
    const [isSharing, setIsSharing] = useState(false)
    const [isUnsharing, setIsUnsharing] = useState(false)
    const [shareResult, setShareResult] = useState<{
        publicUrl: string
        expiresAt: string
    } | null>(null)
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        setIsSharing(true)
        try {
            const response = await notesApi.share(noteId, { duration, allowComments })
            const fullUrl = `${window.location.origin}/public/note/${response.publicToken}`
            setShareResult({
                publicUrl: fullUrl,
                expiresAt: response.expiresAt,
            })
            toast.success('Nota compartida exitosamente')
            onShareSuccess?.()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al compartir la nota'
            toast.error(errorMessage)
        } finally {
            setIsSharing(false)
        }
    }

    const handleUnshare = async () => {
        setIsUnsharing(true)
        try {
            await notesApi.unshare(noteId)
            setShareResult(null)
            toast.success('Nota privada nuevamente')
            onShareSuccess?.()
            onOpenChange(false)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al dejar de compartir la nota'
            toast.error(errorMessage)
        } finally {
            setIsUnsharing(false)
        }
    }

    const copyToClipboard = async () => {
        if (shareResult?.publicUrl) {
            await navigator.clipboard.writeText(shareResult.publicUrl)
            setCopied(true)
            toast.success('Enlace copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const formatExpiration = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('es-MX', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Compartir nota
                    </DialogTitle>
                    <DialogDescription>
                        Comparte &quot;{noteTitle}&quot; con un enlace público temporal
                    </DialogDescription>
                </DialogHeader>

                {!shareResult ? (
                    <div className="space-y-6 py-4">
                        {/* Duration */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Duración del enlace
                            </Label>
                            <Select value={duration} onValueChange={(v) => setDuration(v as typeof duration)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DURATION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                El enlace expirará automáticamente después de este tiempo
                            </p>
                        </div>

                        {/* Comments toggle */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Permitir comentarios
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Los visitantes pueden dejar comentarios en la nota
                                </p>
                            </div>
                            <Switch
                                checked={allowComments}
                                onCheckedChange={setAllowComments}
                            />
                        </div>

                        {isCurrentlyShared && currentExpiresAt && (
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    Esta nota ya está compartida. Expira el {formatExpiration(currentExpiresAt)}.
                                    Generar un nuevo enlace reemplazará el anterior.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Share link result */}
                        <div className="space-y-2">
                            <Label>Enlace público</Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={shareResult.publicUrl}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Expira: {formatExpiration(shareResult.expiresAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span>Comentarios: {allowComments ? 'Habilitados' : 'Deshabilitados'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {shareResult ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleUnshare}
                                disabled={isUnsharing}
                            >
                                {isUnsharing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Quitando...
                                    </>
                                ) : (
                                    'Dejar de compartir'
                                )}
                            </Button>
                            <Button onClick={() => onOpenChange(false)}>
                                Listo
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleShare} disabled={isSharing}>
                                {isSharing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4 mr-2" />
                                        Generar enlace
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
