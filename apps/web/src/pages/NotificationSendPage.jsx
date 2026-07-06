import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Send, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Mail, MessageSquare, Smartphone, Bell } from 'lucide-react';
import { toast } from 'sonner';

const CHANNEL_CONFIG = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10' },
  whatsapp: { label: 'WhatsApp', icon: Smartphone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  in_app: { label: 'In-App', icon: Bell, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const NotificationSendPage = () => {
  const [step, setStep] = useState('select'); // select | preview | sent
  const [channel, setChannel] = useState('email');
  const [recipientType, setRecipientType] = useState('member');
  const [recipientId, setRecipientId] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchTemplates = useCallback(async (ch) => {
    try {
      const res = await pb.request(`/notification-templates?channel=${ch}`);
      setTemplates(res.items || []);
    } catch { }
  }, []);

  useEffect(() => {
    fetchTemplates(channel);
  }, [channel, fetchTemplates]);

  const searchRecipients = useCallback(async (query) => {
    if (!query || query.length < 2) { setRecipients([]); return; }
    try {
      const res = await pb.collection(recipientType === 'member' ? 'members' : recipientType === 'driver' ? 'drivers' : 'users').getList(1, 10, {
        filter: `name~"${query}"`, $autoCancel: false,
      });
      setRecipients(res.items || []);
    } catch { setRecipients([]); }
  }, [recipientType]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setRecipientSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => searchRecipients(val), 300));
  };

  const handleSend = async () => {
    if (!selectedRecipient && !customMessage) {
      toast.error('Sélectionnez un destinataire ou saisissez un message');
      return;
    }
    setSending(true);
    try {
      const payload = {
        channel,
        recipient_type: recipientType,
        recipient_id: selectedRecipient?.id || null,
        template_code: selectedTemplate?.code || null,
        custom_message: customMessage || null,
        dry_run: dryRun,
        variables: {
          recipient_name: selectedRecipient?.name || '',
        },
      };
      const res = await pb.request('/notifications/send', {
        method: 'POST',
        body: payload,
      });
      setResult(res);
      setStep('sent');
      if (res.success) {
        toast.success(dryRun ? 'Simulation réussie' : 'Notification envoyée');
      } else {
        toast.error(res.error || 'Échec de l\'envoi');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi');
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setSelectedRecipient(null);
    setSelectedTemplate(null);
    setCustomMessage('');
    setResult(null);
    setRecipientSearch('');
  };

  const previewMessage = () => {
    if (selectedTemplate) {
      let msg = selectedTemplate.body;
      if (selectedRecipient) msg = msg.replace('{{recipient_name}}', selectedRecipient.name).replace('{{member_name}}', selectedRecipient.name);
      return msg;
    }
    return customMessage || 'Aperçu du message...';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Envoyer une notification" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <Send className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Envoyer une notification</h1>
        </div>

        {step === 'sent' && result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {result.success ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-destructive" />
              )}
              <div>
                <h3 className="font-bold text-foreground">{result.success ? 'Notification envoyée' : 'Échec de l\'envoi'}</h3>
                <p className="text-sm text-muted-foreground">
                  {result.dry_run ? 'Mode simulation — aucun message réel envoyé' : ''}
                </p>
              </div>
            </div>
            {result.error && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm mb-4">{result.error}</div>
            )}
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
              <p>ID Log : <span className="text-foreground font-mono">{result.log_id}</span></p>
              <p>Canal : <span className="text-foreground">{result.channel}</span></p>
              {result.provider_message_id && (
                <p>ID Provider : <span className="text-foreground font-mono">{result.provider_message_id}</span></p>
              )}
            </div>
            <button onClick={resetForm}
              className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
              Envoyer une autre notification
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Channel selection */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Canal d'envoi</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={key} onClick={() => { setChannel(key); setSelectedTemplate(null); }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${channel === key ? `${cfg.bg} ${cfg.color} border-${key === 'email' ? 'blue' : key === 'sms' ? 'green' : key === 'whatsapp' ? 'emerald' : 'purple'}-500/50` : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'}`}>
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Destinataire</h2>
              <div className="flex gap-2 mb-3">
                {[{ key: 'member', label: 'Membre' }, { key: 'driver', label: 'Chauffeur' }, { key: 'user', label: 'Utilisateur' }].map(r => (
                  <button key={r.key} onClick={() => { setRecipientType(r.key); setSelectedRecipient(null); setRecipients([]); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recipientType === r.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              <input type="text" value={recipientSearch} onChange={handleSearchChange} placeholder="Rechercher par nom..."
                className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 mb-2" />
              {recipients.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {recipients.map(r => (
                    <button key={r.id} onClick={() => { setSelectedRecipient(r); setRecipientSearch(r.name); setRecipients([]); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${selectedRecipient?.id === r.id ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                      {r.name} {r.phone ? `— ${r.phone}` : ''} {r.email ? `— ${r.email}` : ''}
                    </button>
                  ))}
                </div>
              )}
              {selectedRecipient && (
                <div className="mt-2 bg-primary/5 rounded-xl px-3 py-2 text-sm text-foreground">
                  ✓ {selectedRecipient.name} {selectedRecipient.phone ? `(${selectedRecipient.phone})` : ''}
                </div>
              )}
            </div>

            {/* Template */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Template ou message personnalisé</h2>
              {templates.length > 0 && (
                <div className="grid gap-1.5 mb-4">
                  {templates.filter(t => t.is_active).map(tpl => (
                    <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl); setCustomMessage(''); }}
                      className={`text-left px-3 py-2 rounded-xl text-sm border transition-all ${selectedTemplate?.id === tpl.id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-foreground hover:bg-muted/50'}`}>
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
              <textarea value={customMessage} onChange={(e) => { setCustomMessage(e.target.value); if (e.target.value) setSelectedTemplate(null); }}
                placeholder="Ou saisissez un message personnalisé..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground/50 resize-none" />
            </div>

            {/* Preview */}
            {(selectedTemplate || customMessage) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold text-foreground">Aperçu du message</h2>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">
                  {previewMessage()}
                </div>
              </motion.div>
            )}

            {/* Send */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary" />
                  Mode simulation (dry-run)
                </label>
              </div>
              <button onClick={handleSend} disabled={sending || (!selectedRecipient && !customMessage)}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Envoi en cours...' : dryRun ? 'Simuler l\'envoi' : 'Envoyer la notification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSendPage;
