
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header.jsx';
import PaymentForm from '@/components/PaymentForm.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, Loader2, MapPin } from 'lucide-react';

const MembersListPage = () => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal state
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const res = await pb.collection('members').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          sort: 'name',
          $autoCancel: false
        });
        setMembers(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [currentUser]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.moto_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mes Membres</h1>
        <p className="text-muted-foreground mb-8">Liste des conducteurs de votre association.</p>

        <div className="relative mb-6 shadow-sm shadow-black/20 rounded-xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou plaque..." 
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
          <div className="grid grid-cols-1 gap-4 pb-12">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground font-medium">Aucun membre trouvé.</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => setSelectedMember(member)}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
                >
                  {member.photo ? (
                    <img src={pb.files.getUrl(member, member.photo)} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center font-bold text-secondary text-xl">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">{member.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{member.moto_number}</span>
                      <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-destructive'}`}></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Detail & Payment Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 pb-12 sm:pb-6 relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-foreground">Paiement Manuel</h2>
              <button onClick={() => setSelectedMember(null)} className="p-2 -mr-2 bg-muted text-muted-foreground rounded-full hover:bg-muted/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <PaymentForm 
              member={selectedMember} 
              onClose={() => setSelectedMember(null)}
              onSuccess={() => setSelectedMember(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersListPage;
