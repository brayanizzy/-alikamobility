import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from 'next-themes';
import { NAV_ITEMS, PROFILE_LINKS } from '@/config/navigation.js';
import { isOfficeCollector, AGENT_TYPE_LABELS } from '@/utils/roles.js';
import { X, Sun, Moon, LogOut, ChevronRight } from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, onLogout }) => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!isOpen || !currentUser) return null;

  const role = currentUser.role;

  const renderGroup = (items, title) => (
    <div className="mb-3">
      {title && (
        <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground font-medium hover:bg-muted transition-all"
            >
              <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              {item.path.includes('coming-soon') ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Bientôt
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  let content;
  if (role === 'super-admin') {
    content = renderGroup(NAV_ITEMS['super-admin'], 'Super Admin');
  } else if (role === 'admin') {
    content = (
      <>
        {renderGroup(NAV_ITEMS.admin.main, 'Général')}
        {renderGroup(NAV_ITEMS.admin.transport, 'Transport')}
        {renderGroup(NAV_ITEMS.admin.finances, 'Finances')}
      </>
    );
  } else if (role === 'agent') {
    const agentType = isOfficeCollector(currentUser) ? 'office_collector' : 'field_collector';
    const agentItems = NAV_ITEMS.agent[agentType] || [];
    content = (
      <>
        {renderGroup(agentItems, AGENT_TYPE_LABELS[currentUser.agent_type] || 'Agent')}
        {renderGroup(PROFILE_LINKS.agent, 'Profil')}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-16 left-0 w-full max-h-[calc(100vh-4rem)] bg-card border-b border-border shadow-2xl overflow-y-auto pb-8">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-sm font-bold text-foreground">{currentUser.name || currentUser.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{role === 'agent' ? AGENT_TYPE_LABELS[currentUser.agent_type] : role}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3">
          {content}
          <div className="h-px bg-border my-3" />
          <div className="space-y-0.5">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-foreground font-medium hover:bg-muted transition-all"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
                {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              </button>
            )}
            <button
              onClick={() => { onClose(); onLogout?.(); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 dark:text-red-400 font-medium hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" /> Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
