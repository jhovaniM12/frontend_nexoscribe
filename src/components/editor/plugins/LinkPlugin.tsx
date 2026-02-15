import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    createCommand,
    LexicalCommand,
} from 'lexical';
import { useEffect, useCallback, useState } from 'react';
import {
    $isLinkNode,
    LinkNode,
    TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { $isAtNodeEnd } from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';

// Command para abrir el diálogo de insertar link
export const OPEN_LINK_DIALOG_COMMAND: LexicalCommand<void> = createCommand('OPEN_LINK_DIALOG_COMMAND');

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
    if (!$isRangeSelection(selection)) return null;
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
    }
}

export default function LinkPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([LinkNode])) {
            throw new Error('LinkPlugin: LinkNode not registered on editor');
        }

        return mergeRegister();
    }, [editor]);

    return null;
}

// Utility function to check if selection has link
export function useLinkState() {
    const [editor] = useLexicalComposerContext();
    const [isLink, setIsLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState<string | null>(null);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const node = getSelectedNode(selection);
                    const parent = node?.getParent();
                    if ($isLinkNode(parent)) {
                        setIsLink(true);
                        setLinkUrl(parent.getURL());
                    } else if ($isLinkNode(node)) {
                        setIsLink(true);
                        setLinkUrl(node.getURL());
                    } else {
                        setIsLink(false);
                        setLinkUrl(null);
                    }
                }
            });
        });
    }, [editor]);

    const insertLink = useCallback((url: string) => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }, [editor]);

    const removeLink = useCallback(() => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }, [editor]);

    return { isLink, linkUrl, insertLink, removeLink };
}

export { TOGGLE_LINK_COMMAND };
