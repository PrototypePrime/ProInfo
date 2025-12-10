import React, { useState } from 'react';
import { Menu, LayoutDashboard, Clock, Settings, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

export type ViewType = 'intel' | 'logs' | 'settings' | 'tools';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeView: ViewType;
    onNavigate: (view: ViewType) => void;
}

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-none w-full transition-all group border-l-2 relative overflow-hidden",
                active
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                    : "border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50",
                collapsed ? "justify-center px-0" : ""
            )}
            title={collapsed ? label : undefined}
        >
            <Icon size={20} className={cn("flex-shrink-0", active && "animate-pulse")} />

            {/* Using absolute positioning trick to ensure clean cut-off during animation, or simple conditional */}
            <span className={cn(
                "text-sm font-mono tracking-wider whitespace-nowrap transition-all duration-300 origin-left",
                collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
            )}>
                {label}
            </span>
        </button>
    );
}

export default function DashboardLayout({ children, activeView, onNavigate }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="h-screen bg-background flex text-foreground overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: sidebarCollapsed ? 70 : 260 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="border-r border-border bg-card/50 backdrop-blur-md flex flex-col h-full z-20"
            >
                <Logo collapsed={sidebarCollapsed} />

                <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className={cn("px-4 pb-2 text-[10px] font-mono text-muted-foreground uppercase opacity-50 transition-all", sidebarCollapsed && "opacity-0 h-0 p-0 overflow-hidden")}>
                        Modules
                    </div>
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="INTEL_SUITE"
                        active={activeView === 'intel'}
                        collapsed={sidebarCollapsed}
                        onClick={() => onNavigate('intel')}
                    />
                    <SidebarItem
                        icon={Clock}
                        label="SCAN_HISTORY"
                        active={activeView === 'logs'}
                        collapsed={sidebarCollapsed}
                        onClick={() => onNavigate('logs')}
                    />
                    <SidebarItem
                        icon={Wrench}
                        label="SOC_TOOLS"
                        active={activeView === 'tools'}
                        collapsed={sidebarCollapsed}
                        onClick={() => onNavigate('tools')}
                    />

                    <div className={cn("pt-6 px-4 pb-2 text-[10px] font-mono text-muted-foreground uppercase opacity-50 transition-all", sidebarCollapsed && "opacity-0 h-0 p-0 overflow-hidden")}>
                        System
                    </div>
                    <SidebarItem
                        icon={Settings}
                        label="SETTINGS"
                        active={activeView === 'settings'}
                        collapsed={sidebarCollapsed}
                        onClick={() => onNavigate('settings')}
                    />
                </nav>

                <div className="p-2 border-t border-border bg-black/20 flex-shrink-0">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="flex items-center justify-center w-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-y-auto custom-scrollbar">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                        <h1 className="text-sm font-mono text-primary/80 uppercase tracking-widest hidden md:block">
                            System Connected // {activeView === 'intel' ? 'IP_INTELLIGENCE_MODULE' : activeView === 'logs' ? 'MISSION_ARCHIVES' : activeView === 'tools' ? 'SOC_UTILITY_BELT' : 'SYSTEM_CONFIG'}
                        </h1>
                        <h1 className="text-sm font-mono text-primary/80 uppercase tracking-widest md:hidden">
                            {activeView === 'intel' ? 'INTEL' : activeView === 'logs' ? 'LOGS' : 'CONFIG'}
                        </h1>
                    </div>
                </header>

                <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 z-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
