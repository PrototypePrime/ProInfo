
export interface IpInfo {
    ip: string;
    type?: 'IP' | 'DOMAIN';
    reverseDns?: string | null;
    owner?: string;
    country?: string;
    asn?: string;
    lat?: number;
    lon?: number;
    ports?: number[];
    vulns?: string[];
    hostnames?: string[];
    cpes?: string[];
    dnsRecords?: { type: string, value: string }[];
    linkedAssets?: string[]; // Pivoting targets (IPs or Domains)
    threatScore?: number;
    measure?: number; // Abuse Confidence (0-100)
    threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'loading' | 'success' | 'error';
    error?: string;
    source?: string;

    // Hierarchy Tracking
    depth?: number;
    via?: string;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Timeout helper
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

// Helper to get keys
const getKeys = () => ({
    shodan: import.meta.env.VITE_SHODAN_API_KEY || localStorage.getItem('proinfo_shodan_key'),
    ipwhois: import.meta.env.VITE_IPWHOIS_API_KEY || localStorage.getItem('proinfo_ipwhois_key'),
    abuse: import.meta.env.VITE_ABUSEIPDB_API_KEY || localStorage.getItem('proinfo_abuse_key')
});

// >>> NEW: AbuseIPDB Reputation Check
async function getAbuseReputation(ip: string): Promise<{ score: number, usageType?: string }> {
    try {
        const { abuse } = getKeys();
        if (!abuse) return { score: 0 };

        const response = await fetchWithTimeout(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
            headers: {
                'Key': abuse,
                'Accept': 'application/json'
            }
        }, 5000);

        if (!response.ok) return { score: 0 };
        const data = await response.json();
        return {
            score: data.data?.abuseConfidenceScore || 0,
            usageType: data.data?.usageType
        };
    } catch (e) {
        console.warn("AbuseIPDB check failed", e);
        return { score: 0 };
    }
}

// Deep Recon via InternetDB (Shodan)
async function getDeepRecon(ip: string): Promise<{ ports: number[], vulns: string[], hostnames: string[], cpes: string[] }> {
    try {
        // const { shodan } = getKeys(); // Future use

        // Placeholder for Shodan API usage if desired in future
        // console.log("Using Shodan Key:", shodan ? "YES" : "NO");

        const response = await fetchWithTimeout(`https://internetdb.shodan.io/${ip}`, {}, 5000);
        if (!response.ok) return { ports: [], vulns: [], hostnames: [], cpes: [] };
        const data = await response.json();
        return {
            ports: data.ports || [],
            vulns: data.vulns || [],
            hostnames: data.hostnames || [],
            cpes: data.cpes || []
        };
    } catch (e) {
        return { ports: [], vulns: [], hostnames: [], cpes: [] };
    }
}

function calculateThreatScore(info: Partial<IpInfo>): { score: number, level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } {
    let score = 0;

    // 1. Port Risk
    const highRiskPorts = [21, 23, 25, 53, 3389, 445, 135, 139, 8080, 8443];
    info.ports?.forEach(p => {
        if (highRiskPorts.includes(p)) score += 10;
        else score += 1;
    });

    // 2. Vulnerability Risk
    if (info.vulns && info.vulns.length > 0) {
        score += info.vulns.length * 20;
    }

    // 3. Hosting/Cloud Provider Risk (Simplified check)
    const cloudProviders = ['AMAZON', 'DIGITALOCEAN', 'GOOGLE', 'MICROSOFT', 'ORACLE', 'ALIBABA', 'TENCENT'];
    if (cloudProviders.some(p => info.owner?.toUpperCase().includes(p))) {
        score += 5; // Slight bump for cloud hosting (common for bots)
    }

    // Cap at 100
    score = Math.min(score, 100);

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score >= 20) level = 'MEDIUM';

    return { score, level };
}

// >>> NEW: DNS Record Fetcher (for Domains)
async function getDnsRecords(domain: string): Promise<{ records: { type: string, value: string }[], ip: string | null }> {
    try {
        // Query A records to get IP
        const responseAs = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const dataA = await responseAs.json();

        let ip: string | null = null;
        const records: { type: string, value: string }[] = [];

        if (dataA.Answer) {
            dataA.Answer.forEach((a: any) => {
                records.push({ type: 'A', value: a.data });
                if (!ip && a.type === 1) ip = a.data; // Capture first IP
            });
        }

        // Query MX
        const responseMx = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const dataMx = await responseMx.json();
        if (dataMx.Answer) {
            dataMx.Answer.forEach((m: any) => records.push({ type: 'MX', value: m.data }));
        }

        return { records, ip };
    } catch (e) {
        return { records: [], ip: null };
    }
}

// Using Cloudflare DNS-over-HTTPS
export async function reverseDnsLookup(ip: string): Promise<{ result: string | null, source: string }> {
    try {
        const reversed = ip.split('.').reverse().join('.') + '.in-addr.arpa';
        const response = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${reversed}&type=PTR`, {
            headers: { 'Accept': 'application/dns-json' }
        });

        if (!response.ok) throw new Error(`DNS Status ${response.status}`);

        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
            return { result: data.Answer[0].data.replace(/\.$/, ''), source: 'Cloudflare DoH' };
        }
        return { result: null, source: 'Cloudflare DoH (No Data)' };
    } catch (e) {
        console.warn(`DNS Error for ${ip}:`, e);
        return { result: null, source: 'DNS Error' };
    }
}

// Universal IP Data (Whois + Geo)
export async function getIpWhois(ip: string): Promise<{ data: Partial<IpInfo>, source: string }> {
    try {
        const { ipwhois } = getKeys();

        // If key exists, use it to bypass free tier strict limits
        const url = ipwhois
            ? `https://ipwhois.app/json/${ip}?key=${ipwhois}` // Premium/Keyed endpoint if available
            : `https://ipwhois.app/json/${ip}`;

        // Note: Using ipwho.is for now as it's the stable free provider we rely on
        const response = await fetchWithTimeout(url.replace('ipwhois.app', 'ipwho.is'), {}, 5000);

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        if (!data.success) throw new Error('API Failed');

        return {
            data: {
                owner: data.connection?.org || data.connection?.isp || 'N/A',
                country: data.country || 'N/A',
                asn: data.connection?.asn ? `AS${data.connection.asn}` : 'N/A',
                lat: data.latitude,
                lon: data.longitude
            },
            source: 'ipwho.is'
        };
    } catch (e) {
        console.warn(`Primary lookup failed for ${ip}:`, e);
        return { data: {}, source: 'All Lookups Failed' };
    }
}

// Main Analysis Function
export async function analyzeIp(input: string, depth = 0, via?: string): Promise<IpInfo> {
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
    const defaultInfo: IpInfo = { ip: input, status: 'loading', type: isIp ? 'IP' : 'DOMAIN', depth, via };

    // Basic Validation
    if (!isIp && !input.includes('.') && input !== 'localhost') {
        return { ...defaultInfo, status: 'error', error: 'Invalid Target' };
    }

    try {
        let targetIp = input;
        let dnsData: any = { records: [], ip: null };

        // 1. Resolve Domain if needed
        if (!isIp) {
            dnsData = await getDnsRecords(input);
            if (dnsData.ip) {
                targetIp = dnsData.ip; // Pivot to analysis IP
            } else {
                return { ...defaultInfo, status: 'error', error: 'Could not resolve domain' };
            }
        }

        // 2. Parallel Recon
        const [dns, whois, deepRecon, abuse] = await Promise.all([
            reverseDnsLookup(targetIp),
            getIpWhois(targetIp),
            getDeepRecon(targetIp),
            getAbuseReputation(targetIp)
        ]);

        let info: IpInfo = {
            ...defaultInfo, // Contains original input name
            status: 'success',

            // If it was a domain, show domain as name, resolved IP in separate field (or just use IP for recon data)
            // Ideally we store the actual IP we scanned

            reverseDns: dns.result,
            ...whois.data,
            ...deepRecon,
            dnsRecords: dnsData.records,
            // PIVOT DATA:
            // If Domain: Linked Assets are the IPs we resolved (A Records)
            // If IP: Linked Assets are the Reverse DNS domains found
            linkedAssets: !isIp
                ? [dnsData.ip].filter(Boolean) as string[] // Domain -> IP
                : dns.result ? [dns.result] : [], // IP -> Domain

            measure: abuse.score, // Abuse Score
            source: `${dns.source} / ${whois.source} / InternetDB`
        };

        // 3. Calc Threat
        // If AbuseIPDB gave a high score, force high threat
        const calculated = calculateThreatScore(info);

        // Merge AbuseIPDB Confidence into Threat Score logic
        // Formula: Max(Calculated, AbuseScore)
        info.threatScore = Math.max(calculated.score, abuse.score);

        // Recalculate Level based on new Max Score
        if (info.threatScore >= 80) info.threatLevel = 'CRITICAL';
        else if (info.threatScore >= 50) info.threatLevel = 'HIGH';
        else if (info.threatScore >= 20) info.threatLevel = 'MEDIUM';
        else info.threatLevel = 'LOW';

        return info;

    } catch (e) {
        return { ...defaultInfo, status: 'error', error: 'Analysis failed' };
    }
}
