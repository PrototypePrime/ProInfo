import { useState, useRef, useEffect } from 'react';
// @ts-ignore
import ForceGraph2D from 'react-force-graph-2d';
import type { IpInfo } from '../services/ipUtils';
import { Maximize2, Minimize2, Share2, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface LinkGraphProps {
    data: IpInfo[];
}

export default function LinkGraph({ data }: LinkGraphProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    // Handle Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const nodes: any[] = [];
    const links: any[] = [];

    // Central Hub Node
    if (data.length > 0) {
        nodes.push({ id: 'HOME_BASE', type: 'HUB', val: 20, color: '#22d3ee', label: 'PROINFO_HQ' });
    }

    data.forEach(info => {
        // IP Node
        if (!nodes.find(n => n.id === info.ip)) {
            const label = info.reverseDns ? info.reverseDns.split('.')[0] : info.ip;
            const isCritical = info.threatLevel === 'CRITICAL';

            nodes.push({
                id: info.ip,
                type: 'TARGET',
                val: 10,
                color: isCritical ? '#ef4444' : '#3b82f6',
                label: label,
                fullLabel: info.reverseDns || info.ip,
                isCritical
            });

            // Connect to Hub
            links.push({ source: 'HOME_BASE', target: info.ip });
        }

        // ASN/Org Node (Cluster)
        if (info.asn && info.asn !== 'N/A') {
            const asnId = info.asn;
            const orgLabel = info.owner || info.asn; // Use Owner name if available, else ASN

            if (!nodes.find(n => n.id === asnId)) {
                nodes.push({
                    id: asnId,
                    type: 'ASN',
                    val: 8,
                    color: '#8b5cf6', // Violet for Infrastructure
                    label: orgLabel,
                    fullLabel: `${asnId} - ${orgLabel}`
                });
            }
            links.push({ source: info.ip, target: asnId });
        }
    });

    return (
        <div
            ref={containerRef}
            className={cn(
                "border border-border rounded-md bg-slate-950 relative overflow-hidden transition-all duration-500 group",
                isFullscreen ? "fixed inset-0 z-50 h-screen w-screen rounded-none" : "h-[500px] w-full"
            )}
        >
            <div className="absolute top-4 left-4 z-10 p-2 bg-slate-900/90 backdrop-blur rounded-md text-primary font-bold border border-primary/20 flex items-center gap-2 shadow-lg hover:border-primary/50 transition-colors">
                <Share2 size={16} className="animate-pulse" /> NETWORK TOPOLOGY
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/10 rounded text-[10px] uppercase text-muted-foreground mr-2">
                    <Activity size={12} className="text-green-500 animate-pulse" /> Live Traffic
                </div>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 bg-slate-900/90 hover:bg-slate-800 text-primary border border-primary/20 rounded-md transition-all shadow-lg"
                    title={isFullscreen ? "Minimize" : "Maximize"}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            <div className="absolute bottom-4 right-4 z-10 text-[10px] text-muted-foreground bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5 font-mono">
                {nodes.length} NODES • {links.length} LINKS • {isFullscreen ? 'ESC TO EXIT' : 'SCROLL TO ZOOM'}
            </div>

            <ForceGraph2D
                ref={fgRef}
                graphData={{ nodes, links }}
                nodeLabel="fullLabel"
                nodeRelSize={6}
                backgroundColor="#020617"

                // Particles
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={() => 0.005}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => '#22d3ee'}

                // Physics
                d3VelocityDecay={0.4}
                d3AlphaDecay={0.02}

                width={isFullscreen ? window.innerWidth : undefined}
                height={isFullscreen ? window.innerHeight : 500}

                // Custom Rendering
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.label;
                    const fontSize = (isFullscreen ? 14 : 12) / globalScale;

                    // Node Shape
                    ctx.beginPath();
                    if (node.type === 'HUB') {
                        ctx.rect(node.x! - 6, node.y! - 6, 12, 12);
                    } else if (node.type === 'ASN') {
                        // Diamond / Rotated Square for Infrastructure
                        ctx.moveTo(node.x!, node.y! - 6);
                        ctx.lineTo(node.x! + 6, node.y!);
                        ctx.lineTo(node.x!, node.y! + 6);
                        ctx.lineTo(node.x! - 6, node.y!);
                        ctx.closePath();
                    } else {
                        ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI, false);
                    }
                    ctx.fillStyle = node.color;
                    ctx.fill();

                    // Glow Effect
                    if (node.isCritical) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#ef4444';
                    } else if (node.type === 'HUB') {
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#22d3ee';
                    } else if (node.type === 'ASN') {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#8b5cf6';
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    // Text Background
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2 - 10, bckgDimensions[0], bckgDimensions[1]);

                    // Text Label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `bold ${fontSize}px Monospace`;
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x!, node.y! - 10);

                    node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                }}
            />
        </div>
    );
}
