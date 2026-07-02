import React, { useEffect, useState } from 'react';
import Header from '@/components/Header.jsx';
import PaymentForm from '@/components/PaymentForm.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Loader2, MapPin, Phone, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';

const LatePaymentsPage = () => {
  const { currentUser } = useAuth();
  const [lateMembers, setLateMembers] = useState([]);
  const [parkings, setParkings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchLateMembers = async () => {
    if (!currentUser?.organization_id) return;

    try {
      setIsLoading(true);

      let memberFilter = `organization_id = "${currentUser.organization_id}"`;
      if (currentUser.role === 'agent' && currentUser.parking_id) {
        memberFilter += ` && parking_id = "${currentUser.parking_id}"`;
      }

      const members = await pb.collection('members').getFullList({
        filter: memberFilter,
        sort: 'name',
        $autoCancel: false,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const todayPayments = await pb.collection('payments').getList(1, 500, {
        filter: `organization_id = "${currentUser.organization_id}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}" && status = "paid"`,
        sort: '-created',
        $autoCancel: false,
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const recentPaymentsRes = await pb.collection('payments').getList(1, 500, {
        filter: `organization_id = "${currentUser.organization_id}" && payment_date >= "${thirtyDaysAgoStr}"`,
        sort: '-payment_date',
        $autoCancel: false,
      });
      const recentPayments = recentPaymentsRes.items || [];

      const lastPaymentByMember = {};
      recentPayments.forEach((payment) => {
        if (!lastPaymentByMember[payment.member_id] || payment.payment_date > lastPaymentByMember[payment.member_id]) {
          lastPaymentByMember[payment.member_id] = payment.payment_date;
        }
      });

      const paidMemberIds = new Set((todayPayments.items || []).map((payment) => payment.member_id));
      const late = members
        .filter((member) => !paidMemberIds.has(member.id))
        .map((member) => ({
          ...member,
          debt: Number(member.debt_amount) || Number(member.debt_balance) || 0,
          lastPaymentDate: lastPaymentByMember[member.id] || null,
        }));

      const parkingsRecords = await pb.collection('parkings').getFullList({
        filter: `organization_id = "${currentUser.organization_id}"`,
        $autoCancel: false,
      });

      setLateMembers(late);
      setParkings(Object.fromEntries(parkingsRecords.map((parking) => [parking.id, parking.name])));
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des retards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLateMembers();
  }, [currentUser?.organization_id, currentUser?.parking_id, currentUser?.role]);

  const filteredMembers = lateMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      member.name?.toLowerCase().includes(query) ||
      member.phone?.includes(query) ||
      member.moto_number?.toLowerCase().includes(query) ||
      member.member_code?.toLowerCase().includes(query);

    if (filter === 'critical') return matchesSearch && member.debt > 5000;
    if (filter === 'warning') return matchesSearch && member.debt > 0 && member.debt <= 5000;
    return matchesSearch;
  });

  const totalDebt = lateMembers.reduce((sum, member) => sum + member.debt, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              Retards
            </h1>
            <p className="text-muted-foreground">Membres n'ayant pas encore cotise aujourd'hui.</p>
          </div>
          <button
            onClick={fetchLateMembers}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Rafraichir"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-destructive uppercase tracking-wider mb-1">En attente</p>
            <p className="text-3xl font-extrabold text-foreground">
              {lateMembers.length} <span className="text-sm text-muted-foreground">membres</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-destructive uppercase tracking-wider mb-1">Dette totale</p>
            <p className="text-3xl font-extrabold text-destructive">
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <button
            onClick={() => setFilter(filter === 'all' ? 'critical' : filter === 'critical' ? 'warning' : 'all')}
            className="text-xs px-3 py-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors font-medium"
          >
            {filter === 'all' ? 'Critiques' : filter === 'critical' ? 'Avertissements' : 'Tous'}
          </button>
        </div>

        <div className="relative mb-6 shadow-sm shadow-black/20 rounded-xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, plaque, code ou telephone..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-12">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                {searchQuery || filter !== 'all' ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Aucun resultat trouve.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-green-500 font-medium">Tous les membres ont cotise aujourd'hui.</p>
                  </>
                )}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="bg-card rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors active:scale-[0.98] border border-border"
                >
                  {member.photo ? (
                    <img src={pb.files.getUrl(member, member.photo)} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center font-bold text-secondary text-lg">
                      {member.name?.charAt(0) || '?'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base truncate">{member.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {member.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </span>
                      )}
                      {parkings[member.parking_id] && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {parkings[member.parking_id]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-destructive">{formatCurrency(member.debt)}</span>
                    <span className="block text-xs font-bold text-muted-foreground">dette</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 pb-12 sm:pb-6 relative">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-foreground">Encaisser</h2>
                <button onClick={() => setSelectedMember(null)} className="p-2 -mr-2 bg-muted text-muted-foreground rounded-full hover:bg-muted/80">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PaymentForm
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
                onSuccess={() => {
                  setSelectedMember(null);
                  fetchLateMembers();
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LatePaymentsPage;
