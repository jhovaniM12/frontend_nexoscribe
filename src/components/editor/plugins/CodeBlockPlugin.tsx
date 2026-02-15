import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createCodeNode, CodeNode, getCodeLanguages, getDefaultCodeLanguage, registerCodeHighlighting } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';

export const INSERT_CODE_BLOCK_COMMAND: LexicalCommand<string | undefined> = createCommand('INSERT_CODE_BLOCK_COMMAND');

// Lenguajes soportados con nombres amigables
export const CODE_LANGUAGES: { value: string; label: string }[] = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'plain', label: 'Texto plano' },
];

export default function CodeBlockPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([CodeNode])) {
            throw new Error('CodeBlockPlugin: CodeNode not registered on editor');
        }

        return editor.registerCommand<string | undefined>(
            INSERT_CODE_BLOCK_COMMAND,
            (language) => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => {
                        const codeNode = $createCodeNode(language || getDefaultCodeLanguage());
                        return codeNode;
                    });
                }

                return true;
            },
            COMMAND_PRIORITY_LOW,
        );
    }, [editor]);

    useEffect(() => {
        return registerCodeHighlighting(editor);
    }, [editor]);

    return null;
}

// Export utilidades adicionales
export { getCodeLanguages, getDefaultCodeLanguage };
