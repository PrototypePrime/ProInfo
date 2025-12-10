import { useState } from 'react';
import { Shield, CheckCircle, RefreshCcw } from 'lucide-react';

export default function IocExtractor() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<{ ips: string[], domains: string[], urls: string[], hashes: string[] } | null>(null);

    const extract = () => {
        // Regex Patterns
        const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
        // Basic domain regex (defanged or not)
        const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi;
        const urlRegex = /(?:https?|hxxp|ftp):\/\/[^\s"']+/gi;
        const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g; // MD5/SHA

        const ips = [...new Set(input.match(ipRegex) || [])];
        const domains = [...new Set(input.match(domainRegex) || [])];
        const urls = [...new Set(input.match(urlRegex) || [])];
        const hashes = [...new Set(input.match(hashRegex) || [])];

        // Defang
        const defang = (s: string) => s.replace(/\./g, '[.]').replace('http', 'hxxp');

        setOutput({
            ips: ips.map(defang),
            domains: domains.map(defang),
            urls: urls.map(defang),
            hashes
        });
    };

    const clear = () => {
        setInput('');
        setOutput(null);
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <Shield size={18} /> IOC EXTRACTOR & DEFANGER
                </h2>
                <button onClick={clear} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
                    <RefreshCcw size={12} /> RESET
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                {/* Input */}
                <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-bold text-muted-foreground">RAW INPUT STREAM</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded p-4 font-mono text-xs focus:border-primary/50 focus:outline-none resize-none"
                        placeholder="Paste email headers, logs, or messy text here..."
                    />
                    <button
                        onClick={extract}
                        className="w-full py-3 bg-primary text-black font-bold text-sm tracking-wider uppercase rounded hover:bg-primary/90 transition-colors"
                    >
                        EXTRACT & DEFANG
                    </button>
                </div>

                {/* Output */}
                <div className="space-y-2 flex flex-col bg-black/20 rounded border border-white/5 p-4 overflow-hidden">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                        <CheckCircle size={12} /> EXTRACTED ARTIFACTS
                    </label>

                    {!output ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground/30 text-xs italic">
                            Waiting for analysis...
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {/* IPs */}
                            {output.ips.length > 0 && (
                                <div>
                                    <span className="block text-[10px] uppercase text-blue-400 mb-1 font-bold">IP Addresses ({output.ips.length})</span>
                                    <div className="p-2 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-blue-200/80 break-all">
                                        {output.ips.join(', ')}
                                    </div>
                                </div>
                            )}

                            {/* Domains */}
                            {output.domains.length > 0 && (
                                <div>
                                    <span className="block text-[10px] uppercase text-orange-400 mb-1 font-bold">Domains ({output.domains.length})</span>
                                    <div className="p-2 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-orange-200/80 break-all">
                                        {output.domains.join(', ')}
                                    </div>
                                </div>
                            )}

                            {/* URLs */}
                            {output.urls.length > 0 && (
                                <div>
                                    <span className="block text-[10px] uppercase text-purple-400 mb-1 font-bold">URLs ({output.urls.length})</span>
                                    <div className="space-y-1">
                                        {output.urls.map((u, i) => (
                                            <div key={i} className="p-1 px-2 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-purple-200/80 truncate">
                                                {u}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hashes */}
                            {output.hashes.length > 0 && (
                                <div>
                                    <span className="block text-[10px] uppercase text-green-400 mb-1 font-bold">Hashes ({output.hashes.length})</span>
                                    <div className="space-y-1">
                                        {output.hashes.map((h, i) => (
                                            <div key={i} className="p-1 px-2 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-green-200/80 truncate">
                                                {h}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
