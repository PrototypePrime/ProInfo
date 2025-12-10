import { useState } from 'react';
import { MultiTargetInput } from '../../components/Input/MultiTargetInput';
import { analyzeIp } from '../../services/ipUtils';
import type { IpInfo } from '../../services/ipUtils';
import { motion } from 'framer-motion';
import { Globe, CheckCircle, Download, Table, FileSearch, Map as MapIcon, Share2, ShieldAlert, Network } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TacticalMap } from '../../components/Map/TacticalMap';
import { LinkGraph } from '../../components/Graph/LinkGraph';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

// Define props to receive state from App
interface IpInvestigatorProps {
    results: IpInfo[];
    setResults: (results: IpInfo[]) => void;
}

export function IpInvestigator({ results, setResults }: IpInvestigatorProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'intel' | 'map' | 'graph'>('intel');

    const saveToHistory = (newResults: IpInfo[]) => {
        const historyItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            targets: newResults.length,
            data: newResults
        };

        const existing = localStorage.getItem('proinfo_scan_history');
        const history = existing ? JSON.parse(existing) : [];
        history.push(historyItem);
        localStorage.setItem('proinfo_scan_history', JSON.stringify(history));
    };

    const handleAnalyze = async (targets: string[]) => {
        setIsAnalyzing(true);
        // Initial setup
        const initialResults = targets.map(ip => ({ ip, status: 'loading' } as IpInfo));
        setResults(initialResults);

        const BATCH_SIZE = 5;
        let finalResults = [...initialResults];

        for (let i = 0; i < targets.length; i += BATCH_SIZE) {
            const batch = targets.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(ip => analyzeIp(ip)));

            // Update local snapshot relative to previous
            finalResults = finalResults.map(prev => {
                const updated = batchResults.find(b => b.ip === prev.ip);
                return updated || prev;
            });

            setResults([...finalResults]);
        }

        saveToHistory(finalResults);
        setIsAnalyzing(false);
    };

    const handlePivot = async (newTargets: string[], parentIp: string, parentDepth = 0) => {
        console.log("Pivot Requested:", { newTargets, parentIp, parentDepth });

        // Filter duplicates globally
        const existingIps = new Set(results.map(r => r.ip));
        const uniqueTargets = newTargets.filter(t => !existingIps.has(t));

        console.log("Unique Targets:", uniqueTargets);

        if (uniqueTargets.length === 0) {
            console.warn("Pivot aborted: No unique targets found.");
            return;
        }

        setIsAnalyzing(true);
        // Analyze with incremented depth
        const newDepth = parentDepth + 1;
        const newRes = await Promise.all(uniqueTargets.map(ip => analyzeIp(ip, newDepth, parentIp)));

        console.log("Pivot Results:", newRes);

        // Insert logic: Find parent index and splice
        const parentIndex = results.findIndex(r => r.ip === parentIp);
        if (parentIndex !== -1) {
            const newResultsList = [...results];
            newResultsList.splice(parentIndex + 1, 0, ...newRes);
            setResults(newResultsList);
        } else {
            // Fallback append
            setResults([...results, ...newRes]);
        }

        setIsAnalyzing(false);
    };

    const handleExportPDF = async () => {
        // Logic: Capture content and print
        // For MVP, we'll export text data in a nice PDF layout
        const doc = new jsPDF();

        doc.setFont("monospace");
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 297, 'F'); // Black BG
        doc.setTextColor(34, 211, 238); // Cyan

        doc.setFontSize(22);
        doc.text("INTELLIGENCE DOSSIER", 10, 20);

        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`GENERATED: ${new Date().toISOString()}`, 10, 30);
        doc.text(`TARGETS: ${results.length}`, 10, 35);

        let y = 50;
        results.forEach((r, i) => {
            if (y > 270) { doc.addPage(); doc.setFillColor(0, 0, 0); doc.rect(0, 0, 210, 297, 'F'); y = 20; }

            doc.setTextColor(34, 211, 238);
            doc.text(`[${i + 1}] ${r.ip} (${r.country}) - RISK: ${r.threatLevel || 'UNKNOWN'}`, 10, y);
            doc.setTextColor(200, 200, 200);
            y += 7;

            doc.text(`   Host: ${r.reverseDns || 'N/A'}`, 10, y); y += 5;
            doc.text(`   Owner: ${r.owner?.substring(0, 40) || 'N/A'}`, 10, y); y += 5;
            doc.text(`   Ports: ${r.ports?.join(', ') || 'None Detected'}`, 10, y); y += 5;
            doc.text(`   Vulns: ${r.vulns?.join(', ') || 'None Detected'}`, 10, y); y += 10;
        });

        doc.save("proinfo_dossier.pdf");
    };

    const downloadCsv = () => {
        if (results.length === 0) return;

        // Expanded Fields for Rich Data Export
        const headers = ['IP', 'Hostname', 'Owner', 'ASN', 'Country', 'Coordinates', 'Risk Level', 'Risk Score', 'Open Ports', 'Vuln Count', 'CVEs', 'Data Source'];
        const rows = results.map(r => [
            r.ip,
            r.reverseDns || 'N/A',
            (r.owner || 'N/A').replace(/,/g, ' '), // sanitize commas
            r.asn || 'N/A',
            r.country || 'N/A',
            `${r.lat};${r.lon}`,
            r.threatLevel || 'N/A',
            r.threatScore || 0,
            r.ports ? `"${r.ports.join(';')}"` : 'None',
            r.vulns ? r.vulns.length : 0,
            r.vulns ? `"${r.vulns.join(';')}"` : 'None',
            r.source || 'N/A'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `proinfo_intel_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 font-mono">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-primary/20 pb-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Globe className="text-primary" /> ProInfo Intelligence Suite
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Advanced OSINT & Threat Analysis Platform
                    </p>
                </div>

                {results.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={downloadCsv}
                            className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/50 text-accent hover:bg-accent/20 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Download size={14} /> EXPORT DATA
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <FileSearch size={14} /> PDF DOSSIER
                        </button>
                    </div>
                )}
            </div>

            <MultiTargetInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />

            {/* Results Section */}
            <div className="space-y-4 min-h-[400px]">
                {/* Tabs */}
                <div className="flex border-b border-primary/20 overflow-x-auto">
                    {[
                        { id: 'intel', label: 'INTEL_CORE', icon: FileSearch },
                        { id: 'map', label: 'TACTICAL_MAP', icon: MapIcon },
                        { id: 'graph', label: 'LINK_TOPOLOGY', icon: Share2 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 md:px-6 py-2 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="relative animate-in fade-in zoom-in-95 duration-300">
                    {results.length === 0 && !isAnalyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 py-20">
                            <Table size={48} strokeWidth={1} />
                            <p className="mt-4 text-xs uppercase tracking-widest">Awaiting Input Stream...</p>
                        </div>
                    ) : (
                        <>
                            {/* Unified Intel View */}
                            {activeTab === 'intel' && (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {results.map((res, idx) => (
                                        <ResultCard
                                            key={idx}
                                            info={res}
                                            onPivot={(targets) => handlePivot(targets, res.ip, res.depth || 0)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Visual Views */}
                            {activeTab === 'map' && <TacticalMap data={results} />}
                            {activeTab === 'graph' && <LinkGraph data={results} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ResultCard({ info, onPivot }: { info: IpInfo, onPivot?: (t: string[]) => void }) {
    const [showVulns, setShowVulns] = useState(false);
    const isSuccess = info.status === 'success';

    // Dynamic Styles based on Threat Level
    const borderColor = info.threatLevel === 'CRITICAL' ? 'border-red-500/50' : info.threatLevel === 'HIGH' ? 'border-orange-500/50' : 'border-primary/30';
    const glowClass = info.threatLevel === 'CRITICAL'
        ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'
        : 'hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, x: (info.depth || 0) * 20 }} // Animate entry
            animate={{ opacity: 1, y: 0, x: 0 }}
            style={{ marginLeft: (info.depth || 0) * 24 }} // Hierarchical Indentation
            className={cn(
                "bg-black/60 backdrop-blur-md border rounded-md p-0 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex flex-col",
                borderColor, glowClass,
                info.depth && info.depth > 0 ? "border-l-4 border-l-primary/50" : "" // Visual cue for child items
            )}
        >
            {/* Hierarchy Connector (Visual Only) */}
            {(info.depth || 0) > 0 && (
                <div className="absolute -left-3 top-6 text-primary/50">
                    <span className="text-xl">↳</span>
                </div>
            )}
            {/* Card Header: IP & Status */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded bg-black/50 border border-white/10", isSuccess ? "text-primary" : "text-muted-foreground")}>
                        {info.type === 'DOMAIN' ? <Globe size={20} className="text-orange-400" /> : <Globe size={20} />}
                    </div>
                    <div>
                        <div className="font-mono font-bold text-xl tracking-tight text-white">{info.ip}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            {info.type === 'DOMAIN' ? 'DOMAIN ASSET' : info.country || 'UNKNOWN LOC'}
                            {info.reverseDns && <span className="text-white/30">•</span>}
                            <span className="truncate max-w-[150px]" title={info.reverseDns || ''}>{info.reverseDns}</span>
                        </div>
                    </div>
                </div>

                {info.threatLevel && (
                    <div className={cn(
                        "px-3 py-1 text-xs font-black uppercase tracking-widest rounded border",
                        info.threatLevel === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            info.threatLevel === 'HIGH' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                "bg-primary/5 text-primary border-primary/10"
                    )}>
                        {info.threatLevel}
                    </div>
                )}
            </div>

            {/* Card Body: 2-Col Grid */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

                {/* Left Col: Identity & Infrastructure */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-primary/70 uppercase flex items-center gap-1">
                            <Share2 size={10} /> Infrastructure Owner
                        </label>
                        <div className="font-mono text-sm text-white/90 break-words leading-tight">
                            {info.owner || 'N/A'}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                            {info.asn || 'ASN: N/A'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="p-2 bg-black/30 rounded border border-white/5">
                            <span className="block text-[9px] uppercase text-muted-foreground">Geolocation</span>
                            <span className="block text-xs font-mono text-white">{info.country}</span>
                        </div>
                        <div className="p-2 bg-black/30 rounded border border-white/5">
                            <span className="block text-[9px] uppercase text-muted-foreground">Coordinates</span>
                            <span className="block text-xs font-mono text-white truncate">{info.lat?.toFixed(2)}, {info.lon?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Col: Attack Surface */}
                <div className="space-y-3 border-l border-white/5 pl-0 lg:pl-6 lg:border-t-0 border-t lg:pt-0 pt-4">
                    <label className="text-[10px] font-bold text-red-400/70 uppercase flex items-center gap-1 mb-2">
                        <ShieldAlert size={10} /> Attack Surface
                    </label>

                    {/* Abuse Score Badge */}
                    {info.measure !== undefined && info.measure > 0 && (
                        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded flex items-center justify-between">
                            <span className="text-[10px] font-bold text-red-400 uppercase">Abuse Confidence</span>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-red-900/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${info.measure}%` }}></div>
                                </div>
                                <span className="text-xs font-mono font-black text-red-500">{info.measure}%</span>
                            </div>
                        </div>
                    )}

                    {/* DNS Records (If Domain) */}
                    {info.dnsRecords && info.dnsRecords.length > 0 && (
                        <div className="mb-3">
                            <span className="text-[9px] uppercase text-muted-foreground mb-1 block">DNS Records</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                                {info.dnsRecords.map((rec, idx) => (
                                    <div key={idx} className="flex gap-2 text-[10px] font-mono border-b border-white/5 pb-1 last:border-0">
                                        <span className="text-primary/70 font-bold w-8">{rec.type}</span>
                                        <span className="text-white/70 truncate">{rec.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ports */}
                    <div>
                        <span className="text-[9px] uppercase text-muted-foreground mb-1 block">Open Ports</span>
                        <div className="flex flex-wrap gap-1.5">
                            {info.ports && info.ports.length > 0 ? (
                                info.ports.slice(0, 12).map(p => (
                                    <span key={p} className={cn(
                                        "px-1.5 py-0.5 text-[10px] font-mono rounded border",
                                        [21, 23, 445, 3389].includes(p) ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                        {p}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] text-muted-foreground italic">No standard ports open</span>
                            )}
                        </div>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="pt-2">
                        <span className="text-[9px] uppercase text-muted-foreground mb-1 block">Vulnerabilities (CVE)</span>
                        {info.vulns && info.vulns.length > 0 ? (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowVulns(!showVulns)}
                                    className="w-full flex items-center justify-between text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1.5 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                >
                                    <span>{info.vulns.length} CVEs DETECTED</span>
                                    <span className="opacity-50 text-[8px]">{showVulns ? 'COLLAPSE' : 'EXPAND'}</span>
                                </button>

                                {showVulns && (
                                    <div className="grid grid-cols-2 gap-1 animate-in slide-in-from-top-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {info.vulns.map((v, i) => (
                                            <a
                                                key={i}
                                                href={`https://nvd.nist.gov/vuln/detail/${v}`} target="_blank" rel="noreferrer"
                                                className="block text-[9px] font-mono text-red-300/80 hover:text-red-300 hover:underline truncate"
                                            >
                                                {v}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-green-500/50 text-[10px]">
                                <CheckCircle size={10} /> No registered CVEs
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Source & Actions */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-t border-white/5">
                <div className="text-[9px] text-white/20 font-mono">
                    SRC: {info.source || 'PROINFO_ENGINE'}
                </div>

                {/* PIVOT ACTION */}
                {info.linkedAssets && info.linkedAssets.length > 0 && (
                    <button
                        onClick={() => onPivot?.(info.linkedAssets!)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-[9px] font-bold uppercase tracking-wider transition-all"
                    >
                        <Network size={10} />
                        EXPAND {info.linkedAssets.length} {info.type === 'DOMAIN' ? 'IPs' : 'DOMAINS'}
                    </button>
                )}
            </div>
        </motion.div>
    )
}
