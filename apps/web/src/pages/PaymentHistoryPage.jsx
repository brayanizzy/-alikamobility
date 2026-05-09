
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, Loader2, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

const PaymentHistoryPage = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTodayPayments = async () => {
      try {
        setIsLoading(true);
        // Date handling for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const records = await pb.collection('payments').getFullList({
          filter: `organization_id = "${currentUser.organization_id}" && recorded_by = "${currentUser.name || currentUser.email}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}"`,
          sort: '-created',
          expand: 'member_id',
          $autoCancel: false
        });

        // Expand isn't setup natively in DB relations based on schema provided, so we manually fetch members if needed
        // Assuming member_id is just string. Let's fetch members to map names.
        const memberIds = [...new Set(records.map(r => r.member_id))];
        let membersMap = {};
        if (memberIds.length > 0) {
          const membersFilter = memberIds.map(id => `id="${id}"`).join(' || ');
          const members = await pb.collection('members').getFullList({
            filter: membersFilter,
            $autoCancel: false
          });
          members.forEach(m => membersMap[m.id] = m);
        }

        const enrichedPayments = records.map(p => ({
          ...p,
          member: membersMap[p.member_id] || { name: 'Inconnu' }
        }));

        setPayments(enrichedPayments);
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du chargement de l'historique");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayPayments();
  }, [currentUser]);

  const filteredPayments = payments.filter(p => 
    p.member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Historique du Jour</h1>
        <p className="text-muted-foreground mb-8 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Total Encaissé</p>
            <p className="text-3xl font-extrabold text-foreground">{totalAmount.toLocaleString()} XAF</p>
          </div>
          <div className="text-right">
             <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Opérations</p>
             <p className="text-3xl font-extrabold text-foreground">{filteredPayments.length}</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher un membre..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground font-medium">Aucun paiement trouvé aujourd'hui.</p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-secondary text-lg">{payment.member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{payment.member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {payment.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-xl text-primary">+{payment.amount}</span>
                    <span className="text-xs uppercase tracking-wider font-bold text-green-500">Payé</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentHistoryPage;
