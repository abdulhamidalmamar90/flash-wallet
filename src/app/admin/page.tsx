
"use client"

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Building2, 
  Loader2, 
  Users, 
  Search, 
  Save, 
  User as UserIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutDashboard,
  ShieldCheck,
  FileCheck,
  Camera,
  Globe,
  FileText,
  DollarSign,
  Trash2,
  Settings2,
  Plus,
  Database,
  UserCheck,
  WalletCards,
  MessageSquare,
  Shield,
  Type,
  AlignLeft,
  ListFilter,
  ImageIcon,
  Percent,
  Coins,
  Edit2,
  Copy,
  Calendar,
  Gamepad2,
  Gift,
  LayoutGrid,
  ShoppingBag,
  Ticket,
  ChevronDown,
  Layers,
  Keyboard,
  Eye,
  EyeOff,
  Hash,
  Filter,
  Unlock,
  Briefcase,
  Contact,
  SendHorizontal,
  CircleDot,
  Play,
  LogOut,
  Star,
  History,
  Info,
  Clock,
  ArrowRight,
  MessageCircle,
  Trash,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc, addDoc, onSnapshot, where, getDocs, limit } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditEditForm] = useState<any>({});
  
  // Chat Admin States
  const [chatConfig, setChatConfig] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatReply, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isJoiningChat, setIsJoiningChat] = useState(false);
  const [isClosingChat, setIsClosingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Archive State
  const [selectedArchive, setSelectedArchive] = useState<any>(null);
  const [archiveMessages, setArchiveMessages] = useState<any[]>([]);
  const [showFullArchive, setShowFullArchive] = useState(false);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const withdrawalsQuery = useMemo(() => query(collection(db, 'withdrawals'), orderBy('date', 'desc')), [db]);
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const depositsQuery = useMemo(() => query(collection(db, 'deposits'), orderBy('date', 'desc')), [db]);
  const { data: deposits = [] } = useCollection(depositsQuery);

  const allUsersQuery = useMemo(() => query(collection(db, 'users')), [db]);
  const { data: allUsers = [] } = useCollection(allUsersQuery);

  const verificationsQuery = useMemo(() => query(collection(db, 'verifications'), orderBy('date', 'desc')), [db]);
  const { data: verifications = [] } = useCollection(verificationsQuery);

  const chatSessionsQuery = useMemo(() => query(collection(db, 'chat_sessions')), [db]);
  const { data: allChatSessions = [] } = useCollection(chatSessionsQuery);

  const chatSessions = useMemo(() => {
    return allChatSessions
      .filter((s: any) => ['open', 'active', 'closed'].includes(s.status))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allChatSessions]);

  const archivedSessions = useMemo(() => {
    return allChatSessions
      .filter((s: any) => s.status === 'archived')
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allChatSessions]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u: any) => 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.customId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'system_settings', 'chat_config'), (doc) => {
      if (doc.exists()) setChatConfig(doc.data());
    });
    return () => unsub();
  }, [db]);

  const toggleChatAvailability = async (isActive: boolean) => {
    try {
      await setDoc(doc(db, 'system_settings', 'chat_config'), { isActive });
      toast({ title: isActive ? "Chat Protocols Online" : "Chat Protocols Offline" });
    } catch (e) { toast({ variant: "destructive", title: "Config Failed" }); }
  };

  useEffect(() => {
    if (!db || !activeChat) return;
    const qMsg = query(collection(db, 'chat_sessions', activeChat.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(qMsg, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [db, activeChat]);

  const handleJoinChat = async () => {
    if (!activeChat || !user || !profile) return;
    setIsJoiningChat(true);
    try {
      await updateDoc(doc(db, 'chat_sessions', activeChat.id), {
        status: 'active',
        joinedBy: profile.username,
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', activeChat.id, 'messages'), {
        text: `تم العثور على موظف. مرحباً، معك ${profile.username}. من فضلك أعطني ثانية لمراجعة تفاصيل مشكلتك.`,
        senderId: 'system',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
    } catch (e) { toast({ variant: "destructive", title: "Join Failed" }); } finally { setIsJoiningChat(false); }
  };

  const handleEndChat = async () => {
    if (!activeChat || !db) return;
    setIsClosingChat(true);
    try {
      await addDoc(collection(db, 'chat_sessions', activeChat.id, 'messages'), {
        text: "تم إنهاء البروتوكول بنجاح. اضغط على الزر أدناه لتقييم الخدمة وإغلاق الحالة.",
        senderId: 'system',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', activeChat.id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      toast({ title: "CHAT CLOSED" });
      setActiveChat(null);
    } catch (e) { toast({ variant: "destructive", title: "Close Failed" }); } finally { setIsClosingChat(false); }
  };

  const handleDeleteArchive = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Confirm permanent deletion of this protocol log?")) return;
    try {
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
      toast({ title: "PROTOCOL PURGED" });
      if (selectedArchive?.id === sessionId) setSelectedArchive(null);
    } catch (e) { toast({ variant: "destructive", title: "PURGE FAILED" }); }
  };

  const handleOpenArchive = async (session: any) => {
    setSelectedArchive(session);
    setShowFullArchive(false);
    try {
      const q = query(collection(db, 'chat_sessions', session.id, 'messages'), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      setArchiveMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { toast({ variant: "destructive", title: "Failed to load archive" }); }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !activeChat || !user) return;
    try {
      await addDoc(collection(db, 'chat_sessions', activeChat.id, 'messages'), {
        text: chatReply.trim(),
        senderId: user.uid,
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', activeChat.id), {
        lastMessage: chatReply.trim(),
        updatedAt: new Date().toISOString()
      });
      setChatMessage('');
    } catch (e) { toast({ variant: "destructive", title: "Reply Failed" }); }
  };

  const handleAction = async (type: 'deposit' | 'withdraw' | 'kyc', id: string, action: 'approve' | 'reject') => {
    if (!db) return;
    try {
      const collectionName = type === 'kyc' ? 'verifications' : type === 'deposit' ? 'deposits' : 'withdrawals';
      const docRef = doc(db, collectionName, id);
      const snap = await getDocs(query(collection(db, collectionName), where('__name__', '==', id)));
      if (snap.empty) return;
      const data = snap.docs[0].data();

      if (action === 'approve') {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', data.userId);
          transaction.update(docRef, { status: 'approved' });
          if (type === 'deposit') {
            transaction.update(userRef, { balance: increment(data.amount) });
            const txRef = doc(collection(db, 'users', data.userId, 'transactions'));
            transaction.set(txRef, { type: 'deposit', amount: data.amount, status: 'completed', date: new Date().toISOString() });
          } else if (type === 'kyc') {
            transaction.update(userRef, { verified: true });
          }
          const notifRef = doc(collection(db, 'users', data.userId, 'notifications'));
          transaction.set(notifRef, {
            title: type === 'deposit' ? "Vault Shipped" : type === 'kyc' ? "Authority Verified" : "Withdrawal Secured",
            message: type === 'deposit' ? `Success! $${data.amount} added to your assets.` : type === 'kyc' ? "Your identity protocol is now verified." : `Your $${data.amount} request has been processed.`,
            read: false,
            date: new Date().toISOString()
          });
        });
      } else {
        await runTransaction(db, async (transaction) => {
          transaction.update(docRef, { status: 'rejected' });
          if (type === 'withdraw') {
            const userRef = doc(db, 'users', data.userId);
            transaction.update(userRef, { balance: increment(data.amount) });
          }
        });
      }
      toast({ title: "ACTION EXECUTED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED", description: e.message }); }
  };

  const handleSaveUser = async () => {
    if (!editingUserId || !db) return;
    try {
      await updateDoc(doc(db, 'users', editingUserId), {
        balance: parseFloat(editForm.balance),
        role: editForm.role,
        verified: editForm.verified
      });
      toast({ title: "USER SYNCED" });
      setEditingUserId(null);
    } catch (e: any) { toast({ variant: "destructive", title: "SYNC FAILED" }); }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v3.0</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">Superuser</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto bg-card/40 border border-white/5 rounded-2xl mb-8 p-1 gap-1 overflow-x-auto">
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ArrowUpCircle className="h-3 w-3 mr-1" /> Withdrawals</TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ArrowDownCircle className="h-3 w-3 mr-1" /> Deposits</TabsTrigger>
          <TabsTrigger value="chats" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><MessageSquare className="h-3 w-3 mr-1" /> Chats</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><Users className="h-3 w-3 mr-1" /> Ledger</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ShieldCheck className="h-3 w-3 mr-1" /> KYC</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-4">
          {withdrawals.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN RECORD</p></div> : 
            withdrawals.map((w: any) => (
              <div key={w.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><ArrowUpCircle size={20} /></div>
                  <div><p className="text-[10px] font-headline font-bold uppercase">@{w.username}</p><p className="text-[12px] font-headline font-black text-white">${w.amount}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleAction('withdraw', w.id, 'approve')} size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-[8px] font-headline uppercase">Approve</Button>
                  <Button onClick={() => handleAction('withdraw', w.id, 'reject')} size="sm" variant="destructive" className="h-8 text-[8px] font-headline uppercase">Reject</Button>
                </div>
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          {deposits.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN RECORD</p></div> : 
            deposits.map((d: any) => (
              <div key={d.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Dialog><DialogTrigger asChild><div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden cursor-zoom-in"><img src={d.proofUrl} className="w-full h-full object-cover" /></div></DialogTrigger><DialogContent className="max-w-2xl bg-black/90 p-0"><img src={d.proofUrl} className="w-full h-auto" /></DialogContent></Dialog>
                  <div><p className="text-[10px] font-headline font-bold uppercase">@{d.username}</p><p className="text-[12px] font-headline font-black text-primary">${d.amount}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleAction('deposit', d.id, 'approve')} size="sm" className="h-8 bg-primary text-background font-headline text-[8px] uppercase">Verify Assets</Button>
                  <Button onClick={() => handleAction('deposit', d.id, 'reject')} size="sm" variant="outline" className="h-8 text-[8px] font-headline uppercase border-white/10">Purge</Button>
                </div>
              </div>
            ))
          }
        </TabsContent>

        <TabsContent value="chats" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", chatConfig?.isActive ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
                <CircleDot className={cn("h-5 w-5", chatConfig?.isActive && "animate-pulse")} />
              </div>
              <div>
                <p className="text-[10px] font-headline font-bold uppercase">{chatConfig?.isActive ? "Live Support Online" : "Live Support Offline"}</p>
                <p className="text-[7px] text-muted-foreground uppercase">{chatConfig?.isActive ? "Agents searching for sessions" : "Automated reply active"}</p>
              </div>
            </div>
            <Switch checked={chatConfig?.isActive || false} onCheckedChange={toggleChatAvailability} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <CircleDot size={12} className="text-primary animate-pulse" />
                <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Active Protocols</p>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {chatSessions.length === 0 ? (
                  <p className="text-center text-[8px] text-muted-foreground uppercase py-10">No active protocols</p>
                ) : chatSessions.map((s: any) => (
                  <button key={s.id} onClick={() => setActiveChat(s)} className={cn("w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5", activeChat?.id === s.id && "bg-primary/10 border-primary/20")}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-headline font-bold uppercase">@{s.username}</p>
                      <p className="text-[6px] text-primary font-black">{s.caseId}</p>
                    </div>
                    <p className="text-[8px] text-muted-foreground truncate uppercase">{s.lastMessage}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[6px] text-white/20 uppercase">{new Date(s.updatedAt).toLocaleTimeString()}</p>
                      <Badge variant="outline" className="text-[5px] h-3 uppercase border-white/10">{s.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto border-t border-white/10 bg-black/20">
                <div className="p-4 border-b border-white/5 flex items-center gap-2"><History size={12} className="text-muted-foreground" /><p className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Archive Ledger</p></div>
                <div className="h-[200px] overflow-y-auto no-scrollbar">
                  {archivedSessions.length === 0 ? <p className="text-center text-[7px] text-muted-foreground uppercase py-6 opacity-40">Ledger is clean</p> : archivedSessions.map((s: any) => (
                    <div key={s.id} onClick={() => handleOpenArchive(s)} className="w-full p-3 border-b border-white/5 text-left transition-all hover:bg-white/5 flex justify-between items-center group cursor-pointer">
                      <div className="flex-1">
                        <p className="text-[9px] font-headline font-bold uppercase text-white/60 group-hover:text-primary transition-colors">{s.caseId}</p>
                        <p className="text-[6px] text-muted-foreground uppercase">{new Date(s.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.rating && <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={6} className={cn(i < s.rating ? "text-primary fill-primary" : "text-white/10")} />)}</div>}
                        <button onClick={(e) => handleDeleteArchive(e, s.id)} className="p-1.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash size={10} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
              {activeChat ? (
                <>
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><UserIcon size={16} /></div>
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">@{activeChat.username} <span className="text-[7px] text-primary ml-2">[{activeChat.caseId}]</span></p>
                        <p className="text-[7px] text-muted-foreground uppercase">{activeChat.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeChat.status === 'open' && <Button onClick={handleJoinChat} disabled={isJoiningChat} size="sm" className="h-8 bg-green-600 text-white rounded-lg text-[8px] font-headline uppercase tracking-widest"><Play size={12} className="mr-1" /> Join Chat</Button>}
                      <Button onClick={handleEndChat} disabled={isClosingChat} size="sm" className="h-8 bg-red-600 text-white rounded-lg text-[8px] font-headline uppercase tracking-widest"><LogOut size={12} className="mr-1" /> End Case</Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isAdmin ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn("p-3 rounded-2xl text-[10px] font-headline", msg.isAdmin ? "bg-primary text-background rounded-tr-none shadow-lg" : "bg-muted text-foreground rounded-tl-none border border-white/10")}>{msg.text}</div>
                        <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    <div ref={chatScrollRef} />
                  </div>
                  {activeChat.status === 'active' ? (
                    <form onSubmit={handleSendAdminReply} className="p-4 border-t border-white/5 bg-white/5 flex gap-2"><Input placeholder="TRANSMIT REPLY..." className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] font-headline" value={chatReply} onChange={(e) => setChatMessage(e.target.value)} /><button type="submit" disabled={!chatReply.trim()} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center hover:scale-105 transition-all"><SendHorizontal size={20} /></button></form>
                  ) : <div className="p-4 bg-muted/20 text-center"><p className="text-[8px] font-headline uppercase text-muted-foreground">Join protocol to enable transmission</p></div>}
                </>
              ) : <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20"><MessageSquare size={64} className="mb-4" /><p className="text-sm font-headline font-bold uppercase tracking-widest">Select Protocol to Intercept</p></div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full sm:max-w-md group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" /><Input placeholder="SEARCH INTEL LEDGER..." className="pl-12 h-12 bg-card/40 border-white/10 rounded-2xl text-[10px] font-headline uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-4"><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Active Entities</p><p className="text-lg font-headline font-black text-white">{allUsers.length}</p></div><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Global Liquidity</p><p className="text-lg font-headline font-black text-primary">${allUsers.reduce((acc: any, u: any) => acc + (u.balance || 0), 0).toLocaleString()}</p></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u: any) => (
              <div key={u.id} className="glass-card p-5 rounded-[2rem] border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center relative overflow-hidden", u.verified ? "border-green-500" : "border-red-500")}>{u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="text-muted-foreground" />}</div>
                    <div><p className="text-[10px] font-headline font-bold uppercase">@{u.username}</p><p className="text-[7px] text-muted-foreground font-black tracking-widest">{u.customId}</p></div>
                  </div>
                  <button onClick={() => { setEditingUserId(u.id); setEditEditForm(u); }} className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all"><Settings2 size={16} /></button>
                </div>
                <div className="space-y-3"><div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Vault Status:</span><span className="text-sm font-headline font-black text-primary">${u.balance?.toLocaleString()}</span></div><div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Role:</span><Badge variant="outline" className="text-[6px] uppercase border-primary/20 text-primary">{u.role}</Badge></div></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="space-y-4">
          {verifications.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN PROTOCOL</p></div> : 
            verifications.map((v: any) => (
              <div key={v.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Dialog><DialogTrigger asChild><div className="w-12 h-12 rounded-xl bg-secondary/10 overflow-hidden cursor-zoom-in"><img src={v.docImageUrl} className="w-full h-full object-cover" /></div></DialogTrigger><DialogContent className="max-w-2xl bg-black/90 p-0"><img src={v.docImageUrl} className="w-full h-auto" /></DialogContent></Dialog>
                  <div><p className="text-[10px] font-headline font-bold uppercase">@{v.username}</p><p className="text-[7px] text-muted-foreground uppercase">IDENTITY SCAN: {v.status}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleAction('kyc', v.id, 'approve')} size="sm" className="h-8 bg-secondary text-background font-headline text-[8px] uppercase">Verify</Button>
                  <Button onClick={() => handleAction('kyc', v.id, 'reject')} size="sm" variant="destructive" className="h-8 text-[8px] font-headline uppercase">Invalidate</Button>
                </div>
              </div>
            ))
          }
        </TabsContent>
      </Tabs>

      {/* User Edit Modal */}
      <Dialog open={!!editingUserId} onOpenChange={() => setEditingUserId(null)}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Settings2 size={14} className="text-primary" /> Edit Entity Protocol</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Adjust Balance ($)</Label><Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-lg text-primary text-center" value={editForm.balance} onChange={(e) => setEditEditForm({...editForm, balance: e.target.value})} /></div>
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Authority Role</Label><Select value={editForm.role} onValueChange={(val) => setEditEditForm({...editForm, role: val})}><SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-white/10"><SelectItem value="user">User (Standard)</SelectItem><SelectItem value="agent">Agent (Intermediate)</SelectItem><SelectItem value="admin">Admin (Full Control)</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"><Label className="text-[10px] font-headline uppercase">Verified Entity</Label><Switch checked={editForm.verified} onCheckedChange={(val) => setEditEditForm({...editForm, verified: val})} /></div>
            <Button onClick={handleSaveUser} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Sync Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Modal */}
      <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-hidden flex flex-col max-h-[80vh]">
          {selectedArchive && (
            <>
              <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><History size={14} className="text-primary" /> Case Archive: {selectedArchive.caseId}</DialogTitle></DialogHeader>
              <div className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                {!showFullArchive ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95">
                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Subject:</span><span className="text-[10px] font-headline font-bold text-primary">@{selectedArchive.username}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Date:</span><span className="text-[9px] font-headline text-white/60">{new Date(selectedArchive.updatedAt).toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Info size={10} /> Problem Description</Label>
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl"><p className="text-[11px] font-headline text-white italic leading-relaxed">"{archiveMessages.find(m => !m.isAdmin && m.senderId !== 'system')?.text || "No description found."}"</p></div>
                    </div>
                    {(selectedArchive.rating || selectedArchive.feedback) && (
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center"><span className="text-[8px] text-green-500 uppercase font-black">User Feedback:</span><div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={12} className={cn(i < selectedArchive.rating ? "text-primary fill-primary" : "text-white/10")} />)}</div></div>
                        {selectedArchive.feedback && <p className="text-[10px] font-headline text-white/60 italic leading-relaxed border-t border-white/5 pt-2">"{selectedArchive.feedback}"</p>}
                      </div>
                    )}
                    <Button onClick={() => setShowFullArchive(true)} className="w-full h-14 bg-white/5 border border-white/10 rounded-xl font-headline text-[9px] uppercase tracking-widest hover:bg-primary hover:text-background transition-all">Open Full Protocol Log <ArrowRight size={14} className="ml-2" /></Button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-4"><button onClick={() => setShowFullArchive(false)} className="text-[8px] font-headline uppercase text-primary hover:underline flex items-center gap-1"><ChevronDown className="rotate-90 h-3 w-3" /> Back to Intel</button><Badge variant="outline" className="text-[6px] uppercase border-white/10">Full Log</Badge></div>
                    <div className="space-y-4">
                      {archiveMessages.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.isAdmin ? "self-end items-end" : "self-start items-start")}>
                          <div className={cn("p-3 rounded-2xl text-[9px] font-headline", msg.isAdmin ? "bg-primary/20 text-white border border-primary/20" : "bg-muted text-foreground border border-white/5")}>{msg.text}</div>
                          <span className="text-[5px] text-muted-foreground mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="ghost" onClick={() => setSelectedArchive(null)} className="mt-6 w-full h-10 text-[8px] font-headline uppercase text-muted-foreground">Close Archives</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
