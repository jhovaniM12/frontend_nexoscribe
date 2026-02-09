import type { NodeKey } from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import { $isImageNode } from './ImageNode';

// Estilos básicos para la imagen seleccionada y el resizer
const imageStyle = {
    maxWidth: '100%',
    height: 'auto',
};

export default function ImageComponent({
    src,
    altText,
    nodeKey,
    width,
    height,
    maxWidth,
}: {
    altText: string;
    height: 'inherit' | number;
    maxWidth: number;
    nodeKey: NodeKey;
    src: string;
    width: 'inherit' | number;
}): React.JSX.Element {
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [editor] = useLexicalComposerContext();
    const activeEditorRef = useRef(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event: KeyboardEvent = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.remove();
                }
            }
            return false;
        },
        [isSelected, nodeKey],
    );

    useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(() => {
                if (isMounted) {
                    // Selection handling could go here
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, newEditor) => {
                    // @ts-expect-error: activeEditorRef is mutable
                    activeEditorRef.current = newEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand<MouseEvent>(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;
                    if (event.target === imageRef.current) {
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }

                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                (event) => {
                    if (event.target === imageRef.current) {
                        // TODO: Eventualmente implementar Drag & Drop de imágenes ya insertadas
                        event.preventDefault();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
        );

        return () => {
            isMounted = false;
            unregister();
        };
    }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

    return (
        <Suspense fallback={null}>
            <>
                <div draggable={isSelected}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className={isSelected ? 'focused-image' : ''}
                        src={src}
                        alt={altText}
                        ref={imageRef}
                        style={{
                            ...imageStyle,
                            height: height === 'inherit' ? 'auto' : height,
                            maxWidth: maxWidth,
                            width: width === 'inherit' ? 'auto' : width,
                            // Añadir un borde visual cuando está seleccionado
                            outline: isSelected ? '2px solid hsl(var(--primary))' : 'none',
                            cursor: 'default',
                        }}
                    />
                </div>
            </>
        </Suspense>
    );
}
