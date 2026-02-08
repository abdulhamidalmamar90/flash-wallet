
"use client"

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';
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
  Settings2,
  PlusCircle,
  MessageSquare,
  ShoppingBag,
  Ticket,
  ClipboardList,
  Store as StoreIcon,
  AlertTriangle,
  Edit3,
  ImageIcon,
  Trash2,
  Banknote,
  Plus,
  Landmark,
  Database,
  Download,
  FileJson,
  ShieldAlert,
  SendHorizontal,
  CircleDot,
  FileArchive,
  Code2,
  Cpu,
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
  increment, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { exportProjectSource } from '@/app/actions/project-backup';

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const gatewayFileInputRef = useRef<HTMLInputElement>(null);

  // System States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isProjectBackingUp, setIsProjectBackingUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Store / Products States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<any>({
    name: '',
    category: '',
    price: 0,
    type: 'fixed',
    variants: [{ label: '', price: 0 }],
    requiresInput: false,
    inputLabel: '',
    isActive: true,
    imageUrl: '',
  });

  // Gateways States
  const [isAddingGateway, setIsAddingGateway] = useState(false);
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [gatewayType, setGatewayType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [newGateway, setNewGateway] = useState<any>({
    name: '',
    country: 'GL',
    exchangeRate: 1,
    currencyCode: 'USD',
    isActive: true,
    iconUrl: '',
    fields: [{ label: '', value: '' }],
    feeType: 'fixed',
    feeValue: 0,
  });

  // Order Fulfillment
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);
  const [orderResultCode, setOrderResultCode] = useState('');
  const [isRejectingOrder, setIsRejectingOrder] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Live Chat Admin
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const withdrawalsQuery = useMemo(() => (db ? query(collection(db, 'withdrawals'), orderBy('date', 'desc')) : null), [db]);
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const depositsQuery = useMemo(() => (db ? query(collection(db, 'deposits'), orderBy('date', 'desc')) : null), [db]);
  const { data: deposits = [] } = useCollection(depositsQuery);

  const usersQuery = useMemo(() => (db ? query(collection(db, 'users')) : null), [db]);
  const { data: allUsers = [] } = useCollection(usersQuery);

  const productsQuery = useMemo(() => (db ? query(collection(db, 'marketplace_services')) : null), [db]);
  const { data: products = [] } = useCollection(productsQuery);

  const ordersQuery = useMemo(() => (db ? query(collection(db, 'service_requests'), orderBy('date', 'desc')) : null), [db]);
  const { data: allOrders = [] } = useCollection(ordersQuery);

  const ticketsQuery = useMemo(() => (db ? query(collection(db, 'support_tickets'), orderBy('date', 'desc')) : null), [db]);
  const { data: allTickets = [] } = useCollection(ticketsQuery);

  const chatSessionsQuery = useMemo(() => (db ? query(collection(db, 'chat_sessions'), orderBy('updatedAt', 'desc')) : null), [db]);
  const { data: chatSessions = [] } = useCollection(chatSessionsQuery);

  const depMethodsQuery = useMemo(() => (db ? query(collection(db, 'deposit_methods')) : null), [db]);
  const { data: allDepositMethods = [] } = useCollection(depMethodsQuery);

  const witMethodsQuery = useMemo(() => (db ? query(collection(db, 'withdrawal_methods')) : null), [db]);
  const { data: allWithdrawMethods = [] } = useCollection(witMethodsQuery);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allUsers.filter((u: any) => 
      u.username?.toLowerCase().includes(term) || 
      u.customId?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [allUsers, searchTerm]);

  useEffect(() => {
    if (mounted && !authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast, mounted]);

  // Chat Subscription
  useEffect(() => {
    if (!db || !activeChatId) return;
    const q = query(collection(db, 'chat_sessions', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [db, activeChatId]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !activeChatId || !chatMessage.trim()) return;
    try {
      await addDoc(collection(db, 'chat_sessions', activeChatId, 'messages'), {
        text: chatMessage.trim(),
        isAdmin: true,
        senderId: user?.uid,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', activeChatId), {
        updatedAt: new Date().toISOString(),
        lastMessage: chatMessage.trim(),
        status: 'active'
      });
      setChatMessage('');
    } catch (e) {}
  };

  const handleApproveOrder = async () => {
    if (!db || !fulfillingOrderId || !orderResultCode.trim()) return;
    try {
      const order = allOrders.find((o: any) => o.id === fulfillingOrderId);
      await updateDoc(doc(db, 'service_requests', fulfillingOrderId), {
        status: 'completed',
        resultCode: orderResultCode.trim()
      });
      
      await addDoc(collection(db, 'users', order.userId, 'notifications'), {
        title: "Order Secured",
        message: `Your request for ${order.serviceName} has been fulfilled. Check history for details.`,
        type: 'service',
        read: false,
        date: new Date().toISOString()
      });

      toast({ title: "ORDER FULFILLED" });
      setFulfillingOrderId(null);
      setOrderResultCode('');
    } catch (e) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleRejectOrder = async () => {
    if (!db || !fulfillingOrderId || !rejectionReason.trim()) return;
    try {
      const order = allOrders.find((o: any) => o.id === fulfillingOrderId);
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', order.userId);
        transaction.update(userRef, { balance: increment(order.price) });
        transaction.update(doc(db, 'service_requests', fulfillingOrderId), {
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        });
        const txRef = doc(collection(db, 'users', order.userId, 'transactions'));
        transaction.set(txRef, {
          type: 'receive',
          amount: order.price,
          sender: 'SYSTEM REFUND',
          status: 'completed',
          date: new Date().toISOString()
        });
      });
      toast({ title: "ORDER REJECTED & REFUNDED" });
      setFulfillingOrderId(null);
      setIsRejectingOrder(false);
      setRejectionReason('');
    } catch (e) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleSaveProduct = async () => {
    if (!db) return;
    try {
      if (editingProductId) await updateDoc(doc(db, 'marketplace_services', editingProductId), newProduct);
      else await addDoc(collection(db, 'marketplace_services'), newProduct);
      toast({ title: "PRODUCT SECURED" });
      setIsAddingProduct(false);
      setEditingProductId(null);
    } catch (e) { toast({ variant: "destructive", title: "SAVE FAILED" }); }
  };

  const handleSaveGateway = async () => {
    if (!db) return;
    const collectionName = gatewayType === 'deposit' ? 'deposit_methods' : 'withdrawal_methods';
    try {
      if (editingGatewayId) await updateDoc(doc(db, collectionName, editingGatewayId), newGateway);
      else await addDoc(collection(db, collectionName), newGateway);
      toast({ title: "GATEWAY DEPLOYED" });
      setIsAddingGateway(false);
      setEditingGatewayId(null);
    } catch (e) { toast({ variant: "destructive", title: "DEPLOYMENT FAILED" }); }
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev: any) => ({ ...prev, [e.target.name === 'gatewayFile' ? 'iconUrl' : 'imageUrl']: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const exportCollection = async (collectionName: string, fileName: string) => {
    if (!db) return;
    try {
      const q = query(collection(db, collectionName));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FLASH_BACKUP_${fileName}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "BACKUP CREATED" });
    } catch (e) { toast({ variant: "destructive", title: "BACKUP FAILED" }); }
  };

  const handleFullSystemBackup = async () => {
    if (!db) return;
    setIsBackingUp(true);
    try {
      const zip = new JSZip();
      const collectionsToExport = [
        { name: 'users', file: 'USERS_ENTITIES.json' },
        { name: 'withdrawals', file: 'WITHDRAWAL_LEDGER.json' },
        { name: 'deposits', file: 'DEPOSIT_LEDGER.json' },
        { name: 'marketplace_services', file: 'STORE_PROTOCOL.json' },
        { name: 'service_requests', file: 'ORDERS_HISTORY.json' },
        { name: 'support_tickets', file: 'SUPPORT_TICKETS.json' },
        { name: 'chat_sessions', file: 'CHAT_CHANNELS.json' },
        { name: 'deposit_methods', file: 'DEPOSIT_GATEWAYS.json' },
        { name: 'withdrawal_methods', file: 'WITHDRAWAL_GATEWAYS.json' },
        { name: 'verifications', file: 'KYC_LEDGER.json' },
      ];

      for (const coll of collectionsToExport) {
        const snap = await getDocs(query(collection(db, coll.name)));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        zip.file(coll.file, JSON.stringify(data, null, 2));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FLASH_DATA_SNAPSHOT_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "DATA ARCHIVE GENERATED" });
    } catch (e) {
      toast({ variant: "destructive", title: "ARCHIVE FAILED" });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleProjectBackup = async () => {
    setIsProjectBackingUp(true);
    try {
      const base64 = await exportProjectSource();
      const blob = await (await fetch(`data:application/zip;base64,${base64}`)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FLASH_FULL_PROJECT_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "FULL PROJECT SNAPSHOT SECURED" });
    } catch (e) {
      toast({ variant: "destructive", title: "PROJECT BACKUP FAILED" });
    } finally {
      setIsProjectBackingUp(false);
    }
  };

  const handleDeleteUserEntity = async () => {
    if (!db || !editingUserId) return;
    try {
      await deleteDoc(doc(db, 'users', editingUserId));
      toast({ title: "ENTITY PURGED" });
      setEditingUserId(null);
      setIsUserDeleteDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "PURGE FAILED" });
    }
  };

  if (!mounted || authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v4.5.0</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">System Master</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <div className="pb-8">
          <TabsList className="grid grid-cols-4 w-full h-auto bg-card/40 border border-white/5 rounded-[2rem] p-2 gap-2">
            <TabsTrigger value="withdrawals" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Withdraws</TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ArrowDownCircle className="h-4 w-4" /> Deposits</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><ClipboardList className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="chats" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><MessageSquare className="h-4 w-4" /> Live Chats</TabsTrigger>
            
            <TabsTrigger value="gateways" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Banknote className="h-4 w-4" /> Gateways</TabsTrigger>
            <TabsTrigger value="store" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><StoreIcon className="h-4 w-4" /> Store</TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Ticket className="h-4 w-4" /> Tickets</TabsTrigger>
            <TabsTrigger value="users" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2"><Users className="h-4 w-4" /> Entities</TabsTrigger>
            
            <TabsTrigger value="backup" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2 col-span-2"><Database className="h-4 w-4" /> System Backup</TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-2xl font-headline text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-4 flex items-center justify-center gap-2 col-span-2"><ShieldCheck className="h-4 w-4" /> KYC Verification</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allOrders.map((order: any) => (
              <div key={order.id} className="glass-card p-5 rounded-[2rem] border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-headline font-bold uppercase">@{order.username}</p>
                    <p className="text-[8px] text-primary font-black uppercase">{order.serviceName}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[7px] uppercase", order.status === 'pending' ? "text-yellow-500 border-yellow-500/20" : order.status === 'completed' ? "text-green-500 border-green-500/20" : "text-red-500 border-red-500/20")}>{order.status}</Badge>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-[8px] space-y-1">
                  <p className="text-white/40 uppercase">VARIANT: <span className="text-white">{order.selectedVariant || 'N/A'}</span></p>
                  <p className="text-white/40 uppercase">INPUT: <span className="text-primary">{order.userInput || 'N/A'}</span></p>
                  <p className="text-white/40 uppercase">PRICE: <span className="text-white font-headline">${order.price}</span></p>
                </div>
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => { setFulfillingOrderId(order.id); setIsRejectingOrder(false); }} className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[8px] font-headline uppercase font-black tracking-widest">Fulfill</Button>
                    <Button onClick={() => { setFulfillingOrderId(order.id); setIsRejectingOrder(true); }} variant="destructive" className="flex-1 h-10 rounded-xl text-[8px] font-headline uppercase font-black tracking-widest">Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-1 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-white/5"><h3 className="text-[10px] font-headline font-bold uppercase tracking-widest">Active Channels</h3></div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                {chatSessions.map((s: any) => (
                  <button key={s.id} onClick={() => setActiveChatId(s.id)} className={cn("w-full p-4 rounded-2xl border text-left transition-all", activeChatId === s.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-transparent hover:border-white/10")}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-headline font-bold uppercase">@{s.username}</p>
                      <Badge className="text-[6px] h-4 uppercase">{s.status}</Badge>
                    </div>
                    <p className="text-[8px] text-muted-foreground truncate">{s.lastMessage || 'Starting session...'}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
              {activeChatId ? (
                <>
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Live Connection: {activeChatId.slice(0, 8)}</p>
                    <button onClick={() => setActiveChatId(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={16} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {chatMessages.map((m: any) => (
                      <div key={m.id} className={cn("flex flex-col max-w-[80%]", m.isAdmin ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn("p-3 rounded-2xl text-[10px] font-financial", m.isAdmin ? "bg-primary text-background rounded-tr-none" : "bg-muted text-foreground rounded-tl-none")}>{m.text}</div>
                        <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendChatMessage} className="p-4 bg-white/5 flex gap-2">
                    <Input placeholder="TYPE RESPONSE..." className="h-12 bg-background border-white/10 rounded-xl font-headline text-[10px]" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                    <button type="submit" className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center transition-transform active:scale-95"><SendHorizontal size={20} /></button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <CircleDot size={48} className="opacity-10 animate-pulse" />
                  <p className="text-[10px] font-headline uppercase font-bold tracking-widest opacity-20">Select an active channel to monitor</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTickets.map((t: any) => (
              <div key={t.id} className="glass-card p-6 rounded-[2.5rem] border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="text-[7px] uppercase border-primary/20 text-primary mb-2">Ticket #{t.id.slice(0, 6)}</Badge>
                    <h4 className="text-[11px] font-headline font-bold uppercase">{t.subject}</h4>
                  </div>
                  <Badge className="bg-white/5 text-white/60 text-[7px] uppercase">{t.status}</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] leading-relaxed text-white/80">{t.message}</p>
                </div>
                {t.imageUrl && (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 group relative">
                    <img src={t.imageUrl} className="w-full h-full object-cover" alt="ticket proof" />
                    <a href={t.imageUrl} target="_blank" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Download size={20} className="text-white" /></a>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <p className="text-primary font-headline font-bold uppercase text-[8px]">BY: @{t.username}</p>
                  <Button variant="ghost" size="sm" onClick={async () => { await updateDoc(doc(db, 'support_tickets', t.id), { status: 'closed' }); toast({ title: "TICKET CLOSED" }); }} className="text-[8px] uppercase h-8 px-4 rounded-lg">Close Ticket</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full sm:max-w-md group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" /><Input placeholder="SEARCH INTEL LEDGER..." className="pl-12 h-12 bg-card/40 border-white/10 rounded-2xl text-[10px] font-headline uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-4"><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Active Entities</p><p className="text-lg font-headline font-black text-white">{allUsers.length}</p></div><div className="glass-card px-6 py-2 rounded-2xl text-center"><p className="text-[7px] text-muted-foreground uppercase font-black">Liquidity</p><p className="text-lg font-headline font-black text-primary">${allUsers.reduce((acc: any, u: any) => acc + (u.balance || 0), 0).toLocaleString()}</p></div></div>
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
                <div className="space-y-3"><div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase font-black">Vault Status:</span><span className="text-sm font-headline font-black text-primary">${u.balance?.toLocaleString()}</span></div></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-8">
          <div className="glass-card p-10 rounded-[2.5rem] border-primary/20 gold-glow flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
              <Cpu size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-headline font-bold uppercase tracking-tighter">System Intelligence Backup</h2>
              <p className="text-[10px] text-muted-foreground uppercase max-w-md mx-auto leading-relaxed">
                Generate cryptographic snapshots of the entire FLASH ecosystem including source code, design protocols, and database entities.
              </p>
            </div>

            <div className="w-full max-w-2xl space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={handleProjectBackup} 
                  disabled={isProjectBackingUp}
                  className="w-full h-24 bg-secondary text-background border border-secondary/40 rounded-2xl hover:bg-secondary/90 transition-all cyan-glow"
                >
                  <div className="flex flex-col items-center gap-2">
                    {isProjectBackingUp ? <Loader2 className="animate-spin" /> : <Code2 size={28} />}
                    <span className="text-[10px] font-headline font-black uppercase tracking-[0.2em]">Archive Full Codebase & Design (ZIP)</span>
                  </div>
                </Button>

                <Button 
                  onClick={handleFullSystemBackup} 
                  disabled={isBackingUp}
                  className="w-full h-24 bg-primary text-background border border-primary/40 rounded-2xl hover:bg-primary/90 transition-all gold-glow"
                >
                  <div className="flex flex-col items-center gap-2">
                    {isBackingUp ? <Loader2 className="animate-spin" /> : <FileArchive size={28} />}
                    <span className="text-[10px] font-headline font-black uppercase tracking-[0.2em]">Generate Master Data Archive (ZIP)</span>
                  </div>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                <div className="relative flex justify-center"><span className="bg-background px-4 text-[8px] text-white/30 uppercase tracking-widest">Granular Node Extraction</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={() => exportCollection('users', 'USERS')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/40 hover:bg-primary/5 group transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-headline font-black uppercase tracking-widest">Export User Entities</span>
                  </div>
                </Button>
                <Button onClick={() => exportCollection('withdrawals', 'WITHDRAWALS')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:border-secondary/40 hover:bg-secondary/5 group transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUpCircle className="text-secondary group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-headline font-black uppercase tracking-widest">Export Withdrawal Ledger</span>
                  </div>
                </Button>
                <Button onClick={() => exportCollection('deposits', 'DEPOSITS')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:border-green-500/40 hover:bg-green-500/5 group transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDownCircle className="text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-headline font-black uppercase tracking-widest">Export Deposit Ledger</span>
                  </div>
                </Button>
                <Button onClick={() => exportCollection('marketplace_services', 'STORE')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/40 hover:bg-orange-500/5 group transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-headline font-black uppercase tracking-widest">Export Store Protocol</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div><h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Financial Gateways</h2><p className="text-[8px] text-muted-foreground uppercase">Configure Global Entry & Exit Protocols</p></div>
            <div className="flex gap-2">
              <Button onClick={() => { setGatewayType('deposit'); setEditingGatewayId(null); setIsAddingGateway(true); setNewGateway({ name: '', country: 'GL', exchangeRate: 1, currencyCode: 'USD', isActive: true, iconUrl: '', fields: [{ label: '', value: '' }] }); }} className="bg-primary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest gold-glow"><Plus size={16} className="mr-2" /> New Deposit</Button>
              <Button onClick={() => { setGatewayType('withdrawal'); setEditingGatewayId(null); setIsAddingGateway(true); setNewGateway({ name: '', country: 'GL', exchangeRate: 1, currencyCode: 'USD', isActive: true, iconUrl: '', feeType: 'fixed', feeValue: 0, fields: [{ label: '', type: 'text', options: '' }] }); }} className="bg-secondary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest cyan-glow"><Plus size={16} className="mr-2" /> New Withdraw</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase text-primary border-l-2 border-primary pl-3">Deposit Pipelines</h3>
              <div className="grid grid-cols-1 gap-3">
                {allDepositMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden">{m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" alt="gateway icon" /> : <Landmark size={20} />}</div>
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">{m.name} <span className="text-[7px] text-muted-foreground ml-2">({m.country})</span></p>
                        <p className="text-[8px] text-primary font-black">RATE: {m.exchangeRate} {m.currencyCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={m.isActive} onCheckedChange={async (val) => { await updateDoc(doc(db, 'deposit_methods', m.id), { isActive: val }); }} />
                      <button onClick={() => { setGatewayType('deposit'); setEditingGatewayId(m.id); setNewGateway(m); setIsAddingGateway(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg"><Edit3 size={14} /></button>
                      <button onClick={async () => { if(confirm("Purge pipeline?")) await deleteDoc(doc(db, 'deposit_methods', m.id)); }} className="p-2 text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase text-secondary border-l-2 border-secondary pl-3">Withdrawal Outlets</h3>
              <div className="grid grid-cols-1 gap-3">
                {allWithdrawMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-white/5 hover:border-secondary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary overflow-hidden">{m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" alt="gateway icon" /> : <Landmark size={20} />}</div>
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">{m.name} <span className="text-[7px] text-muted-foreground ml-2">({m.country})</span></p>
                        <p className="text-[8px] text-secondary font-black">FEE: {m.feeValue}{m.feeType === 'fixed' ? '$' : '%'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={m.isActive} onCheckedChange={async (val) => { await updateDoc(doc(db, 'withdrawal_methods', m.id), { isActive: val }); }} />
                      <button onClick={() => { setGatewayType('withdrawal'); setEditingGatewayId(m.id); setNewGateway(m); setIsAddingGateway(true); }} className="p-2 text-secondary hover:bg-secondary/10 rounded-lg"><Edit3 size={14} /></button>
                      <button onClick={async () => { if(confirm("Purge outlet?")) await deleteDoc(doc(db, 'withdrawal_methods', m.id)); }} className="p-2 text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="store" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div><h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Marketplace Core</h2><p className="text-[8px] text-muted-foreground uppercase">Deploy and Manage Global Digital Assets</p></div>
            <Button onClick={() => { setEditingProductId(null); setIsAddingProduct(true); setNewProduct({ name: '', category: '', price: 0, type: 'fixed', variants: [{ label: '', price: 0 }], requiresInput: false, inputLabel: '', isActive: true, imageUrl: '' }); }} className="bg-primary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest gold-glow"><PlusCircle size={16} className="mr-2" /> Add New Asset</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="glass-card rounded-[2rem] overflow-hidden border-white/5 group relative">
                <div className="aspect-video relative bg-white/5">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag size={32} /></div>}
                  <div className="absolute top-3 left-3"><Badge className="text-[6px] uppercase border-white/10 bg-black/40">{p.category}</Badge></div>
                  <button onClick={() => { setEditingProductId(p.id); setNewProduct(p); setIsAddingProduct(true); }} className="absolute top-3 right-3 p-2 bg-black/60 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-headline font-bold uppercase truncate">{p.name}</h4>
                    <div className="text-lg font-headline font-black text-primary">${p.price || (p.variants && p.variants[0]?.price)}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <Switch checked={p.isActive} onCheckedChange={async (val) => { await updateDoc(doc(db, 'marketplace_services', p.id), { isActive: val }); }} />
                    <button onClick={async () => { if(confirm("Purge asset?")) await deleteDoc(doc(db, 'marketplace_services', p.id)); }} className="p-2 text-red-500/40 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Fulfillment Modal */}
      <Dialog open={!!fulfillingOrderId} onOpenChange={() => { setFulfillingOrderId(null); setIsRejectingOrder(false); }}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2rem] z-[1100]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase text-center">{isRejectingOrder ? "REJECT PROTOCOL" : "FULFILL PROTOCOL"}</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            {!isRejectingOrder ? (
              <div className="space-y-4">
                <Label className="text-[8px] uppercase font-black">Asset Key / Activation Code</Label>
                <Input placeholder="PASTE CODE HERE" className="h-12 bg-background border-white/10 rounded-xl" value={orderResultCode} onChange={(e) => setOrderResultCode(e.target.value)} />
                <Button onClick={handleApproveOrder} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] rounded-xl gold-glow uppercase tracking-widest">Mark as Completed</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-[8px] uppercase font-black text-red-500">Reason for Rejection</Label>
                <Input placeholder="E.G. INVALID ID PROVIDED" className="h-12 bg-background border-red-500/20 rounded-xl" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                <Button onClick={handleRejectOrder} variant="destructive" className="w-full h-14 font-headline font-black text-[10px] rounded-xl uppercase tracking-widest">Confirm Rejection & Refund</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gateway Dialog */}
      <Dialog open={isAddingGateway} onOpenChange={setIsAddingGateway}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1100] overflow-y-auto max-h-[90vh] no-scrollbar">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase text-center">{editingGatewayId ? "Modify Gateway" : "Gateway Factory"}</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Method Name</Label><Input className="bg-background/50 border-white/10 h-12" value={newGateway.name} onChange={(e) => setNewGateway({...newGateway, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Country Code</Label><Input className="bg-background/50 border-white/10 h-12 uppercase" value={newGateway.country} onChange={(e) => setNewGateway({...newGateway, country: e.target.value.toUpperCase()})} /></div>
              <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Currency</Label><Input className="bg-background/50 border-white/10 h-12 uppercase" value={newGateway.currencyCode} onChange={(e) => setNewGateway({...newGateway, currencyCode: e.target.value.toUpperCase()})} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Exchange Rate (1 USD = X Local)</Label><Input type="number" className="bg-background/50 border-white/10 h-12" value={newGateway.exchangeRate} onChange={(e) => setNewGateway({...newGateway, exchangeRate: parseFloat(e.target.value)})} /></div>
            
            {gatewayType === 'withdrawal' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase font-black">Fee Type</Label>
                  <Select value={newGateway.feeType} onValueChange={(val) => setNewGateway({...newGateway, feeType: val})}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" side="bottom" className="bg-card z-[1200]"><SelectItem value="fixed" className="focus:bg-primary/20">Fixed ($)</SelectItem><SelectItem value="percentage" className="focus:bg-primary/20">Percentage (%)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Fee Value</Label><Input type="number" className="bg-background/50 border-white/10 h-12" value={newGateway.feeValue} onChange={(e) => setNewGateway({...newGateway, feeValue: parseFloat(e.target.value)})} /></div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center"><Label className="text-[8px] uppercase font-black">{gatewayType === 'deposit' ? "Transfer Data" : "Required User Intel"}</Label><button onClick={() => { const fs = [...(newGateway.fields || [])]; fs.push(gatewayType === 'deposit' ? { label: '', value: '' } : { label: '', type: 'text', options: '' }); setNewGateway({...newGateway, fields: fs}); }} className="text-[8px] font-headline text-primary font-black">+ ADD FIELD</button></div>
              <div className="space-y-3">
                {newGateway.fields?.map((f: any, i: number) => (
                  <div key={i} className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex gap-2">
                      <Input placeholder="Field Label (e.g. IBAN)" className="bg-background/50 h-10 text-[9px]" value={f.label} onChange={(e) => { const fs = [...newGateway.fields]; fs[i].label = e.target.value; setNewGateway({...newGateway, fields: fs}); }} />
                      <button onClick={() => { const fs = newGateway.fields.filter((_: any, idx: number) => i !== idx); setNewGateway({...newGateway, fields: fs}); }} className="text-red-500/40"><Trash2 size={14} /></button>
                    </div>
                    {gatewayType === 'deposit' ? (
                      <Input placeholder="Value / Data" className="bg-background/50 h-10 text-[9px]" value={f.value} onChange={(e) => { const fs = [...newGateway.fields]; fs[i].value = e.target.value; setNewGateway({...newGateway, fields: fs}); }} />
                    ) : (
                      <div className="flex gap-2">
                        <Select value={f.type} onValueChange={(val) => { const fs = [...newGateway.fields]; fs[i].type = val; setNewGateway({...newGateway, fields: fs}); }}>
                          <SelectTrigger className="h-10 bg-background/50 border-white/10 flex-1 text-[9px]"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper" side="bottom" className="bg-card z-[1200]"><SelectItem value="text" className="focus:bg-primary/20">Text</SelectItem><SelectItem value="textarea" className="focus:bg-primary/20">Long Text</SelectItem><SelectItem value="select" className="focus:bg-primary/20">Options</SelectItem></SelectContent>
                        </Select>
                        {f.type === 'select' && <Input placeholder="Opt1, Opt2..." className="bg-background/50 h-10 flex-1 text-[9px]" value={f.options} onChange={(e) => { const fs = [...newGateway.fields]; fs[i].options = e.target.value; setNewGateway({...newGateway, fields: fs}); }} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[8px] uppercase font-black">Icon / Artwork</Label>
              <div onClick={() => gatewayFileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative">
                {newGateway.iconUrl ? <img src={newGateway.iconUrl} className="w-full h-full object-cover" alt="gateway artwork" /> : <><ImageIcon size={24} className="text-muted-foreground" /><span className="text-[7px] font-headline uppercase text-muted-foreground">Upload Protocol Icon</span></>}
                <input type="file" name="gatewayFile" ref={gatewayFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setNewGateway)} />
              </div>
            </div>

            <Button onClick={handleSaveGateway} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] rounded-xl gold-glow uppercase tracking-widest">{editingGatewayId ? "Update Gateway" : "Deploy Gateway"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={!!editingUserId} onOpenChange={() => setEditingUserId(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Settings2 size={14} className="text-primary" /> Edit Entity Protocol</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Adjust Balance ($)</Label><Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-lg text-primary text-center" value={editForm.balance} onChange={(e) => setEditForm({...editForm, balance: e.target.value})} /></div>
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Authority Role</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-card border-white/10 z-[1100] mt-1 shadow-2xl">
                  <SelectItem value="user" className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer uppercase text-[10px]">User</SelectItem>
                  <SelectItem value="agent" className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer uppercase text-[10px]">Agent</SelectItem>
                  <SelectItem value="admin" className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer uppercase text-[10px]">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-5 bg-card/40 rounded-2xl border border-white/10" dir="ltr">
              <div className="space-y-1"><Label className="text-[10px] font-headline font-bold uppercase tracking-widest">Verified Entity</Label><p className="text-[7px] text-muted-foreground uppercase">Enable high-authority status</p></div>
              <Switch checked={editForm.verified} onCheckedChange={(val) => setEditForm({...editForm, verified: val})} className="data-[state=checked]:bg-green-500" />
            </div>
            <div className="pt-4 space-y-3">
              <Button onClick={async () => { try { await updateDoc(doc(db, 'users', editingUserId!), { balance: parseFloat(editForm.balance), role: editForm.role, verified: editForm.verified }); toast({ title: "SYNCED" }); setEditingUserId(null); } catch (e) {} }} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Sync Changes</Button>
              <button onClick={() => setIsUserDeleteDialogOpen(true)} className="w-full py-3 flex items-center justify-center gap-2 text-red-500/60 hover:text-red-500 transition-all text-[8px] font-headline font-bold uppercase tracking-[0.2em]"><AlertTriangle size={14} /> Purge Entity</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase text-center">{editingProductId ? "Modify Asset" : "Asset Foundry"}</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Asset Name</Label><Input className="bg-background/50 border-white/10 h-12" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} /></div>
            <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Category</Label><Input className="bg-background/50 border-white/10 h-12 uppercase" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value.toUpperCase()})} /></div>
            <div className="flex bg-background p-1 rounded-lg border border-white/5">
              <button onClick={() => setNewProduct({...newProduct, type: 'fixed'})} className={cn("flex-1 py-2 rounded-md text-[8px] font-headline uppercase", newProduct.type === 'fixed' ? "bg-primary text-background" : "text-muted-foreground")}>Fixed</button>
              <button onClick={() => setNewProduct({...newProduct, type: 'variable'})} className={cn("flex-1 py-2 rounded-md text-[8px] font-headline uppercase", newProduct.type === 'variable' ? "bg-primary text-background" : "text-muted-foreground")}>Packages</button>
            </div>
            {newProduct.type === 'fixed' ? (
              <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Price ($)</Label><Input type="number" className="bg-background/50 border-white/10 h-12 text-primary" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} /></div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center"><Label className="text-[8px] uppercase font-black">Packages</Label><button onClick={() => setNewProduct({...newProduct, variants: [...newProduct.variants, { label: '', price: 0 }]})} className="text-[8px] font-headline text-primary">+ Add</button></div>
                {newProduct.variants.map((v: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Package Name" className="flex-1 bg-background/50 h-10 text-[10px]" value={v.label} onChange={(e) => { const vs = [...newProduct.variants]; vs[i].label = e.target.value; setNewProduct({...newProduct, variants: vs}); }} />
                    <Input placeholder="Price" type="number" className="w-24 bg-background/50 h-10 text-[10px]" value={v.price} onChange={(e) => { const vs = [...newProduct.variants]; vs[i].price = parseFloat(e.target.value); setNewProduct({...newProduct, variants: vs}); }} />
                    <button onClick={() => { const vs = newProduct.variants.filter((_: any, idx: number) => i !== idx); setNewProduct({...newProduct, variants: vs}); }} className="text-red-500/40"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="space-y-1"><Label className="text-[10px] font-headline font-bold uppercase">Required Intel</Label><p className="text-[7px] text-muted-foreground uppercase">Enable user input (e.g. ID)</p></div>
              <Switch checked={newProduct.requiresInput} onCheckedChange={(val) => setNewProduct({...newProduct, requiresInput: val})} />
            </div>
            {newProduct.requiresInput && <Input placeholder="Input Descriptor (e.g. Player ID)" className="h-12 bg-background/50" value={newProduct.inputLabel} onChange={(e) => setNewProduct({...newProduct, inputLabel: e.target.value})} />}
            
            <div className="space-y-2">
              <Label className="text-[8px] uppercase font-black">Asset Image</Label>
              <div onClick={() => productFileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative">
                {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="w-full h-full object-cover" alt="asset cover" /> : <><ImageIcon size={24} className="text-muted-foreground" /><span className="text-[7px] font-headline uppercase text-muted-foreground">Upload Asset Art</span></>}
                <input type="file" ref={productFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setNewProduct)} />
              </div>
            </div>

            <Button onClick={handleSaveProduct} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] rounded-xl gold-glow uppercase tracking-widest">{editingProductId ? "Update Asset" : "Deploy Asset"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2rem] p-8 max-w-sm z-[2000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xs font-headline font-bold uppercase text-red-500 flex items-center gap-2"><AlertTriangle size={16} /> Critical Warning</AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-headline uppercase leading-relaxed text-white/60">This action will permanently purge the entity. Proceed?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col gap-2">
            <AlertDialogAction onClick={handleDeleteUserEntity} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-headline font-black text-[10px] uppercase w-full">Confirm Purge</AlertDialogAction>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-headline font-bold text-[9px] uppercase w-full">Abort</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
