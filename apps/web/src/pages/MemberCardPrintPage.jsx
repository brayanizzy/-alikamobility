import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import PrintableMemberCard from '@/components/cards/PrintableMemberCard.jsx';
import { Loader2, AlertCircle, ArrowLeft, Printer } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://alikamobility.alika-konnect.com/api';

const MemberCardPrintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [card, setCard] = useState(null);
  const [member, setMember] = useState(null);
  const [secureUrl, setSecureUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const c = await pb.collection('member_cards').getOne(id, { $autoCancel: false });
        setCard(c);

        // Fetch secure QR URL
        const token = localStorage.getItem('api_token');
        if (token) {
          fetch(`${API_BASE}/cards/secure-url?id=${c.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(r => r.json())
            .then(d => { if (d.success) setSecureUrl(d.verify_url); })
            .catch(() => {});
        }

        if (c.member_id) {
          pb.collection('members').getOne(c.member_id, { $autoCancel: false })
            .then(m => setMember(m)).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la carte.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Carte introuvable.'}</p>
          <button onClick={() => navigate('/member-cards')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0 print:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
          <div className="max-w-lg mx-auto print:max-w-full">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <button onClick={() => navigate(`/member-cards/${id}`)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                <Printer className="w-5 h-5" /> Imprimer
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card print:border-0 print:shadow-none print:p-4">
              <PrintableMemberCard ref={printRef} card={card} memberName={member?.name} verifyUrl={secureUrl} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberCardPrintPage;
