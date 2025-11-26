'use client'

import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
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
  Redo2,
  Save,
  Download,
  ArrowLeft
} from "lucide-react"
import { Canvas as FabricCanvas, Circle as FabricCircle, Rect, IText, PencilBrush, Image as FabricImage } from "fabric"
import { toast } from "sonner"
import Link from "next/link"

type Tool = 'select' | 'draw' | 'text' | 'rectangle' | 'circle'
type Color = '#6366F1' | '#22C55E' | '#EF4444' | '#000000'

const COLORS: { value: Color; label: string }[] = [
  { value: '#6366F1', label: 'Primario' },
  { value: '#22C55E', label: 'Secundario' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#000000', label: 'Negro' },
]

export default function BoardDetail() {
  const params = useParams()
  const boardId = params.id as string
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('draw')
  const [activeColor, setActiveColor] = useState<Color>('#6366F1')
  const [boardTitle, setBoardTitle] = useState(`Tablero ${boardId}`)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Calcular dimensiones responsivas
    const containerWidth = Math.min(1200, window.innerWidth - 200)
    const containerHeight = Math.min(700, window.innerHeight - 200)

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
    
    // Cargar tablero guardado si existe
    loadBoard(boardId, canvas)
    
    toast.success('¡Tablero listo para dibujar!')

    return () => {
      canvas.dispose()
    }
  }, [boardId])

  useEffect(() => {
    if (!fabricCanvas) return

    fabricCanvas.isDrawingMode = activeTool === 'draw'
    
    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor
      fabricCanvas.freeDrawingBrush.width = 3
    }
  }, [activeTool, activeColor, fabricCanvas])

  const loadBoard = (id: string, canvas: FabricCanvas) => {
    const savedBoard = localStorage.getItem(`nexoscribe-board-${id}`)
    if (savedBoard) {
      try {
        const boardData = JSON.parse(savedBoard)
        canvas.loadFromJSON(boardData, () => {
          canvas.renderAll()
          toast.info('Tablero cargado')
        })
      } catch (error) {
        console.error('Error loading board:', error)
      }
    }
  }

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
    fabricCanvas.backgroundColor = '#ffffff'
    fabricCanvas.renderAll()
    toast.info('Tablero limpiado')
  }

  const handleSave = () => {
    if (!fabricCanvas) return
    const json = fabricCanvas.toJSON()
    localStorage.setItem(`nexoscribe-board-${boardId}`, JSON.stringify(json))
    toast.success('¡Tablero guardado!')
  }

  const handleExport = () => {
    if (!fabricCanvas) return
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    })
    const link = document.createElement('a')
    link.download = `nexoscribe-board-${boardId}.png`
    link.href = dataURL
    link.click()
    toast.success('Tablero exportado como PNG')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvas) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string
      const imgElement = new Image()
      imgElement.src = imgUrl
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement, {
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        })
        fabricCanvas.add(fabricImage)
        fabricCanvas.renderAll()
        toast.success('Imagen añadida al tablero')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Link href="/board">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">{boardTitle}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={handleUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleClear}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <Button variant="outline" className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Tools & Canvas */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Toolbar */}
          <Card className="shadow-card p-3 h-fit w-full lg:w-auto">
            <div className="space-y-2">
              <Button
                variant={activeTool === 'select' ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => setActiveTool('select')}
                title="Seleccionar"
              >
                <Pencil className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => setActiveTool('draw')}
                title="Lápiz"
              >
                <Pencil className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTool === 'text' ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => handleToolClick('text')}
                title="Texto"
              >
                <Type className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTool === 'rectangle' ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => handleToolClick('rectangle')}
                title="Rectángulo"
              >
                <Square className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTool === 'circle' ? 'secondary' : 'ghost'}
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => handleToolClick('circle')}
                title="Círculo"
              >
                <Circle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-full hover:bg-accent"
                onClick={() => fileInputRef.current?.click()}
                title="Subir Imagen"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <Separator className="my-2" />
              
              {/* Color Picker */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setActiveColor(color.value)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        activeColor === color.value ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Canvas */}
          <Card className="flex-1 shadow-card p-3 sm:p-6 bg-muted/30 overflow-auto">
            <div className="overflow-auto">
              <canvas ref={canvasRef} className="border border-border rounded-lg shadow-sm max-w-full" />
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
  )
}
