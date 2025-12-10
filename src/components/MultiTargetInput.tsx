import React, { useState, useRef, useEffect } from 'react';
import { Clipboard, X, Terminal, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface MultiTargetInputProps {
    onAnalyze: (targets: string[]) => void;
    isLoading?: boolean;
}

export default function MultiTargetInput({ onAnalyze, isLoading }: MultiTargetInputProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(Math.max(textareaRef.current.scrollHeight, 120), 400) + 'px';
        }
    }, [value]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!value.trim() || isLoading) return;

        // Split by newlines, commas, or spaces
        const targets = value.split(/[\n, ]+/).map(t => t.trim()).filter(Boolean);
        if (targets.length > 0) {
            onAnalyze(targets);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl+Enter submits
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto font-mono">
            <div className="flex items-center justify-between mb-2 px-1">
                <label className="text-xs text-primary/70 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} /> Target_Input_Stream
                </label>
                <span className="text-[10px] text-muted-foreground">SINGLE TARGET = DEEP PIVOT MODE ENABLED</span>
            </div>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-sm opacity-20 group-hover:opacity-50 transition duration-500 blur-sm"></div>

                <div className="relative bg-black/80 border border-primary/30 rounded-sm overflow-hidden flex flex-col">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            placeholder={"ENTER TARGET IPs OR DOMAINS...\n192.168.1.1\ngoogle.com\n\n(SINGLE TARGET ENABLED DEEP PIVOT MODE)"}
                            className="w-full bg-transparent p-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none min-h-[120px]"
                        />
                    </div>

                    {/* Visual Footer/Actions */}
                    <div className="flex items-center justify-between p-2 bg-primary/5 border-t border-primary/20">
                        <div className="flex gap-1">
                            <button
                                className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors"
                                title="Paste from Clipboard"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        setValue(text);
                                    } catch (err) {
                                        console.error('Failed to read clipboard', err);
                                    }
                                }}
                            >
                                <Clipboard size={14} />
                            </button>
                            {value && (
                                <button
                                    onClick={() => setValue('')}
                                    className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                                    title="Clear"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleSubmit()}
                            disabled={!value.trim() || isLoading}
                            className={cn(
                                "flex items-center gap-2 px-6 py-1.5 bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed clip-path-slant",
                                isLoading && "animate-pulse"
                            )}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
                        >
                            {isLoading ? 'PROCESSING...' : 'INITIATE_SCAN'} <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-right mt-1">
                PRESS CTRL+ENTER TO EXECUTE
            </p>
        </div>
    );
}
