import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import MemberSelector from '@/components/people/MemberSelector.jsx';
import { toast } from 'sonner';

const CARD_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

const initialData = {
  card_type: 'standard',
  issued_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  pin: '',
  notes: '',
};

const MemberCardForm = ({ onSubmit, submitLabel, submitting, initial }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ ...initialData, ...initial });
  const [selectedMember, setSelectedMember] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setFormData(prev => ({ ...prev, ...initial }));
    }
  }, [initial]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleMemberSelect = useCallback((member) => {
    setSelectedMember(member);
    if (member) {
      handleChange('member_id', member.id);
    } else {
      handleChange('member_id', '');
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.member_id) errs.member_id = 'Veuillez sélectionner un membre';
    if (!formData.issued_date) errs.issued_date = "La date d'émission est requise";
    if (formData.expiry_date && formData.expiry_date < formData.issued_date) {
      errs.expiry_date = "La date d'expiration doit être postérieure à la date d'émission";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      organization_id: currentUser.organization_id,
      member_id: formData.member_id,
      card_number: formData.card_number || initial?.card_number,
      card_type: formData.card_type,
      issued_date: formData.issued_date,
      expiry_date: formData.expiry_date || null,
      pin: formData.pin || null,
      notes: formData.notes || null,
    };

    if (!data.card_number) {
      try {
        const res = await pb.collection('member_cards').getList(1, 1, {
          filter: `organization_id = "${currentUser.organization_id}"`,
          sort: '-created',
          fields: 'card_number',
          $autoCancel: false,
        });
        const lastNum = res.items?.[0]?.card_number || 'CARD-000000';
        const seq = parseInt(lastNum.split('-')[1] || '0', 10) + 1;
        data.card_number = `CARD-${String(seq).padStart(6, '0')}`;
      } catch {
        data.card_number = `CARD-${String(Date.now()).slice(-6)}`;
      }
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Membre *</label>
        <MemberSelector
          value={selectedMember}
          onChange={handleMemberSelect}
          error={errors.member_id}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Type de carte</label>
        <div className="grid grid-cols-3 gap-3">
          {CARD_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleChange('card_type', t.value)}
              className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                formData.card_type === t.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Date d'émission *</label>
          <input
            type="date"
            value={formData.issued_date}
            onChange={e => handleChange('issued_date', e.target.value)}
            className="w-full p-3 rounded-xl bg-muted border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          {errors.issued_date && <p className="text-xs text-destructive mt-1">{errors.issued_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Date d'expiration</label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={e => handleChange('expiry_date', e.target.value)}
            min={formData.issued_date}
            className="w-full p-3 rounded-xl bg-muted border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          {errors.expiry_date && <p className="text-xs text-destructive mt-1">{errors.expiry_date}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Code PIN (optionnel, pour vérification hors ligne)</label>
        <input
          type="text"
          value={formData.pin}
          onChange={e => handleChange('pin', e.target.value)}
          maxLength={6}
          placeholder="Ex: 1234"
          className="w-full p-3 rounded-xl bg-muted border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="Informations complémentaires..."
          className="w-full p-3 rounded-xl bg-muted border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
        />
      </div>

      <motion.button
        type="submit"
        disabled={submitting}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
      >
        {submitting ? 'Enregistrement...' : submitLabel || 'Créer la carte'}
      </motion.button>
    </form>
  );
};

export default MemberCardForm;
