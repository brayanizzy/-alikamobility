import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { isOfficeCollector } from '@/utils/roles.js';

const MAX_VISIBLE = 5;

const MobileBottomNav = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  let items = [];
  if (currentUser.role === 'admin') {
    items = NAV_ITEMS.admin.main.filter(i => !i.path.includes('coming-soon'));
  } else if (currentUser.role === 'agent') {
    const agentType = isOfficeCollector(currentUser) ? 'office_collector' : 'field_collector';
    items = (NAV_ITEMS.agent[agentType] || []).filter(i => !i.path.includes('coming-soon'));
  }

  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visible.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 flex-1 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                isActive ? 'bg-primary/15' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium truncate max-w-full ${
                isActive ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
