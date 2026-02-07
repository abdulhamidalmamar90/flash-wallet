"use client"

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Loader2, 
  Users, 
  Search, 
  User as UserIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Globe,
  DollarSign,
  Trash2,
  Settings2,
  Plus,
  CircleDot,
  SendHorizontal,
  LogOut,
  Star,
  History,
  Info,
  ArrowRight,
  MessageSquare,
  ShoppingBag,
  Ticket,
  ChevronDown,
  PlusCircle,
  Banknote,
  ClipboardList,
  Store as StoreIcon,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  runTransaction, 
  setDoc, 
  increment, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

const COUNTRIES = [
  { code: 'GL', name: 'Global' },
  { code: 'CR', name: 'Crypto' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'UAE' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'JO', name: 'Jordan' },
  { code: 'IQ', name: 'Iraq' },
];

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  
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

  // Management States
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [methodType, setMethodType] = useState<'deposit' | 'withdraw'>('deposit');
  const [newMethod, setNewMethod] = useState<any>({
    name: '',
    country: 'GL',
    currencyCode: 'USD',
    exchangeRate: 1,
    feeType: 'fixed',
    feeValue: 0,
    isActive: true,
    fields: [{ label: '', value: '', type: 'text' }]
  });

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<any>({
    name: '',
    category: 'GAMES',
    price: 0,
    type: 'fixed',
    variants: [{ label: '', price: 0 }],
    requiresInput: false,
    inputLabel: '',
    isActive: true,
    imageUrl: '',
    color: 'bg-primary'
  });

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  // Queries
  const allWithdrawalsQuery = useMemo(() => query(collection(db, 'withdrawals')), [db]);
  const { data: allWithdrawals = [] } = useCollection(allWithdrawalsQuery);
  const withdrawals = useMemo(() => [...allWithdrawals].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allWithdrawals]);

  const allDepositsQuery = useMemo(() => query(collection(db, 'deposits')), [db]);
  const { data: allDeposits = [] } = useCollection(allDepositsQuery);
  const deposits = useMemo(() => [...allDeposits].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allDeposits]);

  const allUsersQuery = useMemo(() => query(collection(db, 'users')), [db]);
  const { data: allUsers = [] } = useCollection(allUsersQuery);

  const allVerificationsQuery = useMemo(() => query(collection(db, 'verifications')), [db]);
  const { data: allVerifications = [] } = useCollection(allVerificationsQuery);
  const verifications = useMemo(() => [...allVerifications].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allVerifications]);

  const allTicketsQuery = useMemo(() => query(collection(db, 'support_tickets')), [db]);
  const { data: allTickets = [] } = useCollection(allTicketsQuery);
  const tickets = useMemo(() => [...allTickets].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allTickets]);

  const allOrdersQuery = useMemo(() => query(collection(db, 'service_requests')), [db]);
  const { data: allOrders = [] } = useCollection(allOrdersQuery);
  const orders = useMemo(() => [...allOrders].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), [allOrders]);

  const chatSessionsQuery = useMemo(() => query(collection(db, 'chat_sessions')), [db]);
  const { data: allChatSessions = [] } = useCollection(chatSessionsQuery);

  const depositMethodsQuery = useMemo(() => query(collection(db, 'deposit_methods')), [db]);
  const { data: depositMethods = [] } = useCollection(depositMethodsQuery);

  const withdrawalMethodsQuery = useMemo(() => query(collection(db, 'withdrawal_methods')), [db]);
  const { data: withdrawalMethods = [] } = useCollection(withdrawalMethodsQuery);

  const productsQuery = useMemo(() => query(collection(db, 'marketplace_services')), [db]);
  const { data: products = [] } = useCollection(productsQuery);

  // Processed Chat Data
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

  useEffect(() => {
    if (!db || !activeChat) return;
    const qMsg = query(collection(db, 'chat_sessions', activeChat.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(qMsg, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [db, activeChat]);

  // Handlers
  const handleAction = async (type: 'deposit' | 'withdraw' | 'kyc' | 'order', id: string, action: 'approve' | 'reject', extra?: any) => {
    if (!db) return;
    try {
      const collectionName = type === 'kyc' ? 'verifications' : type === 'deposit' ? 'deposits' : type === 'withdraw' ? 'withdrawals' : 'service_requests';
      const docRef = doc(db, collectionName, id);
      
      const snap = await getDocs(query(collection(db, collectionName), where('__name__', '==', id)));
      if (snap.empty) return;
      const data = snap.docs[0].data();

      if (action === 'approve') {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', data.userId);
          transaction.update(docRef, { status: 'approved', ...extra });
          
          if (type === 'deposit') {
            transaction.update(userRef, { balance: increment(data.amount) });
            const txRef = doc(collection(db, 'users', data.userId, 'transactions'));
            transaction.set(txRef, { type: 'deposit', amount: data.amount, status: 'completed', date: new Date().toISOString() });
          } else if (type === 'kyc') {
            transaction.update(userRef, { verified: true });
          }
          
          const notifRef = doc(collection(db, 'users', data.userId, 'notifications'));
          transaction.set(notifRef, {
            title: type === 'deposit' ? "Assets Credited" : type === 'kyc' ? "Authority Verified" : type === 'order' ? "Order Fulfilled" : "Withdrawal Success",
            message: type === 'deposit' ? `$${data.amount} added to vault.` : type === 'order' ? `${data.serviceName} is now ready.` : "Protocol executed successfully.",
            read: false,
            date: new Date().toISOString()
          });
        });
      } else {
        await runTransaction(db, async (transaction) => {
          transaction.update(docRef, { status: 'rejected', rejectionReason: extra?.reason || 'Protocol Denied' });
          if (type === 'withdraw' || type === 'order') {
            const userRef = doc(db, 'users', data.userId);
            transaction.update(userRef, { balance: increment(data.amountUsd || data.price) });
          }
        });
      }
      toast({ title: "ACTION EXECUTED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED", description: e.message }); }
  };

  const handleSaveMethod = async () => {
    if (!db) return;
    try {
      const collectionName = methodType === 'deposit' ? 'deposit_methods' : 'withdrawal_methods';
      await addDoc(collection(db, collectionName), newMethod);
      toast({ title: "METHOD DEPLOYED" });
      setIsAddingMethod(false);
    } catch (e) { toast({ variant: "destructive", title: "DEPLOY FAILED" }); }
  };

  const handleSaveProduct = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'marketplace_services'), newProduct);
      toast({ title: "PRODUCT SECURED" });
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        category: 'GAMES',
        price: 0,
        type: 'fixed',
        variants: [{ label: '', price: 0 }],
        requiresInput: false,
        inputLabel: '',
        isActive: true,
        imageUrl: '',
        color: 'bg-primary'
      });
    } catch (e) { toast({ variant: "destructive", title: "PURGE FAILED" }); }
  };

  const toggleStatus = async (coll: string, id: string, status: boolean) => {
    try { await updateDoc(doc(db, coll, id), { isActive: status }); toast({ title: "STATUS SYNCED" }); } catch (e) { }
  };

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

  const handleDeleteArchive = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Purge this protocol log?")) return;
    try { await deleteDoc(doc(db, 'chat_sessions', sessionId)); toast({ title: "PURGED" }); if (selectedArchive?.id === sessionId) setSelectedArchive(null); } catch (e) { }
  };

  const handleOpenArchive = async (session: any) => {
    setSelectedArchive(session);
    setShowFullArchive(false);
    try {
      const q = query(collection(db, 'chat_sessions', session.id, 'messages'), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      setArchiveMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { }
  };

  const handleDeleteUserEntity = async () => {
    if (!editingUserId || !db) return;
    try {
      await deleteDoc(doc(db, 'users', editingUserId));
      toast({ title: "ENTITY PURGED", description: "The user has been removed from all database records." });
      setEditingUserId(null);
      setIsUserDeleteDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "PURGE FAILED", description: e.message });
    }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v4.5.0</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">System Master</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <div className="pb-8">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto bg-card/40 border border-white/5 rounded-[2rem] p-2 gap-2">
            <TabsTrigger value="withdrawals" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Withdraws</TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ArrowDownCircle className="h-4 w-4" /> Deposits</TabsTrigger>
            <TabsTrigger value="chats" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><MessageSquare className="h-4 w-4" /> Chats</TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Ticket className="h-4 w-4" /> Tickets</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ClipboardList className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="gateways" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Banknote className="h-4 w-4" /> Gateways</TabsTrigger>
            <TabsTrigger value="store" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><StoreIcon className="h-4 w-4" /> Store</TabsTrigger>
            <TabsTrigger value="users" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Users className="h-4 w-4" /> Entities</TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2 sm:col-span-4"><ShieldCheck className="h-4 w-4" /> KYC Verification</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Withdrawals */}
        <TabsContent value="withdrawals" className="space-y-4">
          {withdrawals.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN RECORD</p></div> : 
            withdrawals.map((w: any) => (
              <div key={w.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><ArrowUpCircle size={20} /></div>
                  <div>
                    <div className="text-[10px] font-headline font-bold uppercase">@{w.username} <span className="text-white/20 ml-2">({w.methodName})</span></div>
                    <div className="text-[12px] font-headline font-black text-white">${w.amountUsd} <ArrowRight className="inline mx-1 h-3 w-3 text-muted-foreground" /> {w.netAmount} {w.currencyCode}</div>
                  </div>
                </div>
                {w.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction('withdraw', w.id, 'approve')} size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-[8px] font-headline uppercase">Approve</Button>
                    <Button onClick={() => handleAction('withdraw', w.id, 'reject')} size="sm" variant="destructive" className="h-8 text-[8px] font-headline uppercase">Reject</Button>
                  </div>
                )}
                {w.status !== 'pending' && <Badge className="uppercase text-[8px]">{w.status}</Badge>}
              </div>
            ))
          }
        </TabsContent>

        {/* 2. Deposits */}
        <TabsContent value="deposits" className="space-y-4">
          {deposits.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN RECORD</p></div> : 
            deposits.map((d: any) => (
              <div key={d.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Dialog>
                    <DialogTrigger asChild><div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden cursor-zoom-in border border-white/5"><img src={d.proofUrl} className="w-full h-full object-cover" alt="proof" /></div></DialogTrigger>
                    <DialogContent className="max-w-2xl bg-black/90 p-0">
                      <DialogHeader className="sr-only"><DialogTitle>Proof of Payment Preview</DialogTitle></DialogHeader>
                      <img src={d.proofUrl} className="w-full h-auto" alt="proof enlarged" />
                    </DialogContent>
                  </Dialog>
                  <div>
                    <div className="text-[10px] font-headline font-bold uppercase">@{d.username} <span className="text-white/20 ml-2">via {d.method}</span></div>
                    <div className="text-[12px] font-headline font-black text-primary">${d.amount}</div>
                  </div>
                </div>
                {d.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction('deposit', d.id, 'approve')} size="sm" className="h-8 bg-primary text-background font-headline text-[8px] uppercase">Verify Assets</Button>
                    <Button onClick={() => handleAction('deposit', d.id, 'reject')} size="sm" variant="outline" className="h-8 text-[8px] font-headline uppercase border-white/10">Purge</Button>
                  </div>
                )}
                {d.status !== 'pending' && <Badge className="uppercase text-[8px]">{d.status}</Badge>}
              </div>
            ))
          }
        </TabsContent>

        {/* 3. Chats */}
        <TabsContent value="chats" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", chatConfig?.isActive ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
                <CircleDot className={cn("h-5 w-5", chatConfig?.isActive && "animate-pulse")} />
              </div>
              <div>
                <div className="text-[10px] font-headline font-bold uppercase">{chatConfig?.isActive ? "Live Support Online" : "Live Support Offline"}</div>
                <div className="text-[7px] text-muted-foreground uppercase">{chatConfig?.isActive ? "Agents searching for sessions" : "Automated reply active"}</div>
              </div>
            </div>
            <Switch checked={chatConfig?.isActive || false} onCheckedChange={(isActive) => setDoc(doc(db, 'system_settings', 'chat_config'), { isActive })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center gap-2"><CircleDot size={12} className="text-primary animate-pulse" /><div className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Active Protocols</div></div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {chatSessions.length === 0 ? <p className="text-center text-[8px] text-muted-foreground uppercase py-10">No active protocols</p> : chatSessions.map((s: any) => (
                  <button key={s.id} onClick={() => setActiveChat(s)} className={cn("w-full p-4 border-b border-white/5 text-left transition-all hover:bg-white/5", activeChat?.id === s.id && "bg-primary/10 border-primary/20")}>
                    <div className="flex justify-between items-center mb-1"><p className="text-[10px] font-headline font-bold uppercase">@{s.username}</p><p className="text-[6px] text-primary font-black">{s.caseId}</p></div>
                    <p className="text-[8px] text-muted-foreground truncate uppercase">{s.lastMessage}</p>
                    <div className="flex justify-between items-center mt-1"><p className="text-[6px] text-white/20 uppercase">{new Date(s.updatedAt).toLocaleTimeString()}</p><Badge variant="outline" className="text-[5px] h-3 uppercase border-white/10">{s.status}</Badge></div>
                  </button>
                ))}
              </div>
              <div className="mt-auto border-t border-white/10 bg-black/20">
                <div className="p-4 border-b border-white/5 flex items-center gap-2"><History size={12} className="text-muted-foreground" /><div className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Archive Ledger</div></div>
                <div className="h-[200px] overflow-y-auto no-scrollbar">
                  {archivedSessions.length === 0 ? <p className="text-center text-[7px] text-muted-foreground uppercase py-6 opacity-40">Ledger is clean</p> : archivedSessions.map((s: any) => (
                    <div key={s.id} onClick={() => handleOpenArchive(s)} className="w-full p-3 border-b border-white/5 text-left transition-all hover:bg-white/5 flex justify-between items-center group cursor-pointer">
                      <div className="flex-1"><p className="text-[9px] font-headline font-bold uppercase text-white/60 group-hover:text-primary transition-colors">{s.caseId}</p><p className="text-[6px] text-muted-foreground uppercase">{new Date(s.updatedAt).toLocaleDateString()}</p></div>
                      <div className="flex items-center gap-2">
                        {s.rating && <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={6} className={cn(i < s.rating ? "text-primary fill-primary" : "text-white/10")} />)}</div>}
                        <button onClick={(e) => handleDeleteArchive(e, s.id)} className="p-1.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
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
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><UserIcon size={16} /></div><div><p className="text-[10px] font-headline font-bold uppercase">@{activeChat.username} <span className="text-[7px] text-primary ml-2">[{activeChat.caseId}]</span></p><p className="text-[7px] text-muted-foreground uppercase">{activeChat.email}</p></div></div>
                    <div className="flex gap-2">
                      {activeChat.status === 'open' && <Button onClick={handleJoinChat} disabled={isJoiningChat} size="sm" className="h-8 bg-green-600 text-white rounded-lg text-[8px] font-headline uppercase tracking-widest"><CircleDot size={12} className="mr-1" /> Join Chat</Button>}
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

        {/* 4. Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          {tickets.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">NO TICKETS</p></div> : 
            tickets.map((t: any) => (
              <div key={t.id} className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {t.imageUrl ? (
                      <Dialog>
                        <DialogTrigger asChild><div className="w-12 h-12 rounded-xl bg-blue-500/10 overflow-hidden cursor-zoom-in border border-white/5"><img src={t.imageUrl} className="w-full h-full object-cover" alt="attachment" /></div></DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black/90 p-0">
                          <DialogHeader className="sr-only"><DialogTitle>Ticket Attachment Preview</DialogTitle></DialogHeader>
                          <img src={t.imageUrl} className="w-full h-auto" alt="attachment enlarged" />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><FileText size={24} /></div>
                    )}
                    <div>
                      <div className="text-[10px] font-headline font-bold uppercase">@{t.username} <span className="text-white/20 ml-2">[{t.subject}]</span></div>
                      <p className="text-[8px] text-muted-foreground uppercase">{new Date(t.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="uppercase text-[7px] border-blue-500/30 text-blue-500">{t.status}</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-headline leading-relaxed text-white/80 italic">"{t.message}"</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => { await updateDoc(doc(db, 'support_tickets', t.id), { status: 'resolved' }); toast({ title: "RESOLVED" }); }} size="sm" className="h-8 bg-blue-600 text-white text-[8px] font-headline uppercase">Mark Resolved</Button>
                  <Button onClick={async () => { if(confirm("Purge?")) await deleteDoc(doc(db, 'support_tickets', t.id)); }} size="sm" variant="ghost" className="h-8 text-red-500 text-[8px] font-headline uppercase">Purge</Button>
                </div>
              </div>
            ))
          }
        </TabsContent>

        {/* 5. Orders */}
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">NO ORDERS</p></div> : 
            orders.map((o: any) => (
              <div key={o.id} className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><ShoppingBag size={20} /></div>
                    <div>
                      <div className="text-[10px] font-headline font-bold uppercase">@{o.username} <span className="text-white/20 ml-2"> ordered {o.serviceName}</span></div>
                      <div className="text-[12px] font-headline font-black text-primary">${o.price} <span className="text-[8px] text-muted-foreground font-black ml-2">{o.selectedVariant}</span></div>
                    </div>
                  </div>
                  <Badge className="uppercase text-[7px]">{o.status}</Badge>
                </div>
                {o.userInput && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                    <span className="text-[8px] text-muted-foreground uppercase font-black">User Data:</span>
                    <span className="text-[10px] font-headline font-bold text-primary select-all">{o.userInput}</span>
                  </div>
                )}
                {o.status === 'pending' && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" className="h-8 bg-green-600 text-white text-[8px] font-headline uppercase">Complete Order</Button></DialogTrigger>
                      <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem]">
                        <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase">Deliver Asset</DialogTitle></DialogHeader>
                        <div className="mt-4 space-y-4">
                          <Label className="text-[8px] uppercase">Asset Key / Result Code</Label>
                          <Input id={`code-${o.id}`} placeholder="ENTER CODE..." className="h-12 bg-background border-white/10" />
                          <Button onClick={() => {
                            const val = (document.getElementById(`code-${o.id}`) as HTMLInputElement).value;
                            handleAction('order', o.id, 'approve', { resultCode: val });
                          }} className="w-full h-12 bg-primary text-background font-headline font-bold text-[9px] uppercase">Authorize Delivery</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => handleAction('order', o.id, 'reject', { reason: 'System Failure' })} size="sm" variant="destructive" className="h-8 text-[8px] font-headline uppercase">Refund & Reject</Button>
                  </div>
                )}
              </div>
            ))
          }
        </TabsContent>

        {/* 6. Gateways */}
        <TabsContent value="gateways" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div><h2 className="text-sm font-headline font-bold uppercase tracking-widest">Gateway Architect</h2><p className="text-[8px] text-muted-foreground uppercase">Configure Global Payment Entry/Exit Points</p></div>
            <div className="flex gap-3">
              <Button onClick={() => { setMethodType('deposit'); setIsAddingMethod(true); }} className="bg-primary/10 border border-primary/20 text-primary h-10 rounded-xl font-headline text-[8px] uppercase"><Plus size={14} className="mr-1" /> New Deposit Gateway</Button>
              <Button onClick={() => { setMethodType('withdraw'); setIsAddingMethod(true); }} className="bg-secondary/10 border border-secondary/20 text-secondary h-10 rounded-xl font-headline text-[8px] uppercase"><Plus size={14} className="mr-1" /> New Withdraw Gateway</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase text-primary tracking-widest flex items-center gap-2"><ArrowDownCircle size={14} /> Deposit Routes</h3>
              <div className="space-y-3">
                {depositMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10"><Globe size={18} /></div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-headline font-bold uppercase">{m.name}</span>
                          <Badge variant="outline" className="text-[6px] border-white/10 uppercase">{m.country}</Badge>
                        </div>
                        <div className="text-[8px] text-muted-foreground uppercase">Rate: 1 USD = {m.exchangeRate} {m.currencyCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={m.isActive} onCheckedChange={(val) => toggleStatus('deposit_methods', m.id, val)} />
                      <button onClick={async () => { if(confirm("Delete gateway?")) await deleteDoc(doc(db, 'deposit_methods', m.id)); }} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase text-secondary tracking-widest flex items-center gap-2"><ArrowUpCircle size={14} /> Withdrawal Routes</h3>
              <div className="space-y-3">
                {withdrawalMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/5 flex items-center justify-center text-secondary border border-secondary/10"><DollarSign size={18} /></div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-headline font-bold uppercase">{m.name}</span>
                          <Badge variant="outline" className="text-[6px] border-white/10 uppercase">{m.country}</Badge>
                        </div>
                        <div className="text-[8px] text-muted-foreground uppercase">Fee: {m.feeValue}{m.feeType === 'percent' ? '%' : ' Fixed'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={m.isActive} onCheckedChange={(val) => toggleStatus('withdrawal_methods', m.id, val)} />
                      <button onClick={async () => { if(confirm("Delete gateway?")) await deleteDoc(doc(db, 'withdrawal_methods', m.id)); }} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 7. Store */}
        <TabsContent value="store" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div><h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Marketplace Core</h2><p className="text-[8px] text-muted-foreground uppercase">Deploy and Manage Global Digital Assets</p></div>
            <Button onClick={() => setIsAddingProduct(true)} className="bg-primary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest gold-glow"><PlusCircle size={16} className="mr-2" /> Add New Asset</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="glass-card rounded-[2rem] overflow-hidden border-white/5 group">
                <div className="aspect-video relative bg-white/5">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag size={32} /></div>}
                  <div className="absolute top-3 left-3"><Badge className="text-[6px] uppercase border-white/10 bg-black/40">{p.category}</Badge></div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-headline font-bold uppercase truncate">{p.name}</h4>
                    <div className="text-lg font-headline font-black text-primary">${p.price || (p.variants && p.variants[0]?.price)}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <Switch checked={p.isActive} onCheckedChange={(val) => toggleStatus('marketplace_services', p.id, val)} />
                    <button onClick={async () => { if(confirm("Purge asset?")) await deleteDoc(doc(db, 'marketplace_services', p.id)); }} className="p-2 text-red-500/40 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 8. Users */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full sm:max-w-md group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" /><Input placeholder="SEARCH INTEL LEDGER..." className="pl-12 h-12 bg-card/40 border-white/10 rounded-2xl text-[10px] font-headline uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-4"><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Active Entities</p><p className="text-lg font-headline font-black text-white">{allUsers.length}</p></div><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Managed Liquidity</p><p className="text-lg font-headline font-black text-primary">${allUsers.reduce((acc: any, u: any) => acc + (u.balance || 0), 0).toLocaleString()}</p></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u: any) => (
              <div key={u.id} className="glass-card p-5 rounded-[2rem] border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center relative overflow-hidden", u.verified ? "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-red-500")}>{u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <UserIcon className="text-muted-foreground" />}</div>
                    <div>
                      <div className="text-[10px] font-headline font-bold uppercase">@{u.username}</div>
                      <div className="text-[7px] text-muted-foreground font-black tracking-widest flex flex-col gap-0.5 mt-1">
                        <span>ID: {u.customId}</span>
                        <span className="lowercase opacity-60 truncate max-w-[120px]">{u.email}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setEditingUserId(u.id); setEditForm(u); }} className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all"><Settings2 size={16} /></button>
                </div>
                <div className="space-y-3"><div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Vault Status:</span><span className="text-sm font-headline font-black text-primary">${u.balance?.toLocaleString()}</span></div><div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Role:</span><Badge variant="outline" className="text-[6px] uppercase border-primary/20 text-primary">{u.role}</Badge></div></div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 9. KYC */}
        <TabsContent value="kyc" className="space-y-4">
          {verifications.length === 0 ? <div className="py-20 text-center glass-card rounded-3xl opacity-20"><Info className="mx-auto mb-2" /><p className="text-[10px] font-headline">CLEAN PROTOCOL</p></div> : 
            verifications.map((v: any) => (
              <div key={v.id} className="glass-card p-6 rounded-3xl border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Dialog>
                    <DialogTrigger asChild><div className="w-12 h-12 rounded-xl bg-secondary/10 overflow-hidden cursor-zoom-in border border-white/5"><img src={v.docImageUrl} className="w-full h-full object-cover" alt="KYC document" /></div></DialogTrigger>
                    <DialogContent className="max-w-2xl bg-black/90 p-0">
                      <DialogHeader className="sr-only"><DialogTitle>Identity Scan Preview</DialogTitle></DialogHeader>
                      <img src={v.docImageUrl} className="w-full h-auto" alt="KYC enlarged" />
                    </DialogContent>
                  </Dialog>
                  <div><div className="text-[10px] font-headline font-bold uppercase">@{v.username}</div><p className="text-[7px] text-muted-foreground uppercase">IDENTITY SCAN: {v.status}</p></div>
                </div>
                {v.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction('kyc', v.id, 'approve')} className="h-8 px-4 bg-secondary text-background font-headline font-8px uppercase rounded-lg hover:scale-105 transition-all">Verify</button>
                    <button onClick={() => handleAction('kyc', v.id, 'reject')} className="h-8 px-4 bg-red-600 text-white font-headline text-[8px] uppercase rounded-lg hover:scale-105 transition-all">Invalidate</button>
                  </div>
                )}
                {v.status !== 'pending' && <Badge className="uppercase text-[8px]">{v.status}</Badge>}
              </div>
            ))
          }
        </TabsContent>
      </Tabs>

      {/* Management Dialogs */}
      <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Banknote size={14} className="text-primary" /> Gateway Configurator</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Gateway Name</Label><Input placeholder="e.g. STC Pay / Binance" className="bg-background border-white/10 h-12 text-xs" value={newMethod.name} onChange={(e) => setNewMethod({...newMethod, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase text-muted-foreground">Region</Label>
                <Select value={newMethod.country} onValueChange={(v) => setNewMethod({...newMethod, country: v})}>
                  <SelectTrigger className="bg-background border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10 z-[1100]">{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Exchange Rate (vs USD)</Label><Input type="number" className="bg-background border-white/10 h-12 text-xs" value={newMethod.exchangeRate} onChange={(e) => setNewMethod({...newMethod, exchangeRate: parseFloat(e.target.value)})} /></div>
            </div>
            {methodType === 'withdraw' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase text-muted-foreground">Fee Mode</Label>
                  <Select value={newMethod.feeType} onValueChange={(v) => setNewMethod({...newMethod, feeType: v})}>
                    <SelectTrigger className="bg-background border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10 z-[1100]"><SelectItem value="fixed">Fixed USD</SelectItem><SelectItem value="percent">Percentage</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Fee Value</Label><Input type="number" className="bg-background border-white/10 h-12 text-xs" value={newMethod.feeValue} onChange={(e) => setNewMethod({...newMethod, feeValue: parseFloat(e.target.value)})} /></div>
              </div>
            )}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center"><Label className="text-[8px] uppercase text-primary">Required Meta-Fields</Label><button onClick={() => setNewMethod({...newMethod, fields: [...newMethod.fields, { label: '', value: '', type: 'text' }]})} className="text-[8px] font-headline text-primary border border-primary/20 px-2 py-1 rounded-md">+ Add Field</button></div>
              {newMethod.fields.map((f: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Label (e.g. Account No)" className="bg-background/50 border-white/5 h-10 text-[10px]" value={f.label} onChange={(e) => { const fs = [...newMethod.fields]; fs[i].label = e.target.value; setNewMethod({...newMethod, fields: fs}); }} />
                  {methodType === 'deposit' && <Input placeholder="Value (e.g. 123456)" className="bg-background/50 border-white/5 h-10 text-[10px]" value={f.value} onChange={(e) => { const fs = [...newMethod.fields]; fs[i].value = e.target.value; setNewMethod({...newMethod, fields: fs}); }} />}
                  <button onClick={() => { const fs = newMethod.fields.filter((_: any, idx: number) => i !== idx); setNewMethod({...newMethod, fields: fs}); }} className="text-red-500/40 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
            <Button onClick={handleSaveMethod} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Deploy Gateway</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Foundry (Add Product) */}
      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><ShoppingBag size={14} className="text-primary" /> Asset Foundry</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Asset Name</Label><Input placeholder="PUBG Mobile 600 UC" className="bg-background border-white/10 h-12 text-xs" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase text-muted-foreground">Category</Label>
                <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                  <SelectTrigger className="bg-background border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10 z-[1100]"><SelectItem value="GAMES">Games</SelectItem><SelectItem value="CARDS">Gift Cards</SelectItem><SelectItem value="SOFTWARE">Software</SelectItem><SelectItem value="SOCIAL">Social Media</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Price ($)</Label><Input type="number" disabled={newProduct.type === 'variable'} className="bg-background border-white/10 h-12 text-xs disabled:opacity-30" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} /></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="space-y-1"><Label className="text-[9px] font-headline uppercase">Multiple Quantities</Label><p className="text-[7px] text-muted-foreground uppercase">Enable tiered pricing packages</p></div>
              <Switch checked={newProduct.type === 'variable'} onCheckedChange={(val) => setNewProduct({...newProduct, type: val ? 'variable' : 'fixed'})} />
            </div>

            {newProduct.type === 'variable' && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center"><Label className="text-[8px] uppercase text-primary">Pricing Tiers</Label><button onClick={() => setNewProduct({...newProduct, variants: [...newProduct.variants, { label: '', price: 0 }]})} className="text-[8px] font-headline text-primary border border-primary/20 px-2 py-1 rounded-md">+ Add Tier</button></div>
                {newProduct.variants.map((v: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Package (e.g. 600 UC)" className="flex-1 bg-background/50 border-white/5 h-10 text-[10px]" value={v.label} onChange={(e) => { const vs = [...newProduct.variants]; vs[i].label = e.target.value; setNewProduct({...newProduct, variants: vs}); }} />
                    <Input type="number" placeholder="Price" className="w-24 bg-background/50 border-white/5 h-10 text-[10px]" value={v.price} onChange={(e) => { const vs = [...newProduct.variants]; vs[i].price = parseFloat(e.target.value); setNewProduct({...newProduct, variants: vs}); }} />
                    <button onClick={() => { const vs = newProduct.variants.filter((_: any, idx: number) => i !== idx); setNewProduct({...newProduct, variants: vs}); }} className="text-red-500/40"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="space-y-1"><Label className="text-[9px] font-headline uppercase">Require User Input</Label><p className="text-[7px] text-muted-foreground uppercase">e.g. Game ID or Account Link</p></div>
              <Switch checked={newProduct.requiresInput} onCheckedChange={(val) => setNewProduct({...newProduct, requiresInput: val})} />
            </div>

            {newProduct.requiresInput && (
              <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Input Label</Label><Input placeholder="Enter Player ID" className="bg-background border-white/10 h-12 text-xs" value={newProduct.inputLabel} onChange={(e) => setNewProduct({...newProduct, inputLabel: e.target.value})} /></div>
            )}

            <div className="space-y-2"><Label className="text-[8px] uppercase text-muted-foreground">Image URL</Label><Input placeholder="https://..." className="bg-background border-white/10 h-12 text-xs" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} /></div>
            
            <Button onClick={handleSaveProduct} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Authorize Asset</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Modal */}
      <Dialog open={!!editingUserId} onOpenChange={() => setEditingUserId(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Settings2 size={14} className="text-primary" /> Edit Entity Protocol</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Adjust Balance ($)</Label><Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-lg text-primary text-center" value={editForm.balance} onChange={(e) => setEditForm({...editForm, balance: e.target.value})} /></div>
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Authority Role</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-white/10 z-[1100]">
                  <SelectItem value="user">User (Standard)</SelectItem>
                  <SelectItem value="agent">Agent (Intermediate)</SelectItem>
                  <SelectItem value="admin">Admin (Full Control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-card/40 rounded-2xl border border-white/10 shadow-inner group transition-all hover:border-primary/20">
              <div className="space-y-1">
                <Label className="text-[10px] font-headline font-bold uppercase tracking-widest group-hover:text-primary transition-colors">Verified Entity</Label>
                <p className="text-[7px] text-muted-foreground uppercase">Enable high-authority status</p>
              </div>
              <div dir="ltr" className="p-1.5 bg-background/20 rounded-full border border-white/5 flex items-center justify-center">
                <Switch 
                  checked={editForm.verified} 
                  onCheckedChange={(val) => setEditForm({...editForm, verified: val})} 
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button onClick={async () => { try { await updateDoc(doc(db, 'users', editingUserId!), { balance: parseFloat(editForm.balance), role: editForm.role, verified: editForm.verified }); toast({ title: "SYNCED" }); setEditingUserId(null); } catch (e) {} }} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Sync Changes</Button>
              
              <button 
                type="button"
                onClick={() => setIsUserDeleteDialogOpen(true)}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-500/60 hover:text-red-500 transition-all text-[8px] font-headline font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 rounded-xl"
              >
                <AlertTriangle size={14} /> Purge Entity from Ledger
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Popup */}
      <AlertDialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2rem] p-8 max-w-sm z-[2000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xs font-headline font-bold uppercase text-red-500 flex items-center gap-2">
              <AlertTriangle size={16} /> Critical Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-headline uppercase leading-relaxed text-white/60">
              This action will permanently purge the entity and all associated vault credentials from the global ledger. This protocol cannot be reversed. Proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col gap-2">
            <AlertDialogAction 
              onClick={handleDeleteUserEntity}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-headline font-black text-[10px] uppercase tracking-widest w-full"
            >
              Confirm Purge
            </AlertDialogAction>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-headline font-bold text-[9px] uppercase hover:bg-white/10 transition-all w-full">
              Abort Protocol
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl"><div className="text-[11px] font-headline text-white italic leading-relaxed">"{archiveMessages.find(m => !m.isAdmin && m.senderId !== 'system')?.text || "No description found."}"</div></div>
                    </div>
                    {(selectedArchive.rating || selectedArchive.feedback) && (
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center"><span className="text-[8px] text-green-500 uppercase font-black">User Feedback:</span><div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={6} className={cn(i < selectedArchive.rating ? "text-primary fill-primary" : "text-white/10")} />)}</div></div>
                        {selectedArchive.feedback && <div className="text-[10px] font-headline text-white/60 italic leading-relaxed border-t border-white/5 pt-2">"{selectedArchive.feedback}"</div>}
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
