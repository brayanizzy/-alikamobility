import React from 'react';

const RoleCard = ({ icon: Icon, title, description, accent = 'primary' }) => {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300 h-full flex flex-col">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accentClasses[accent] || accentClasses.primary}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default RoleCard;
