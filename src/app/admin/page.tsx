
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
  History,
  Star,
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

  const handleJoinChat = async (id: string) => {
    if (!db || !user || !profile) return;
    try {
      await updateDoc(doc(db, 'chat_sessions', id), {
        status: 'active',
        joinedBy: profile.username,
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', id, 'messages'), {
        text: `Hello! I am ${profile.username}, your authorized agent. Please allow me a moment to review your request.`,
        isAdmin: true,
        senderId: user.uid,
        timestamp: new Date().toISOString()
      });
      setActiveChatId(id);
    } catch (e) {}
  };

  const handleEndChat = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'chat_sessions', id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', id, 'messages'), {
        text: "The agent has marked this issue as resolved. Please provide your feedback below.",
        isAdmin: true,
        senderId: 'system',
        timestamp: new Date().toISOString()
      });
      toast({ title: "Session Closed" });
    } catch (e) {}
  };

  const handleDeleteChat = async (id: string) => {
    if (!db || !confirm("Archive and purge this session?")) return;
    try {
      await deleteDoc(doc(db, 'chat_sessions', id));
      toast({ title: "Session Purged" });
    } catch (e) {}
  };

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
        lastMessage: chatMessage.trim()
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
      toast({ title: "ORDER FULFILLED" });
      setFulfillingOrderId(null);
      setOrderResultCode('');
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
    } catch (e) { toast({ variant: "destructive", title: "PROJECT BACKUP FAILED" }); }
    finally { setIsProjectBackingUp(false); }
  };

  const handleDeleteUserEntity = async () => {
    if (!db || !editingUserId) return;
    try {
      await deleteDoc(doc(db, 'users', editingUserId));
      toast({ title: "ENTITY PURGED" });
      setEditingUserId(null);
      setIsUserDeleteDialogOpen(false);
    } catch (e) { toast({ variant: "destructive", title: "PURGE FAILED" }); }
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

        <TabsContent value="chats" className="space-y-6">
          <Tabs defaultValue="active_sessions">
            <TabsList className="bg-white/5 border border-white/5 rounded-xl p-1 mb-4 h-10">
              <TabsTrigger value="active_sessions" className="text-[8px] uppercase font-headline">Live Channels</TabsTrigger>
              <TabsTrigger value="chat_history" className="text-[8px] uppercase font-headline">Archive History</TabsTrigger>
            </TabsList>

            <TabsContent value="active_sessions">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                <div className="lg:col-span-1 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest">Active Channels</h3>
                    <Badge variant="outline" className="text-[6px] text-primary">{chatSessions.filter((s:any) => s.status !== 'archived').length}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                    {chatSessions.filter((s:any) => s.status !== 'archived').map((s: any) => (
                      <div key={s.id} className={cn("w-full p-4 rounded-2xl border text-left transition-all relative group", activeChatId === s.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-transparent hover:border-white/10")}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-headline font-bold uppercase">@{s.username}</p>
                          <Badge className={cn("text-[6px] h-4 uppercase", s.status === 'open' ? "bg-red-500" : "bg-green-500")}>{s.status}</Badge>
                        </div>
                        <p className="text-[8px] text-muted-foreground truncate mb-3">{s.lastMessage || 'Starting...'}</p>
                        <div className="flex gap-2">
                          <Button onClick={() => handleJoinChat(s.id)} size="sm" className="h-7 text-[7px] font-headline font-black uppercase flex-1 bg-primary text-background">Join</Button>
                          <Button onClick={() => handleEndChat(s.id)} variant="outline" size="sm" className="h-7 text-[7px] font-headline font-black uppercase flex-1 border-red-500/20 text-red-500">Close</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
                  {activeChatId ? (
                    <>
                      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Connection: {activeChatId.slice(0, 8)}</p>
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

            <TabsContent value="chat_history">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatSessions.filter((s:any) => s.status === 'archived').map((s: any) => (
                  <div key={s.id} className="glass-card p-5 rounded-[2rem] border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">Case #{s.caseId || s.id.slice(0,6)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">By @{s.username}</p>
                      </div>
                      <Badge className="bg-white/5 text-muted-foreground text-[7px] uppercase">Archived</Badge>
                    </div>
                    {s.rating && (
                      <div className="p-3 bg-primary/5 rounded-xl flex justify-between items-center border border-primary/10">
                        <div className="flex gap-0.5 text-primary">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < s.rating ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[8px] font-headline font-black text-primary uppercase">Score: {s.rating}/5</span>
                      </div>
                    )}
                    <div className="text-[8px] text-white/40 leading-relaxed italic p-3 bg-white/5 rounded-xl">"{s.feedback || 'No feedback left'}"</div>
                    <Button onClick={() => handleDeleteChat(s.id)} variant="destructive" className="w-full h-10 rounded-xl text-[8px] font-headline uppercase font-black tracking-widest"><Trash2 size={12} className="mr-2" /> Purge Record</Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {withdrawals.map((w: any) => (
              <div key={w.id} className="glass-card p-5 rounded-[2rem] border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div><p className="text-[10px] font-headline font-bold uppercase">@{w.username}</p><p className="text-[8px] text-secondary font-black uppercase">{w.methodName}</p></div>
                  <Badge variant="outline" className={cn("text-[7px] uppercase", w.status === 'pending' ? "text-yellow-500 border-yellow-500/20" : w.status === 'approved' ? "text-green-500 border-green-500/20" : "text-red-500 border-red-500/20")}>{w.status}</Badge>
                </div>
                <div className="p-3 bg-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-center"><span className="text-[7px] text-white/40 uppercase">Requested:</span><span className="text-[10px] font-headline font-bold text-white">${w.amountUsd}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[7px] text-white/40 uppercase">Net Payout:</span><span className="text-[10px] font-headline font-bold text-primary">{w.netAmount} {w.currencyCode}</span></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] text-muted-foreground uppercase font-black">Destination Intel:</p>
                  {Object.entries(w.details || {}).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between gap-4 text-[8px]"><span className="text-white/30 truncate">{k}:</span><span className="text-white font-headline truncate">{v}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

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
      </Tabs>

      {/* Shared Modals */}
      <Dialog open={!!fulfillingOrderId} onOpenChange={() => { setFulfillingOrderId(null); setIsRejectingOrder(false); }}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem] z-[1100]">
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
                <Button onClick={async () => {
                  if (!db || !fulfillingOrderId) return;
                  const order = allOrders.find((o: any) => o.id === fulfillingOrderId);
                  await runTransaction(db, async (t) => {
                    t.update(doc(db, 'users', order.userId), { balance: increment(order.price) });
                    t.update(doc(db, 'service_requests', fulfillingOrderId), { status: 'rejected', rejectionReason });
                  });
                  setFulfillingOrderId(null);
                  toast({ title: "Refunded & Rejected" });
                }} variant="destructive" className="w-full h-14 font-headline font-black text-[10px] rounded-xl uppercase tracking-widest">Confirm Rejection & Refund</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
