'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { type Folder as FolderType } from "@/lib/api"

const FOLDER_COLORS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Morado', value: '#8B5CF6' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Naranja', value: '#F97316' },
  { name: 'Indigo', value: '#6366F1' },
]

interface FolderDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  folder: FolderType | null
  folderName: string
  folderColor: string
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onColorChange: (color: string) => void
  onSubmit: () => void
}

export function FolderDialog({
  open,
  mode,
  folderName,
  folderColor,
  isSubmitting,
  onOpenChange,
  onNameChange,
  onColorChange,
  onSubmit,
}: FolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Carpeta' : 'Editar Carpeta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crea una nueva carpeta para organizar tus notas'
              : 'Modifica los detalles de la carpeta'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nombre</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej: Matemáticas, Historia..."
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onColorChange(color.value)}
                  className={`h-10 rounded-md border-2 transition-all ${
                    folderColor === color.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-105'
                      : 'hover:scale-105 border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !folderName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              mode === 'create' ? 'Crear' : 'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

