'use client'

import { useEffect, useRef, useState, useCallback } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Pencil, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon,
  Undo2,
  Eraser,
  MousePointer2,
  Trash2,
  RotateCcw,
  Save,
  Download,
  ArrowLeft
} from "lucide-react"
import { Canvas as FabricCanvas, Circle as FabricCircle, Rect, IText, PencilBrush, Image as FabricImage } from "fabric"
import { toast } from "sonner"
import { uploadApi, whiteboardApi } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"

type Tool = 'select' | 'draw' | 'eraser' | 'text' | 'rectangle' | 'circle'
type Color = string

const COLORS: { value: Color; label: string }[] = [
  { value: '#000000', label: 'Negro' },
  { value: '#ffffff', label: 'Blanco' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#a855f7', label: 'Púrpura' },
  { value: '#f97316', label: 'Naranja' },
]

function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while(n--){
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, {type:mime})
}

export default function BoardEditor() {
  const { id } = useParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('draw')
  const [activeColor, setActiveColor] = useState<Color>('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [boardTitle, setBoardTitle] = useState("")

  useEffect(() => {
    if (!canvasRef.current || !id) return

    // Calcular dimensiones responsivas
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth < 1024
    const sidebarWidth = isMobile ? 0 : (isTablet ? 64 : 64)
    const headerHeight = 64
    const padding = isMobile ? 16 : (isTablet ? 24 : 32)
    const toolbarWidth = isMobile ? 0 : (isTablet ? 80 : 80)
    
    const containerWidth = Math.min(1200, window.innerWidth - sidebarWidth - toolbarWidth - padding * 2)
    const containerHeight = Math.min(700, window.innerHeight - headerHeight - padding * 2)

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: '#ffffff',
    })

    // Initialize drawing brush
    const brush = new PencilBrush(canvas)
    brush.color = activeColor
    brush.width = 3
    canvas.freeDrawingBrush = brush

    setFabricCanvas(canvas)
    
    // Cargar tablero desde la nube por ID
    const loadBoard = async () => {
      try {
        const { whiteboard } = await whiteboardApi.getById(id as string)
        setBoardTitle(whiteboard.title)
        
        // Validación defensiva extrema para evitar crashes de Fabric
        const isValidContent = 
            whiteboard && 
            whiteboard.content && 
            typeof whiteboard.content === 'object' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Array.isArray((whiteboard.content as any).objects) &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (whiteboard.content as any).objects.length > 0;

        if (isValidContent) {
          try {
              // Clonar para evitar mutaciones
              const contentToLoad = JSON.parse(JSON.stringify(whiteboard.content));
              await canvas.loadFromJSON(contentToLoad as Record<string, unknown>);
              canvas.requestRenderAll();
              toast.success('Tablero cargado');
          } catch (jsonError) {
              console.warn("Advertencia: No se pudo restaurar el estado del tablero (posiblemente vacío o versión incompatible). Se inicia lienzo limpio.", jsonError);
          }
        }
      } catch (error) {
        console.error("Error loading board:", error)
        toast.error("Error al cargar el tablero")
      }
    }
    loadBoard()

    return () => {
      canvas.dispose()
    }
  }, [id, activeColor])

  const handleDeleteSelected = useCallback(() => {
    if (!fabricCanvas) return
    const activeObjects = fabricCanvas.getActiveObjects()
    
    if (activeObjects.length) {
      fabricCanvas.discardActiveObject()
      activeObjects.forEach((obj) => {
        fabricCanvas.remove(obj)
      })
      fabricCanvas.renderAll()
    }
  }, [fabricCanvas])

  useEffect(() => {
    if (!fabricCanvas) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvas.getActiveObject()
        // Don't delete if editing text
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (activeObject && (activeObject as any).isEditing) return
        
        handleDeleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fabricCanvas, handleDeleteSelected])

  useEffect(() => {
    if (!fabricCanvas) return

    if (activeTool === 'draw' || activeTool === 'eraser') {
        // Fabric.js requires direct property mutation - these are side effects on external canvas
        // eslint-disable-next-line react-hooks/immutability
        fabricCanvas.isDrawingMode = true
        if (fabricCanvas.freeDrawingBrush) {
            // eslint-disable-next-line react-hooks/immutability
            fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : activeColor
            fabricCanvas.freeDrawingBrush.width = activeTool === 'eraser' ? 20 : strokeWidth
        }
    } else {
        fabricCanvas.isDrawingMode = false
    }
  }, [activeTool, activeColor, strokeWidth, fabricCanvas])

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool)

    if (!fabricCanvas) return

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 150,
        height: 100,
        stroke: activeColor,
        strokeWidth: 2,
      })
      fabricCanvas.add(rect)
      fabricCanvas.setActiveObject(rect)
      fabricCanvas.renderAll()
      toast.success('Rectángulo añadido')
    } else if (tool === 'circle') {
      const circle = new FabricCircle({
        left: 100,
        top: 100,
        fill: 'transparent',
        radius: 60,
        stroke: activeColor,
        strokeWidth: 3,
      })
      fabricCanvas.add(circle)
      fabricCanvas.setActiveObject(circle)
      fabricCanvas.renderAll()
      toast.success('Círculo añadido')
    } else if (tool === 'text') {
      const text = new IText('Escribe aquí...', {
        left: 100,
        top: 100,
        fill: activeColor,
        fontSize: 24,
        fontFamily: 'Inter, sans-serif',
      })
      fabricCanvas.add(text)
      fabricCanvas.setActiveObject(text)
      fabricCanvas.renderAll()
      toast.success('Texto añadido - haz doble clic para editar')
    }
  }

  const handleUndo = () => {
    if (!fabricCanvas) return
    const objects = fabricCanvas.getObjects()
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1])
      fabricCanvas.renderAll()
      toast.info('Deshacer')
    }
  }

  const handleClear = () => {
    if (!fabricCanvas) return
    fabricCanvas.clear()
    // Fabric.js requires direct property mutation - side effect on external canvas
    // eslint-disable-next-line react-hooks/immutability
    fabricCanvas.backgroundColor = '#ffffff'
    fabricCanvas.renderAll()
    toast.info('Tablero limpiado')
  }

  const handleSave = async () => {
    if (!fabricCanvas || !id) return
    
    const toastId = toast.loading("Guardando tablero...")

    try {
      const json = fabricCanvas.toJSON()
      
      // 1. Generar miniatura (baja calidad para que sea rápido)
      const dataURL = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.5,
        multiplier: 0.5, // Mitad de tamaño
      })

      // 2. Convertir a archivo y subir
      const file = dataURLtoFile(dataURL, 'thumbnail.jpg')
      const { url: thumbnailUrl } = await uploadApi.uploadFile(file, 'whiteboard-thumbs')
      
      // 3. Guardar en backend
      await whiteboardApi.update(id as string, { content: json, thumbnail: thumbnailUrl })
      
      toast.success('¡Cambios guardados!', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar cambios', { id: toastId })
    }
  }

  const handleExport = () => {
    if (!fabricCanvas) return
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    })
    const link = document.createElement('a')
    link.download = `${boardTitle || 'tablero'}.png`
    link.href = dataURL
    link.click()
    toast.success('Tablero exportado como PNG')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvas) return

    const toastId = toast.loading("Subiendo imagen...")

    try {
      const response = await uploadApi.uploadFile(file, 'whiteboard')
      // Use proxy to avoid CORS issues when saving canvas
      const proxyUrl = uploadApi.getProxyUrl(response.url)
      const fabricImage = await FabricImage.fromURL(proxyUrl, { crossOrigin: 'anonymous' })
      
      fabricImage.set({
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
      })
      
      fabricCanvas.add(fabricImage)
      fabricCanvas.setActiveObject(fabricImage)
      fabricCanvas.renderAll()
      
      toast.success('Imagen añadida al tablero', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Error al subir imagen', { id: toastId })
    }
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-7xl mx-auto px-1 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" onClick={() => router.push('/board')}>
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate max-w-[200px] sm:max-w-[300px]">
                  {boardTitle || 'Editando Tablero'}
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleUndo} title="Deshacer">
                <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleDeleteSelected} title="Eliminar seleccionado">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleClear} title="Limpiar todo">
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />
              <Button variant="outline" className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3" onClick={handleSave}>
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Guardar</span>
              </Button>
              <Button variant="outline" className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>

          {/* Tools & Canvas */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Toolbar */}
            <Card className="shadow-card p-2 sm:p-3 h-fit w-full lg:w-auto">
              <div className="space-y-3 sm:space-y-2">
                {/* Tools Grid - Horizontal en móvil, Vertical en desktop */}
                <div className="grid grid-cols-7 lg:grid-cols-1 gap-1.5 sm:gap-2 lg:space-y-0">
                <Button
                  variant={activeTool === 'select' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => setActiveTool('select')}
                  title="Seleccionar (Mover objetos)"
                >
                  <MousePointer2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => setActiveTool('draw')}
                  title="Lápiz"
                >
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'eraser' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => setActiveTool('eraser')}
                  title="Borrador"
                >
                  <Eraser className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'text' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => handleToolClick('text')}
                  title="Texto"
                >
                  <Type className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'rectangle' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => handleToolClick('rectangle')}
                  title="Rectángulo"
                >
                  <Square className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'circle' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => handleToolClick('circle')}
                  title="Círculo"
                >
                  <Circle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={activeTool === 'circle' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-full hover:bg-accent h-9 sm:h-10 lg:h-10"
                  onClick={() => fileInputRef.current?.click()}
                  title="Subir Imagen"
                >
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                </div>
                
                <Separator className="my-2 lg:my-2" />

                {/* Stroke Width */}
                <div className="space-y-2 px-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Grosor</label>
                  <div className="flex gap-1.5 sm:gap-1">
                    {[2, 4, 6, 10].map((width) => (
                      <button
                        key={width}
                        onClick={() => setStrokeWidth(width)}
                        className={`flex-1 h-7 sm:h-6 rounded flex items-center justify-center hover:bg-accent transition-colors ${strokeWidth === width ? 'bg-accent' : ''}`}
                        title={`Grosor ${width}px`}
                      >
                        <div 
                          className="bg-foreground rounded-full" 
                          style={{ width: Math.min(width + 2, 14), height: Math.min(width + 2, 14) }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-2 lg:my-2" />
                
                {/* Color Picker */}
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-1.5">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setActiveColor(color.value)}
                        className={`w-full aspect-square rounded border-2 transition-all ${
                          activeColor === color.value ? 'border-foreground scale-110 ring-1 ring-offset-1 ring-foreground' : 'border-border'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 pt-1">
                      <label className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">Personalizado:</label>
                      <input 
                          type="color" 
                          value={activeColor}
                          onChange={(e) => setActiveColor(e.target.value)}
                          className="h-7 sm:h-6 w-full sm:flex-1 cursor-pointer rounded border border-border p-0"
                      />
                  </div>
                </div>
              </div>
            </Card>

            {/* Canvas */}
            <Card className="flex-1 shadow-card p-2 sm:p-3 md:p-6 bg-muted/30 overflow-auto min-h-[400px] sm:min-h-[500px]">
              <div className="overflow-auto h-full w-full">
                <canvas ref={canvasRef} className="border border-border rounded-lg shadow-sm max-w-full block mx-auto" />
              </div>
            </Card>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </Layout>
    </AuthGuard>
  )
}
