
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
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const withdrawalsQuery = useMemo(() => query(collection(db, 'withdrawals'), orderBy('date', 'desc')), [db]);
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const depositsQuery = useMemo(() => query(collection(db, 'deposits'), orderBy('date', 'desc')), [db]);
  const { data: deposits = [] } = useCollection(depositsQuery);

  const verificationsQuery = useMemo(() => query(collection(db, 'verifications'), orderBy('date', 'desc')), [db]);
  const { data: verifications = [] } = useCollection(verificationsQuery);

  const allUsersQuery = useMemo(() => query(collection(db, 'users')), [db]);
  const { data: allUsers = [] } = useCollection(allUsersQuery);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast]);

  const sendNotification = async (userId: string, title: string, message: string, type: 'system' | 'transaction' | 'verification' = 'system') => {
    const notifRef = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(notifRef, {
      title,
      message,
      type,
      read: false,
      date: new Date().toISOString()
    });
  };

  const handleApproveWithdrawal = async (id: string, userId: string, amount: number) => {
    try {
      const ref = doc(db, 'withdrawals', id);
      await updateDoc(ref, { status: 'approved' });
      await sendNotification(userId, "Withdrawal Confirmed", `Your request for $${amount} has been processed.`, 'transaction');
      toast({ title: "WITHDRAWAL APPROVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); }
  };

  const handleApproveDeposit = async (id: string, userId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'deposits', id);
        const userRef = doc(db, 'users', userId);
        const txRef = doc(collection(db, 'users', userId, 'transactions'));
        
        transaction.update(depositRef, { status: 'approved' });
        transaction.update(userRef, { balance: increment(amount) });
        transaction.set(txRef, {
          type: 'deposit',
          amount,
          status: 'completed',
          date: new Date().toISOString()
        });
      });
      await sendNotification(userId, "Deposit Approved", `Success! $${amount} has been credited to your vault.`, 'transaction');
      toast({ title: "DEPOSIT APPROVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); }
  };

  const handleApproveVerification = async (id: string, userId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const verRef = doc(db, 'verifications', id);
        const userRef = doc(db, 'users', userId);
        transaction.update(verRef, { status: 'approved' });
        transaction.update(userRef, { verified: true });
      });
      await sendNotification(userId, "Account Verified", "Your entity is now officially verified by FLASH authority.", 'verification');
      toast({ title: "USER VERIFIED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleUpdateBalance = async (targetUserId: string, currentBalance: number) => {
    const amountNum = parseFloat(newBalance);
    if (!newBalance || isNaN(amountNum)) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', targetUserId);
        const diff = amountNum - currentBalance;
        transaction.update(userRef, { balance: amountNum });
        if (diff !== 0) {
          const txRef = doc(collection(db, 'users', targetUserId, 'transactions'));
          transaction.set(txRef, { 
            type: diff > 0 ? 'receive' : 'withdraw', 
            amount: Math.abs(diff), 
            status: 'completed', 
            date: new Date().toISOString(),
            sender: diff > 0 ? 'SYSTEM ADJUSTMENT' : undefined
          });
        }
      });
      await sendNotification(targetUserId, "Balance Adjustment", `Administrator has updated your balance to $${amountNum}`, 'system');
      toast({ title: "BALANCE UPDATED" });
      setEditingUserId(null);
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    try {
      // حذف وثيقة المستخدم من قاعدة البيانات
      await deleteDoc(doc(db, 'users', targetUserId));
      
      toast({ 
        title: "USER PURGED", 
        description: "The entity record has been permanently removed from the ledger." 
      });
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "PURGE FAILED", 
        description: e.message 
      });
    }
  };

  const filteredUsers = allUsers.filter((u: any) => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.customId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v2.5</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">Superuser</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-card/40 border border-white/5 rounded-2xl mb-8 p-1 gap-1">
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ArrowUpCircle className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Withdrawals</span><span className="sm:hidden">Out</span>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ArrowDownCircle className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Deposits</span><span className="sm:hidden">In</span>
          </TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ShieldCheck className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Verifications</span><span className="sm:hidden">KYC</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <Users className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Ledger</span><span className="sm:hidden">Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-6">
          <div className="space-y-4">
            {withdrawals.length === 0 ? <p className="text-center text-[10px] text-muted-foreground uppercase py-10">No pending withdrawals</p> : withdrawals.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-orange-500/40" : req.status === 'approved' ? "bg-primary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5">{req.type === 'bank' ? <Building2 className="h-6 w-6 text-primary" /> : <Bitcoin className="h-6 w-6 text-secondary" />}</div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">{req.type} transfer</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-primary">${req.amount}</p></div>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveWithdrawal(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => updateDoc(doc(db, 'withdrawals', req.id), { status: 'rejected' })} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <div className="space-y-4">
            {deposits.length === 0 ? <p className="text-center text-[10px] text-muted-foreground uppercase py-10">No pending deposits</p> : deposits.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-secondary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-cyan-500/40" : req.status === 'approved' ? "bg-secondary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><DollarSign className="h-6 w-6 text-secondary" /></div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">{req.method || 'Manual'} Deposit</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-secondary">${req.amount}</p></div>
                </div>
                {req.proofUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-3 w-3 text-secondary group-hover:scale-110 transition-transform" /><span className="text-[8px] font-headline font-bold tracking-widest uppercase">View Proof</span></button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]"><DialogHeader><DialogTitle className="text-[10px] font-headline font-bold tracking-widest uppercase text-center mb-4">Payment Evidence</DialogTitle></DialogHeader><div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black"><img src={req.proofUrl} alt="Deposit Proof" className="w-full h-full object-contain" /></div></DialogContent>
                  </Dialog>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveDeposit(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => updateDoc(doc(db, 'deposits', req.id), { status: 'rejected' })} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="space-y-6">
          <div className="space-y-4">
            {verifications.length === 0 ? <p className="text-center text-[10px] text-muted-foreground uppercase py-10">Verification queue is clear</p> : verifications.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-cyan-500/40" : req.status === 'approved' ? "bg-secondary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><FileCheck className="h-6 w-6 text-secondary" /></div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">Identity Submission</p></div>
                  </div>
                  <Badge className={cn("text-[8px] uppercase tracking-widest", req.status === 'pending' ? "bg-orange-500/20" : "bg-primary/20")}>{req.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-1"><p className="text-[7px] text-muted-foreground uppercase font-black flex items-center gap-1"><Globe className="w-2 h-2" /> Country</p><p className="text-[9px] font-headline font-bold text-white truncate">{req.details?.country || 'N/A'}</p></div>
                  <div className="flex flex-col gap-1"><p className="text-[7px] text-muted-foreground uppercase font-black flex items-center gap-1"><FileText className="w-2 h-2" /> Doc Type</p><p className="text-[9px] font-headline font-bold text-white uppercase">{req.details?.docType || 'ID'}</p></div>
                  <div className="col-span-2 flex flex-col gap-1 pt-1 border-t border-white/5"><p className="text-[7px] text-muted-foreground uppercase font-black">Document Number</p><p className="text-[9px] font-headline font-bold text-primary tracking-widest">{req.details?.docNumber || 'NOT PROVIDED'}</p></div>
                </div>
                {req.documentUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" /><span className="text-[9px] font-headline font-bold tracking-widest uppercase">Inspect Credentials</span></button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]"><DialogHeader><DialogTitle className="text-[10px] font-headline font-bold tracking-widest uppercase text-center mb-4">Official Document Preview</DialogTitle></DialogHeader><div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black"><img src={req.documentUrl} alt="KYC Document" className="w-full h-full object-contain" /></div></DialogContent>
                  </Dialog>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveVerification(req.id, req.userId)} className="flex-1 h-12 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Verify</span></button>
                    <button onClick={() => updateDoc(doc(db, 'verifications', req.id), { status: 'rejected' })} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Decline</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Input placeholder="SEARCH LEDGER..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-14 bg-card/40 border-white/10 rounded-2xl text-[10px] tracking-widest uppercase font-headline pl-6" />
          <div className="space-y-4">
            {filteredUsers.map((u: any) => (
              <div key={u.id} className="glass-card p-6 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border-2 transition-all duration-500 overflow-hidden", u.verified ? "border-green-500 cyan-glow" : "border-red-500")}>{u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="h-6 w-6 text-primary/40" />}</div>
                    <div>
                      <p className="text-[11px] font-headline font-bold uppercase tracking-tight">@{u.username}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-lg font-headline font-black text-primary">${u.balance?.toLocaleString()}</p>
                    
                    {/* زر حذف المستخدم مع نافذة تأكيد */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-red-500/40 hover:text-red-500 transition-colors p-1.5 bg-red-500/5 rounded-lg border border-red-500/10 hover:border-red-500/40">
                          <Trash2 size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-red-500/20 rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xs font-headline font-bold uppercase tracking-widest text-red-500">Confirm Asset Purge</AlertDialogTitle>
                          <AlertDialogDescription className="text-[10px] text-muted-foreground uppercase leading-relaxed">
                            This action will permanently remove @{u.username} from the FLASH database. This entity will be erased from the ledger, allowing for a fresh initialization if required.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-[9px] font-headline uppercase tracking-widest rounded-xl">Abort</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(u.id)}
                            className="bg-red-500 text-white text-[9px] font-headline uppercase tracking-widest rounded-xl"
                          >
                            Authorize Purge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {editingUserId === u.id ? (
                  <div className="flex gap-2 animate-in slide-in-from-right-2">
                    <Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-12 bg-background border-primary/20 rounded-xl" />
                    <button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                      <Save size={20} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingUserId(u.id); setNewBalance(u.balance?.toString()); }} className="w-full h-12 bg-white/5 border border-white/5 rounded-xl text-[10px] font-headline font-bold uppercase tracking-widest hover:bg-primary/10 transition-all">
                    Modify Asset Balance
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
