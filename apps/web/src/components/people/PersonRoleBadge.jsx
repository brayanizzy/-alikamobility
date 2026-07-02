import React from 'react';

const ROLE_CONFIG = {
  driver: { label: 'Chauffeur', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  owner: { label: 'Propriétaire', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  member: { label: 'Membre', bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' },
};

const PersonRoleBadge = ({ role = 'member', className = '' }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
};

export default PersonRoleBadge;
