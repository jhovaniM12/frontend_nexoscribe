'use client'

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {
  ParagraphNode,
  TextNode,
  EditorState,
} from 'lexical';
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';

import ExampleTheme from './Theme';
import ToolbarPlugin from './ToolbarPlugin';
import { ImageNode } from './nodes/ImageNode';
import ImagesPlugin from './plugins/ImagesPlugin';
import CodeBlockPlugin from './plugins/CodeBlockPlugin';
import FormatPlugin from './plugins/FormatPlugin';
import './editor.css';

const placeholder = 'Enter some rich text...';

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}


interface LexicalEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// Plugin para inicializar contenido HTML
function InitialContentPlugin({ initialHtml }: { initialHtml?: string }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!initialHtml || hasInitialized.current) return;
    hasInitialized.current = true;

    // Cargar contenido inicial
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      try {
        const parser = new DOMParser();
        let htmlContent = initialHtml.trim();

        if (!htmlContent.startsWith('<')) {
          htmlContent = `<p dir="ltr">${htmlContent}</p>`;
        } else {
          // Asegurar que el primer elemento tenga dir="ltr"
          htmlContent = htmlContent.replace(/^<(\w+)/, '<$1 dir="ltr"');
        }

        const dom = parser.parseFromString(htmlContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom.body);
        root.append(...nodes);

        // Posicionar el cursor al final del contenido
        root.selectEnd();
      } catch (error) {
        console.error('Error loading initial HTML content:', error);
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        root.selectEnd();
      }
    });
  }, [editor, initialHtml]);

  return null;
}

// Plugin para manejar cambios y generar HTML
function OnChangePluginInternal({ onChange }: { onChange?: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  if (!onChange) {
    return null;
  }

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        });
      }}
    />
  );
}

const editorConfig = {
  namespace: 'NoteEditor',
  nodes: [
    ParagraphNode,
    TextNode,
    ImageNode,
    CodeNode,
    CodeHighlightNode,
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
  ],
  onError,
  theme: ExampleTheme,
};

function LexicalEditor({
  initialValue,
  onChange,
  placeholder: customPlaceholder,
  className,
}: LexicalEditorProps) {
  const displayPlaceholder = customPlaceholder || placeholder;

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={`editor-container ${className || ''}`}>
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={displayPlaceholder}
                placeholder={
                  <div className="editor-placeholder">{displayPlaceholder}</div>
                }
                dir="ltr"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ImagesPlugin />
          <CodeBlockPlugin />
          <FormatPlugin />
          <ListPlugin />
          <LinkPlugin />
          {!initialValue && <AutoFocusPlugin />}
          {initialValue && <InitialContentPlugin initialHtml={initialValue} />}
          <OnChangePluginInternal onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}

// Export both default and named export for compatibility
export default LexicalEditor;
export { LexicalEditor };

