
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
  Keyboard,
  Edit3,
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
            transaction.set(doc(collection(db, 'users', data.userId, 'transactions')), { type: 'deposit', amount: data.amount, status: 'completed', date: new Date().toISOString() });
          } else if (type === 'kyc') transaction.update(userRef, { verified: true });
          transaction.set(doc(collection(db, 'users', data.userId, 'notifications')), {
            title: type === 'deposit' ? "Assets Credited" : type === 'kyc' ? "Authority Verified" : type === 'order' ? "Order Fulfilled" : "Withdrawal Success",
            message: type === 'deposit' ? `$${data.amount} added to vault.` : "Protocol executed successfully.",
            read: false,
            date: new Date().toISOString()
          });
        });
      } else {
        await runTransaction(db, async (transaction) => {
          transaction.update(docRef, { status: 'rejected', rejectionReason: extra?.reason || 'Protocol Denied' });
          if (type === 'withdraw' || type === 'order') transaction.update(doc(db, 'users', data.userId), { balance: increment(data.amountUsd || data.price) });
        });
      }
      toast({ title: "ACTION EXECUTED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED", description: e.message }); }
  };

  const handleSaveMethod = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, methodType === 'deposit' ? 'deposit_methods' : 'withdrawal_methods'), newMethod);
      toast({ title: "METHOD DEPLOYED" });
      setIsAddingMethod(false);
    } catch (e) { toast({ variant: "destructive", title: "DEPLOY FAILED" }); }
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

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setNewProduct({ ...product });
    setIsAddingProduct(true);
  };

  const toggleStatus = async (coll: string, id: string, status: boolean) => {
    try { await updateDoc(doc(db, coll, id), { isActive: status }); toast({ title: "STATUS SYNCED" }); } catch (e) { }
  };

  const handleDeleteUserEntity = async () => {
    if (!editingUserId || !db) return;
    try {
      await deleteDoc(doc(db, 'users', editingUserId));
      toast({ title: "ENTITY PURGED" });
      setEditingUserId(null);
      setIsUserDeleteDialogOpen(false);
    } catch (e: any) { toast({ variant: "destructive", title: "PURGE FAILED", description: e.message }); }
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

        {/* User Content Example */}
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

        {/* Store Content Example */}
        <TabsContent value="store" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div><h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Marketplace Core</h2><p className="text-[8px] text-muted-foreground uppercase">Deploy and Manage Global Digital Assets</p></div>
            <Button onClick={() => { setEditingProductId(null); setIsAddingProduct(true); setNewProduct({ name: '', category: '', price: 0, type: 'fixed', variants: [{ label: '', price: 0 }], requiresInput: false, inputLabel: '', isActive: true, imageUrl: '', color: 'bg-primary' }); }} className="bg-primary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest gold-glow"><PlusCircle size={16} className="mr-2" /> Add New Asset</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="glass-card rounded-[2rem] overflow-hidden border-white/5 group relative">
                <div className="aspect-video relative bg-white/5">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag size={32} /></div>}
                  <div className="absolute top-3 left-3"><Badge className="text-[6px] uppercase border-white/10 bg-black/40">{p.category}</Badge></div>
                  <button onClick={() => handleEditProduct(p)} className="absolute top-3 right-3 p-2 bg-black/60 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
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
        {/* ... (Keep other content tabs) */}
      </Tabs>

      {/* Entity Edit Modal */}
      <Dialog open={!!editingUserId} onOpenChange={() => setEditingUserId(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Settings2 size={14} className="text-primary" /> Edit Entity Protocol</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Adjust Balance ($)</Label><Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-lg text-primary text-center" value={editForm.balance} onChange={(e) => setEditForm({...editForm, balance: e.target.value})} /></div>
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Authority Role</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-white/10 z-[1100]">
                  <SelectItem value="user">User</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="admin">Admin</SelectItem>
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

      {/* Delete User Confirmation Popup */}
      <AlertDialog open={isUserDeleteDialogOpen} onOpenChange={setIsUserDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2rem] p-8 max-w-sm z-[2000]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xs font-headline font-bold uppercase text-red-500 flex items-center gap-2"><AlertTriangle size={16} /> Critical Warning</AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-headline uppercase leading-relaxed text-white/60">This action will permanently purge the entity from the ledger. Proceed?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col gap-2">
            <AlertDialogAction onClick={handleDeleteUserEntity} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-headline font-black text-[10px] uppercase w-full">Confirm Purge</AlertDialogAction>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-headline font-bold text-[9px] uppercase w-full">Abort</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asset Foundry Modal */}
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
            <div className="space-y-2"><Label className="text-[8px] uppercase font-black">Image URL</Label><Input className="bg-background/50 h-12" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} /></div>
            <Button onClick={handleSaveProduct} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] rounded-xl gold-glow uppercase tracking-widest">{editingProductId ? "Update Asset" : "Deploy Asset"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
