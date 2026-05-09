
import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { isOnline, queueMutation } from '@/utils/OfflineService.js';
import { Loader2, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MemberForm = ({ existingMember, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  
  const DRAFT_KEY = `draft_member_${existingMember?.id || 'new'}`;

  const [formData, setFormData] = useState({
    name: existingMember?.name || '',
    phone: existingMember?.phone || '',
    moto_number: existingMember?.moto_number || '',
    parking_id: existingMember?.parking_id || '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(
    existingMember?.photo ? pb.files.getUrl(existingMember, existingMember.photo) : null
  );

  useEffect(() => {
    // Check for draft
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft && !existingMember) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.name || parsed.phone || parsed.moto_number) {
          if (window.confirm("Voulez-vous restaurer le brouillon précédent ?")) {
            setFormData(prev => ({ ...prev, ...parsed, photo: null })); // Cannot easily restore File objects
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } catch(e) { /* ignore */ }
    }

    const fetchParkings = async () => {
      try {
        const res = await pb.collection('parkings').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          $autoCancel: false
        });
        setParkings(res);
        if (!formData.parking_id && res.length > 0) {
          setFormData(prev => ({ ...prev, parking_id: res[0].id }));
        }
      } catch (err) {
        console.error('Error fetching parkings:', err);
      }
    };
    fetchParkings();
  }, [currentUser.organization_id]);

  // Auto-save draft
  useEffect(() => {
    const draftData = { ...formData, photo: null };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }, [formData, DRAFT_KEY]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis";
    else if (!/^\d{9,15}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = "Format de téléphone invalide";
    if (!formData.moto_number.trim()) newErrors.moto_number = "La plaque est requise";
    if (!formData.parking_id) newErrors.parking_id = "Le parking est requis";

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
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
      if (!isOnline()) {
        // Offline handling (simplified for member creation without file upload)
        if (formData.photo) {
          toast.error("Impossible d'uploader une photo hors ligne. Retirez la photo pour continuer.");
          setIsSubmitting(false);
          return;
        }
        
        const offlineData = {
          ...formData,
          organization_id: currentUser.organization_id,
          status: 'active',
          member_id: `MEM${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        };
        
        queueMutation('members', existingMember ? 'update' : 'create', offlineData);
        toast.success("Enregistré hors ligne. Synchronisation dès que la connexion revient.");
        localStorage.removeItem(DRAFT_KEY);
        onClose();
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('moto_number', formData.moto_number.toUpperCase());
      data.append('parking_id', formData.parking_id);
      
      if (!existingMember) {
        data.append('organization_id', currentUser.organization_id);
        data.append('status', 'active');
        const randomId = `MEM${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        data.append('member_id', randomId);
      }

      if (formData.photo instanceof File) {
        data.append('photo', formData.photo);
      }

      let record;
      if (existingMember) {
        record = await pb.collection('members').update(existingMember.id, data, { $autoCancel: false });
        toast.success("Membre mis à jour avec succès");
      } else {
        record = await pb.collection('members').create(data, { $autoCancel: false });
        const qrData = `${record.id}|${currentUser.organization_id}`;
        await pb.collection('qrcodes').create({
          organization_id: currentUser.organization_id,
          member_id: record.id,
          qr_data: qrData
        }, { $autoCancel: false });
        toast.success("Nouveau membre ajouté avec succès");
      }
      
      localStorage.removeItem(DRAFT_KEY);
      onSuccess(record);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement du membre");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Nom complet *</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={(e) => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }}
            className={`w-full h-11 px-4 rounded-xl bg-input border ${errors.name ? 'border-destructive ring-1 ring-destructive' : 'border-border'} text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          />
          {errors.name && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.name}</p>}
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Téléphone *</label>
          <input 
            type="tel" 
            name="phone"
            value={formData.phone}
            onChange={(e) => { setFormData({...formData, phone: e.target.value}); setErrors({...errors, phone: ''}); }}
            className={`w-full h-11 px-4 rounded-xl bg-input border ${errors.phone ? 'border-destructive ring-1 ring-destructive' : 'border-border'} text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.phone}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Plaque Moto *</label>
          <input 
            type="text" 
            name="moto_number"
            value={formData.moto_number}
            onChange={(e) => { setFormData({...formData, moto_number: e.target.value}); setErrors({...errors, moto_number: ''}); }}
            className={`w-full h-11 px-4 rounded-xl bg-input border ${errors.moto_number ? 'border-destructive ring-1 ring-destructive' : 'border-border'} text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all uppercase`}
          />
          {errors.moto_number && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.moto_number}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Parking Assigné *</label>
          <select 
            name="parking_id"
            value={formData.parking_id}
            onChange={(e) => { setFormData({...formData, parking_id: e.target.value}); setErrors({...errors, parking_id: ''}); }}
            className={`w-full h-11 px-4 rounded-xl bg-input border ${errors.parking_id ? 'border-destructive ring-1 ring-destructive' : 'border-border'} text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none`}
          >
            <option value="" disabled>Sélectionner un parking</option>
            {parkings.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.parking_id && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.parking_id}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (existingMember ? 'Mettre à jour' : 'Ajouter')}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
