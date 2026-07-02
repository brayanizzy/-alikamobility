import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header.jsx';
import PaymentForm from '@/components/PaymentForm.jsx';
import { Html5Qrcode } from 'html5-qrcode';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import {
  getCachedData,
  cacheData,
  isOnline,
  getMembersFromDB,
  syncMembersToDB,
  getScanHistory,
  addScanToHistory,
  clearScanHistory
} from '@/utils/OfflineService.js';

import { validateQrSecret } from '@/utils/qrUtils.js';
import { formatCurrency } from '@/utils/currency.js';
import { Loader2, ScanLine, AlertTriangle, Flashlight, History, Trash2, ShieldAlert, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const ScannerPage = () => {
  const { currentUser } = useAuth();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedMember, setScannedMember] = useState(null);
  const [memberChecks, setMemberChecks] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const qrRef = useRef(null);

  // Audio beep
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
    } catch (e) {}
  };

  const playError = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.value = 300;
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  useEffect(() => {
    const loadHistory = async () => {
      const hist = await getScanHistory();
      setScanHistory(hist);
    };
    loadHistory();

    // Cache members for offline support
    if (isOnline() && currentUser?.organization_id) {
      let filterStr = `organization_id = "${currentUser.organization_id}"`;
      // Agent only caches their parking members
      if (currentUser.role === 'agent' && currentUser.parking_id) {
        filterStr += ` && parking_id = "${currentUser.parking_id}"`;
      }

      pb.collection('members').getFullList({
        filter: filterStr,
        $autoCancel: false
      }).then(async (res) => {
        await cacheData('members_list', res);
        await syncMembersToDB(res);
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
          () => { /* Ignore periodic scan failures */ }
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

  const retryScan = () => {
    setScannedMember(null);
    setMemberChecks(null);
    setGeneratedReceipt(null);
    setError('');
    setIsScanning(true);
  };

  /**
   * Run fraud/validation checks on the scanned member
   */
  const runMemberChecks = async (member) => {
    const checks = {
      isActive: member.status === 'active',
      alreadyPaidToday: false,
      hasDept: (Number(member.debt_amount) || Number(member.debt_balance) || 0) > 0,
      debtAmount: Number(member.debt_amount) || Number(member.debt_balance) || 0,
      qrValid: true,
      warnings: [],
      errors: [],
    };

    // Check if already paid today
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (isOnline()) {
        const todayPayments = await pb.collection('payments').getList(1, 1, {
          filter: `member_id = "${member.id}" && payment_date >= "${today}" && payment_date < "${tomorrowStr}" && status = "paid"`,
          $autoCancel: false
        });
        checks.alreadyPaidToday = todayPayments.totalItems > 0;
      } else {
        // Offline: check cached today's payments
        const cachedPayments = await getCachedData('today_payments') || [];
        checks.alreadyPaidToday = cachedPayments.some(p => p.member_id === member.id);
      }
    } catch (err) {
      console.warn('Could not check today payments', err);
    }

    // Build warnings/errors
    if (!checks.isActive) {
      checks.errors.push('⛔ Membre SUSPENDU — Paiement interdit');
    }
    if (checks.alreadyPaidToday) {
      checks.warnings.push('⚠️ Déjà payé aujourd\'hui — Doublon possible');
    }
    if (checks.hasDept) {
      checks.warnings.push(`Dette en cours : ${formatCurrency(checks.debtAmount)}`);
    }

    return checks;
  };

  const handleScanSuccess = async (decodedText) => {
    if (isLoading || !isScanning) return;

    setIsScanning(false);
    setIsLoading(true);
    setError('');
    setMemberChecks(null);

    try {
      let member = null;

      // Try card QR format: "https://alikamobility.alika-konnect.com/verify/card/CARD-GOM-000001"
      if (decodedText.includes('/verify/card/')) {
        const cardMatch = decodedText.match(/\/verify\/card\/([A-Z0-9-]+)/i);
        const cardNumber = cardMatch ? cardMatch[1] : null;
        if (!cardNumber) throw new Error("Numéro de carte invalide dans le QR.");

        if (isOnline()) {
          // Look up the card to get the member_id
          const cardRes = await pb.collection('member_cards').getList(1, 1, {
            filter: `card_number = "${cardNumber}" && organization_id = "${currentUser.organization_id}"`,
            $autoCancel: false,
          });
          if (cardRes.totalItems === 0) throw new Error(`Carte ${cardNumber} introuvable ou non associée à votre organisation.`);

          const foundCard = cardRes.items[0];
          if (foundCard.status !== 'active') throw new Error(`Carte ${foundCard.status === 'expired' ? 'expirée' : foundCard.status}. Paiement refusé.`);

          if (!foundCard.member_id) throw new Error("Carte non liée à un membre.");
          member = await pb.collection('members').getOne(foundCard.member_id, { $autoCancel: false });
        } else {
          throw new Error("La vérification par carte nécessite une connexion internet.");
        }
      } else if (decodedText.includes('ALIKA-')) {
        const validation = validateQrSecret(decodedText, currentUser.organization_id);

        if (!validation.valid) {
          playError();
          throw new Error("QR Code invalide ou falsifié. Vérification de signature échouée.");
        }

        const memberCode = validation.memberCode;

        if (isOnline()) {
          const res = await pb.collection('members').getList(1, 1, {
            filter: `member_code = "${memberCode}" && organization_id = "${currentUser.organization_id}"`,
            $autoCancel: false
          });
          if (res.totalItems === 0) throw new Error(`Membre ${memberCode} introuvable`);
          member = res.items[0];
        } else {
          const cached = await getCachedData('members_list');
          member = (cached || []).find(m => m.member_code === memberCode);
          if (!member) {
            // Try IndexedDB
            const dbMembers = await getMembersFromDB(currentUser.organization_id);
            member = dbMembers.find(m => m.member_code === memberCode);
          }
          if (!member) throw new Error("Membre introuvable hors ligne");
        }
      } else {
        // Fallback: old format "member_id|org_id"
        const parts = decodedText.split('|');
        let targetId = parts[0];
        if (!targetId) throw new Error("Format QR Invalide");

        if (isOnline()) {
          member = await pb.collection('members').getOne(targetId, { $autoCancel: false });
        } else {
          const cached = await getCachedData('members_list');
          member = (cached || []).find(m => m.id === targetId);
          if (!member) {
            const dbMembers = await getMembersFromDB(currentUser.organization_id);
            member = dbMembers.find(m => m.id === targetId);
          }
          if (!member) throw new Error("Membre introuvable hors ligne");
        }
      }

      // Run fraud checks
      const checks = await runMemberChecks(member);
      setMemberChecks(checks);

      playBeep();
      setScannedMember(member);
      await addScanToHistory(member);

      if (checks.errors.length > 0) {
        toast.error(checks.errors[0]);
      } else if (checks.warnings.length > 0) {
        toast.warning(checks.warnings[0]);
      } else {
        toast.success("Membre identifié !");
      }
    } catch (err) {
      console.error(err);
      playError();
      setError(err.message || "Membre non trouvé ou QR invalide.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
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
            <p className="text-foreground font-medium text-lg">Vérification du membre...</p>
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

        {scannedMember && !showPaymentForm && !generatedReceipt && (
          <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl mb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>

              <div className="flex flex-col items-center text-center mb-4 relative z-10">
                {scannedMember.photo ? (
                  <img src={pb.files.getUrl(scannedMember, scannedMember.photo)} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center border-4 border-secondary shadow-lg mb-4">
                    <span className="text-3xl font-bold text-secondary">{scannedMember.name.charAt(0)}</span>
                  </div>
                )}
                <h2 className="text-2xl font-extrabold text-foreground">{scannedMember.name}</h2>
                {scannedMember.member_code && (
                  <p className="font-mono text-sm text-muted-foreground mt-1">{scannedMember.member_code}</p>
                )}
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${scannedMember.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                  {scannedMember.status}
                </span>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-2xl relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plaque</span>
                  <span className="font-bold text-foreground font-mono">{scannedMember.moto_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <span className="font-bold text-foreground">{scannedMember.phone}</span>
                </div>
                {scannedMember.daily_fee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cotisation</span>
                    <span className="font-bold text-primary">{formatCurrency(scannedMember.daily_fee)} / jour</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fraud Check Alerts */}
            {memberChecks && (memberChecks.errors.length > 0 || memberChecks.warnings.length > 0) && (
              <div className="space-y-2 mb-4">
                {memberChecks.errors.map((msg, i) => (
                  <div key={`err-${i}`} className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                    <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                    <span className="text-sm font-bold text-destructive">{msg}</span>
                  </div>
                ))}
                {memberChecks.warnings.map((msg, i) => (
                  <div key={`warn-${i}`} className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <span className="text-sm font-medium text-yellow-600">{msg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* No warnings = green light */}
            {memberChecks && memberChecks.errors.length === 0 && memberChecks.warnings.length === 0 && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-bold text-green-600">✓ Aucune anomalie détectée — Encaisser</span>
              </div>
            )}

            <div className="mt-auto grid grid-cols-1 gap-3 pb-4">
              <button
                onClick={() => setShowPaymentForm(true)}
                disabled={memberChecks?.errors?.length > 0}
                className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
              >
                💰 Enregistrer Paiement
              </button>
              <button
                onClick={retryScan}
                className="w-full py-4 rounded-2xl bg-muted text-foreground font-bold text-lg hover:bg-muted/80 active:scale-[0.98] transition-all"
              >
                Scanner un autre
              </button>
            </div>
          </div>
        )}

        {/* Scan History */}
        {isScanning && !isLoading && scanHistory.length > 0 && (
          <div className="mt-4 bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Historique</h3>
              <button onClick={async () => { await clearScanHistory(); setScanHistory([]); }} className="text-muted-foreground hover:text-destructive text-xs">
                Vider
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
              {scanHistory.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium text-foreground">{item.memberName}</span>
                    {item.memberCode && <span className="text-xs text-muted-foreground ml-2 font-mono">{item.memberCode}</span>}
                  </div>
                  <span className="text-muted-foreground text-xs">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPaymentForm && scannedMember && !generatedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 pb-12 sm:pb-6 relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <h2 className="text-2xl font-bold text-foreground mb-6">Nouveau Paiement</h2>
            <PaymentForm
              member={scannedMember}
              onClose={() => setShowPaymentForm(false)}
              onSuccess={(record) => {
                setShowPaymentForm(false);
                setGeneratedReceipt(record);
              }}
            />
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {generatedReceipt && scannedMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl p-8 relative animate-in zoom-in-90 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-1">Reçu de Paiement</h2>
            <p className="text-muted-foreground mb-8">N° {generatedReceipt.id?.substring(0, 8)?.toUpperCase()}</p>

            <div className="w-full space-y-4 bg-muted/30 p-6 rounded-2xl mb-8 border border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Membre</span>
                <span className="font-bold text-foreground">{scannedMember.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plaque</span>
                <span className="font-bold text-foreground font-mono">{scannedMember.moto_number}</span>
              </div>
              {scannedMember.member_code && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-bold text-foreground font-mono text-sm">{scannedMember.member_code}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date</span>
                <span className="font-bold text-foreground">{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-lg font-bold text-foreground">Montant</span>
                <span className="text-2xl font-extrabold text-primary">{formatCurrency(generatedReceipt.amount || 5000)}</span>
              </div>
            </div>

            <div className="w-full flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-4 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors"
              >
                Imprimer
              </button>
              <button
                onClick={retryScan}
                className="flex-[2] py-4 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
