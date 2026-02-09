import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
    $createParagraphNode,
    $insertNodes,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    createCommand,
    DRAGOVER_COMMAND,
    DROP_COMMAND,
    LexicalCommand,
    LexicalEditor,
    PASTE_COMMAND,
} from 'lexical';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

import { $createImageNode, ImageNode, ImagePayload } from '../nodes/ImageNode';
import { uploadApi } from '@/lib/api';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
    createCommand('INSERT_IMAGE_COMMAND');

export default function ImagesPlugin({
    captionsEnabled,
}: {
    captionsEnabled?: boolean;
}): React.JSX.Element | null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([ImageNode])) {
            throw new Error('ImagesPlugin: ImageNode not registered on editor');
        }

        return mergeRegister(
            editor.registerCommand<InsertImagePayload>(
                INSERT_IMAGE_COMMAND,
                (payload) => {
                    const imageNode = $createImageNode(payload);
                    $insertNodes([imageNode]);

                    if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                        $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
                    }

                    return true;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
            editor.registerCommand<DragEvent>(
                DRAGOVER_COMMAND,
                (event) => {
                    const dragEvent = event as DragEvent;
                    if (!dragEvent.dataTransfer) {
                        return false;
                    }
                    // Permitir drop si hay archivos y alguno es imagen
                    const hasImage = Array.from(dragEvent.dataTransfer.types).includes('Files');
                    if (hasImage) {
                        dragEvent.preventDefault(); // Necesario para permitir el drop
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand<DragEvent>(
                DROP_COMMAND,
                (event) => {
                    const dragEvent = event as DragEvent;
                    const files = dragEvent.dataTransfer?.files;

                    if (files && files.length > 0) {
                        const hasImage = Array.from(files).some(file => file.type.startsWith('image/'));
                        if (hasImage) {
                            dragEvent.preventDefault();
                            handleFiles(files, editor);
                            return true;
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_HIGH,
            ),
            editor.registerCommand(
                PASTE_COMMAND,
                (event: ClipboardEvent) => {
                    const { clipboardData } = event;
                    const files = clipboardData?.files;

                    if (files && files.length > 0) {
                        const hasImage = Array.from(files).some(file => file.type.startsWith('image/'));
                        if (hasImage) {
                            event.preventDefault();
                            handleFiles(files, editor);
                            return true;
                        }
                    }
                    return false;
                },
                COMMAND_PRIORITY_EDITOR,
            ),
        );
    }, [captionsEnabled, editor]);

    return null;
}

async function handleFiles(files: FileList, editor: LexicalEditor) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            try {
                // Notificar al usuario que la subida ha comenzado
                const toastId = toast.loading('Subiendo imagen...');

                const uploadResponse = await uploadApi.uploadFile(file, 'notes');

                toast.dismiss(toastId);
                toast.success('Imagen subida correctamente');

                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: uploadResponse.url,
                    maxWidth: 500
                });
            } catch (error) {
                console.error('Error uploading image:', error);
                toast.error('Error al subir la imagen');
            }
        }
    }
}
