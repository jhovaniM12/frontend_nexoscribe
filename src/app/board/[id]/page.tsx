'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { 
  Pencil, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon,
  Undo2,
  Redo2,
  Eraser,
  MousePointer2,
  Save,
  Download,
  ArrowLeft,
  Share2,
  Palette,
  Trash2
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Canvas as FabricCanvas, Rect, IText, Line, PencilBrush, Image as FabricImage, Group, Ellipse, type FabricObject } from "fabric"
import { toast } from "sonner"
import { uploadApi, whiteboardApi } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"

type Tool = 'select' | 'draw' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow'
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

const ARROW_HEAD_LENGTH = 14
const ARROW_HEAD_ANGLE = (25 * Math.PI) / 180

function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: { stroke: string; strokeWidth: number; strokeDashArray?: number[] }
) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const lineEndX = x2 - ARROW_HEAD_LENGTH * cos
  const lineEndY = y2 - ARROW_HEAD_LENGTH * sin
  const line = new Line([x1, y1, lineEndX, lineEndY], {
    stroke: opts.stroke,
    strokeWidth: opts.strokeWidth,
    strokeDashArray: opts.strokeDashArray,
  })
  const tipX = x2
  const tipY = y2
  const leftX = x2 - ARROW_HEAD_LENGTH * Math.cos(angle + ARROW_HEAD_ANGLE)
  const leftY = y2 - ARROW_HEAD_LENGTH * Math.sin(angle + ARROW_HEAD_ANGLE)
  const rightX = x2 - ARROW_HEAD_LENGTH * Math.cos(angle - ARROW_HEAD_ANGLE)
  const rightY = y2 - ARROW_HEAD_LENGTH * Math.sin(angle - ARROW_HEAD_ANGLE)
  const headOpts = {
    stroke: opts.stroke,
    strokeWidth: opts.strokeWidth,
    strokeDashArray: opts.strokeDashArray,
  }
  const legLeft = new Line([tipX, tipY, leftX, leftY], headOpts)
  const legRight = new Line([tipX, tipY, rightX, rightY], headOpts)
  const group = new Group([line, legLeft, legRight], { hasBorders: false, hasControls: true })
  return group
}

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerRect, setContainerRect] = useState({ w: 0, h: 0 })
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('draw')
  const [activeColor, setActiveColor] = useState<Color>('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [shapeFill, setShapeFill] = useState<'none' | 'solid'>('solid')
  const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid')
  const [roundedCorners, setRoundedCorners] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const strokeDashArray = useMemo(
    () => (strokeStyle === 'solid' ? undefined : strokeStyle === 'dashed' ? [10, 5] : [2, 4]),
    [strokeStyle]
  )
  const [boardTitle, setBoardTitle] = useState("")
  const [redoStack, setRedoStack] = useState<Record<string, unknown>[]>([])

  const drawStartRef = useRef<{ x: number; y: number } | null>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const lastCanvasPointerRef = useRef<{ x: number; y: number } | null>(null)
  const shiftKeyRef = useRef(false)
  const previewRef = useRef<FabricObject | null>(null)
  const drawStyleRef = useRef({ activeColor, strokeWidth, shapeFill, strokeDashArray, roundedCorners })
  drawStyleRef.current = { activeColor, strokeWidth, shapeFill, strokeDashArray, roundedCorners }

  // ResizeObserver: medir contenedor del canvas para tamaño dinámico
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerRect({ w: width, h: height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Crear o redimensionar canvas cuando hay dimensiones y id
  useEffect(() => {
    if (!id || !canvasRef.current || containerRect.w <= 0 || containerRect.h <= 0) return

    const loadBoard = async (canvas: FabricCanvas) => {
      try {
        const { whiteboard } = await whiteboardApi.getById(id as string)
        setBoardTitle(whiteboard.title)
        const isValidContent =
          whiteboard?.content &&
          typeof whiteboard.content === 'object' &&
          Array.isArray((whiteboard.content as { objects?: unknown[] }).objects) &&
          (whiteboard.content as { objects: unknown[] }).objects.length > 0
        if (isValidContent) {
          try {
            const contentToLoad = JSON.parse(JSON.stringify(whiteboard.content))
            await canvas.loadFromJSON(contentToLoad as Record<string, unknown>)
            canvas.requestRenderAll()
            toast.success('Tablero cargado')
          } catch {
            console.warn('No se pudo restaurar el tablero; se inicia lienzo limpio.')
          }
        }
      } catch (error) {
        console.error('Error loading board:', error)
        toast.error('Error al cargar el tablero')
      }
    }

    if (!fabricCanvas) {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: containerRect.w,
        height: containerRect.h,
        backgroundColor: 'transparent',
      })
      const brush = new PencilBrush(canvas)
      brush.color = activeColor
      brush.width = strokeWidth
      canvas.freeDrawingBrush = brush
      setFabricCanvas(canvas)
      loadBoard(canvas)
      return () => {
        canvas.dispose()
        setFabricCanvas(null)
      }
    }

    fabricCanvas.setDimensions({ width: containerRect.w, height: containerRect.h })
    fabricCanvas.requestRenderAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fabricCanvas set in same effect, omit to avoid recreate on brush change
  }, [id, containerRect.w, containerRect.h])

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
    const canvas = fabricCanvas
    const el = containerRef.current
    if (!canvas || !el) return
    const onMove = (e: MouseEvent) => {
      const p = canvas.getPointer(e)
      if (p) lastCanvasPointerRef.current = { x: p.x, y: p.y }
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [fabricCanvas])

  useEffect(() => {
    if (!fabricCanvas) return

    if (activeTool === 'draw' || activeTool === 'eraser') {
        fabricCanvas.isDrawingMode = true
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : activeColor
            fabricCanvas.freeDrawingBrush.width = activeTool === 'eraser' ? 20 : strokeWidth
        }
    } else {
        fabricCanvas.isDrawingMode = false
    }
  }, [activeTool, activeColor, strokeWidth, fabricCanvas])

  // Dibujo por arrastre tipo Excalidraw: rect, circle, arrow
  useEffect(() => {
    const canvas = fabricCanvas
    if (!canvas) return
    const shapeTools: Tool[] = ['rectangle', 'circle', 'arrow']
    if (!shapeTools.includes(activeTool)) return

    const removePreview = () => {
      if (previewRef.current) {
        canvas.remove(previewRef.current)
        previewRef.current = null
        canvas.requestRenderAll()
      }
    }

    const onDown = (opt: { e: MouseEvent | TouchEvent; target?: FabricObject | null }) => {
      if (opt.target) return
      const pointer = canvas.getPointer(opt.e as MouseEvent)
      if (!pointer) return
      drawStartRef.current = { x: pointer.x, y: pointer.y }
    }

    const onMove = (opt: { e: MouseEvent | TouchEvent }) => {
      if (!drawStartRef.current) return
      const pointer = canvas.getPointer(opt.e as MouseEvent)
      if (!pointer) return
      shiftKeyRef.current = 'shiftKey' in opt.e ? opt.e.shiftKey : false
      lastPointerRef.current = { x: pointer.x, y: pointer.y }
      const start = drawStartRef.current
      const style = drawStyleRef.current
      const minSize = 4
      const w = pointer.x - start.x
      const h = pointer.y - start.y
      const left = Math.min(start.x, pointer.x)
      const top = Math.min(start.y, pointer.y)
      const width = Math.max(minSize, Math.abs(w))
      const height = Math.max(minSize, Math.abs(h))

      const ellipseRadius = (rx: number, ry: number, forceCircle: boolean) => {
        if (forceCircle) {
          const r = Math.min(rx, ry)
          return { rx: r, ry: r }
        }
        return { rx, ry }
      }

      if (!previewRef.current) {
        if (activeTool === 'rectangle') {
          const rect = new Rect({
            left,
            top,
            width,
            height,
            fill: 'transparent',
            stroke: style.activeColor,
            strokeWidth: 2,
            strokeDashArray: [4, 4],
            ...(style.roundedCorners ? { rx: 8, ry: 8 } : {}),
          })
          rect.selectable = false
          canvas.add(rect)
          previewRef.current = rect
        } else if (activeTool === 'circle') {
          const cx = (start.x + pointer.x) / 2
          const cy = (start.y + pointer.y) / 2
          const rx = Math.max(minSize / 2, Math.abs(pointer.x - start.x) / 2)
          const ry = Math.max(minSize / 2, Math.abs(pointer.y - start.y) / 2)
          const { rx: rxa, ry: rya } = ellipseRadius(rx, ry, shiftKeyRef.current)
          const ellipse = new Ellipse({
            left: cx,
            top: cy,
            rx: rxa,
            ry: rya,
            fill: 'transparent',
            stroke: style.activeColor,
            strokeWidth: 2,
            strokeDashArray: [4, 4],
          })
          ellipse.selectable = false
          canvas.add(ellipse)
          previewRef.current = ellipse
        } else {
          const arrow = createArrow(start.x, start.y, pointer.x, pointer.y, {
            stroke: style.activeColor,
            strokeWidth: style.strokeWidth || 2,
            strokeDashArray: style.strokeDashArray,
          })
          arrow.selectable = false
          canvas.add(arrow)
          previewRef.current = arrow
        }
        canvas.requestRenderAll()
        return
      }

      const obj = previewRef.current
      if (activeTool === 'rectangle' && obj.type === 'rect') {
        obj.set({ left, top, width, height })
      } else if (activeTool === 'circle' && obj.type === 'ellipse') {
        const cx = (start.x + pointer.x) / 2
        const cy = (start.y + pointer.y) / 2
        const rx = Math.max(minSize / 2, Math.abs(pointer.x - start.x) / 2)
        const ry = Math.max(minSize / 2, Math.abs(pointer.y - start.y) / 2)
        const { rx: rxa, ry: rya } = ellipseRadius(rx, ry, shiftKeyRef.current)
        obj.set({ left: cx, top: cy, rx: rxa, ry: rya })
      } else if (activeTool === 'arrow' && obj.type === 'group') {
        canvas.remove(obj)
        const arrow = createArrow(start.x, start.y, pointer.x, pointer.y, {
          stroke: style.activeColor,
          strokeWidth: style.strokeWidth || 2,
          strokeDashArray: style.strokeDashArray,
        })
        arrow.selectable = false
        canvas.add(arrow)
        previewRef.current = arrow
      }
      canvas.requestRenderAll()
    }

    const MIN_DRAG_DISTANCE = 8

    const onUp = () => {
      if (!drawStartRef.current) return
      const start = drawStartRef.current
      const end = lastPointerRef.current ?? start
      lastPointerRef.current = null
      const style = drawStyleRef.current
      removePreview()
      const dragDistance = Math.hypot(end.x - start.x, end.y - start.y)
      if (dragDistance < MIN_DRAG_DISTANCE) {
        drawStartRef.current = null
        return
      }
      const minSize = 4
      const w = end.x - start.x
      const h = end.y - start.y
      const left = Math.min(start.x, end.x)
      const top = Math.min(start.y, end.y)
      const width = Math.max(minSize, Math.abs(w))
      const height = Math.max(minSize, Math.abs(h))

      if (activeTool === 'rectangle') {
        const rect = new Rect({
          left,
          top,
          width,
          height,
          fill: style.shapeFill === 'solid' ? style.activeColor : 'transparent',
          stroke: style.activeColor,
          strokeWidth: 2,
          strokeDashArray: style.strokeDashArray ?? undefined,
          ...(style.roundedCorners ? { rx: 12, ry: 12 } : {}),
        })
        canvas.add(rect)
        canvas.setActiveObject(rect)
        toast.success('Rectángulo añadido')
      } else if (activeTool === 'circle') {
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        const rx = Math.max(minSize / 2, Math.abs(end.x - start.x) / 2)
        const ry = Math.max(minSize / 2, Math.abs(end.y - start.y) / 2)
        const forceCircle = shiftKeyRef.current
        const { rx: rxa, ry: rya } = forceCircle
          ? { rx: Math.min(rx, ry), ry: Math.min(rx, ry) }
          : { rx, ry }
        const ellipse = new Ellipse({
          left: cx,
          top: cy,
          rx: rxa,
          ry: rya,
          fill: style.shapeFill === 'solid' ? style.activeColor : 'transparent',
          stroke: style.activeColor,
          strokeWidth: 3,
          strokeDashArray: style.strokeDashArray ?? undefined,
        })
        canvas.add(ellipse)
        canvas.setActiveObject(ellipse)
        toast.success(forceCircle ? 'Círculo añadido' : 'Elipse añadida')
      } else {
        const arrow = createArrow(start.x, start.y, end.x, end.y, {
          stroke: style.activeColor,
          strokeWidth: style.strokeWidth || 2,
          strokeDashArray: style.strokeDashArray,
        })
        canvas.add(arrow)
        canvas.setActiveObject(arrow)
        toast.success('Flecha añadida')
      }
      canvas.requestRenderAll()
      setRedoStack([])
      drawStartRef.current = null
    }

    canvas.on('mouse:down', onDown)
    canvas.on('mouse:move', onMove)
    canvas.on('mouse:up', onUp)
    return () => {
      canvas.off('mouse:down', onDown)
      canvas.off('mouse:move', onMove)
      canvas.off('mouse:up', onUp)
      drawStartRef.current = null
      removePreview()
    }
  }, [activeTool, fabricCanvas])

  // Aplicar estilo actual al objeto seleccionado (rect, circle, line, arrow group)
  useEffect(() => {
    if (!fabricCanvas) return
    const obj = fabricCanvas.getActiveObject()
    if (!obj || Array.isArray(obj)) return
    const fill = shapeFill === 'solid' ? activeColor : 'transparent'
    const dash = strokeDashArray ?? undefined
    if (obj.type === 'rect') {
      obj.set({ fill, stroke: activeColor, strokeDashArray: dash, ...(roundedCorners ? { rx: 12, ry: 12 } : { rx: 0, ry: 0 }) })
    } else if (obj.type === 'circle' || obj.type === 'ellipse') {
      obj.set({ fill, stroke: activeColor, strokeDashArray: dash })
    } else if (obj.type === 'line') {
      obj.set({ stroke: activeColor, strokeDashArray: dash })
    } else if (obj.type === 'group') {
      const group = obj as unknown as { getObjects: () => FabricObject[] }
      const children = group.getObjects?.() ?? []
      children.forEach((child: FabricObject) => {
        if (child.type === 'line') child.set({ stroke: activeColor, strokeDashArray: dash })
      })
    } else {
      return
    }
    fabricCanvas.requestRenderAll()
  }, [shapeFill, strokeStyle, roundedCorners, activeColor, fabricCanvas, strokeDashArray])

  // Limpiar pila de rehacer al dibujar (path:created)
  useEffect(() => {
    if (!fabricCanvas) return
    const clearRedo = () => setRedoStack([])
    fabricCanvas.on('path:created', clearRedo)
    return () => { fabricCanvas.off('path:created', clearRedo) }
  }, [fabricCanvas])

  const handleToolClick = useCallback(
    (tool: Tool, position?: { x: number; y: number }) => {
      setActiveTool(tool)
      if (!fabricCanvas) return
      if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow') {
        toast.info('Arrastra en el lienzo para dibujar')
        return
      }
      if (tool === 'text') {
        const pos = position ?? lastCanvasPointerRef.current ?? { x: 100, y: 100 }
        const text = new IText('Escribe aquí...', {
          left: pos.x,
          top: pos.y,
          fill: activeColor,
          fontSize: 24,
          fontFamily: 'Inter, sans-serif',
        })
        fabricCanvas.add(text)
        fabricCanvas.setActiveObject(text)
        fabricCanvas.renderAll()
        toast.success('Texto añadido - haz doble clic para editar')
        setRedoStack([])
      }
    },
    [fabricCanvas, activeColor]
  )

  useEffect(() => {
    if (!fabricCanvas) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.target as HTMLElement)?.isContentEditable) return
      if (e.ctrlKey || e.metaKey) return

      const key = e.key.toLowerCase()
      const toolByKey: Record<string, Tool> = {
        v: 'select',
        p: 'draw',
        t: 'text',
        r: 'rectangle',
        c: 'circle',
        a: 'arrow',
        e: 'eraser',
      }
      const tool = toolByKey[key]
      if (tool) {
        e.preventDefault()
        if (tool === 'text') {
          handleToolClick('text', lastCanvasPointerRef.current ?? undefined)
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow') {
          handleToolClick(tool)
        } else {
          setActiveTool(tool)
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvas.getActiveObject()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (activeObject && (activeObject as any).isEditing) return
        handleDeleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fabricCanvas, handleDeleteSelected, handleToolClick])

  const handleUndo = () => {
    if (!fabricCanvas) return
    const objects = fabricCanvas.getObjects()
    if (objects.length > 0) {
      const last = objects[objects.length - 1]
      setRedoStack(prev => [...prev, last.toJSON() as Record<string, unknown>])
      fabricCanvas.remove(last)
      fabricCanvas.renderAll()
      toast.info('Deshacer')
    }
  }

  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) return
    const json = redoStack[redoStack.length - 1]
    const current = fabricCanvas.toJSON() as { version?: string; objects?: Record<string, unknown>[] }
    const nextObjects = [...(current.objects || []), json]
    fabricCanvas.loadFromJSON({ ...current, objects: nextObjects } as Record<string, unknown>, () => {
      fabricCanvas.requestRenderAll()
    })
    setRedoStack(prev => prev.slice(0, -1))
    toast.info('Rehacer')
  }

  const handleClear = () => {
    if (!fabricCanvas) return
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = 'transparent'
    fabricCanvas.renderAll()
    setRedoStack([])
    toast.info('Tablero limpiado')
  }

  const handleSave = async () => {
    const validId = typeof id === 'string' && id && id !== 'undefined'
    if (!fabricCanvas || !validId) {
      if (!validId) toast.error('No se puede guardar: ID del tablero no válido. Vuelve a la lista de pizarras.')
      return
    }

    const toastId = toast.loading("Guardando tablero...")

    try {
      const json = fabricCanvas.toJSON()
      const prevBg = fabricCanvas.backgroundColor
      fabricCanvas.backgroundColor = '#ffffff'
      fabricCanvas.requestRenderAll()
      // 1. Generar miniatura (baja calidad para que sea rápido)
      const dataURL = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.5,
        multiplier: 0.5,
      })
      fabricCanvas.backgroundColor = prevBg
      fabricCanvas.requestRenderAll()

      // 2. Convertir a archivo y subir
      const file = dataURLtoFile(dataURL, 'thumbnail.jpg')
      const { url: thumbnailUrl } = await uploadApi.uploadFile(file, 'whiteboard-thumbs')
      
      // 3. Guardar en backend
      await whiteboardApi.update(id, { content: json, thumbnail: thumbnailUrl })
      
      toast.success('¡Cambios guardados!', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar cambios', { id: toastId })
    }
  }

  const handleExport = () => {
    if (!fabricCanvas) return
    const prevBg = fabricCanvas.backgroundColor
    fabricCanvas.backgroundColor = '#ffffff'
    fabricCanvas.requestRenderAll()
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    })
    fabricCanvas.backgroundColor = prevBg
    fabricCanvas.requestRenderAll()
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
      const proxyUrl = uploadApi.getProxyUrl(response.url)
      const res = await fetch(proxyUrl, { credentials: 'include' })
      if (!res.ok) throw new Error('No se pudo cargar la imagen')
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Error al leer la imagen'))
        reader.readAsDataURL(blob)
      })
      const fabricImage = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })

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
      <Layout fullWidth>
        <div className="flex flex-col h-full w-full min-h-0">
          {/* Top bar: volver + título | Undo, Redo, Share, Export, Guardar */}
          <header className="flex-shrink-0 h-12 flex items-center justify-between gap-2 px-3 border-b bg-background">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => router.push('/board')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-base font-semibold truncate max-w-[180px] sm:max-w-xs">
                {boardTitle || 'Editando Tablero'}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleUndo} title="Deshacer">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRedo} disabled={redoStack.length === 0} title="Rehacer">
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toast.info('Compartir próximamente')} title="Compartir">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExport} title="Exportar">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.confirm('¿Borrar todo el contenido del tablero?') && handleClear()} title="Limpiar tablero">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" className="h-9 gap-1.5" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </header>

          {/* Cuerpo: toolbar + canvas */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Toolbar vertical (referencia) */}
            <aside className="flex-shrink-0 w-14 flex flex-col items-center py-2 gap-1 border-r bg-muted/30">
              <Button variant={activeTool === 'select' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => setActiveTool('select')} title="Seleccionar (V)">
                <MousePointer2 className="h-5 w-5" />
              </Button>
              <Button variant={activeTool === 'draw' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => setActiveTool('draw')} title="Lápiz (P)">
                <Pencil className="h-5 w-5" />
              </Button>
              <Button variant={activeTool === 'text' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => handleToolClick('text')} title="Texto (T)">
                <Type className="h-5 w-5" />
              </Button>
              <Button variant={activeTool === 'rectangle' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => handleToolClick('rectangle')} title="Rectángulo (R)">
                <Square className="h-5 w-5" />
              </Button>
              <Button variant={activeTool === 'circle' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => handleToolClick('circle')} title="Círculo / Elipse (C) (Shift = círculo perfecto)">
                <Circle className="h-5 w-5" />
              </Button>
              <Button variant={activeTool === 'arrow' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => handleToolClick('arrow')} title="Flecha (A)">
                <ArrowLeft className="h-5 w-5 rotate-[-45deg]" />
              </Button>
              <Button variant={activeTool === 'eraser' ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10" onClick={() => setActiveTool('eraser')} title="Borrador (E)">
                <Eraser className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-h-2" />
              {/* Color principal + secundario */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full border-2 border-border shadow-inner" style={{ backgroundColor: activeColor }} title="Color actual" />
                <div className="grid grid-cols-2 gap-0.5">
                  {COLORS.slice(0, 4).map((c) => (
                    <button key={c.value} className={`w-4 h-4 rounded border ${activeColor === c.value ? 'border-foreground ring-1' : 'border-border'}`} style={{ backgroundColor: c.value }} onClick={() => setActiveColor(c.value)} title={c.label} />
                  ))}
                </div>
              </div>
              {/* Grosor */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">Grosor</span>
                <div className="flex flex-col gap-0.5">
                  {[2, 4, 6].map((w) => (
                    <button key={w} className={`w-6 h-2 rounded ${strokeWidth === w ? 'bg-primary' : 'bg-muted-foreground/30'}`} onClick={() => setStrokeWidth(w)} title={`${w}px`} />
                  ))}
                </div>
              </div>
              {/* Estilo (relleno, trazo, esquinas) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10" title="Estilo de forma">
                    <Palette className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start" side="right">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Relleno</p>
                      <div className="flex gap-1">
                        <Button variant={shapeFill === 'none' ? 'secondary' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setShapeFill('none')}>Sin relleno</Button>
                        <Button variant={shapeFill === 'solid' ? 'secondary' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setShapeFill('solid')}>Con relleno</Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Trazo</p>
                      <div className="flex gap-1 flex-wrap">
                        <Button variant={strokeStyle === 'solid' ? 'secondary' : 'outline'} size="sm" className="text-xs" onClick={() => setStrokeStyle('solid')}>Sólido</Button>
                        <Button variant={strokeStyle === 'dashed' ? 'secondary' : 'outline'} size="sm" className="text-xs" onClick={() => setStrokeStyle('dashed')}>Discontinuo</Button>
                        <Button variant={strokeStyle === 'dotted' ? 'secondary' : 'outline'} size="sm" className="text-xs" onClick={() => setStrokeStyle('dotted')}>Punteado</Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Esquinas (rectángulos)</p>
                      <div className="flex gap-1">
                        <Button variant={!roundedCorners ? 'secondary' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setRoundedCorners(false)}>Rectas</Button>
                        <Button variant={roundedCorners ? 'secondary' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setRoundedCorners(true)}>Redondeadas</Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </aside>

            {/* Canvas con grid punteado */}
            <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden relative bg-[#fafafa]" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            </div>

            {/* Botón flotante imagen */}
            <Button variant="secondary" size="icon" className="absolute bottom-4 left-20 h-12 w-12 rounded-full shadow-lg z-10" onClick={() => fileInputRef.current?.click()} title="Subir imagen">
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
      </Layout>
    </AuthGuard>
  )
}
