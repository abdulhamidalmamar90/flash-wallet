
"use client"

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Building2, 
  Bitcoin, 
  Clock, 
  Loader2, 
  AlertTriangle, 
  Users, 
  Search, 
  Wallet, 
  Edit2, 
  Save, 
  User as UserIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, increment, query, orderBy, runTransaction, DocumentData } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  // Fetch Withdrawals
  const withdrawalsQuery = useMemo(() => query(
    collection(db, 'withdrawals'),
    orderBy('date', 'desc')
  ), [db]);
  const { data: withdrawals = [], loading: withdrawLoading } = useCollection(withdrawalsQuery);

  // Fetch Deposits
  const depositsQuery = useMemo(() => query(
    collection(db, 'deposits'),
    orderBy('date', 'desc')
  ), [db]);
  const { data: deposits = [], loading: depositLoading } = useCollection(depositsQuery);

  // Fetch Users for Management
  const allUsersQuery = useMemo(() => query(collection(db, 'users')), [db]);
  const { data: allUsers = [], loading: usersLoading } = useCollection(allUsersQuery);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED", description: "You do not have administrative privileges." });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast]);

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const ref = doc(db, 'withdrawals', id);
      await updateDoc(ref, { status: 'approved' });
      toast({ title: "WITHDRAWAL APPROVED", description: "System has finalized the transaction." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    }
  };

  const handleRejectWithdrawal = async (id: string, userId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'withdrawals', id);
        const userRef = doc(db, 'users', userId);
        
        transaction.update(reqRef, { status: 'rejected' });
        transaction.update(userRef, { balance: increment(amount) });
      });
      toast({ variant: "destructive", title: "WITHDRAWAL REJECTED", description: "Funds have been returned to user vault." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    }
  };

  const handleApproveDeposit = async (id: string, userId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const depRef = doc(db, 'deposits', id);
        const userRef = doc(db, 'users', userId);
        const txRef = doc(collection(db, 'users', userId, 'transactions'));
        
        transaction.update(depRef, { status: 'approved' });
        transaction.update(userRef, { balance: increment(amount) });
        transaction.set(txRef, {
          type: 'deposit',
          amount: amount,
          status: 'completed',
          date: new Date().toISOString()
        });
      });
      toast({ title: "DEPOSIT APPROVED", description: "User balance has been increased." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      const ref = doc(db, 'deposits', id);
      await updateDoc(ref, { status: 'rejected' });
      toast({ variant: "destructive", title: "DEPOSIT REJECTED", description: "The request has been dismissed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    }
  };

  const handleUpdateBalance = async (targetUserId: string, currentBalance: number) => {
    const amountNum = parseFloat(newBalance);
    if (!newBalance || isNaN(amountNum)) {
      toast({ variant: "destructive", title: "INVALID AMOUNT", description: "Please enter a valid numeric value." });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', targetUserId);
        const txRef = doc(collection(db, 'users', targetUserId, 'transactions'));
        
        const diff = amountNum - currentBalance;
        if (diff === 0) return;

        transaction.update(userRef, { balance: amountNum });
        transaction.set(txRef, {
          type: diff > 0 ? 'deposit' : 'withdraw',
          amount: Math.abs(diff),
          service: diff > 0 ? 'Admin Deposit' : 'Admin Debit',
          status: 'completed',
          date: new Date().toISOString()
        });
      });

      toast({ title: "BALANCE UPDATED", description: "User vault has been synchronized." });
      setEditingUserId(null);
      setNewBalance('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "UPDATE FAILED", description: e.message });
    }
  };

  const filteredUsers = allUsers.filter((u: any) => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.customId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if ((profile as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
        <h1 className="text-2xl font-headline font-black text-foreground">403 - UNAUTHORIZED</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Quantum signature mismatch. Access denied.</p>
        <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-primary text-background font-headline font-bold rounded-xl">RETURN TO SAFETY</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group">
            <LayoutDashboard className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </Link>
          <div>
            <h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1>
            <p className="text-[8px] text-muted-foreground uppercase font-black">Secure Shell v2.5</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">Superuser</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-card/40 border border-white/5 rounded-2xl mb-8 p-1">
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[8px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all">
            <ArrowUpCircle className="h-3 w-3 mr-1" /> Withdraw
          </TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[8px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all">
            <ArrowDownCircle className="h-3 w-3 mr-1" /> Deposit
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[8px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all">
            <Users className="h-3 w-3 mr-1" /> Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-headline font-bold text-muted-foreground tracking-widest uppercase">Withdrawal Queue</h3>
            <span className="text-[10px] font-headline text-primary">
              {withdrawals.filter(w => w.status === 'pending').length} Action(s) Required
            </span>
          </div>
          <div className="space-y-4">
            {withdrawLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : withdrawals.length === 0 ? <p className="text-center text-[10px] opacity-30 py-10 uppercase font-headline">No withdrawals</p> : withdrawals.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-orange-500/40" : req.status === 'approved' ? "bg-primary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5">
                      {req.type === 'bank' ? <Building2 className="h-6 w-6 text-primary" /> : <Bitcoin className="h-6 w-6 text-secondary" />}
                    </div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1">ID: {req.id?.slice(0, 8)}...</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-primary">${req.amount}</p><Badge className={cn("text-[8px] px-2 py-0.5 h-5 border-none uppercase tracking-widest font-black mt-1", req.status === 'pending' ? "bg-orange-500/20 text-orange-400" : req.status === 'approved' ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400")}>{req.status}</Badge></div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveWithdrawal(req.id)} className="flex-1 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => handleRejectWithdrawal(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-headline font-bold text-muted-foreground tracking-widest uppercase">Deposit Queue</h3>
            <span className="text-[10px] font-headline text-secondary">
              {deposits.filter(d => d.status === 'pending').length} Verification(s) Required
            </span>
          </div>
          <div className="space-y-4">
            {depositLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : deposits.length === 0 ? <p className="text-center text-[10px] opacity-30 py-10 uppercase font-headline">No deposits</p> : deposits.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-secondary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-blue-500/40" : req.status === 'approved' ? "bg-secondary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5">
                      {req.type === 'bank' ? <Building2 className="h-6 w-6 text-primary" /> : <Bitcoin className="h-6 w-6 text-secondary" />}
                    </div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1">ID: {req.id?.slice(0, 8)}...</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-secondary">${req.amount}</p><Badge className={cn("text-[8px] px-2 py-0.5 h-5 border-none uppercase tracking-widest font-black mt-1", req.status === 'pending' ? "bg-blue-500/20 text-blue-400" : req.status === 'approved' ? "bg-secondary/20 text-secondary" : "bg-red-500/20 text-red-400")}>{req.status}</Badge></div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveDeposit(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Confirm</span></button>
                    <button onClick={() => handleRejectDeposit(req.id)} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Decline</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="relative group px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="SEARCH BY USERNAME, EMAIL OR ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-card/40 border-white/10 rounded-2xl font-headline text-[10px] tracking-widest uppercase"
            />
          </div>
          <div className="space-y-4">
            {usersLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : filteredUsers.length === 0 ? <p className="text-center text-[10px] opacity-30 py-10 uppercase font-headline">No users found</p> : filteredUsers.map((u: any) => (
              <div key={u.id} className="glass-card p-6 rounded-[2rem] border-white/5 group hover:border-primary/20 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border border-white/5">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" /> : <UserIcon className="h-6 w-6 text-primary/40" />}
                    </div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground flex items-center gap-2">@{u.username}{u.role === 'admin' && <ShieldAlert size={12} className="text-primary" />}</p><p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1 truncate max-w-[150px]">{u.email}</p></div>
                  </div>
                  <div className="text-right"><p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">ID: {u.customId}</p><div className="flex items-center justify-end gap-2"><Wallet size={14} className="text-primary/60" /><p className="text-lg font-headline font-black text-primary">${u.balance?.toLocaleString() || '0'}</p></div></div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  {editingUserId === u.id ? (
                    <div className="flex gap-2 animate-in slide-in-from-right-2">
                      <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-headline">$</span><Input type="number" placeholder="NEW BALANCE" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="pl-8 h-12 bg-background border-primary/20 rounded-xl font-headline text-xs" /></div>
                      <button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center hover:scale-105 transition-all"><Save size={20} /></button>
                      <button onClick={() => setEditingUserId(null)} className="w-12 h-12 bg-muted/20 text-foreground/40 rounded-xl flex items-center justify-center transition-all"><X size={20} /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingUserId(u.id); setNewBalance(u.balance?.toString() || '0'); }} className="w-full h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-headline font-bold tracking-widest uppercase hover:bg-primary/10 hover:border-primary/30 transition-all group"><Edit2 size={14} className="group-hover:text-primary transition-colors" />Modify User Balance</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
