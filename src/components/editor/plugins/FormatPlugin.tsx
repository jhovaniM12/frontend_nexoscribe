import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    createCommand,
    LexicalCommand,
    $createParagraphNode,
} from 'lexical';
import { useEffect } from 'react';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';

// Commands para headings y quotes
export const FORMAT_HEADING_COMMAND: LexicalCommand<HeadingTagType> = createCommand('FORMAT_HEADING_COMMAND');
export const FORMAT_QUOTE_COMMAND: LexicalCommand<void> = createCommand('FORMAT_QUOTE_COMMAND');
export const FORMAT_PARAGRAPH_COMMAND: LexicalCommand<void> = createCommand('FORMAT_PARAGRAPH_COMMAND');

export default function FormatPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Register heading command
        const unregisterHeading = editor.registerCommand<HeadingTagType>(
            FORMAT_HEADING_COMMAND,
            (headingTag) => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(headingTag));
                }
                return true;
            },
            COMMAND_PRIORITY_LOW,
        );

        // Register quote command
        const unregisterQuote = editor.registerCommand(
            FORMAT_QUOTE_COMMAND,
            () => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
                return true;
            },
            COMMAND_PRIORITY_LOW,
        );

        // Register paragraph command (to reset formatting)
        const unregisterParagraph = editor.registerCommand(
            FORMAT_PARAGRAPH_COMMAND,
            () => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
                return true;
            },
            COMMAND_PRIORITY_LOW,
        );

        return () => {
            unregisterHeading();
            unregisterQuote();
            unregisterParagraph();
        };
    }, [editor]);

    return null;
}

// Export list commands for use in toolbar
export { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND };
