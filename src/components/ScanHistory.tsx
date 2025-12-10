
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, History as HistoryIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { IpInfo } from '../services/ipUtils';

interface HistoryItem {
    id: string;
    timestamp: string;
    targets: number;
    data: IpInfo[];
}

export default function ScanHistory({ onRestore }: { onRestore: (results: any[]) => void }) {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('proinfo_scan_history');
        if (stored) {
            try {
                setHistory(JSON.parse(stored).reverse()); // Newest first
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const clearHistory = () => {
        if (confirm('Clear all scan history?')) {
            localStorage.removeItem('proinfo_scan_history');
            setHistory([]);
        }
    }

    const deleteItem = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        localStorage.setItem('proinfo_scan_history', JSON.stringify(updated.reverse())); // Store chronological
    };

    return (
        <div className="space-y-6 font-mono">
            <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <HistoryIcon className="text-primary" /> Scan History
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Archive of previous intelligence operations.
                    </p>
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-400 uppercase font-bold border border-red-500/30 px-3 py-1 bg-red-500/10 rounded">
                        Clear Archives
                    </button>
                )}
            </div>

            <div className="border border-border rounded-md bg-card/50 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-black/20">
                    <div className="col-span-3">Timestamp</div>
                    <div className="col-span-2">Count</div>
                    <div className="col-span-5">Summary</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-border">
                    {history.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-white/5 transition-colors group"
                        >
                            <div className="col-span-3 text-primary/80 text-xs">
                                {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div className="col-span-2 font-bold">{log.targets} IPs</div>
                            <div className="col-span-5 truncate opacity-70 text-xs">
                                {log.data.map(d => d.ip).slice(0, 3).join(', ')}{log.data.length > 3 ? '...' : ''}
                            </div>
                            <div className="col-span-2 flex gap-2 justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onRestore(log.data)}
                                    className="p-1.5 hover:bg-primary/20 text-primary rounded transition-colors flex items-center gap-1 bg-primary/10"
                                    title="Restore Session"
                                >
                                    <RotateCcw size={14} /> <span className="text-[10px] font-bold uppercase">Load</span>
                                </button>
                                <button
                                    onClick={() => deleteItem(log.id)}
                                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                    title="Delete Log"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {history.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground text-sm italic flex flex-col items-center gap-2">
                            <HistoryIcon size={32} className="opacity-20" />
                            No local scan history found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
