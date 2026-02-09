'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Calendar, Tag as TagIcon, MessageSquare, Send, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { publicApi, type PublicNote, type PublicComment } from '@/lib/api'
import { toast } from 'sonner'

interface PageProps {
    params: Promise<{
        token: string
    }>
}

function CommentForm({ token, onCommentAdded }: { token: string; onCommentAdded: (comment: PublicComment) => void }) {
    const [authorName, setAuthorName] = useState('')
    const [authorEmail, setAuthorEmail] = useState('')
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!authorName.trim() || !content.trim()) {
            toast.error('Nombre y comentario son requeridos')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await publicApi.addComment(token, {
                authorName: authorName.trim(),
                authorEmail: authorEmail.trim() || undefined,
                content: content.trim(),
            })
            toast.success('Comentario agregado')
            onCommentAdded(response.comment)
            setContent('')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al agregar comentario'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                        id="name"
                        placeholder="Tu nombre"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        maxLength={100}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={authorEmail}
                        onChange={(e) => setAuthorEmail(e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="comment">Comentario *</Label>
                <Textarea
                    id="comment"
                    placeholder="Escribe tu comentario..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    required
                />
                <p className="text-xs text-muted-foreground text-right">
                    {content.length}/1000
                </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar comentario
                    </>
                )}
            </Button>
        </form>
    )
}

function CommentCard({ comment }: { comment: PublicComment }) {
    return (
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-medium">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString('es-MX', {
                        dateStyle: 'medium',
                    })}
                </span>
            </div>
            <p className="text-sm text-muted-foreground">{comment.content}</p>
        </div>
    )
}

export default function PublicNotePage({ params }: PageProps) {
    const { token } = use(params)
    const [note, setNote] = useState<PublicNote | null>(null)
    const [comments, setComments] = useState<PublicComment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadNote = async () => {
            try {
                setLoading(true)
                const response = await publicApi.getNote(token)
                setNote(response.note)
                setComments(response.comments)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error al cargar la nota'
                setError(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            loadNote()
        }
    }, [token])

    const handleCommentAdded = (comment: PublicComment) => {
        setComments([comment, ...comments])
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
                <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Nota no disponible</h2>
                            <p className="text-muted-foreground mt-1">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!note) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{note.title}</h1>
                            <p className="text-sm text-muted-foreground">Nota compartida públicamente</p>
                        </div>
                    </div>
                </div>

                {/* Note Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Creada {new Date(note.createdAt).toLocaleDateString('es-MX')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Actualizada {new Date(note.updatedAt).toLocaleDateString('es-MX')}</span>
                            </div>
                        </div>
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {note.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="gap-1">
                                        <TagIcon className="h-3 w-3" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                    </CardContent>
                </Card>

                {/* Comments Section */}
                {note.allowComments && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5" />
                                Comentarios ({comments.length})
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-6 space-y-6">
                            {/* Comment Form */}
                            <CommentForm token={token} onCommentAdded={handleCommentAdded} />

                            {/* Comments List */}
                            {comments.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <CommentCard key={comment._id} comment={comment} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground py-4">
                    <p>Compartido con NexoScribe</p>
                </div>
            </div>
        </div>
    )
}
