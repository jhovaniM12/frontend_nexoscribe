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
} from 'lucide-react';
import { $patchStyleText } from '@lexical/selection';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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
        (_payload, _newEditor) => {
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

  return (
    <div className="toolbar" ref={toolbarRef}>
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
                  ${
                    currentHighlight === color.value || 
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
      <Divider />
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
  );
}
