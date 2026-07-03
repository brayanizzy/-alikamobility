
import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { isOnline, queueMutation } from '@/utils/OfflineService.js';
import { Loader2, Banknote, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentForm = ({ member, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  
  const DRAFT_KEY = `draft_payment_${member.id}`;

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Espèces',
    notes: ''
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.amount || parsed.notes) {
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      } catch(e) {}
    }
  }, [DRAFT_KEY]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, DRAFT_KEY]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount) newErrors.amount = "Le montant est requis";
    else if (Number(formData.amount) <= 0) newErrors.amount = "Le montant doit être > 0";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const paymentData = {
        organization_id: currentUser.organization_id,
        member_id: member.id,
        amount: Number(formData.amount),
        payment_date: `${today} 12:00:00.000Z`,
        payment_method: formData.payment_method,
        notes: formData.notes,
        status: 'paid',
        recorded_by: currentUser.name || currentUser.email
      };

      if (!isOnline()) {
        paymentData.id = crypto.randomUUID(); // Mock ID for queue
        queueMutation('payments', 'create', paymentData);
        toast.success("Paiement enregistré hors ligne");
      } else {
        const record = await pb.collection('payments').create(paymentData, { $autoCancel: false });
        toast.success("Paiement enregistré avec succès");
        if (onSuccess) onSuccess(record);
      }
      
      localStorage.removeItem(DRAFT_KEY);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center gap-4">
        {member.photo ? (
          <img src={pb.files.getUrl(member, member.photo)} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center font-bold text-foreground">{member.name.charAt(0)}</div>
        )}
        <div>
          <h4 className="font-bold text-foreground">{member.name}</h4>
          <p className="text-sm text-muted-foreground">{member.moto_number}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Montant (XAF) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <input 
              type="number" 
              name="amount"
              min="1"
              value={formData.amount}
              onChange={(e) => { setFormData({...formData, amount: e.target.value}); setErrors({...errors, amount: ''}); }}
              className={`w-full h-14 pl-12 pr-4 rounded-xl bg-input border ${errors.amount ? 'border-destructive ring-1 ring-destructive' : 'border-border'} text-foreground font-bold text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
              placeholder="5000"
            />
          </div>
          {errors.amount && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.amount}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Mode de Paiement *</label>
          <select 
            name="payment_method"
            value={formData.payment_method}
            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
            className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
          >
            <option value="Espèces">Espèces</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Virement">Virement</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Notes (Optionnel)</label>
          <textarea 
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full p-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none h-24"
            placeholder="Détails supplémentaires..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 px-4 py-4 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-[2] px-4 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Valider le paiement'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
