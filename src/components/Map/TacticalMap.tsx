import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { IpInfo } from '../../services/ipUtils';
// import L from 'leaflet'; // Unused
import { Terminal } from 'lucide-react';

// Custom Pulse Icon - REMOVED for Heatmap style
// const createPulseIcon = ...
// const safeIcon = ...
// const dangerIcon = ...

interface TacticalMapProps {
    data: IpInfo[];
}

export function TacticalMap({ data }: TacticalMapProps) {
    const validPoints = data.filter(d => d.lat && d.lon);

    // Default center
    const center: [number, number] = validPoints.length > 0
        ? [validPoints[0].lat!, validPoints[0].lon!]
        : [20, 0];

    // Flight paths from center (Command Node) to targets
    const flightPaths = validPoints.map(pt => ({
        positions: [[center[0], center[1]], [pt.lat!, pt.lon!]] as [number, number][],
        color: pt.threatLevel === 'CRITICAL' ? '#ef4444' : '#3b82f6'
    }));

    return (
        <div className="h-[500px] w-full border border-primary/30 rounded-sm overflow-hidden relative group bg-[#09090b]">
            <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur-md p-2 border border-primary/20 text-primary uppercase text-xs font-bold tracking-widest flex items-center gap-2 shadow-neon">
                <Terminal size={12} /> Global_Intel_Tracking // DARK_MATTER
            </div>

            <MapContainer
                center={center}
                zoom={2}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", background: '#09090b' }}
            >
                {/* CartoDB Dark Matter Tiles */}
                <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Connection Lines */}
                {flightPaths.map((path, idx) => (
                    <Polyline
                        key={`path-${idx}`}
                        positions={path.positions}
                        pathOptions={{ color: path.color, weight: 1, opacity: 0.3, dashArray: '5, 10' }}
                    />
                ))}

                {/* Heatmap / Glow Markers */}
                {validPoints.map((point, idx) => {
                    const isCritical = point.threatLevel === 'CRITICAL';
                    const color = isCritical ? '#ef4444' : '#06b6d4'; // Red vs Cyan

                    return (
                        <div key={idx}>
                            {/* Outer Glow (Heat) */}
                            <CircleMarker
                                center={[point.lat!, point.lon!]}
                                radius={35}
                                pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.15,
                                    stroke: false
                                }}
                            />
                            {/* Mid Glow */}
                            <CircleMarker
                                center={[point.lat!, point.lon!]}
                                radius={15}
                                pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.3,
                                    stroke: false
                                }}
                            />
                            {/* Core Node */}
                            <CircleMarker
                                center={[point.lat!, point.lon!]}
                                radius={4}
                                pathOptions={{
                                    color: '#ffffff',
                                    fillColor: color,
                                    fillOpacity: 1,
                                    weight: 2
                                }}
                            >
                                <Popup className="cyberpunk-popup">
                                    <div className="font-mono text-xs p-1">
                                        <strong className="text-primary block mb-1 text-sm">{point.ip}</strong>
                                        <span className="block text-muted-foreground uppercase">{point.country || 'Unknown Location'}</span>
                                        {point.threatLevel && (
                                            <div className={`mt-2 px-2 py-0.5 text-[10px] font-bold rounded border ${isCritical ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-blue-500/50 bg-blue-500/10 text-blue-500'}`}>
                                                THREAT: {point.threatLevel}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
}
