import { Settings as SettingsIcon, Shield, Layout, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export function Settings() {
    // Load initial state from local storage or defaults
    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem('proinfo_high_contrast') === 'true';
    });
    const [reducedMotion, setReducedMotion] = useState(() => {
        return localStorage.getItem('proinfo_reduced_motion') === 'true';
    });

    // Load Keys
    const [shodanKey, setShodanKey] = useState(() => localStorage.getItem('proinfo_shodan_key') || '');
    const [ipwhoisKey, setIpwhoisKey] = useState(() => localStorage.getItem('proinfo_ipwhois_key') || '');
    const [abuseKey, setAbuseKey] = useState(() => localStorage.getItem('proinfo_abuse_key') || '');
    const [envKeys, setEnvKeys] = useState({ shodan: false, ipwhois: false, abuse: false });

    // Check Env
    useEffect(() => {
        setEnvKeys({
            shodan: !!import.meta.env.VITE_SHODAN_API_KEY,
            ipwhois: !!import.meta.env.VITE_IPWHOIS_API_KEY,
            abuse: !!import.meta.env.VITE_ABUSEIPDB_API_KEY
        });
    }, []);

    const saveKeys = () => {
        localStorage.setItem('proinfo_shodan_key', shodanKey);
        localStorage.setItem('proinfo_ipwhois_key', ipwhoisKey);
        localStorage.setItem('proinfo_abuse_key', abuseKey);
        // Toast or visual feedback could go here
    };

    // Apply High Contrast
    useEffect(() => {
        const root = document.documentElement;
        if (highContrast) {
            root.classList.add('high-contrast');
            // Brutal force high contrast overrides
            root.style.setProperty('--background', '0 0% 0%'); // Pure black
            root.style.setProperty('--foreground', '0 0% 100%'); // Pure white
            root.style.setProperty('--card', '0 0% 5%');
            root.style.setProperty('--primary', '60 100% 50%'); // High vis yellow
            root.style.setProperty('--muted', '0 0% 20%');
        } else {
            root.classList.remove('high-contrast');
            root.style.removeProperty('--background');
            root.style.removeProperty('--foreground');
            root.style.removeProperty('--card');
            root.style.removeProperty('--primary');
            root.style.removeProperty('--muted');
        }
        localStorage.setItem('proinfo_high_contrast', String(highContrast));
    }, [highContrast]);

    // Apply Reduced Motion
    useEffect(() => {
        const root = document.documentElement;
        if (reducedMotion) {
            root.classList.add('motion-reduce');
            // We can use a global CSS rule for this or specific class
        } else {
            root.classList.remove('motion-reduce');
        }
        localStorage.setItem('proinfo_reduced_motion', String(reducedMotion));
    }, [reducedMotion]);

    return (
        <div className="p-6 space-y-6 text-foreground animate-in fade-in duration-500 pb-20">
            <header className="mb-8 border-b border-white/10 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <SettingsIcon className="text-primary animate-spin-slow" /> SYSTEM_CONFIG
                </h1>
                <p className="text-muted-foreground mt-2 font-mono text-sm">Global System Parameters & API Gateways</p>
            </header>

            {/* API Key Management */}
            <section className="bg-card/50 backdrop-blur-sm border border-primary/20 p-6 rounded-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={100} />
                </div>

                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Shield size={18} /> API CREDENTIALS
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Shodan */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-white block">SHODAN API KEY</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={shodanKey}
                                onChange={(e) => setShodanKey(e.target.value)}
                                placeholder={envKeys.shodan ? "Loaded from Environment (.env)" : "Enter your API Key"}
                                className={cn(
                                    "w-full bg-black/50 border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none transition-all",
                                    envKeys.shodan ? "border-green-500/50 text-green-500" : "border-white/10 text-white"
                                )}
                                disabled={envKeys.shodan}
                            />
                            {envKeys.shodan && <span className="absolute right-3 top-2.5 text-[10px] text-green-500 font-bold">ENV ACTIVE</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Required for deep scan results. <br />
                            <a href="https://account.shodan.io/" target="_blank" className="text-primary hover:underline flex items-center gap-1 mt-1">
                                Get a Free Key <Layout size={10} />
                            </a>
                        </p>
                    </div>

                    {/* IpWhois */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-white block">IPWHOIS.IO KEY</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={ipwhoisKey}
                                onChange={(e) => setIpwhoisKey(e.target.value)}
                                placeholder={envKeys.ipwhois ? "Loaded from Environment (.env)" : "Optional (Improves Rate Limits)"}
                                className={cn(
                                    "w-full bg-black/50 border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none transition-all",
                                    envKeys.ipwhois ? "border-green-500/50 text-green-500" : "border-white/10 text-white"
                                )}
                                disabled={envKeys.ipwhois}
                            />
                            {envKeys.ipwhois && <span className="absolute right-3 top-2.5 text-[10px] text-green-500 font-bold">ENV ACTIVE</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Increases rate limits for bulk scanning. <br />
                            <a href="https://ipwhois.io/" target="_blank" className="text-primary hover:underline flex items-center gap-1 mt-1">
                                Get a Free Key <Layout size={10} />
                            </a>
                        </p>
                    </div>

                    {/* AbuseIPDB */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-white block">ABUSEIPDB KEY</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={abuseKey}
                                onChange={(e) => setAbuseKey(e.target.value)}
                                placeholder={envKeys.abuse ? "Loaded from Environment (.env)" : "Optional (For Reputation Score)"}
                                className={cn(
                                    "w-full bg-black/50 border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none transition-all",
                                    envKeys.abuse ? "border-green-500/50 text-green-500" : "border-white/10 text-white"
                                )}
                                disabled={envKeys.abuse}
                            />
                            {envKeys.abuse && <span className="absolute right-3 top-2.5 text-[10px] text-green-500 font-bold">ENV ACTIVE</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Required for Malicious Confidence Scores. <br />
                            <a href="https://www.abuseipdb.com/account/api" target="_blank" className="text-primary hover:underline flex items-center gap-1 mt-1">
                                Get a Free Key (1000/day) <Layout size={10} />
                            </a>
                        </p>
                    </div>
                </div>

                {!envKeys.shodan && !envKeys.ipwhois && !envKeys.abuse && (
                    <button
                        onClick={saveKeys}
                        className="mt-6 px-4 py-2 bg-primary hover:bg-primary/80 text-black font-bold rounded text-sm transition-all"
                    >
                        SAVE CREDENTIALS
                    </button>
                )}
            </section>

            {/* API Status */}
            <section className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Shield size={18} /> API SYSTEMS STATUS
                </h2>

                <div className="space-y-3">
                    <div className="p-3 bg-black/20 rounded border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                            <span>InternetDB (Shodan)</span>
                            <span className="text-green-500">ACTIVE</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            <Info size={10} className="inline mr-1" />
                            Using public non-commercial endpoint.
                            <br />Limit: High burst capacity. Free for personal use.
                        </p>
                    </div>

                    <div className="p-3 bg-black/20 rounded border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                            <span>ipwho.is</span>
                            <span className="text-green-500">ACTIVE</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            <Info size={10} className="inline mr-1" />
                            Free tier: 10,000 requests/month restriction.
                            <br />Targeting above 200 IPs/sec may trigger rate limiting.
                        </p>
                    </div>
                </div>
            </section>

            {/* Accessibility */}
            <section className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Layout size={18} /> INTERFACE PREFERENCES
                </h2>

                <div className="space-y-3">
                    <button
                        onClick={() => setHighContrast(!highContrast)}
                        className="w-full flex items-center justify-between p-3 bg-black/20 rounded hover:bg-black/30 transition-colors border border-transparent hover:border-primary/20"
                    >
                        <span className="text-sm font-source font-bold text-foreground">High Contrast Mode</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${highContrast ? 'bg-primary' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${highContrast ? 'left-6' : 'left-1'}`} />
                        </div>
                    </button>

                    <button
                        onClick={() => setReducedMotion(!reducedMotion)}
                        className="w-full flex items-center justify-between p-3 bg-black/20 rounded hover:bg-black/30 transition-colors border border-transparent hover:border-primary/20"
                    >
                        <span className="text-sm font-source font-bold text-foreground">Reduced Motion</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${reducedMotion ? 'bg-primary' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${reducedMotion ? 'left-6' : 'left-1'}`} />
                        </div>
                    </button>

                    <p className="text-[10px] text-muted-foreground mt-2">
                        Adjusts system-wide animations and color contrast for better accessibility.
                    </p>
                </div>
            </section>
        </div>
    );
}
