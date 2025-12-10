# ProInfo Intelligence Suite
### Advanced OSINT & Threat Analysis Platform

**ProInfo** is a professional-grade Open Source Intelligence (OSINT) dashboard designed for streamlined IP reconnaissance, infrastructure analysis, and threat assessment. It consolidates multiple intelligence streams into a single, high-fidelity tactical view.

![Dashboard Preview](./public/preview.png)
*(Note: Add a screenshot here locally if desired)*

## 🚀 Key Features

### 🧠 INTEL_CORE Dashboard
Unified intelligence view merging Identity, Infrastructure, and Attack Surface data.
- **Identity**: Usage Type, ISP/Organization, Geolocation.
- **Infrastructure**: Reverse DNS (PTR), ASN, Hosting Provider.
- **Attack Surface**: 
    - Full Open Port scan (with risk color-coding).
    - Vulnerability Detection (CVEs with links to NVD).

### 🗺️ Tactical Visuals
- **Cyber-Heatmap**: Interactive map visualizing threat density with glowing "radiation" zones (Red for Critical, Cyan for Safe).
- **Link Topology**: Force-directed graph showing relationships between Targets, ASNs, and Organizations.

### 🛡️ Security & Privacy
- **Client-Side Storage**: All API keys and history are stored locally in your browser (`localStorage`).
- **Bring Your Own Key (BYOK)**: Support for personal Shodan and IpWhois API keys to bypass rate limits.
- **Privacy First**: No backend telemetry. Your scans are your business.

### 💾 Reporting
- **PDF Dossier**: Generate professional PDF reports for stake-holders.
- **Data Export**: Full CSV export including Risk Scores, CVE counts, and raw data for external processing.

## 🛠️ Technology Stack
- **Core**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS v3.4, Framer Motion
- **Visuals**: React Leaflet (Map), React Force Graph (Topology)
- **Utilities**: Lucide React (Icons), jsPDF (Reporting)

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/proinfo-suite.git
    cd proinfo-suite
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Configure Environment Variables:
    Create a `.env.local` file to pre-load API keys (Git ignored for security):
    ```ini
    VITE_SHODAN_API_KEY=your_shodan_key
    VITE_IPWHOIS_API_KEY=your_ipwhois_key
    ```

4.  Start the Development Server:
    ```bash
    npm run dev
    ```

## 📖 Usage Guide

1.  **Input Targets**: Enter IP addresses (one per line or comma-separated) in the input field.
2.  **Analyze**: Click "INITIALIZE SCAN". usage of keys will be automatic.
3.  **Review Intel**:
    - **INTEL_CORE**: Detailed card view per IP.
    - **TACTICAL_MAP**: Global distribution and threat heat map.
    - **LINK_TOPOLOGY**: Network relationship graph.
4.  **Export**: Use the "EXPORT DATA" or "PDF DOSSIER" buttons in the header to save your findings.
5.  **Settings**: Configure API Keys and Accessibility options (High Contrast / Reduced Motion) via the Settings module.

## 🔒 Security Note
This tool interacts with third-party APIs (`internetdb.shodan.io`, `ipwho.is`). While standard SSL encryption is used, be aware that your scan targets are visible to these providers.

## 📄 License
MIT License - Free for educational and professional use.
