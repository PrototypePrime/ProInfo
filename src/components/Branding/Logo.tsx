import { Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProInfoLogo({ collapsed = false }: { collapsed?: boolean }) {
    return (
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-md rotate-3 group-hover:rotate-6 transition-transform"></div>
                <div className="absolute inset-0 border border-primary/50 rounded-md -rotate-3 group-hover:-rotate-6 transition-transform"></div>
                <div className="relative z-10 text-primary">
                    <Shield size={20} className="fill-primary/10" strokeWidth={2.5} />
                    <Zap size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-accent text-accent animate-pulse" />
                </div>
            </div>

            {!collapsed && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col leading-none"
                >
                    <span className="font-black text-lg tracking-tighter text-foreground">
                        PRO<span className="text-primary">INFO</span>
                    </span>
                    <span className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-bold">
                        INTELLIGENCE
                    </span>
                </motion.div>
            )}
        </div>
    );
}
