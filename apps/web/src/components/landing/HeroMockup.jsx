import React from 'react';
import { QrCode, Bell, Wifi, CheckCircle2, TrendingUp, Wallet } from 'lucide-react';

/**
 * Visuel SaaS 100% HTML/CSS (aucune image lourde) représentant :
 * - une carte dashboard avec KPIs
 * - un téléphone agent terrain
 * - un QR code stylisé
 * - une notification
 * - un mini reçu de paiement
 * - un badge "Synchronisé"
 */
const HeroMockup = () => {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0 select-none">
      {/* Carte dashboard principale */}
      <div className="relative rounded-3xl border border-border bg-card shadow-elevated p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Encaissements du jour</p>
            <p className="text-2xl font-extrabold text-foreground">1 240 000 FC</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" /> +12%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Membres', value: '482' },
            { label: 'Véhicules', value: '96' },
            { label: 'Dettes', value: '14' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl bg-muted/60 border border-border/60 px-3 py-2.5">
              <p className="text-lg font-bold text-foreground leading-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/40 border border-border/40 flex items-center px-3 gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="h-2 w-24 bg-muted rounded-full" />
              <div className="h-2 w-10 bg-muted rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Mini reçu paiement flottant */}
      <div className="hidden sm:flex absolute -left-8 bottom-10 z-20 rounded-2xl border border-border bg-card shadow-modal p-3 w-40 animate-float">
        <div className="w-full">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Reçu #A-2044</p>
          <p className="text-sm font-bold text-foreground mb-2">5 000 FC</p>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-success">
            <CheckCircle2 className="w-3 h-3" /> Payé
          </div>
        </div>
      </div>

      {/* Badge notification flottant */}
      <div
        className="hidden sm:flex absolute -right-6 top-6 z-20 items-center gap-2 rounded-2xl border border-border bg-card shadow-modal px-3 py-2.5 animate-float"
        style={{ animationDelay: '1.2s' }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20">
          <Bell className="w-3.5 h-3.5 text-secondary" />
        </span>
        <div>
          <p className="text-[11px] font-bold text-foreground leading-tight">Paiement reçu</p>
          <p className="text-[10px] text-muted-foreground leading-tight">à l'instant</p>
        </div>
      </div>

      {/* QR code stylisé */}
      <div className="hidden md:flex absolute -right-10 bottom-0 z-20 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card shadow-modal p-3">
        <div className="grid grid-cols-5 grid-rows-5 gap-[2px] w-16 h-16">
          {Array.from({ length: 25 }).map((_, i) => (
            <span
              key={i}
              className={`rounded-[1px] ${[0,1,2,4,5,9,10,12,14,15,19,20,22,23,24,3,7,11,16,21].includes(i) ? 'bg-foreground' : 'bg-transparent'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
          <QrCode className="w-3 h-3" /> QR sécurisé
        </div>
      </div>

      {/* Badge synchronisation */}
      <div className="absolute left-2 -top-4 z-20 flex items-center gap-1.5 rounded-full border border-border bg-card shadow-md px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
          <Wifi className="w-3 h-3 text-success" /> Synchronisé
        </span>
      </div>
    </div>
  );
};

export default HeroMockup;
