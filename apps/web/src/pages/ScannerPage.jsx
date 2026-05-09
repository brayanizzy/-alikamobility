
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header.jsx';
import PaymentForm from '@/components/PaymentForm.jsx';
import { Html5Qrcode } from 'html5-qrcode';
import pb from '@/lib/pocketbaseClient';
import { isOnline, getCachedData, cacheData } from '@/utils/OfflineService.js';
import { Loader2, ScanLine, AlertTriangle, Flashlight, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ScannerPage = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scannedMember, setScannedMember] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  
  const qrRef = useRef(null);

  // Audio setup for scan beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {} // Ignore audio errors
  };

  useEffect(() => {
    const hist = JSON.parse(localStorage.getItem('alika_scan_history') || '[]');
    setScanHistory(hist);
    
    // Cache members for offline support
    if (isOnline()) {
      pb.collection('members').getFullList({ $autoCancel: false }).then(res => {
        cacheData('members_list', res);
      }).catch(e => console.error('Failed to cache members', e));
    }
  }, []);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      if (!isScanning) return;
      
      try {
        html5QrCode = new Html5Qrcode("reader");
        qrRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          handleScanSuccess,
          (err) => { /* Ignore periodic scan failures */ }
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const toggleTorch = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.applyVideoConstraints({ advanced: [{ torch: !torchEnabled }] });
        setTorchEnabled(!torchEnabled);
      } catch (e) {
        toast.error("Lampe torche non supportée sur cet appareil");
      }
    }
  };

  const addToHistory = (member) => {
    const newItem = { id: crypto.randomUUID(), memberName: member.name, timestamp: Date.now() };
    const newHist = [newItem, ...scanHistory].slice(0, 20); // Keep last 20
    setScanHistory(newHist);
    localStorage.setItem('alika_scan_history', JSON.stringify(newHist));
  };

  const handleScanSuccess = async (decodedText) => {
    if (isLoading || !isScanning) return;
    
    playBeep();
    setIsScanning(false);
    setIsLoading(true);
    setError('');

    try {
      const parts = decodedText.split('|');
      let targetId = parts[0]; 
      
      if (!targetId) throw new Error("Format QR Invalide");

      let member = null;
      if (isOnline()) {
        member = await pb.collection('members').getOne(targetId, { $autoCancel: false });
      } else {
        const cached = getCachedData('members_list') || [];
        member = cached.find(m => m.id === targetId);
        if (!member) throw new Error("Membre introuvable hors ligne");
      }
      
      setScannedMember(member);
      addToHistory(member);
      toast.success("Membre identifié !");
    } catch (err) {
      console.error(err);
      setError(err.message || "Membre non trouvé ou QR invalide.");
    } finally {
      setIsLoading(false);
    }
  };

  const retryScan = () => {
    setScannedMember(null);
    setError('');
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4">
        <h1 className="text-2xl font-bold text-foreground text-center my-6">Scanner QR Code</h1>
        
        {isScanning && !isLoading && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full aspect-square rounded-3xl overflow-hidden bg-card border-4 border-primary relative shadow-lg shadow-primary/20">
              <div id="reader" className="w-full h-full object-cover bg-black"></div>
              <div className="absolute inset-0 border-[40px] border-background/60 pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <ScanLine className="w-16 h-16 text-primary/50 animate-pulse" />
              </div>
              <button 
                onClick={toggleTorch}
                className={`absolute top-4 right-4 p-3 rounded-full ${torchEnabled ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white'} backdrop-blur transition-colors`}
              >
                <Flashlight className="w-6 h-6" />
              </button>
            </div>
            <p className="mt-8 text-muted-foreground text-center">Centrez le code QR dans le cadre</p>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium text-lg">Recherche du membre...</p>
          </div>
        )}

        {error && !isScanning && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Scan Échoué</h2>
            <p className="text-muted-foreground mb-8">{error}</p>
            <button 
              onClick={retryScan}
              className="px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/20"
            >
              Réessayer
            </button>
          </div>
        )}

        {scannedMember && !showPaymentForm && (
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
              
              <div className="flex flex-col items-center text-center mb-6 relative z-10">
                {scannedMember.photo ? (
                  <img src={pb.files.getUrl(scannedMember, scannedMember.photo)} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center border-4 border-secondary shadow-lg mb-4">
                    <span className="text-3xl font-bold text-secondary">{scannedMember.name.charAt(0)}</span>
                  </div>
                )}
                <h2 className="text-2xl font-extrabold text-foreground">{scannedMember.name}</h2>
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${scannedMember.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                  {scannedMember.status}
                </span>
              </div>
              
              <div className="space-y-4 bg-muted/30 p-4 rounded-2xl relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plaque</span>
                  <span className="font-bold text-foreground font-mono">{scannedMember.moto_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <span className="font-bold text-foreground">{scannedMember.phone}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-1 gap-4">
              <button 
                onClick={() => setShowPaymentForm(true)}
                disabled={scannedMember.status !== 'active'}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                Enregistrer Paiement
              </button>
              <button 
                onClick={retryScan}
                className="w-full py-4 rounded-2xl bg-muted text-foreground font-bold text-lg hover:bg-muted/80 active:scale-95 transition-all"
              >
                Scanner un autre
              </button>
            </div>
          </div>
        )}

        {/* Scan History (only show when scanning and history exists) */}
        {isScanning && !isLoading && scanHistory.length > 0 && (
          <div className="mt-8 bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><History className="w-4 h-4"/> Historique Récent</h3>
              <button onClick={() => {setScanHistory([]); localStorage.removeItem('alika_scan_history');}} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {scanHistory.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                  <span className="font-medium text-foreground">{item.memberName}</span>
                  <span className="text-muted-foreground text-xs">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Payment Modal */}
      {showPaymentForm && scannedMember && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 pb-12 sm:pb-6 relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <h2 className="text-2xl font-bold text-foreground mb-6">Nouveau Paiement</h2>
            <PaymentForm 
              member={scannedMember} 
              onClose={() => setShowPaymentForm(false)}
              onSuccess={() => {
                setShowPaymentForm(false);
                retryScan();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
