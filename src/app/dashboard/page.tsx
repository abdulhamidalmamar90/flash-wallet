
"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Copy, 
  Loader2, 
  Wallet, 
  Send, 
  Camera, 
  ChevronLeft, 
  Smartphone, 
  ShieldCheck, 
  MailCheck, 
  Headset, 
  MessageSquare, 
  ImageIcon, 
  SendHorizontal, 
  CircleDot, 
  Star, 
  CheckCircle2,
  Trash2,
  ArrowDownLeft,
  ClipboardList,
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
  updateDoc, 
  deleteDoc, 
  addDoc,
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
import { submitTicketAndSendEmail } from '@/app/actions/support';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language, toggleLanguage, isScannerOpen, setScannerOpen } = useStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportStep, setSupportStep] = useState<'options' | 'form' | 'chat'>('options');
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatStatus, setChatStatus] = useState<any>(null);
  const [chatSession, setChatSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [recipient, setRecipient] = useState(''); 
  const [mounted, setMounted] = useState(false);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImage, setSupportImage] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const supportFileInputRef = useRef<HTMLInputElement>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !authLoading && !user) router.push('/'); }, [user, authLoading, router, mounted]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(10)) : null, [db, user?.uid]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const notificationsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('date', 'desc')) : null, [db, user?.uid]);
  const { data: notifications = [] } = useCollection(notificationsQuery);
  const unreadCount = useMemo(() => notifications.filter((n: any) => !n.read).length, [notifications]);

  useEffect(() => {
    if (!db || !user || supportStep !== 'chat') return;
    const sessionsQuery = query(collection(db, 'chat_sessions'), where('userId', '==', user.uid));
    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      if (!snap.empty) {
        const session = snap.docs[0];
        setChatSession({ id: session.id, ...session.data() });
        
        const msgsQuery = query(collection(db, 'chat_sessions', session.id, 'messages'), orderBy('timestamp', 'asc'));
        return onSnapshot(msgsQuery, (mSnap) => {
          setMessages(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
      }
    });
    return () => unsubSessions();
  }, [db, user, supportStep]);

  const copyId = useCallback(() => {
    if (profile?.customId) {
      navigator.clipboard.writeText(profile.customId);
      toast({ title: "COPIED" });
    }
  }, [profile?.customId, toast]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !supportSubject.trim() || !supportMessage.trim()) return;
    setIsSubmittingSupport(true);
    try {
      const result = await submitTicketAndSendEmail({
        userId: user.uid,
        username: profile.username || 'unknown',
        email: profile.email || 'unknown',
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
        imageUrl: supportImage,
        language: language as 'ar' | 'en'
      });

      if (result.success) {
        toast({ 
          title: language === 'ar' ? "تم إرسال التذكرة" : "Ticket Deployed",
          description: language === 'ar' ? "تم إرسال بريد تأكيد إلى عنوانك المسجل." : "A confirmation email has been sent to your inbox."
        });
        setIsSupportOpen(false);
        setSupportStep('options');
        setSupportSubject('');
        setSupportMessage('');
        setSupportImage(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) { 
      toast({ variant: "destructive", title: "Protocol Error", description: err.message }); 
    } finally { 
      setIsSubmittingSupport(false); 
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !chatSession || !chatMessage.trim() || !user) return;
    try {
      await addDoc(collection(db, 'chat_sessions', chatSession.id, 'messages'), {
        text: chatMessage.trim(),
        senderId: user.uid,
        isAdmin: false,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', chatSession.id), {
        updatedAt: new Date().toISOString()
      });
      setChatMessage('');
    } catch (e) {}
  };

  if (!mounted) return null;
  if (authLoading || (profileLoading && !profile)) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="flex justify-between items-center px-8 py-10">
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-4 group">
          <div className={cn("w-14 h-14 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center relative overflow-hidden", profile?.verified ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "border-red-500 shadow-lg")}>{profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <User size={24} className="text-muted-foreground" />}</div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 mb-0.5">{profile?.verified && <ShieldCheck size={10} className="text-green-500" />}<p className="text-[9px] text-primary font-headline font-bold tracking-widest uppercase">{profile?.verified ? "Verified" : "Unverified"}</p></div>
            <p className="font-headline font-bold text-sm">@{profile?.username}</p>
          </div>
        </button>
        <button onClick={() => { setIsNotifOpen(true); }} className="relative p-2 text-muted-foreground hover:text-foreground transition-all">
          <Bell size={24} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">{unreadCount}</span>}
        </button>
      </header>

      <main className="px-8 space-y-10">
        <section className="text-center py-10 glass-card rounded-[2.5rem] gold-glow border-primary/20">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-headline mb-4">{language === 'ar' ? 'إجمالي الأصول' : 'Current Asset Value'}</p>
          <h1 className="text-5xl font-headline font-bold text-foreground tracking-tighter">${profile?.balance?.toLocaleString()}<span className="textxl opacity-20">.00</span></h1>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"><div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full"></div><span className="text-[8px] text-primary tracking-[0.2em] font-headline font-bold uppercase">Vault Secure v2.5.0</span></div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-primary transition-all group"><div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all"><Send size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إرسال' : 'Send'}</span></button>
          <Link href="/deposit" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-secondary transition-all group"><div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary group-hover:text-background transition-all"><Wallet size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إيداع' : 'Deposit'}</span></Link>
          <button onClick={() => setIsSupportOpen(true)} className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-foreground/20 transition-all group"><div className="p-3 rounded-xl bg-muted group-hover:bg-foreground group-hover:text-background transition-all"><Headset size={20} /></div><span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'دعم' : 'Support'}</span></button>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'سجل العمليات' : 'Recent Ledger'}</h3><Link href="/transactions" className="text-[8px] font-headline text-primary hover:underline">{language === 'ar' ? 'استخراج الكل' : 'EXTRACT ALL'}</Link></div>
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 glass-card rounded-2xl border-border/40 hover:bg-muted/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-1 h-10 rounded-full", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "bg-red-500/40" : "bg-primary/40")} />
                  <div>
                    <p className="font-headline font-bold text-[10px] uppercase truncate max-w-[150px]">{tx.type === 'send' ? `TO @${tx.recipient}` : tx.type === 'receive' ? `FROM @${tx.sender || 'SYSTEM'}` : tx.type === 'withdraw' ? 'WITHDRAWAL' : tx.type === 'deposit' ? 'DEPOSIT' : `${tx.service}`}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn("font-financial font-bold text-xs", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "text-foreground" : "text-primary")}>{(tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? '-' : '+'}${tx.amount}</p>
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
              <button onClick={() => setSupportStep('form')} className="w-full p-6 glass-card rounded-3xl border-secondary/20 flex items-center gap-5 hover:border-secondary transition-all group"><div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div><div className="text-left"><p className="text-[11px] font-headline font-bold uppercase">{language === 'ar' ? 'مراسلة الدعم' : 'Contact Support'}</p><p className="text-[8px] text-muted-foreground uppercase">Open encrypted ticket</p></div></button>
              <button onClick={() => setSupportStep('chat')} className="w-full p-6 glass-card rounded-3xl border-primary/20 flex items-center gap-5 hover:border-primary transition-all group"><div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><CircleDot size={24} className="animate-pulse" /></div><div className="text-left"><p className="text-[11px] font-headline font-bold uppercase">{language === 'ar' ? 'دردشة مباشرة' : 'Direct Live Chat'}</p><p className="text-[8px] text-muted-foreground uppercase">Immediate agent link</p></div></button>
            </div>
          ) : supportStep === 'form' ? (
            <form onSubmit={handleSupportSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-secondary">PROTOCOL SUBJECT</Label><Input placeholder="DESCRIBE ISSUE TYPE" className="h-12 bg-background/50 border-white/10 text-[10px] font-headline uppercase" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-secondary">DETAILED INTEL</Label><Textarea placeholder="PROVIDE FULL CONTEXT" className="min-h-[120px] bg-background/50 border-white/10 text-[10px] font-headline uppercase pt-3" value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">ATTACH EVIDENCE</Label><div onClick={() => supportFileInputRef.current?.click()} className="w-full h-24 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/5 transition-all group overflow-hidden">{supportImage ? <img src={supportImage} className="w-full h-full object-cover" alt="support" /> : <><ImageIcon size={20} className="text-muted-foreground" /><span className="text-[7px] font-headline uppercase text-muted-foreground">Upload Visual Evidence</span></>}<input type="file" ref={supportFileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSupportImage(reader.result as string); reader.readAsDataURL(file); } }} /></div></div>
              </div>
              <button type="submit" disabled={isSubmittingSupport} className="w-full h-14 bg-secondary text-background font-headline font-black text-[10px] tracking-widest rounded-2xl cyan-glow flex items-center justify-center gap-2">{isSubmittingSupport ? <Loader2 className="animate-spin" /> : "DEPLOY TICKET"}</button>
            </form>
          ) : (
            <div className="flex flex-col h-[500px]">
              {!chatSession ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20"><CircleDot size={40} className="animate-pulse" /></div>
                  <Button onClick={async () => { setIsStartingChat(true); try { await addDoc(collection(db, 'chat_sessions'), { userId: user!.uid, username: profile.username, status: 'open', updatedAt: new Date().toISOString() }); } finally { setIsStartingChat(false); } }} disabled={isStartingChat} className="w-full h-14 bg-primary text-background rounded-2xl font-headline font-black text-[10px] tracking-widest gold-glow">START NEW CONVERSATION</Button>
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                    <Badge variant="outline" className="text-[6px] h-4 border-primary/20 text-primary uppercase">{chatSession.status}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 p-4 no-scrollbar">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.isAdmin ? "self-start items-start" : "self-end items-end")}>
                        <div className={cn("p-3 rounded-2xl text-[10px] font-financial", msg.isAdmin ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-background rounded-tr-none shadow-lg")}>{msg.text}</div>
                        <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-auto p-4 pt-0 flex gap-2"><Input placeholder="TYPE MESSAGE..." className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] font-headline" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} /><button type="submit" disabled={!chatMessage.trim()} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center"><SendHorizontal size={20} /></button></form>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-6 sm:p-8 rounded-[2rem] z-[1000] max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="relative mb-4"><button onClick={() => setIsSettingsOpen(false)} className={cn("absolute top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-primary", language === 'ar' ? "right-[-10px]" : "left-[-10px]")}><ChevronLeft className={cn("h-6 w-6", language === 'ar' && "rotate-180")} /></button><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center w-full">Settings & Entity Control</DialogTitle></DialogHeader>
          <div className="space-y-6 sm:space-y-8 mt-4">
            <div className="flex flex-col items-center gap-4 text-center"><div className={cn("w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shadow-xl", profile?.verified ? "border-green-500" : "border-red-500")}>{profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="profile" /> : <User size={32} />}</div><div className="space-y-2"><h3 className="text-md font-headline font-bold tracking-tight">@{profile?.username}</h3><button onClick={copyId} className="px-4 py-2 bg-muted text-[9px] font-headline font-bold uppercase tracking-widest rounded-full border border-border/40 flex items-center gap-2">ID: {profile?.customId} <Copy size={12} /></button></div></div>
            <div className="space-y-3 pb-4">
              <ThemeToggle /><button onClick={() => { setIsSettingsOpen(false); setIsQrOpen(true); }} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all"><Camera size={18} className="text-primary" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">My Flash Identifier</span></button>
              <Link href="/profile/edit" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all"><Settings size={18} className="text-muted-foreground" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">Configure Account</span></Link>
              <Link href="/orders" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all"><ClipboardList size={18} className="text-muted-foreground" /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">Asset Orders</span></Link>
              <button onClick={toggleLanguage} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:bg-muted/20 transition-all"><MessageSquare size={18} /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">Language: {language === 'en' ? 'Arabic' : 'English'}</span></button>
              <button onClick={() => signOut(auth)} className="w-full h-14 glass-card rounded-2xl border-red-500/20 text-red-500 flex items-center px-6 gap-4 hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /><span className="text-[10px] font-headline font-bold uppercase tracking-widest">Terminate Access</span></button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
