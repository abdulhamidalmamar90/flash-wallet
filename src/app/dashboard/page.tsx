
"use client"

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Send, 
  Download, 
  LayoutGrid, 
  Bell, 
  User, 
  Home, 
  ScanLine, 
  ArrowUpRight, 
  ArrowDownLeft,
  Wallet,
  Settings,
  LogOut,
  Copy,
  ChevronDown,
  X,
  QrCode,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, increment } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const COUNTRIES = [
  { code: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', nameAr: 'جمهورية مصر العربية', nameEn: 'Egypt', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪', prefix: '+971' },
];

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Firestore Data
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => user ? query(
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
    services: language === 'ar' ? 'خدمات' : 'Services',
    recent: language === 'ar' ? 'آخر العمليات' : 'Recent Activity',
    seeAll: language === 'ar' ? 'عرض الكل' : 'See All',
    home: language === 'ar' ? 'الرئيسية' : 'Home',
    wallet: language === 'ar' ? 'المحفظة' : 'Wallet',
    profile: language === 'ar' ? 'حسابي' : 'Profile',
    noActivity: language === 'ar' ? 'لا توجد عمليات' : 'No activity found',
    idCopied: language === 'ar' ? 'تم نسخ معرف الحساب!' : 'Account ID copied!',
    editAccount: language === 'ar' ? 'تعديل الحساب' : 'Edit Account',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
    sendHeader: language === 'ar' ? 'تحويل سريع' : 'Quick Transfer',
    confirmSend: language === 'ar' ? 'تأكيد التحويل' : 'Authorize Transfer',
    recipientLabel: language === 'ar' ? 'اسم مستخدم المستلم' : 'Recipient Username',
    recipientPlaceholder: language === 'ar' ? 'مثال: Mostafa88' : 'Ex: CryptoWhale',
    amountLabel: language === 'ar' ? 'المبلغ (دولار)' : 'Amount (USD)',
    showQr: language === 'ar' ? 'إظهار QR Code' : 'Show QR Code',
    scanToPay: language === 'ar' ? 'امسح الكود للإرسال فوراً' : 'Scan to send money instantly',
    myFlashId: 'My Flash ID',
    deposit: language === 'ar' ? 'شحن رصيد' : 'Deposit',
    withdrawal: language === 'ar' ? 'سحب أموال' : 'Withdrawal',
    sentTo: language === 'ar' ? 'تحويل إلى' : 'Sent to',
    successSendTitle: language === 'ar' ? 'تم التحويل بنجاح' : 'Transfer Successful',
    errorSendTitle: language === 'ar' ? 'فشلت العملية' : 'Transaction Failed',
    insufficientFunds: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance',
    sending: language === 'ar' ? 'جاري التحويل...' : 'Sending...',
  };

  const handleCopyId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (user) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: t.idCopied, description: user.uid });
    }
  };

  const handleLogout = () => {
    if (auth) {
      signOut(auth).then(() => router.push('/'));
    }
  };

  const handleSendMoney = async () => {
    if (!user || !recipient || !sendAmount || !profile) return;
    const amountNum = parseFloat(sendAmount);
    if (profile.balance < amountNum) {
      toast({ variant: "destructive", title: t.errorSendTitle, description: t.insufficientFunds });
      return;
    }

    setIsSending(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-amountNum) });
        
        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'send',
          amount: amountNum,
          recipient: recipient,
          status: 'completed',
          date: new Date().toISOString()
        });
      });

      toast({
        title: t.successSendTitle,
        description: language === 'ar' 
          ? `لقد أرسلت $${sendAmount} إلى @${recipient}` 
          : `You sent $${sendAmount} to @${recipient}`,
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

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white font-body pb-32 relative overflow-hidden"
      onClick={() => { setIsProfileOpen(false); }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00f3ff]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(212,175,55,0.4)] transform scale-100 animate-in zoom-in-95 duration-300 relative text-center max-w-[90%] w-[340px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
               <h3 className="text-black font-headline font-black text-xl uppercase tracking-tighter">{t.myFlashId}</h3>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{t.scanToPay}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border-2 border-[#D4AF37]/20 mx-auto w-fit shadow-inner">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.uid}&color=000000&bgcolor=ffffff`} alt="QR" className="w-48 h-48 rounded-lg" />
            </div>
            <div className="mt-6 bg-gray-100 py-3 px-6 rounded-2xl inline-flex items-center gap-3 cursor-pointer" onClick={() => handleCopyId()}>
              <span className="text-black font-headline font-black tracking-widest text-lg">{user.uid.slice(0, 10)}...</span>
              <Copy size={16} className="text-gray-400" />
            </div>
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
               <button onClick={() => setIsQrModalOpen(false)} className="bg-white/10 text-white p-3 rounded-full border border-white/10"><X size={24} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSendModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-[#0f0f0f] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2"><Send className="text-primary" />{t.sendHeader}</h2>
              <button onClick={() => setIsSendModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-white/60" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.recipientLabel}</label>
                <div className="relative">
                   <input 
                    type="text" 
                    placeholder={t.recipientPlaceholder}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className={cn("w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50", language === 'ar' ? 'text-right' : 'text-left')} 
                   />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.amountLabel}</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-5 text-center text-4xl font-headline font-black text-primary placeholder:text-primary/10 focus:outline-none focus:border-primary/50" 
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={handleSendMoney}
                disabled={isSending || !recipient || !sendAmount}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-headline font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{isSending ? t.sending : t.confirmSend}</span>
                <ArrowUpRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center p-6 pt-8 relative z-[60]">
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }} className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
              <User size={20} className="text-[#D4AF37]" />
            </div>
            <div className={cn("text-start hidden sm:block", language === 'ar' ? 'text-right' : 'text-left')}>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">{t.welcome}</p>
              <div className="flex items-center gap-1">
                <p className="font-headline font-bold text-sm tracking-wide">{profile?.username || 'User'}</p>
                <ChevronDown size={12} className={cn("text-white/40 transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </div>
            </div>
          </button>
          {isProfileOpen && (
            <div onClick={(e) => e.stopPropagation()} className={cn("absolute top-14 w-64 bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-[70]", language === 'ar' ? 'right-0' : 'left-0')}>
              <div className="p-4 border-b border-white/5 bg-white/5">
                <p className="text-sm font-headline font-bold text-white mb-1 uppercase">{profile?.username}</p>
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 group cursor-pointer" onClick={(e) => handleCopyId(e)}>
                  <span className="text-[10px] text-[#D4AF37] font-headline tracking-wider">ID: {user.uid.slice(0, 8)}...</span>
                  <Copy size={12} className="text-white/40" />
                </div>
                <button onClick={() => { setIsQrModalOpen(true); setIsProfileOpen(false); }} className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                  <QrCode size={14} className="text-white/40 group-hover:text-primary" />
                  <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-white/40 group-hover:text-white">{t.showQr}</span>
                </button>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/80 transition-all">
                  <Settings size={16} className="text-[#00f3ff]" />{t.editAccount}
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-red-400 transition-all mt-1">
                  <LogOut size={16} />{t.logout}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="relative"><Bell size={24} className="text-white/80" /><span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D4AF37] rounded-full border-2 border-[#0a0a0a]"></span></div>
        </div>
      </header>

      {/* Balance Card */}
      <section className="px-6 mb-8 relative z-10 text-center">
        <div className="relative w-full p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden group">
          <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] mb-4 font-bold">{t.totalBalance}</p>
          <h1 className="text-5xl font-headline font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            {profileLoading ? '...' : `$${profile?.balance?.toLocaleString() || '0'}`}
            <span className="text-2xl text-white/20">.00</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/20">
            <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse"></span>
            <span className="text-[9px] text-[#00f3ff] tracking-[0.2em] font-black uppercase">{t.secured}</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="px-6 grid grid-cols-3 gap-6 mb-10 relative z-10">
        <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
            <ArrowUpRight size={28} className="text-black" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.send}</span>
        </button>
        <Link href="/withdraw" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#00f3ff]/30 group-hover:bg-white/10 transition-all duration-300">
            <ArrowDownLeft size={28} className="text-[#00f3ff]" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.withdraw}</span>
        </Link>
        <Link href="/marketplace" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all duration-300">
            <LayoutGrid size={28} className="text-white" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.services}</span>
        </Link>
      </section>

      {/* Recent Activity */}
      <section className="px-6 rounded-t-[3rem] bg-white/[0.03] border-t border-white/5 min-h-[400px] backdrop-blur-md pt-10 relative z-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-sm font-headline font-black uppercase tracking-widest text-white">{t.recent}</h3>
          <button className="text-[10px] font-headline font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">{t.seeAll}</button>
        </div>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-[2rem] border border-dashed border-white/5">
              <p className="text-white/30 text-[10px] font-headline font-bold uppercase tracking-widest">{t.noActivity}</p>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-black/40 border border-white/5 hover:border-white/15 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", tx.type === 'receive' ? "bg-[#00f3ff]/10 text-[#00f3ff]" : "bg-red-500/10 text-red-500")}>
                    {tx.type === 'receive' ? <Download size={20} /> : <Send size={20} />}
                  </div>
                  <div>
                    <p className="font-headline font-black text-[11px] uppercase tracking-wide text-white">
                       {tx.type === 'send' && `${t.sentTo} @${tx.recipient}`}
                       {tx.type === 'receive' && t.deposit}
                       {tx.type === 'withdraw' && t.withdrawal}
                       {tx.type === 'purchase' && tx.service}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">
                       {tx.date ? new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-headline font-black text-sm", tx.type === 'receive' ? "text-[#00f3ff]" : "text-white")}>
                    {tx.type === 'receive' ? '+' : '-'}${tx.amount}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 px-8 py-5 flex justify-between items-center z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1.5 text-[#D4AF37]">
          <Home size={22} /><span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.home}</span>
        </Link>
        <button className="flex flex-col items-center gap-1.5 text-white/40"><Wallet size={22} /><span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.wallet}</span></button>
        <div className="relative -top-10"><div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)] border-4 border-[#0a0a0a] cursor-pointer" onClick={() => setIsQrModalOpen(true)}><ScanLine size={28} className="text-black" /></div></div>
        <Link href="/marketplace" className="flex flex-col items-center gap-1.5 text-white/40"><LayoutGrid size={22} /><span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.services}</span></Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-white/40"><User size={22} /><span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.profile}</span></Link>
      </nav>
    </div>
  );
}
