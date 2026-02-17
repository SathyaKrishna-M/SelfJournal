import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EncryptedImage } from './EncryptedImage';
import { useEffect, useState, useMemo } from 'react';
import { ImageService } from '../../image/imageService';
import { Loader2 } from 'lucide-react';
import { EditorView } from '@tiptap/pm/view';
import { Slice } from '@tiptap/pm/model';

interface RichTextEditorProps {
    initialContent?: any;
    onChange: (content: any) => void;
    entryId: string;
    readOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialContent,
    onChange,
    entryId,
    readOnly = false
}) => {
    const [isUploading, setIsUploading] = useState(false);

    const extensions = useMemo(() => [
        StarterKit,
        Placeholder.configure({
            placeholder: 'Start writing...',
        }),
        EncryptedImage
    ], []);

    const editor = useEditor({
        extensions,
        content: initialContent || {},
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[50vh] p-4 font-handwriting text-2xl leading-loose',
            },
            handleDrop: (_view: EditorView, event: DragEvent, _slice: Slice, moved: boolean) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        handleImageUpload(file);
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (_view: EditorView, event: ClipboardEvent, _slice: Slice) => {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
                    const file = event.clipboardData.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        handleImageUpload(file);
                        return true;
                    }
                }
                return false;
            }
        }
    });

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    const handleImageUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const imageId = await ImageService.saveImage(entryId, file);

            if (editor) {
                editor.commands.insertContent({
                    type: 'encryptedImage',
                    attrs: {
                        imageId
                    }
                });
            }
        } catch (e) {
            console.error("Failed to upload image", e);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!editor) {
        return null; // Or skeleton loader
    }

    return (
        <div className="relative w-full">
            {isUploading && (
                <div className="absolute right-4 top-4 z-10 flex items-center gap-2 text-xs text-stone-400 bg-white/80 dark:bg-stone-900/80 p-2 rounded-full shadow-sm backdrop-blur-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Encrypting...</span>
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
