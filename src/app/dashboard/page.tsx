
"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Bell, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  LogOut,
  Copy,
  Loader2,
  PlusCircle,
  ArrowDown,
  Languages,
  Moon,
  Sun,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  Trash2,
  Wallet,
  Send,
  X,
  Camera,
  ShoppingBag,
  Delete,
  Check,
  Fingerprint,
  Briefcase,
  ChevronLeft,
  Smartphone,
  ShieldCheck,
  MailCheck,
  Headset,
  MessageSquare,
  FileText,
  ImageIcon,
  SendHorizontal,
  CircleDot,
  Star,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  runTransaction, 
  increment, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from "html5-qrcode";
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sendTelegramNotification, sendTelegramPhoto } from '@/lib/telegram';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language, toggleLanguage, isScannerOpen, setScannerOpen } = useStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportStep, setSupportStep] = useState<'options' | 'form' | 'chat'>('options');
  
  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatStatus, setChatStatus] = useState<any>(null);
  const [chatSession, setChatSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState('');
  const [showRatingUI, setShowRatingUI] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  // Support Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImage, setSupportImage] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const supportFileInputRef = useRef<HTMLInputElement>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingScanner = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !authLoading && !user) router.push('/'); }, [user, authLoading, router, mounted]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(10)) : null, [db, user?.uid]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const notificationsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('date', 'desc')) : null, [db, user?.uid]);
  const { data: notifications = [] } = useCollection(notificationsQuery);
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'system_settings', 'chat_config'), (doc) => {
      if (doc.exists()) setChatStatus(doc.data());
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (!db || !user || supportStep !== 'chat') return;
    const sessionsQuery = query(collection(db, 'chat_sessions'), where('userId', '==', user.uid));
    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      if (!snap.empty) {
        const relevantDocs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((s: any) => ['open', 'active', 'closed', 'archived'].includes(s.status))
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (relevantDocs.length > 0) {
          const session = relevantDocs[0];
          setChatSession(session);
          
          const msgsQuery = query(collection(db, 'chat_sessions', session.id, 'messages'), orderBy('timestamp', 'asc'));
          onSnapshot(msgsQuery, (mSnap) => {
            setMessages(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          });
        }
      } else {
        setChatSession(null);
        setMessages([]);
      }
    });
    return () => unsubSessions();
  }, [db, user, supportStep]);

  const generateCaseId = () => `FL-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleStartChat = async () => {
    if (!user || !profile || !db) return;
    setIsStartingChat(true);
    setShowRatingUI(false);
    setUserRating(0);
    setUserFeedback('');
    try {
      const caseId = generateCaseId();
      const newSessionRef = await addDoc(collection(db, 'chat_sessions'), {
        userId: user.uid,
        username: profile.username,
        email: profile.email,
        status: 'open',
        caseId: caseId,
        lastMessage: 'Protocol Initiated',
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', newSessionRef.id, 'messages'), {
        text: language === 'ar' ? `مرحباً بك في دعم فلاش المباشر. تم فتح تذكرة برقم ${caseId}. يرجى وصف مشكلتك بالتفصيل.` : `Welcome to Flash Live Support. Case #${caseId} opened. Please describe your issue in detail.`,
        senderId: 'system',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Chat Error" });
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user || !profile || !chatSession) return;
    try {
      await addDoc(collection(db, 'chat_sessions', chatSession.id, 'messages'), {
        text: chatMessage.trim(),
        senderId: user.uid,
        isAdmin: false,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', chatSession.id), {
        lastMessage: chatMessage.trim(),
        updatedAt: new Date().toISOString()
      });
      if (messages.length <= 2) {
        const telegramMsg = `💬 <b>New Live Chat Protocol [${chatSession.caseId}]</b>\n━━━━━━━━━━━━━━━━\n<b>From:</b> @${profile.username}\n<b>Email:</b> ${profile.email}\n<b>Issue:</b>\n${chatMessage.trim()}`;
        await sendTelegramNotification(telegramMsg);
      }
      setChatMessage('');
    } catch (e) {
      toast({ variant: "destructive", title: "Chat Error" });
    }
  };

  const submitRating = async () => {
    if (!chatSession || !db || userRating === 0) return;
    setIsSubmittingRating(true);
    try {
      await updateDoc(doc(db, 'chat_sessions', chatSession.id), {
        rating: userRating,
        feedback: userFeedback.trim(),
        status: 'archived',
        updatedAt: new Date().toISOString()
      });
      toast({ title: language === 'ar' ? "شكراً لتقييمك" : "Thank you for rating" });
      setShowRatingUI(false);
    } catch (e) { 
      toast({ variant: "destructive", title: "Rating failed" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === 2) await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) { console.warn(e); } finally { scannerRef.current = null; }
      }
    };
    const startScanner = async () => {
      if (isStartingScanner.current) return;
      isStartingScanner.current = true;
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!isMounted || !isScannerOpen) { isStartingScanner.current = false; return; }
      const readerElement = document.getElementById("reader");
      if (!readerElement) { isStartingScanner.current = false; return; }
      try {
        await stopScanner(); 
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!isMounted) return;
            setScannerOpen(false);
            router.push(`/transfer?id=${decodedText.toUpperCase()}`);
            toast({ title: language === 'ar' ? "تم التعرف على الكود" : "ID DETECTED" });
          },
          () => {} 
        );
      } catch (err) {
        if (isMounted) {
          setScannerOpen(false);
          toast({ variant: "destructive", title: language === 'ar' ? "خطأ في الكاميرا" : "CAMERA ERROR" });
        }
      } finally { isStartingScanner.current = false; }
    };
    if (isScannerOpen) startScanner();
    else stopScanner();
    return () => { isMounted = false; stopScanner(); };
  }, [isScannerOpen, language, toast, setScannerOpen, router]);

  const copyId = () => {
    if (profile?.customId) {
      navigator.clipboard.writeText(profile.customId);
      toast({ title: "COPIED TO CLIPBOARD" });
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !supportSubject.trim() || !supportMessage.trim()) return;
    setIsSubmittingSupport(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        username: profile?.username || 'unknown',
        email: profile?.email || 'unknown',
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
        imageUrl: supportImage,
        status: 'open',
        date: new Date().toISOString()
      });
      const telegramMsg = `🎫 <b>New Support Ticket</b>\n━━━━━━━━━━━━━━━━\n<b>From:</b> @${profile?.username}\n<b>Subject:</b> ${supportSubject}\n<b>Message:</b>\n${supportMessage}`;
      if (supportImage) await sendTelegramPhoto(supportImage, telegramMsg);
      else await sendTelegramNotification(telegramMsg);
      toast({ title: language === 'ar' ? "تم إرسال طلبك" : "Ticket Submitted" });
      setIsSupportOpen(false);
      setSupportStep('options');
    } catch (err: any) { toast({ variant: "destructive", title: "Error" }); } finally { setIsSubmittingSupport(false); }
  };

  const handleSupportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSupportImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user || !db || unreadCount === 0) return;
    notifications.forEach(async (n: any) => {
      if (!n.read) await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
    });
  };

  const deleteNotification = async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
  };

  if (!mounted) return null;
  if (authLoading || (profileLoading && !profile)) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="flex justify-between items-center px-8 py-10">
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-4 group">
          <div className={cn("w-14 h-14 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center relative overflow-hidden", profile?.verified ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "border-red-500 shadow-lg")}>{profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <User size={24} className="text-muted-foreground" />}</div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 mb-0.5">{profile?.verified && <ShieldCheck size={10} className="text-green-500" />}{profile?.emailVerified && <MailCheck size={10} className="text-primary" />}{profile?.phoneVerified && <Smartphone size={10} className="text-blue-500" />}<p className="text-[9px] text-primary font-headline font-bold tracking-widest uppercase">{profile?.verified ? (language === 'ar' ? "هوية موثقة" : "Entity Verified") : (language === 'ar' ? "غير موثق" : "Unverified")}</p></div>
            <p className="font-headline font-bold text-sm">@{profile?.username}</p>
          </div>
        </button>
        <button onClick={() => { setIsNotifOpen(true); markNotificationsAsRead(); }} className="relative p-2 text-muted-foreground hover:text-foreground transition-all">
          <Bell size={24} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">{unreadCount}</span>}
        </button>
      </header>

      <main className="px-8 space-y-10">
        <section className="text-center py-10 glass-card rounded-[2.5rem] gold-glow border-primary/20">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-headline mb-4">{language === 'ar' ? 'إجمالي الأصول' : 'Current Asset Value'}</p>
          <h1 className="text-5xl font-headline font-bold text-foreground tracking-tighter">${profile?.balance?.toLocaleString()}<span className="text-xl opacity-20">.00</span></h1>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"><div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full"></div><span className="text-[8px] text-primary tracking-[0.2em] font-headline font-bold uppercase">Vault Secure v2.5.0</span></div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Link href="/transfer" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-primary transition-all group"><div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all"><Send size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إرسال' : 'Send'}</span></Link>
          <Link href="/deposit" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-secondary transition-all group"><div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary group-hover:text-background transition-all"><Wallet size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إيداع' : 'Deposit'}</span></Link>
          <Link href="/withdraw" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-foreground/20 transition-all group"><div className="p-3 rounded-xl bg-muted group-hover:bg-foreground group-hover:text-background transition-all"><ArrowDownLeft size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'سحب' : 'Withdraw'}</span></Link>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'سجل العمليات' : 'Recent Ledger'}</h3><Link href="/transactions" className="text-[8px] font-headline text-primary hover:underline">{language === 'ar' ? 'استخراج الكل' : 'EXTRACT ALL'}</Link></div>
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 glass-card rounded-2xl border-border/40 hover:bg-muted/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-1 h-10 rounded-full", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "bg-red-500/40" : "bg-primary/40")} />
                  <div>
                    <p className="font-headline font-bold text-[10px] uppercase">{tx.type === 'send' ? (language === 'ar' ? `تحويل إلى @${tx.recipient}` : `SENT TO @${tx.recipient}`) : tx.type === 'receive' ? (language === 'ar' ? `استلام من @${tx.sender || 'SYSTEM'}` : `RECEIVED FROM @${tx.sender || 'SYSTEM'}`) : tx.type === 'withdraw' ? (language === 'ar' ? 'طلب سحب رصيد' : 'WITHDRAWAL INITIATED') : tx.type === 'deposit' ? (language === 'ar' ? 'تأكيد إيداع' : 'DEPOSIT CONFIRMED') : tx.type === 'refund' ? (language === 'ar' ? 'استرداد رصيد' : 'ASSET REFUNDED') : `${tx.service}`}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn("font-headline font-bold text-xs", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "text-foreground" : "text-primary")}>{(tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? '-' : '+'}${tx.amount}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Support Modal */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-6 sm:p-8 rounded-[2.5rem] z-[1001] max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="relative mb-6">
            <button onClick={() => { if (supportStep === 'options') setIsSupportOpen(false); else setSupportStep('options'); }} className={cn("absolute top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-secondary", language === 'ar' ? "right-[-10px]" : "left-[-10px]")}><ChevronLeft className={cn("h-6 w-6", language === 'ar' && "rotate-180")} /></button>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center w-full">{language === 'ar' ? 'مركز الدعم والمساعدة' : 'Support Command Center'}</DialogTitle>
          </DialogHeader>

          {supportStep === 'options' ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <button onClick={() => setSupportStep('form')} className="w-full p-6 glass-card rounded-3xl border-secondary/20 flex items-center gap-5 hover:border-secondary transition-all group"><div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div><div className="text-left"><p className="text-[11px] font-headline font-bold uppercase">{language === 'ar' ? 'مراسلة الدعم' : 'Contact Support'}</p><p className="text-[8px] text-muted-foreground uppercase">{language === 'ar' ? 'افتح تذكرة دعم فني جديدة' : 'Open a new encrypted ticket'}</p></div></button>
              <button onClick={() => setSupportStep('chat')} className="w-full p-6 glass-card rounded-3xl border-primary/20 flex items-center gap-5 hover:border-primary transition-all group"><div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><CircleDot size={24} className="animate-pulse" /></div><div className="text-left"><p className="text-[11px] font-headline font-bold uppercase">{language === 'ar' ? 'دردشة مباشرة' : 'Direct Live Chat'}</p><p className="text-[8px] text-muted-foreground uppercase">{language === 'ar' ? 'تواصل فوري مع الموظف' : 'Immediate connection with agent'}</p></div></button>
              <a href="https://t.me/flash_support" target="_blank" className="w-full p-6 glass-card rounded-3xl border-blue-500/20 flex items-center gap-5 hover:border-blue-500 transition-all group"><div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><SendHorizontal size={24} /></div><div className="text-left"><p className="text-[11px] font-headline font-bold uppercase">Telegram Support</p><p className="text-[8px] text-muted-foreground uppercase">Direct immediate connection</p></div></a>
            </div>
          ) : supportStep === 'form' ? (
            <form onSubmit={handleSupportSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'الاسم' : 'ID NAME'}</Label><Input value={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || profile?.username} disabled className="h-10 bg-white/5 border-white/10 text-[10px] font-headline opacity-60" /></div><div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'البريد' : 'AUTHORITY MAIL'}</Label><Input value={profile?.email} disabled className="h-10 bg-white/5 border-white/10 text-[10px] font-headline opacity-60" /></div></div>
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-secondary">{language === 'ar' ? 'الموضوع' : 'PROTOCOL SUBJECT'}</Label><Input placeholder={language === 'ar' ? 'ما هي مشكلتك؟' : 'DESCRIBE ISSUE TYPE'} className="h-12 bg-background/50 border-white/10 text-[10px] font-headline uppercase focus:border-secondary/50" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-secondary">{language === 'ar' ? 'الرسالة' : 'DETAILED INTEL'}</Label><Textarea placeholder={language === 'ar' ? 'اشرح بالتفصيل...' : 'PROVIDE FULL CONTEXT'} className="min-h-[120px] bg-background/50 border-white/10 text-[10px] font-headline uppercase focus:border-secondary/50 pt-3" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'إرفاق صورة (اختياري)' : 'ATTACH VISUAL EVIDENCE (OPTIONAL)'}</Label><div onClick={() => supportFileInputRef.current?.click()} className="w-full h-24 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/5 transition-all group overflow-hidden">{supportImage ? <img src={supportImage} className="w-full h-full object-cover" /> : <><ImageIcon size={20} className="text-muted-foreground group-hover:text-secondary transition-colors" /><span className="text-[7px] font-headline uppercase text-muted-foreground">Upload Protocol Evidence</span></>}<input type="file" ref={supportFileInputRef} className="hidden" accept="image/*" onChange={handleSupportImageUpload} /></div></div>
              </div>
              <button type="submit" disabled={isSubmittingSupport} className="w-full h-14 bg-secondary text-background font-headline font-black text-[10px] tracking-widest rounded-2xl cyan-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">{isSubmittingSupport ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'إرسال التذكرة' : 'DEPLOY SUPPORT TICKET')}</button>
            </form>
          ) : (
            <div className="flex flex-col h-[500px] animate-in slide-in-from-right-4 duration-300">
              {!chatSession ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20"><CircleDot size={40} className="animate-pulse" /></div>
                  <div className="space-y-2"><h3 className="text-xs font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'ابدأ محادثة جديدة' : 'Initialize Protocol'}</h3><p className="text-[8px] text-muted-foreground uppercase">{language === 'ar' ? 'تواصل فوري مع خبراء فلاش' : 'Direct link to Flash Authority'}</p></div>
                  <Button onClick={handleStartChat} disabled={isStartingChat} className="w-full h-14 bg-primary text-background rounded-2xl font-headline font-black text-[10px] tracking-widest gold-glow">{isStartingChat ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'بدء الدردشة الآن' : 'START NEW CONVERSATION')}</Button>
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <p className="text-[8px] font-headline font-bold text-primary tracking-widest uppercase">CASE: {chatSession.caseId}</p>
                    <Badge variant="outline" className="text-[6px] h-4 border-primary/20 text-primary uppercase">{chatSession.status === 'active' ? (language === 'ar' ? 'متصل' : 'AGENT JOINED') : (language === 'ar' ? 'قيد الانتظار' : 'WAITING')}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 p-4 no-scrollbar">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.isAdmin ? "self-start items-start" : "self-end items-end")}>
                        <div className={cn("p-3 rounded-2xl text-[10px] font-headline", msg.isAdmin ? "bg-muted text-foreground rounded-tl-none border border-white/5" : "bg-primary text-background rounded-tr-none shadow-lg")}>{msg.text}</div>
                        <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}

                    {chatSession.status === 'closed' && (
                      <div className="animate-in fade-in zoom-in-95 duration-500 py-4">
                        {!showRatingUI ? (
                          <div className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5 space-y-4 text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto border border-primary/20"><CheckCircle2 size={24} /></div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'تم إنهاء البروتوكول' : 'Protocol Terminated'}</p>
                              <p className="text-[7px] text-muted-foreground uppercase">{language === 'ar' ? 'تم حل المشكلة. نرجو منك تقييم الخدمة.' : 'Issue resolved. Please authorize service evaluation.'}</p>
                            </div>
                            <Button onClick={() => setShowRatingUI(true)} className="w-full h-12 bg-primary text-background rounded-xl font-headline font-black text-[9px] tracking-widest gold-glow">
                              {language === 'ar' ? 'بدء التقييم الآن' : 'BEGIN EVALUATION'}
                            </Button>
                          </div>
                        ) : (
                          <div className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5 space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="text-center space-y-1">
                              <p className="text-[10px] font-headline font-bold uppercase text-primary">{language === 'ar' ? 'كيف كانت تجربتك؟' : 'Rate Your Experience'}</p>
                              <p className="text-[7px] text-muted-foreground uppercase">Case ID: {chatSession.caseId}</p>
                            </div>
                            <div className="flex justify-center gap-3">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} onClick={() => setUserRating(s)} className={cn("p-1 transition-all hover:scale-125", userRating >= s ? "text-primary" : "text-white/10")}><Star fill={userRating >= s ? "currentColor" : "none"} size={28} /></button>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'ملاحظات إضافية' : 'Protocol Feedback'}</Label>
                              <Textarea 
                                placeholder={language === 'ar' ? 'اكتب تجربتك هنا...' : 'PROVIDE CONTEXTUAL FEEDBACK...'} 
                                className="bg-background/50 border-white/10 text-[9px] font-headline uppercase min-h-[80px]"
                                value={userFeedback}
                                onChange={(e) => setUserFeedback(e.target.value)}
                              />
                            </div>
                            <Button onClick={submitRating} disabled={isSubmittingRating || userRating === 0} className="w-full h-12 bg-primary text-background rounded-xl font-headline font-black text-[9px] tracking-widest gold-glow">
                              {isSubmittingRating ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'إرسال التقييم' : 'TRANSMIT FEEDBACK')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {chatSession.status === 'archived' && (
                      <div className="py-6 text-center animate-in fade-in">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-3"><CheckCircle2 size={24} /></div>
                        <p className="text-[10px] font-headline font-bold uppercase text-green-500">{language === 'ar' ? 'شكراً لتقييمك!' : 'Feedback Secured'}</p>
                        <p className="text-[7px] text-muted-foreground uppercase mt-1">{language === 'ar' ? 'تم أرشفة هذه التذكرة بنجاح.' : 'Protocol archived in global ledger.'}</p>
                        <Button variant="ghost" onClick={() => setSupportStep('options')} className="mt-4 text-[8px] font-headline uppercase text-muted-foreground hover:text-white">Return to Command</Button>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                  
                  {chatSession.status === 'active' || chatSession.status === 'open' ? (
                    <>
                      {messages.length > 1 && chatSession.status === 'open' && (
                        <div className="mx-4 py-2 px-4 bg-primary/10 border border-primary/20 rounded-xl mb-2 text-center animate-pulse"><p className="text-[8px] font-headline font-black text-primary uppercase tracking-widest">{chatStatus?.isActive ? (language === 'ar' ? 'جاري البحث عن موظف...' : 'Searching for an agent...') : (language === 'ar' ? 'سيتم التواصل معك في أوقات العمل' : 'We will contact you during working hours')}</p></div>
                      )}
                      <form onSubmit={handleSendChatMessage} className="mt-auto p-4 pt-0 flex gap-2"><Input placeholder={language === 'ar' ? 'اكتب هنا...' : 'TYPE MESSAGE...'} className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] font-headline" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} /><button type="submit" disabled={!chatMessage.trim()} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"><SendHorizontal size={20} /></button></form>
                    </>
                  ) : null}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}><DialogContent className="max-w-sm glass-card border-border/40 p-10 text-center rounded-[2.5rem] z-[1001]"><DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary">{language === 'ar' ? 'المعرف التشفيري' : 'Cryptographic Identifier'}</DialogTitle></DialogHeader><div className="space-y-8 mt-6"><div className="p-6 bg-white rounded-3xl inline-block shadow-lg"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile?.customId}`} alt="QR" className="w-48 h-48" /></div><div className="space-y-2"><p className="text-center text-[10px] font-headline font-bold text-muted-foreground uppercase">{language === 'ar' ? 'معرف الكيان' : 'Entity ID'}</p><p className="text-center text-sm font-headline font-black tracking-widest text-foreground">{profile?.customId}</p></div><button onClick={copyId} className="w-full h-14 bg-primary text-primary-foreground font-headline font-bold rounded-2xl gold-glow hover:scale-105 transition-all">{language === 'ar' ? 'نسخ المعرف' : 'COPY FLASH ID'}</button></div></DialogContent></Dialog>

      {/* Notification Modal */}
      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}><DialogContent className="max-w-sm glass-card border-border/40 p-8 rounded-[2rem] max-h-[80vh] overflow-y-auto z-[1000]"><DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center mb-4">{language === 'ar' ? 'شريط الحماية' : 'Security Feed'}</DialogTitle></DialogHeader><div className="space-y-4">{notifications.length === 0 ? <p className="text-center text-[10px] text-muted-foreground uppercase font-headline py-10">{language === 'ar' ? 'النظام خالي من التنبيهات' : 'System is clear'}</p> : notifications.map((n: any) => (<div key={n.id} className={cn("p-4 rounded-2xl border transition-all relative group", n.read ? "bg-muted/20 border-border/40" : "bg-primary/5 border-primary/20 shadow-lg")}><button onClick={() => deleteNotification(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button><div className="flex justify-between items-start mb-2"><p className="text-[10px] font-headline font-bold uppercase text-primary">{n.title}</p><p className="text-[7px] text-muted-foreground uppercase">{new Date(n.date).toLocaleTimeString()}</p></div><p className="text-[9px] text-muted-foreground leading-relaxed">{n.message}</p></div>))}</div></DialogContent></Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-6 sm:p-8 rounded-[2rem] z-[1000] max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-10 duration-500">
          <DialogHeader className="relative mb-4"><button onClick={() => setIsSettingsOpen(false)} className={cn("absolute top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-primary", language === 'ar' ? "right-[-10px]" : "left-[-10px]")}><ChevronLeft className={cn("h-6 w-6", language === 'ar' && "rotate-180")} /></button><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center w-full">{language === 'ar' ? 'الإعدادات والتحكم' : 'Settings & Entity Control'}</DialogTitle></DialogHeader>
          <div className="space-y-6 sm:space-y-8 mt-4">
            <div className="flex flex-col items-center gap-4 text-center"><div className={cn("w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shadow-xl", profile?.verified ? "border-green-500" : "border-red-500")}>{profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <User size={32} />}</div><div className="space-y-2"><h3 className="text-md font-headline font-bold tracking-tight">@{profile?.username}</h3><button onClick={copyId} className="px-4 py-2 bg-muted text-[9px] font-headline font-bold uppercase tracking-widest rounded-full border border-border/40 flex items-center gap-2 hover:bg-muted/80 transition-all">ID: {profile?.customId} <Copy size={12} /></button></div></div>
            <div className="space-y-3 pb-4">
              <ThemeToggle /><button onClick={() => { setIsSettingsOpen(false); setIsQrOpen(true); }} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all"><QrCode size={18} className="text-primary" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'المعرف الرقمي الخاص بي' : 'My Flash Identifier'}</span></button>
              <Link href="/profile/edit" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all"><Settings size={18} className="text-muted-foreground" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'تعديل الحساب' : 'Configure Account'}</span></Link>
              <button onClick={toggleLanguage} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:bg-muted/20 transition-all"><Languages size={18} /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'اللغة: العربية' : 'Language: EN'}</span></button>
              <button onClick={() => { setIsSettingsOpen(false); setIsSupportOpen(true); }} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-secondary transition-all"><Headset size={18} className="text-secondary" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'الدعم الفني' : 'Support Center'}</span></button>
              <button onClick={() => signOut(auth)} className="w-full h-14 glass-card rounded-2xl border-red-500/20 text-red-500 flex items-center px-6 gap-4 hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'تسجيل الخروج' : 'Terminate Access'}</span></button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-6 rounded-[2rem] z-[1001]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase text-center">{language === 'ar' ? 'ماسح المعرف' : 'Flash ID Scanner'}</DialogTitle></DialogHeader>
          <div className="mt-4 relative aspect-square overflow-hidden rounded-2xl border-2 border-primary/20 bg-black/40">
            <div id="reader" className="w-full h-full"></div>
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-2xl shadow-[0_0_20px_rgba(250,218,122,0.4)]">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-[scan_2s_linear_infinite]"></div>
            </div>
          </div>
          <p className="text-[8px] text-muted-foreground uppercase text-center mt-4 tracking-widest">{language === 'ar' ? 'قم بتوجيه الكاميرا نحو كود المستلم' : 'Position Flash ID within the frame'}</p>
          <Button variant="ghost" onClick={() => setScannerOpen(false)} className="w-full mt-4 text-[9px] font-headline font-bold uppercase tracking-widest text-red-500">{language === 'ar' ? 'إلغاء' : 'Abort Scan'}</Button>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
