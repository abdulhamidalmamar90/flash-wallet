
"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Download, 
  LayoutGrid, 
  Bell, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  LogOut,
  Copy,
  ChevronDown,
  QrCode,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Send,
  X,
  Camera,
  UserCheck,
  ArrowDown,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, increment, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { BottomNav } from '@/components/layout/BottomNav';
import { Html5Qrcode } from 'html5-qrcode';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [recipient, setRecipient] = useState(''); 
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUid, setRecipientUid] = useState<string | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router, mounted]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(
    collection(db, 'users', user.uid, 'transactions'),
    orderBy('date', 'desc'),
    limit(10)
  ) : null, [db, user]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const t = {
    welcome: language === 'ar' ? 'مرحباً بك،' : 'Welcome back,',
    totalBalance: language === 'ar' ? 'الرصيد الكلي' : 'Total Balance',
    secured: language === 'ar' ? 'مؤمن ومحمي' : 'Secured & Protected',
    send: language === 'ar' ? 'إرسال' : 'Send',
    withdraw: language === 'ar' ? 'سحب' : 'Withdraw',
    deposit: language === 'ar' ? 'إيداع' : 'Deposit',
    recent: language === 'ar' ? 'آخر العمليات' : 'Recent Activity',
    seeAll: language === 'ar' ? 'عرض الكل' : 'See All',
    noActivity: language === 'ar' ? 'لا توجد عمليات' : 'No activity found',
    idCopied: language === 'ar' ? 'تم نسخ المعرف!' : 'ID copied!',
    editAccount: language === 'ar' ? 'تعديل الحساب' : 'Edit Account',
    adminPanel: language === 'ar' ? 'لوحة التحكم للإدارة' : 'Admin Command',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
    sendHeader: language === 'ar' ? 'تحويل سريع' : 'Quick Transfer',
    confirmSend: language === 'ar' ? 'تأكيد التحويل' : 'Authorize Transfer',
    recipientLabel: language === 'ar' ? 'معرف المستلم (Flash ID)' : 'Recipient Flash ID',
    recipientPlaceholder: language === 'ar' ? 'مثال: F123456789012' : 'Ex: F123456789012',
    amountLabel: language === 'ar' ? 'المبلغ (دولار)' : 'Amount (USD)',
    sentTo: language === 'ar' ? 'تحويل إلى' : 'Sent to',
    successSendTitle: language === 'ar' ? 'تم التحويل بنجاح' : 'Transfer Successful',
    errorSendTitle: language === 'ar' ? 'فشلت العملية' : 'Transaction Failed',
    insufficientFunds: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance',
    sending: language === 'ar' ? 'جاري التحويل...' : 'Sending...',
    showQr: language === 'ar' ? 'عرض رمز QR' : 'Show My QR',
    qrTitle: language === 'ar' ? 'هوية الفلاش الرقمية' : 'Digital Flash ID',
    qrSub: language === 'ar' ? 'امسح الكود للإرسال فوراً' : 'Scan to send money instantly',
    scanTitle: language === 'ar' ? 'ماسح الفلاش الضوئي' : 'Flash Scanner',
    scanSub: language === 'ar' ? 'وجه الكاميرا نحو الكود' : 'Point camera at the QR code',
    verifying: language === 'ar' ? 'جاري التحقق من الهوية...' : 'Verifying Identity...',
    userFound: language === 'ar' ? 'مستلم مؤكد' : 'Confirmed Recipient',
    userNotFound: language === 'ar' ? 'المستلم غير موجود' : 'Recipient not found',
    selfTransfer: language === 'ar' ? 'لا يمكنك التحويل لنفسك' : 'Cannot transfer to self',
    yourIdLabel: language === 'ar' ? 'معرف الفلاش الخاص بك' : 'YOUR FLASH ID',
    withdrawal: language === 'ar' ? 'سحب أموال' : 'Withdrawal',
    switchTheme: language === 'ar' ? 'تبديل الوضع' : 'SWITCH THEME'
  };

  useEffect(() => {
    if (recipient.length >= 13 && db) {
      setIsVerifying(true);
      const q = query(collection(db, 'users'), where('customId', '==', recipient.toUpperCase()));
      getDocs(q).then((snap) => {
        if (!snap.empty) {
          const target = snap.docs[0];
          if (target.id === user?.uid) {
            setRecipientName('SELF');
            setRecipientUid(null);
          } else {
            setRecipientName(target.data().username);
            setRecipientUid(target.id);
          }
        } else {
          setRecipientName(null);
          setRecipientUid(null);
        }
        setIsVerifying(false);
      }).catch(() => {
        setIsVerifying(false);
      });
    } else {
      setRecipientName(null);
      setRecipientUid(null);
    }
  }, [recipient, db, user?.uid]);

  const startScanner = async () => {
    setIsScannerOpen(true);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setRecipient(decodedText);
          stopScanner();
          setIsSendModalOpen(true);
        },
        () => {}
      ).catch(() => {
        toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera." });
        setIsScannerOpen(false);
      });
    }, 300);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScannerOpen(false);
      }).catch(() => {
        setIsScannerOpen(false);
      });
    } else {
      setIsScannerOpen(false);
    }
  };

  const handleSendMoney = async () => {
    if (!user || !recipientUid || !sendAmount || !profile || !db) return;
    const amountNum = parseFloat(sendAmount);
    
    if (recipientUid === user.uid) {
      toast({ variant: "destructive", title: t.errorSendTitle, description: t.selfTransfer });
      return;
    }

    if ((profile.balance || 0) < amountNum) {
      toast({ variant: "destructive", title: t.errorSendTitle, description: t.insufficientFunds });
      return;
    }

    setIsSending(true);
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', recipientUid);
        
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });
        
        const senderTxRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(senderTxRef, {
          type: 'send',
          amount: amountNum,
          recipient: recipientName,
          status: 'completed',
          date: new Date().toISOString()
        });

        const receiverTxRef = doc(collection(db, 'users', recipientUid, 'transactions'));
        transaction.set(receiverTxRef, {
          type: 'receive',
          amount: amountNum,
          sender: profile.username,
          status: 'completed',
          date: new Date().toISOString()
        });
      });

      toast({
        title: t.successSendTitle,
        description: language === 'ar' 
          ? `لقد أرسلت $${sendAmount} إلى @${recipientName}` 
          : `You sent $${sendAmount} to @${recipientName}`,
      });
      setIsSendModalOpen(false);
      setRecipient('');
      setSendAmount('');
    } catch (e: any) {
      toast({ variant: "destructive", title: t.errorSendTitle, description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  const qrCodeUrl = useMemo(() => profile?.customId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${profile.customId}&color=d4af37&bgcolor=ffffff&margin=1`
    : null, [profile?.customId]);

  if (!mounted || (authLoading && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-primary font-headline text-[10px] tracking-widest uppercase animate-pulse">Synchronizing Wallet...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-32 relative overflow-hidden" onClick={() => setIsProfileOpen(false)}>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-sm p-6 text-center space-y-8">
             <div className="space-y-2">
                <h3 className="text-xl font-headline font-black uppercase text-white tracking-widest">{t.scanTitle}</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">{t.scanSub}</p>
             </div>
             <div id="reader" className="w-full aspect-square overflow-hidden rounded-3xl border-2 border-primary/20 gold-glow bg-black"></div>
             <button onClick={stopScanner} className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl font-headline text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all">Cancel Scan</button>
           </div>
        </div>
      )}

      {isQrOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300" onClick={() => setIsQrOpen(false)}>
          <div className="bg-black/40 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(212,175,55,0.1)] border border-primary/20 relative text-center max-w-[90%] w-[380px] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 w-full text-center">
               <h3 className="font-headline font-black text-2xl uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{t.qrTitle}</h3>
               <p className="text-primary/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">{t.qrSub}</p>
            </div>
            
            <div className="relative group mb-8">
              <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <div className="relative bg-white p-4 rounded-[2rem] border-4 border-primary/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR" className="w-52 h-52" />
                ) : (
                  <div className="w-52 h-52 bg-muted flex items-center justify-center rounded-lg">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div 
              className="bg-primary/5 py-4 px-4 rounded-2xl border border-primary/20 flex flex-col items-center gap-1 cursor-pointer hover:bg-primary/10 transition-all w-full group overflow-hidden" 
              onClick={() => { 
                if(profile?.customId) { 
                  navigator.clipboard.writeText(profile.customId); 
                  toast({ title: t.idCopied }); 
                }
              }}
            >
              <span className="text-[10px] text-primary/40 font-bold uppercase tracking-[0.3em]">{t.yourIdLabel}</span>
              <div className="flex items-center justify-center gap-2 w-full max-w-full px-2">
                <span className="font-headline font-black tracking-[0.05em] text-lg text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {profile?.customId || '---'}
                </span>
                <Copy size={16} className="text-primary/40 group-hover:text-primary transition-colors shrink-0" />
              </div>
            </div>

            <button onClick={() => setIsQrOpen(false)} className="mt-12 bg-white/5 text-white/40 hover:text-white p-4 rounded-full border border-white/10 hover:border-primary/50 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {isSendModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSendModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-card border-t sm:border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-headline font-bold text-foreground flex items-center gap-2"><Send className="text-primary" />{t.sendHeader}</h2>
              <button onClick={() => setIsSendModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest">{t.recipientLabel}</label>
                  <div className="relative">
                     <input 
                      type="text" 
                      placeholder={t.recipientPlaceholder}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                      className={cn("w-full bg-muted/50 border border-border rounded-xl py-3.5 px-4 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 text-center font-headline tracking-widest uppercase")} 
                     />
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4",
                  isVerifying ? "bg-muted/20 border-border" :
                  recipientName === 'SELF' ? "bg-red-500/5 border-red-500/20" :
                  recipientName ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border"
                )}>
                   <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
                     {isVerifying ? <Loader2 size={18} className="animate-spin text-primary" /> : <UserCheck size={18} className={recipientName ? "text-primary" : "text-muted-foreground/20"} />}
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">
                       {isVerifying ? t.verifying : recipientName ? t.userFound : t.userNotFound}
                     </p>
                     <p className={cn("text-xs font-headline font-bold uppercase truncate", recipientName ? "text-foreground" : "text-muted-foreground/30")}>
                        {recipientName === 'SELF' ? t.selfTransfer : (recipientName || '---')}
                     </p>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest">{t.amountLabel}</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl py-5 text-center text-4xl font-headline font-black text-primary placeholder:text-primary/10 focus:outline-none focus:border-primary/50" 
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={handleSendMoney}
                disabled={isSending || !recipientUid || !sendAmount || recipientName === 'SELF'}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-headline font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{isSending ? t.sending : t.confirmSend}</span>
                <ArrowUpRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center p-6 pt-8 relative z-[60]">
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }} className="flex items-center gap-3 p-1 rounded-full hover:bg-muted transition-colors group">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={20} className="text-primary" />}
            </div>
            <div className={cn("text-start hidden sm:block", language === 'ar' ? 'text-right' : 'text-left')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.welcome}</p>
              <div className="flex items-center gap-1">
                <p className="font-headline font-bold text-sm tracking-wide">{profile?.username || 'User'}</p>
                <ChevronDown size={12} className={cn("text-muted-foreground transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </div>
            </div>
          </button>
          {isProfileOpen && (
            <div onClick={(e) => e.stopPropagation()} className={cn("absolute top-14 w-64 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-[70]", language === 'ar' ? 'right-0' : 'left-0')}>
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-3 px-1">
                   <p className="text-sm font-headline font-bold text-foreground uppercase truncate flex-1">{profile?.username}</p>
                   {profile?.verified && <CheckCircle2 size={14} className="text-secondary shrink-0 ml-2" />}
                </div>
                <div className="flex items-center justify-center bg-muted p-2 rounded-lg border border-border group cursor-pointer mb-2 w-full text-center" onClick={() => { if(profile?.customId) { navigator.clipboard.writeText(profile.customId); toast({ title: t.idCopied }); }}}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[9px] text-primary font-headline tracking-tight font-bold truncate">ID: {profile?.customId || '...'}</span>
                    <Copy size={11} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </div>
                <button onClick={() => { setIsQrOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 p-2 rounded-lg border border-primary/20 transition-all group">
                  <span className="text-[9px] text-primary font-headline font-bold uppercase tracking-widest">{t.showQr}</span>
                  <QrCode size={14} className="text-primary" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                <Link href="/profile/edit" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-[11px] font-bold uppercase tracking-widest text-foreground/80 transition-all">
                  <Settings size={16} className="text-secondary" />
                  {t.editAccount}
                </Link>

                {/* Theme Toggle in Profile Menu */}
                <div className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-all">
                  <div className="flex items-center gap-3">
                    <Moon size={16} className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">{t.switchTheme}</span>
                  </div>
                  <ThemeToggle />
                </div>

                {profile?.role === 'admin' && <Link href="/admin" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 text-[11px] font-bold uppercase tracking-widest text-primary transition-all mt-1"><ShieldCheck size={16} />{t.adminPanel}</Link>}
                <button onClick={() => { if(auth) signOut(auth).then(() => router.push('/')); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-red-400 transition-all mt-1"><LogOut size={16} />{t.logout}</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="relative">
            <Bell size={24} className="text-foreground/80" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background"></span>
          </div>
        </div>
      </header>

      <section className="px-6 mb-8 relative z-10 text-center">
        <div className="relative w-full p-8 rounded-[2rem] border border-border bg-card/40 backdrop-blur-2xl shadow-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] mb-4 font-bold relative z-10">{t.totalBalance}</p>
          <h1 className="text-5xl font-headline font-black text-foreground mb-4 tracking-tighter drop-shadow-2xl relative z-10">
            {profileLoading ? '...' : `$${profile?.balance?.toLocaleString() || '0'}`}
            <span className="text-2xl text-muted-foreground/20">.00</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 relative z-10">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[9px] text-secondary tracking-[0.2em] font-black uppercase">{t.secured}</span>
          </div>
        </div>
      </section>

      <section className="px-6 grid grid-cols-3 gap-6 mb-10 relative z-10">
        <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300"><ArrowUpRight size={28} className="text-primary-foreground" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.send}</span>
        </button>
        <Link href="/withdraw" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-card border border-border flex items-center justify-center hover:border-secondary/30 group-hover:bg-muted transition-all duration-300"><ArrowDownLeft size={28} className="text-secondary" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.withdraw}</span>
        </Link>
        <button onClick={() => toast({ title: "Coming Soon", description: "Deposit feature will be activated shortly." })} className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-card border border-border flex items-center justify-center group-hover:bg-muted transition-all duration-300"><ArrowDown size={28} className="text-foreground" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.deposit}</span>
        </button>
      </section>

      <section className="px-6 rounded-t-[3rem] bg-muted/30 border-t border-border min-h-[400px] backdrop-blur-md pt-10 relative z-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-sm font-headline font-black uppercase tracking-widest text-foreground">{t.recent}</h3>
          <button className="text-[10px] font-headline font-bold text-primary uppercase tracking-widest hover:underline">{t.seeAll}</button>
        </div>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-20 bg-card/40 rounded-[2rem] border border-dashed border-border">
              <p className="text-muted-foreground/30 text-[10px] font-headline font-bold uppercase tracking-widest">{t.noActivity}</p>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-card border border-border hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", tx.type === 'receive' ? "bg-secondary/10 text-secondary" : "bg-red-500/10 text-red-500")}>
                    {tx.type === 'receive' ? <Download size={20} /> : <Send size={20} />}
                  </div>
                  <div>
                    <p className="font-headline font-black text-[11px] uppercase tracking-wide text-foreground">
                       {tx.type === 'send' && `${t.sentTo} @${tx.recipient}`}
                       {tx.type === 'receive' && `${t.deposit} ${tx.sender ? `(From @${tx.sender})` : ''}`}
                       {tx.type === 'withdraw' && t.withdrawal}
                       {tx.type === 'purchase' && tx.service}
                    </p>
                    <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] mt-1 font-bold">
                       {tx.date ? new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-headline font-black text-sm", tx.type === 'receive' ? "text-secondary" : "text-foreground")}>
                    {tx.type === 'receive' ? '+' : '-'}${tx.amount}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <BottomNav onScanClick={startScanner} />
    </div>
  );
}
