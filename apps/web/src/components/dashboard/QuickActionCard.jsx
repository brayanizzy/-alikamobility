import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const QuickActionCard = ({ icon: Icon, title, description, href, onClick, comingSoon = false, color = 'primary', className = '' }) => {
  const colorMap = {
    primary: { bg: 'bg-primary/10', icon: 'text-primary', hover: 'hover:bg-primary/20' },
    secondary: { bg: 'bg-secondary/10', icon: 'text-secondary', hover: 'hover:bg-secondary/20' },
    accent: { bg: 'bg-accent/30', icon: 'text-accent-foreground', hover: 'hover:bg-accent/40' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', hover: 'hover:bg-amber-500/20' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', hover: 'hover:bg-red-500/20' },
  };

  const c = colorMap[color] || colorMap.primary;
  const Wrapper = comingSoon ? 'div' : Link;

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Wrapper
        to={comingSoon ? undefined : href}
        onClick={comingSoon ? undefined : onClick}
        className={`bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 transition-all shadow-card flex flex-col items-center justify-center gap-3 text-center group ${comingSoon ? 'opacity-70' : ''} ${className}`}
      >
        <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center group-hover:${c.hover} transition-colors group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
        <span className="font-bold text-sm text-foreground">
          {title}
        </span>
        {(description || comingSoon) && (
          <span className="text-[10px] text-muted-foreground -mt-1">
            {comingSoon ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">Bientôt</span>
            ) : description}
          </span>
        )}
      </Wrapper>
    </motion.div>
  );
};

export default QuickActionCard;
