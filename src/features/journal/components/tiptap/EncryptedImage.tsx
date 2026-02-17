import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { ImageService } from '../../image/imageService';
import { Loader2, AlertCircle } from 'lucide-react';

const EncryptedImageComponent = (props: any) => {
    const { node, selected } = props;
    const { imageId, caption } = node.attrs;

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!imageId) {
                setLoading(false);
                return;
            }

            try {
                const url = await ImageService.getImage(imageId);
                if (active) {
                    setImageUrl(url);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load encrypted image:", e);
                if (active) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            active = false;
            // Revoke is handled by service or we can do it here if we want strict control
            // but for Tiptap node views, repeated mounting is possible. 
            // We'll let React cleanup via hook if we used one, but here we just manually revoke if we wanted.
            // keeping it simple for now as ImageService creates unique URLs.
        };
    }, [imageId]);

    // Simple component-level cleanup
    useEffect(() => {
        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [imageUrl]);

    return (
        <NodeViewWrapper className="encrypted-image-component my-4 flex flex-col items-center options-drag" >
            <div
                className={`relative rounded-xl overflow-hidden shadow-sm transition-all ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                style={{ maxWidth: '100%' }
                }
            >
                {loading && (
                    <div className="w-full h-48 bg-stone-100 dark:bg-stone-800 flex items-center justify-center animate-pulse rounded-xl" >
                        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                )}

                {
                    error && (
                        <div className="w-full h-32 bg-red-50 dark:bg-red-900/20 text-red-500 flex flex-col items-center justify-center p-4 rounded-xl" >
                            <AlertCircle className="w-6 h-6 mb-2" />
                            <span className="text-xs" > Image Decryption Failed </span>
                        </div>
                    )
                }

                {
                    imageUrl && (
                        <img
                            src={imageUrl}
                            alt={caption || 'Encrypted Journal Image'
                            }
                            className="max-h-[600px] w-auto object-contain rounded-xl"
                        />
                    )}
            </div>

            {
                (caption || selected) && (
                    <div className="mt-2 text-center text-sm italic text-stone-500 dark:text-stone-400 min-h-[1.5em] focus-within:ring-0 border-none outline-none" >
                        {/* Note: In a real Tiptap setup, editing caption directly here needs careful wiring to update node attributes.
                         For MVP, we might treat it as read-only rendering of the attribute, 
                         or use a simple input that updates attributes on blur. */}
                        {caption}
                    </div>
                )
            }
        </NodeViewWrapper>
    );
};

export const EncryptedImage = Node.create({
    name: 'encryptedImage',

    group: 'block',

    draggable: true,

    addAttributes() {
        return {
            imageId: {
                default: null,
            },
            caption: {
                default: '',
            },
            width: {
                default: null,
            },
            height: {
                default: null,
            },
            alignment: {
                default: 'center',
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'encrypted-image',
            },
        ];
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
        return ['encrypted-image', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EncryptedImageComponent);
    },
});
