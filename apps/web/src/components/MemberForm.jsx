
import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { isOnline, queueMutation } from '@/utils/OfflineService.js';
import { generateMemberCode, generateQrSecret } from '@/utils/qrUtils.js';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Camera, AlertCircle, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const MemberForm = ({ existingMember, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [errors, setErrors] = useState({});
  const [orgCity, setOrgCity] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [generatedQr, setGeneratedQr] = useState(null); // Show QR after creation
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);
  
  const DRAFT_KEY = `draft_member_${existingMember?.id || 'new'}`;

  const [formData, setFormData] = useState({
    name: existingMember?.name || '',
    phone: existingMember?.phone || '',
    moto_number: existingMember?.moto_number || '',
    parking_id: existingMember?.parking_id || '',
    emergency_contact: existingMember?.emergency_contact || '',
    daily_fee: existingMember?.daily_fee || 500,
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
            setFormData(prev => ({ ...prev, ...parsed, photo: null }));
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } catch(e) { /* ignore */ }
    }

    const fetchData = async () => {
      // Fetch parkings (critical for form)
      try {
        const parkingsRes = await pb.collection('parkings').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          $autoCancel: false
        });
        setParkings(parkingsRes);
        if (!formData.parking_id && parkingsRes.length > 0) {
          setFormData(prev => ({ ...prev, parking_id: parkingsRes[0].id }));
        }
      } catch (err) {
        console.error('Error fetching parkings:', err);
      }

      // Fetch member count (for code generation)
      try {
        const membersCountRes = await pb.collection('members').getList(1, 1, {
          filter: `organization_id = "${currentUser.organization_id}"`,
          $autoCancel: false
        });
        setMemberCount(membersCountRes.totalItems);
      } catch (err) {
        console.error('Error fetching member count:', err);
      }

      // Fetch org info (for city prefix in QR code)
      try {
        const orgRes = await pb.collection('organizations').getOne(currentUser.organization_id, { $autoCancel: false });
        setOrgCity(orgRes.city || '');
      } catch (err) {
        console.error('Error fetching org:', err);
      }
    };
    fetchData();
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
      const firstErrorField = Object.keys(newErrors)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.focus();
      return false;
    }
    return true;
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (!isOnline()) {
        if (formData.photo) {
          toast.error("Impossible d'uploader une photo hors ligne. Retirez la photo pour continuer.");
          setIsSubmitting(false);
          return;
        }
        
        const memberCode = generateMemberCode(orgCity, memberCount);
        const qrSecret = generateQrSecret(memberCode, currentUser.organization_id);
        
        const offlineData = {
          ...formData,
          organization_id: currentUser.organization_id,
          status: 'active',
          member_id: memberCode,
          member_code: memberCode,
          qr_secret: qrSecret,
          qr_code: qrSecret,
          join_date: new Date().toISOString().split('T')[0]
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
      data.append('emergency_contact', formData.emergency_contact);
      data.append('daily_fee', formData.daily_fee);
      
      if (!existingMember) {
        // Generate unique member code and QR secret
        const memberCode = generateMemberCode(orgCity, memberCount);
        const qrSecret = generateQrSecret(memberCode, currentUser.organization_id);
        
        data.append('organization_id', currentUser.organization_id);
        data.append('status', 'active');
        data.append('member_id', memberCode);
        data.append('member_code', memberCode);
        data.append('qr_secret', qrSecret);
        data.append('qr_code', qrSecret);
        data.append('join_date', new Date().toISOString().split('T')[0]);
      }

      if (formData.photo instanceof File) {
        data.append('photo', formData.photo);
      }

      let record;
      if (existingMember) {
        record = await pb.collection('members').update(existingMember.id, data, { $autoCancel: false });
        toast.success("Membre mis à jour avec succès");
        localStorage.removeItem(DRAFT_KEY);
        onSuccess(record);
        onClose();
      } else {
        record = await pb.collection('members').create(data, { $autoCancel: false });
        toast.success("Nouveau membre ajouté !");
        localStorage.removeItem(DRAFT_KEY);
        
        // Show QR code after creation instead of closing
        setGeneratedQr({
          memberCode: record.member_code,
          qrSecret: record.qr_secret || record.qr_code,
          name: record.name,
          motoNumber: record.moto_number,
          record
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement du membre");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- QR Code Result Screen ---
  if (generatedQr) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <QrCode className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-foreground mb-1">Membre créé !</h3>
          <p className="text-muted-foreground">{generatedQr.name} • {generatedQr.motoNumber}</p>
        </div>

        {/* Member Code */}
        <div className="bg-muted/50 border border-border rounded-xl px-6 py-3 flex items-center gap-3">
          <span className="font-mono font-bold text-lg text-foreground tracking-wider">{generatedQr.memberCode}</span>
          <button onClick={() => handleCopyCode(generatedQr.memberCode)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-2xl shadow-lg" id="qr-card-preview">
          <QRCodeSVG
            value={generatedQr.qrSecret}
            size={220}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: '/favicon.svg',
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
          <p className="text-xs text-gray-500 mt-3 font-mono">{generatedQr.memberCode}</p>
        </div>

        <p className="text-sm text-muted-foreground max-w-xs">
          Imprimez ce QR code ou prenez une capture d'écran. L'agent pourra scanner ce code pour encaisser instantanément.
        </p>

        <div className="w-full flex gap-3 pt-2">
          <button 
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors"
          >
            Imprimer
          </button>
          <button 
            onClick={() => { onSuccess(generatedQr.record); onClose(); }}
            className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  // --- Main Form ---
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Existing member QR display */}
      {existingMember?.qr_secret && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shrink-0">
            <QRCodeSVG value={existingMember.qr_secret} size={64} level="M" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Code Membre</p>
            <p className="font-mono font-bold text-foreground">{existingMember.member_code}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4">
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Contact Urgence</label>
          <input 
            type="tel" 
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
            className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="+243..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Cotisation / Jour (XAF)</label>
          <input 
            type="number" 
            name="daily_fee"
            value={formData.daily_fee}
            onChange={(e) => setFormData({...formData, daily_fee: Number(e.target.value)})}
            className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
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
