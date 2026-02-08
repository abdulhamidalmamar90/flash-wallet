
"use client"

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Loader2, 
  Users, 
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  ClipboardList,
  Store as StoreIcon,
  Trash2,
  Database,
  SendHorizontal,
  CircleDot,
  Star,
  Plus,
  Landmark,
  Search,
  Edit3,
  Globe,
  Settings as SettingsIcon,
  AlertCircle,
  FileArchive
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
  setDoc,
  where
} from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { exportProjectSource } from '@/app/actions/project-backup';

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isProjectBackingUp, setIsProjectBackingUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  // Queries
  const usersQuery = useMemo(() => (db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null), [db]);
  const { data: allUsers = [] } = useCollection(usersQuery);

  const depositsQuery = useMemo(() => (db ? query(collection(db, 'deposits'), orderBy('date', 'desc')) : null), [db]);
  const { data: deposits = [] } = useCollection(depositsQuery);

  const withdrawalsQuery = useMemo(() => (db ? query(collection(db, 'withdrawals'), orderBy('date', 'desc')) : null), [db]);
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const kycQuery = useMemo(() => (db ? query(collection(db, 'verifications'), where('status', '==', 'pending')) : null), [db]);
  const { data: kycRequests = [] } = useCollection(kycQuery);

  const chatSessionsQuery = useMemo(() => (db ? query(collection(db, 'chat_sessions'), orderBy('updatedAt', 'desc')) : null), [db]);
  const { data: chatSessions = [] } = useCollection(chatSessionsQuery);

  const marketplaceQuery = useMemo(() => (db ? query(collection(db, 'marketplace_services')) : null), [db]);
  const { data: marketplaceServices = [] } = useCollection(marketplaceQuery);

  const depMethodsQuery = useMemo(() => (db ? query(collection(db, 'deposit_methods')) : null), [db]);
  const { data: depositMethods = [] } = useCollection(depMethodsQuery);

  const witMethodsQuery = useMemo(() => (db ? query(collection(db, 'withdrawal_methods')) : null), [db]);
  const { data: withdrawalMethods = [] } = useCollection(witMethodsQuery);

  // States for Modals
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalance, setEditBalance] = useState('');

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState(false);
  const [gatewayType, setGatewayType] = useState<'dep' | 'wit'>('dep');

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

  // Handlers
  const handleApproveDeposit = async (dep: any) => {
    if (!db) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', dep.userId);
        const depRef = doc(db, 'deposits', dep.id);
        const txRef = doc(collection(db, 'users', dep.userId, 'transactions'));
        
        transaction.update(depRef, { status: 'approved' });
        transaction.update(userRef, { balance: increment(dep.amount) });
        transaction.set(txRef, {
          type: 'deposit',
          amount: dep.amount,
          status: 'completed',
          date: new Date().toISOString()
        });
      });
      toast({ title: "DEPOSIT APPROVED" });
    } catch (e) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleApproveWithdrawal = async (wit: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'withdrawals', wit.id), { status: 'completed' });
      toast({ title: "WITHDRAWAL COMPLETED" });
    } catch (e) {}
  };

  const handleApproveKYC = async (req: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'verifications', req.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', req.userId), { verified: true });
      toast({ title: "KYC VERIFIED" });
    } catch (e) {}
  };

  const handleUpdateBalance = async () => {
    if (!db || !selectedUser || !editBalance) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), { balance: parseFloat(editBalance) });
      toast({ title: "BALANCE UPDATED" });
      setIsEditUserOpen(false);
    } catch (e) {}
  };

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

  const handleProjectBackup = async () => {
    setIsProjectBackingUp(true);
    try {
      const base64 = await exportProjectSource();
      const blob = await (await fetch(`data:application/zip;base64,${base64}`)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FLASH_MASTER_SNAPSHOT_${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      toast({ title: "SYSTEM SECURED" });
    } catch (e) { toast({ variant: "destructive", title: "BACKUP FAILED" }); }
    finally { setIsProjectBackingUp(false); }
  };

  if (!mounted || authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v4.5.0</p></div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="hidden sm:flex text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">System Master</Badge>
          <Button onClick={handleProjectBackup} disabled={isProjectBackingUp} size="sm" className="h-8 text-[8px] font-headline bg-primary text-background">
            {isProjectBackingUp ? <Loader2 className="animate-spin" /> : <FileArchive size={12} className="mr-1" />} Backup
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-card/40 border border-white/5 rounded-[2rem] p-2 gap-2 mb-8">
          <TabsTrigger value="overview" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Users</TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Deposits {deposits.filter((d:any)=>d.status==='pending').length > 0 && `(${deposits.filter((d:any)=>d.status==='pending').length})`}</TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Withdraws {withdrawals.filter((w:any)=>w.status==='pending').length > 0 && `(${withdrawals.filter((w:any)=>w.status==='pending').length})`}</TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">KYC</TabsTrigger>
          <TabsTrigger value="store" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Store</TabsTrigger>
          <TabsTrigger value="gateways" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Gateways</TabsTrigger>
          <TabsTrigger value="chats" className="rounded-xl font-headline text-[9px] uppercase px-4 py-2">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Volume', val: `$${allUsers.reduce((acc:any, u:any) => acc + (u.balance || 0), 0).toLocaleString()}`, icon: Database, color: 'text-primary' },
              { label: 'Verified Entities', val: allUsers.filter((u:any)=>u.verified).length, icon: ShieldCheck, color: 'text-green-500' },
              { label: 'Pending Deposits', val: deposits.filter((d:any)=>d.status==='pending').length, icon: ArrowDownCircle, color: 'text-secondary' },
              { label: 'Active Users', val: allUsers.length, icon: Users, color: 'text-white' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-3xl border-white/5 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[8px] text-muted-foreground uppercase font-headline">{stat.label}</p>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <p className="text-2xl font-headline font-black">{stat.val}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="font-headline text-muted-foreground">
                  <th className="p-4 text-left">ENTITY</th>
                  <th className="p-4 text-left">FLASH ID</th>
                  <th className="p-4 text-left">VAULT</th>
                  <th className="p-4 text-left">STATUS</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg overflow-hidden border", u.verified ? "border-green-500" : "border-red-500")}>
                          <img src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/100`} className="w-full h-full object-cover" />
                        </div>
                        <div><p className="font-bold">@{u.username}</p><p className="text-[8px] text-muted-foreground">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="p-4 font-financial font-bold tracking-widest">{u.customId}</td>
                    <td className="p-4 font-financial font-bold text-primary">${u.balance?.toLocaleString()}</td>
                    <td className="p-4"><Badge className={cn("text-[7px]", u.verified ? "bg-green-500" : "bg-red-500")}>{u.verified ? "VERIFIED" : "UNVERIFIED"}</Badge></td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(u); setEditBalance(u.balance?.toString()); setIsEditUserOpen(true); }}><Edit3 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deposits.map((dep: any) => (
              <div key={dep.id} className="glass-card p-5 rounded-3xl border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-headline font-bold">@{dep.username}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">{new Date(dep.date).toLocaleString()}</p>
                  </div>
                  <Badge className={cn("text-[7px]", dep.status === 'pending' ? "bg-yellow-500" : dep.status === 'approved' ? "bg-green-500" : "bg-red-500")}>{dep.status}</Badge>
                </div>
                <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-[8px] text-muted-foreground uppercase">Amount:</span>
                  <span className="text-sm font-headline font-black text-primary">${dep.amount}</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 group relative">
                  <img src={dep.proofUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button size="sm" variant="outline" className="text-[8px] font-headline" onClick={() => window.open(dep.proofUrl)}>VIEW FULL</Button>
                  </div>
                </div>
                {dep.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleApproveDeposit(dep)} className="flex-1 bg-green-500 text-white text-[8px] font-headline"><Check size={12} className="mr-1" /> Approve</Button>
                    <Button onClick={() => updateDoc(doc(db!, 'deposits', dep.id), { status: 'rejected' })} variant="destructive" className="flex-1 text-[8px] font-headline"><X size={12} className="mr-1" /> Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="font-headline text-muted-foreground">
                  <th className="p-4 text-left">ENTITY</th>
                  <th className="p-4 text-left">METHOD</th>
                  <th className="p-4 text-left">NET PAYOUT</th>
                  <th className="p-4 text-left">STATUS</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((wit: any) => (
                  <tr key={wit.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold">@{wit.username}</td>
                    <td className="p-4 uppercase">{wit.methodName}</td>
                    <td className="p-4 font-financial font-bold text-red-500">${wit.amountUsd}</td>
                    <td className="p-4"><Badge className={cn("text-[7px]", wit.status === 'pending' ? "bg-yellow-500" : "bg-green-500")}>{wit.status}</Badge></td>
                    <td className="p-4 text-right">
                      {wit.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleApproveWithdrawal(wit)} className="h-7 text-[7px] bg-green-500"><Check size={10} /></Button>
                          <Button size="sm" variant="destructive" onClick={() => updateDoc(doc(db!, 'withdrawals', wit.id), { status: 'rejected' })} className="h-7 text-[7px]"><X size={10} /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kycRequests.map((req: any) => (
              <div key={req.id} className="glass-card p-5 rounded-3xl border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck /></div>
                  <div><p className="text-[10px] font-headline font-bold">@{req.username}</p><p className="text-[8px] text-muted-foreground">ID Verification Request</p></div>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10"><img src={req.documentUrl} className="w-full h-full object-cover" /></div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApproveKYC(req)} className="flex-1 bg-green-500 text-[8px] font-headline">Verify Identity</Button>
                  <Button onClick={() => updateDoc(doc(db!, 'verifications', req.id), { status: 'rejected' })} variant="destructive" className="flex-1 text-[8px] font-headline">Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-headline font-bold uppercase">Store Inventory</h2>
            <Button onClick={() => setIsAddServiceOpen(true)} className="h-9 text-[8px] font-headline bg-primary text-background"><Plus size={12} className="mr-1" /> Add Protocol</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {marketplaceServices.map((s: any) => (
              <div key={s.id} className="glass-card p-4 rounded-3xl border-white/5 space-y-3 group">
                <div className="aspect-square rounded-xl overflow-hidden bg-white/5 relative">
                  <img src={s.imageUrl || 'https://picsum.photos/seed/store/200'} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button onClick={() => deleteDoc(doc(db!, 'marketplace_services', s.id))} className="p-2 bg-red-500 rounded-lg text-white"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-[9px] font-headline font-bold text-center uppercase truncate">{s.name}</p>
                <div className="flex justify-center gap-1">
                  <Badge variant="outline" className="text-[6px] text-primary">{s.category}</Badge>
                  <Badge variant="outline" className={cn("text-[6px]", s.isActive ? "text-green-500" : "text-red-500")}>{s.isActive ? "ACTIVE" : "OFF"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-headline font-bold uppercase text-secondary">Deposit Gateways</h3><Button size="sm" onClick={() => { setGatewayType('dep'); setIsAddGatewayOpen(true); }} className="h-7 text-[7px] bg-secondary text-background"><Plus size={10} /></Button></div>
              <div className="space-y-2">
                {depositMethods.map((m: any) => (
                  <div key={m.id} className="p-4 glass-card rounded-2xl border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">{m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover rounded-lg" /> : <Landmark size={16} />}</div>
                      <div><p className="text-[9px] font-headline font-bold">{m.name}</p><p className="text-[7px] text-muted-foreground uppercase">{m.country}</p></div>
                    </div>
                    <button onClick={() => deleteDoc(doc(db!, 'deposit_methods', m.id))} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-[10px] font-headline font-bold uppercase text-primary">Withdrawal Gateways</h3><Button size="sm" onClick={() => { setGatewayType('wit'); setIsAddGatewayOpen(true); }} className="h-7 text-[7px] bg-primary text-background"><Plus size={10} /></Button></div>
              <div className="space-y-2">
                {withdrawalMethods.map((m: any) => (
                  <div key={m.id} className="p-4 glass-card rounded-2xl border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">{m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover rounded-lg" /> : <ArrowUpCircle size={16} />}</div>
                      <div><p className="text-[9px] font-headline font-bold">{m.name}</p><p className="text-[7px] text-muted-foreground uppercase">{m.country}</p></div>
                    </div>
                    <button onClick={() => deleteDoc(doc(db!, 'withdrawal_methods', m.id))} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

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
                        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Case: {activeChatId.slice(0, 8)}</p>
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
      </Tabs>

      {/* Modals */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-sm">
          <DialogHeader><DialogTitle className="text-[10px] font-headline font-bold uppercase">Modify Entity Balance</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[8px] uppercase">New Vault Total ($)</Label>
              <Input type="number" value={editBalance} onChange={(e)=>setEditBalance(e.target.value)} className="h-14 bg-white/5 border-white/10 font-financial text-xl" />
            </div>
            <Button onClick={handleUpdateBalance} className="w-full h-14 bg-primary text-background font-headline font-bold uppercase tracking-widest">Execute Update</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Modal */}
      <AddServiceModal open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen} db={db} />

      {/* Add Gateway Modal */}
      <AddGatewayModal open={isAddGatewayOpen} onOpenChange={setIsAddGatewayOpen} db={db} type={gatewayType} />
    </div>
  );
}

// Components for Modals
function AddServiceModal({ open, onOpenChange, db }: { open: boolean, onOpenChange: any, db: any }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Games',
    price: '',
    type: 'fixed',
    imageUrl: '',
    isActive: true,
    requiresInput: true,
    inputLabel: 'Player ID',
    variants: [] as any[]
  });

  const handleSave = async () => {
    if (!formData.name || !db) return;
    try {
      await addDoc(collection(db, 'marketplace_services'), {
        ...formData,
        price: parseFloat(formData.price || '0'),
        variants: formData.variants.map(v => ({ ...v, price: parseFloat(v.price) }))
      });
      onOpenChange(false);
    } catch (e) {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-md max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase">Deploy New Service</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-1"><Label className="text-[8px] uppercase">Service Name</Label><Input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="h-10 bg-white/5" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-[8px] uppercase">Category</Label><Input value={formData.category} onChange={(e)=>setFormData({...formData, category: e.target.value})} className="h-10 bg-white/5" /></div>
            <div className="space-y-1"><Label className="text-[8px] uppercase">Price ($)</Label><Input type="number" value={formData.price} onChange={(e)=>setFormData({...formData, price: e.target.value})} className="h-10 bg-white/5" /></div>
          </div>
          <div className="space-y-1"><Label className="text-[8px] uppercase">Image URL</Label><Input value={formData.imageUrl} onChange={(e)=>setFormData({...formData, imageUrl: e.target.value})} className="h-10 bg-white/5" /></div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[8px] uppercase font-bold">Active Status</span>
            <Switch checked={formData.isActive} onCheckedChange={(val)=>setFormData({...formData, isActive: val})} />
          </div>
          <Button onClick={handleSave} className="w-full h-12 bg-primary text-background font-headline font-bold uppercase tracking-widest mt-4">Confirm Deployment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddGatewayModal({ open, onOpenChange, db, type }: { open: boolean, onOpenChange: any, db: any, type: 'dep' | 'wit' }) {
  const [formData, setFormData] = useState({
    name: '',
    country: 'SA',
    currencyCode: 'SAR',
    exchangeRate: '3.75',
    iconUrl: '',
    isActive: true,
    fields: [] as any[]
  });

  const handleAddField = () => {
    setFormData({ ...formData, fields: [...formData.fields, { label: '', value: '', type: 'text' }] });
  };

  const handleSave = async () => {
    if (!formData.name || !db) return;
    try {
      const collectionName = type === 'dep' ? 'deposit_methods' : 'withdrawal_methods';
      await addDoc(collection(db, collectionName), {
        ...formData,
        exchangeRate: parseFloat(formData.exchangeRate || '1')
      });
      onOpenChange(false);
    } catch (e) {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-md max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader><DialogTitle className="text-xs font-headline font-bold uppercase">Add {type === 'dep' ? 'Deposit' : 'Withdrawal'} Gateway</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-[8px] uppercase">Gateway Name</Label><Input value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="h-10 bg-white/5" /></div>
            <div className="space-y-1"><Label className="text-[8px] uppercase">Country Code</Label><Input value={formData.country} onChange={(e)=>setFormData({...formData, country: e.target.value})} className="h-10 bg-white/5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-[8px] uppercase">Currency Code</Label><Input value={formData.currencyCode} onChange={(e)=>setFormData({...formData, currencyCode: e.target.value})} className="h-10 bg-white/5" /></div>
            <div className="space-y-1"><Label className="text-[8px] uppercase">Exchange Rate (1 USD = ?)</Label><Input type="number" value={formData.exchangeRate} onChange={(e)=>setFormData({...formData, exchangeRate: e.target.value})} className="h-10 bg-white/5" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label className="text-[8px] uppercase">Required Credentials/Fields</Label><Button size="sm" onClick={handleAddField} className="h-6 px-2 text-[7px]"><Plus size={10} /></Button></div>
            {formData.fields.map((f, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Label" value={f.label} onChange={(e) => {
                  const newFields = [...formData.fields];
                  newFields[i].label = e.target.value;
                  setFormData({ ...formData, fields: newFields });
                }} className="h-8 bg-white/5 text-[8px]" />
                <Input placeholder="Value (for deposit)" value={f.value} onChange={(e) => {
                  const newFields = [...formData.fields];
                  newFields[i].value = e.target.value;
                  setFormData({ ...formData, fields: newFields });
                }} className="h-8 bg-white/5 text-[8px]" />
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="w-full h-12 bg-primary text-background font-headline font-bold uppercase tracking-widest mt-4">Save Gateway</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
