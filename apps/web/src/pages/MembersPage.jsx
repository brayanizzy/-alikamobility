
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header.jsx';
import MemberForm from '@/components/MemberForm.jsx';
import { generateMemberCard } from '@/utils/MemberCardPDF.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Plus, Search, Filter, FileText, Edit2, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MembersPage = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [parkings, setParkings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch members and parkings
      const [membersRes, parkingsRes] = await Promise.all([
        pb.collection('members').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('parkings').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          $autoCancel: false
        })
      ]);

      setMembers(membersRes);
      
      const pMap = {};
      parkingsRes.forEach(p => { pMap[p.id] = p.name; });
      setParkings(pMap);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des membres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentUser.organization_id]);

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      await pb.collection('members').update(member.id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Statut mis à jour: ${newStatus}`);
      fetchMembers();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleGeneratePDF = async (member) => {
    try {
      toast.info('Génération de la carte PDF...');
      // Get QR code data
      const qrs = await pb.collection('qrcodes').getFullList({
        filter: `member_id = "${member.id}"`,
        $autoCancel: false
      });
      const qrData = qrs.length > 0 ? qrs[0].qr_data : `${member.id}|${currentUser.organization_id}`;
      
      // Ensure photo is fully resolved URL if exists
      const memberWithUrl = {
        ...member,
        photoUrl: member.photo ? pb.files.getUrl(member, member.photo) : null,
        parkingName: parkings[member.parking_id] || 'Non assigné'
      };

      await generateMemberCard(memberWithUrl, qrData);
      toast.success('Carte téléchargée !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération PDF');
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.phone.includes(searchQuery) || 
                          m.moto_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Gestion des Membres</h1>
            <p className="text-muted-foreground">Consultez, ajoutez et gérez les membres de votre association.</p>
          </div>
          <button 
            onClick={() => { setSelectedMember(null); setIsFormOpen(true); }}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Ajouter un membre
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, tel ou plaque..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Membre</th>
                    <th className="px-6 py-4 font-semibold">Plaque</th>
                    <th className="px-6 py-4 font-semibold">Parking</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                        Aucun membre trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {member.photo ? (
                              <img src={pb.files.getUrl(member, member.photo)} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">{member.name.charAt(0)}</div>
                            )}
                            <div>
                              <p className="font-bold text-foreground">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">{member.moto_number}</span>
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          {parkings[member.parking_id] || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${member.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}
                          `}>
                            {member.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleGeneratePDF(member)}
                              className="p-2 bg-card hover:bg-secondary/20 text-muted-foreground hover:text-secondary rounded-lg border border-transparent hover:border-secondary/30 transition-all"
                              title="Carte PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedMember(member); setIsFormOpen(true); }}
                              className="p-2 bg-card hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg border border-transparent hover:border-primary/30 transition-all"
                              title="Éditer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(member)}
                              className="p-2 bg-card hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg border border-transparent hover:border-destructive/30 transition-all"
                              title={member.status === 'active' ? 'Suspendre' : 'Réactiver'}
                            >
                              {member.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {selectedMember ? 'Modifier le membre' : 'Ajouter un membre'}
            </h2>
            <MemberForm 
              existingMember={selectedMember} 
              onClose={() => setIsFormOpen(false)} 
              onSuccess={fetchMembers} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
