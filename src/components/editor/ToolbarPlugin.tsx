import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Image as ImageIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { $patchStyleText } from '@lexical/selection';
import { INSERT_IMAGE_COMMAND } from './plugins/ImagesPlugin';
import { INSERT_CODE_BLOCK_COMMAND, CODE_LANGUAGES } from './plugins/CodeBlockPlugin';
import { FORMAT_HEADING_COMMAND, FORMAT_QUOTE_COMMAND, FORMAT_PARAGRAPH_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from './plugins/FormatPlugin';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { uploadApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function Divider() {
  return <div className="divider" />;
}

const HIGHLIGHT_COLORS = [
  { name: 'Amarillo', value: '#FEF08A', className: 'bg-yellow-200' },
  { name: 'Verde', value: '#BBF7D0', className: 'bg-green-200' },
  { name: 'Azul', value: '#BFDBFE', className: 'bg-blue-200' },
  { name: 'Rosa', value: '#FBCFE8', className: 'bg-pink-200' },
  { name: 'Naranja', value: '#FED7AA', className: 'bg-orange-200' },
  { name: 'Morado', value: '#E9D5FF', className: 'bg-purple-200' },
  { name: 'Rojo', value: '#FECACA', className: 'bg-red-200' },
  { name: 'Gris', value: '#E5E7EB', className: 'bg-gray-200' },
  { name: 'Sin color', value: 'transparent', className: 'bg-transparent border-2 border-gray-300' },
];

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<string>('transparent');
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [codeLanguageOpen, setCodeLanguageOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Get current background color from selection
      const nodes = selection.getNodes();
      let foundColor = 'transparent';
      for (const node of nodes) {
        if ('getStyle' in node && typeof node.getStyle === 'function') {
          const style = node.getStyle();
          const bgColorMatch = style.match(/background-color:\s*([^;]+)/);
          if (bgColorMatch) {
            foundColor = bgColorMatch[1].trim();
            break;
          }
        }
      }
      setCurrentHighlight(foundColor);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor }
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $updateToolbar]);

  const applyHighlight = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          'background-color': color === 'transparent' ? '' : color,
        });
      }
      setHighlightOpen(false);
    });
  }, [editor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file) {
      try {
        const toastId = toast.loading('Subiendo imagen...');
        const uploadResponse = await uploadApi.uploadFile(file, 'notes');

        toast.dismiss(toastId);
        toast.success('Imagen insertada');

        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          altText: file.name,
          src: uploadResponse.url,
          maxWidth: 500,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Error al subir la imagen');
      }
    }

    // Reset inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertLink = useCallback(() => {
    if (linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      setLinkDialogOpen(false);
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }, [editor]);

  return (
    <>
      <div className="toolbar" ref={toolbarRef}>
        {/* Undo/Redo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          className="toolbar-item spaced"
          aria-label="Undo"
          title="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          className="toolbar-item"
          aria-label="Redo"
          title="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <Divider />

        {/* Headings */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_HEADING_COMMAND, 'h1');
          }}
          className="toolbar-item spaced"
          aria-label="Heading 1"
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_HEADING_COMMAND, 'h2');
          }}
          className="toolbar-item spaced"
          aria-label="Heading 2"
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_HEADING_COMMAND, 'h3');
          }}
          className="toolbar-item"
          aria-label="Heading 3"
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <Divider />

        {/* Text formatting */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
          aria-label="Format Bold"
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
          aria-label="Format Italics"
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
          aria-label="Format Underline"
          title="Subrayado"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={'toolbar-item spaced ' + (isStrikethrough ? 'active' : '')}
          aria-label="Format Strikethrough"
          title="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <Divider />

        {/* Highlight */}
        <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`toolbar-item spaced ${currentHighlight !== 'transparent' ? 'active' : ''}`}
              aria-label="Highlight"
              title="Resaltar texto"
              style={currentHighlight !== 'transparent' ? {
                backgroundColor: currentHighlight,
              } : undefined}
            >
              <Highlighter className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-3 gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyHighlight(color.value);
                  }}
                  className={`
                    h-8 w-full rounded border-2 transition-all
                    ${color.className}
                    ${currentHighlight === color.value ||
                      (color.value === 'transparent' && currentHighlight === 'transparent')
                      ? 'ring-2 ring-offset-2 ring-primary scale-105'
                      : 'hover:scale-105 border-transparent'
                    }
                  `}
                  title={color.name}
                  aria-label={color.name}
                >
                  {color.value === 'transparent' && (
                    <span className="text-xs text-muted-foreground">Sin color</span>
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Link */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLinkDialogOpen(true);
          }}
          className="toolbar-item spaced"
          aria-label="Insert Link"
          title="Insertar enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeLink();
          }}
          className="toolbar-item"
          aria-label="Remove Link"
          title="Quitar enlace"
        >
          <Unlink className="h-4 w-4" />
        </button>
        <Divider />

        {/* Lists */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          }}
          className="toolbar-item spaced"
          aria-label="Bullet List"
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }}
          className="toolbar-item spaced"
          aria-label="Numbered List"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_QUOTE_COMMAND, undefined);
          }}
          className="toolbar-item"
          aria-label="Quote"
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </button>
        <Divider />

        {/* Code Block */}
        <Popover open={codeLanguageOpen} onOpenChange={setCodeLanguageOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="toolbar-item spaced"
              aria-label="Code Block"
              title="Bloque de código"
            >
              <Code className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, lang.value);
                    setCodeLanguageOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="toolbar-item spaced"
          aria-label="Insert Image"
          title="Insertar imagen"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          type="file"
          className="hidden"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={(e) => handleImageUpload(e.target.files)}
          accept="image/*"
          aria-hidden="true"
        />
        <Divider />

        {/* Alignment */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          }}
          className="toolbar-item spaced"
          aria-label="Left Align"
          title="Alinear izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          }}
          className="toolbar-item spaced"
          aria-label="Center Align"
          title="Alinear centro"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          }}
          className="toolbar-item spaced"
          aria-label="Right Align"
          title="Alinear derecha"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          }}
          className="toolbar-item"
          aria-label="Justify Align"
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar enlace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://ejemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    insertLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={insertLink} disabled={!linkUrl}>
              Insertar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

