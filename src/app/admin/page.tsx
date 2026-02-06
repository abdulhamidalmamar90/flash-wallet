
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
  Trash2,
  Settings2,
  Plus,
  Database,
  UserCheck,
  WalletCards,
  MapPin,
  MessageSquare,
  Shield,
  Type,
  AlignLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc, addDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

const COUNTRIES = [
  { code: 'GL', name: 'Global / Worldwide' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'UAE' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'JO', name: 'Jordan' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'LY', name: 'Libya' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'MA', name: 'Morocco' },
  { code: 'PS', name: 'Palestine' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'SY', name: 'Syria' },
  { code: 'OM', name: 'Oman' },
  { code: 'YE', name: 'Yemen' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'SD', name: 'Sudan' },
  { code: 'US', name: 'USA' },
  { code: 'GB', name: 'UK' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'TR', name: 'Turkey' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AU', name: 'Australia' },
];

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  // Rejection Dialog State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeKycRequest, setActiveKycRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Deposit Method Config State
  const [newMethodCountry, setNewMethodCountry] = useState('');
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodDetails, setNewMethodDetails] = useState('');

  // Withdrawal Method Dynamic Config State
  const [newWithdrawCountry, setNewWithdrawCountry] = useState('');
  const [newWithdrawName, setNewWithdrawName] = useState('');
  const [withdrawFields, setWithdrawFields] = useState<Array<{ label: string, type: 'text' | 'textarea' }>>([]);

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

  const methodsQuery = useMemo(() => query(collection(db, 'deposit_methods')), [db]);
  const { data: depositMethods = [] } = useCollection(methodsQuery);

  const withdrawMethodsQuery = useMemo(() => query(collection(db, 'withdrawal_methods')), [db]);
  const { data: withdrawalMethods = [] } = useCollection(withdrawMethodsQuery);

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

  const handleRejectWithdrawal = async (id: string, userId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', id);
        const userRef = doc(db, 'users', userId);
        const txRef = doc(collection(db, 'users', userId, 'transactions'));

        transaction.update(withdrawalRef, { status: 'rejected' });
        transaction.update(userRef, { balance: increment(amount) });
        transaction.set(txRef, {
          type: 'receive',
          amount,
          status: 'completed',
          sender: 'SYSTEM REFUND',
          date: new Date().toISOString()
        });
      });
      await sendNotification(userId, "Withdrawal Rejected", `Your request for $${amount} was declined. Funds have been returned to your vault.`, 'transaction');
      toast({ title: "WITHDRAWAL REJECTED & REFUNDED" });
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

  const handleApproveKyc = async (req: any) => {
    try {
      await updateDoc(doc(db, 'verifications', req.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', req.userId), { verified: true });
      await sendNotification(req.userId, "Identity Verified", `Congratulations @${req.username}, your identity has been successfully verified. Your account is now high-authority.`, 'verification');
      toast({ title: "KYC APPROVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); }
  };

  const handleRejectKyc = async () => {
    if (!activeKycRequest || !rejectionReason.trim()) return;
    setIsSubmittingRejection(true);
    try {
      await updateDoc(doc(db, 'verifications', activeKycRequest.id), { 
        status: 'rejected',
        reason: rejectionReason.trim()
      });
      await sendNotification(
        activeKycRequest.userId, 
        "Identity Verification Rejected", 
        `Your verification request was declined. Reason: ${rejectionReason}`, 
        'verification'
      );
      toast({ title: "KYC REJECTED" });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setActiveKycRequest(null);
    } catch (e: any) { 
      toast({ variant: "destructive", title: "ERROR" }); 
    } finally {
      setIsSubmittingRejection(false);
    }
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

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { role: newRole });
      await sendNotification(targetUserId, "Role Updated", `Your account authority has been changed to: ${newRole.toUpperCase()}`, 'system');
      toast({ title: "ROLE UPDATED SUCCESSFULLY" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "FAILED TO UPDATE ROLE" });
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    try {
      await deleteDoc(doc(db, 'users', targetUserId));
      toast({ title: "USER PURGED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleAddDepositMethod = async () => {
    if (!newMethodCountry || !newMethodName || !newMethodDetails) return;
    try {
      await addDoc(collection(db, 'deposit_methods'), {
        country: newMethodCountry,
        name: newMethodName,
        details: newMethodDetails,
        isActive: true
      });
      toast({ title: "METHOD ADDED" });
      setNewMethodName('');
      setNewMethodDetails('');
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleAddWithdrawMethod = async () => {
    if (!newWithdrawCountry || !newWithdrawName || withdrawFields.length === 0) {
      toast({ variant: "destructive", title: "MISSING FIELDS", description: "Define at least one form field." });
      return;
    }
    try {
      await addDoc(collection(db, 'withdrawal_methods'), {
        country: newWithdrawCountry,
        name: newWithdrawName,
        fields: withdrawFields,
        isActive: true
      });
      toast({ title: "WITHDRAW METHOD ADDED" });
      setNewWithdrawName('');
      setWithdrawFields([]);
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const addField = () => {
    setWithdrawFields([...withdrawFields, { label: '', type: 'text' }]);
  };

  const removeField = (index: number) => {
    setWithdrawFields(withdrawFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: 'label' | 'type', value: string) => {
    const updated = [...withdrawFields];
    (updated[index] as any)[key] = value;
    setWithdrawFields(updated);
  };

  const handleDeleteMethod = async (id: string, type: 'deposit' | 'withdraw') => {
    try {
      const coll = type === 'deposit' ? 'deposit_methods' : 'withdrawal_methods';
      await deleteDoc(doc(db, coll, id));
      toast({ title: "METHOD REMOVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const filteredUsers = allUsers.filter((u: any) => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.customId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v2.5</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">Superuser</Badge>
      </header>

      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-14 bg-card/40 border border-white/5 rounded-2xl mb-8 p-1 gap-1 overflow-x-auto">
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ArrowUpCircle className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Withdrawals</span><span className="sm:hidden">Out</span>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ArrowDownCircle className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Deposits</span><span className="sm:hidden">In</span>
          </TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <ShieldCheck className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">KYC</span><span className="sm:hidden">KYC</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <Users className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Ledger</span><span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <Settings2 className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Dep-Cfg</span><span className="sm:hidden">Dep-Cfg</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw_config" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background transition-all px-1">
            <WalletCards className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Wit-Cfg</span><span className="sm:hidden">Wit-Cfg</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withdrawals.length === 0 ? <p className="col-span-full text-center text-[10px] text-muted-foreground uppercase py-10">No pending withdrawals</p> : withdrawals.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-orange-500/40" : req.status === 'approved' ? "bg-primary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><Building2 className="h-6 w-6 text-primary" /></div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">{req.methodName}</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-primary">${req.amount}</p></div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[7px] text-muted-foreground uppercase font-black">User Details</p>
                  {req.details && Object.entries(req.details).map(([label, value]: [string, any]) => (
                    <div key={label} className="flex justify-between items-start">
                      <span className="text-[8px] text-muted-foreground uppercase">{label}:</span>
                      <span className="text-[9px] font-headline text-white text-right break-all ml-4">{value}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveWithdrawal(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => handleRejectWithdrawal(req.id, req.userId, req.amount)} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deposits.length === 0 ? <p className="col-span-full text-center text-[10px] text-muted-foreground uppercase py-10">No pending deposits</p> : deposits.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-secondary/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-cyan-500/40" : req.status === 'approved' ? "bg-secondary/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><DollarSign className="h-6 w-6 text-secondary" /></div>
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">{req.method} Deposit</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-headline font-black text-secondary">${req.amount}</p></div>
                </div>

                <div className="bg-background/50 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase">Sender:</span><span className="text-[9px] font-headline text-white flex items-center gap-1"><UserCheck size={10} className="text-secondary" /> {req.senderName || 'N/A'}</span></div>
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

        <TabsContent value="config" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-primary/10 space-y-6">
            <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-primary"><Database size={14} /> Deposit Infrastructure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest">Target Country</Label>
                <Select onValueChange={setNewMethodCountry}>
                  <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{c.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest">Service Name</Label>
                <Input placeholder="E.G. INSTAPAY" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[8px] uppercase tracking-widest">Payment Data (Multi-line)</Label>
                <Textarea 
                  placeholder="ACCOUNT / WALLET / IBAN DETAILS" 
                  className="min-h-[100px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3" 
                  value={newMethodDetails} 
                  onChange={(e) => setNewMethodDetails(e.target.value)} 
                />
              </div>
            </div>
            <button onClick={handleAddDepositMethod} className="w-full h-12 bg-primary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"><Plus size={16} /> Deploy New Method</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {depositMethods.map((m: any) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-headline font-bold text-xs shrink-0">{m.country}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-headline font-bold uppercase truncate">{m.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest whitespace-pre-line line-clamp-2">{m.details}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteMethod(m.id, 'deposit')} className="p-2 text-red-500/40 hover:text-red-500 transition-colors shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="withdraw_config" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-secondary/10 space-y-6">
            <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-secondary"><WalletCards size={14} /> Withdrawal Gateways</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Target Country</Label>
                  <Select onValueChange={setNewWithdrawCountry}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Method Name</Label>
                  <Input placeholder="E.G. GLOBAL BANK WIRE" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawName} onChange={(e) => setNewWithdrawName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[8px] uppercase tracking-widest">Form Structure (Inputs)</Label>
                  <button onClick={addField} className="p-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary hover:text-background transition-all"><Plus size={14} /></button>
                </div>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {withdrawFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-right-2">
                      <Input placeholder="FIELD LABEL" className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} />
                      <Select value={field.type} onValueChange={(val: any) => updateField(idx, 'type', val)}>
                        <SelectTrigger className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="text" className="text-[9px] uppercase"><Type size={10} className="inline mr-2" /> Text</SelectItem>
                          <SelectItem value="textarea" className="text-[9px] uppercase"><AlignLeft size={10} className="inline mr-2" /> Area</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={() => removeField(idx)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {withdrawFields.length === 0 && <p className="text-[8px] text-muted-foreground text-center py-4 uppercase font-black">Add fields to generate form</p>}
                </div>
              </div>
            </div>
            <button onClick={handleAddWithdrawMethod} className="w-full h-12 bg-secondary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"><Plus size={16} /> Deploy Dynamic Method</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withdrawalMethods.map((m: any) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary font-headline font-bold text-xs shrink-0">{m.country}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-headline font-bold uppercase truncate">{m.name}</p>
                    <div className="flex gap-1 mt-1 overflow-x-auto">
                      {m.fields?.map((f: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[6px] tracking-tight uppercase border-white/10 text-muted-foreground whitespace-nowrap">{f.label}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteMethod(m.id, 'withdraw')} className="p-2 text-red-500/40 hover:text-red-500 transition-colors shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Input placeholder="SEARCH LEDGER..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-14 bg-card/40 border-white/10 rounded-2xl text-[10px] tracking-widest uppercase font-headline pl-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((u: any) => (
              <div key={u.id} className="glass-card p-6 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center border-2 transition-all duration-500 overflow-hidden", u.verified ? "border-green-500 cyan-glow" : "border-red-500")}>{u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="h-6 w-6 text-primary/40" />}</div>
                    <div>
                      <p className="text-[11px] font-headline font-bold uppercase tracking-tight">@{u.username}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">{u.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className={cn("text-[6px] tracking-tighter uppercase font-black", u.role === 'admin' ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground")}>
                          {u.role === 'admin' ? 'Superuser' : 'Client'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-lg font-headline font-black text-primary">${u.balance?.toLocaleString()}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-red-500/40 hover:text-red-500 transition-colors p-1.5 bg-red-500/5 rounded-lg border border-red-500/10 hover:border-red-500/40"><Trash2 size={14} /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10 rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xs font-headline font-bold uppercase tracking-widest">Confirm Entity Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="text-[10px] uppercase text-muted-foreground">This action will permanently purge @{u.username} from the central database. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl font-headline text-[9px] uppercase border-white/10">Abort</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="rounded-xl font-headline text-[9px] uppercase bg-red-500 text-white hover:bg-red-600">Proceed with Purge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-primary/60" />
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Access Authority:</Label>
                    </div>
                    <Select defaultValue={u.role || 'user'} onValueChange={(val) => handleUpdateRole(u.id, val)}>
                      <SelectTrigger className="h-8 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase w-[100px] font-headline">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="user" className="text-[9px] uppercase">User</SelectItem>
                        <SelectItem value="admin" className="text-[9px] uppercase text-primary font-bold">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingUserId === u.id ? (
                    <div className="flex gap-2 animate-in slide-in-from-right-2">
                      <Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-10 bg-background border-primary/20 rounded-xl text-xs" />
                      <button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="w-10 h-10 bg-primary text-background rounded-xl flex items-center justify-center shrink-0"><Save size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingUserId(u.id); setNewBalance(u.balance?.toString()); }} className="w-full h-10 bg-white/5 border border-white/5 rounded-xl text-[9px] font-headline font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Modify Asset Balance</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifications.length === 0 ? <p className="col-span-full text-center text-[10px] text-muted-foreground uppercase py-10">No pending KYC requests</p> : verifications.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-green-500/20 transition-all duration-500">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-blue-500/40" : req.status === 'approved' ? "bg-green-500/40" : "bg-red-500/40")} />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><FileCheck className="h-6 w-6 text-green-500" /></div>
                  <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">@{req.username}</p><p className="text-[7px] text-muted-foreground uppercase">Identity Verification</p></div>
                </div>

                <div className="bg-background/50 p-4 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[7px] text-muted-foreground uppercase font-black">Submission Intelligence</p>
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><Globe size={10} /> Country:</span><span className="text-[9px] font-headline text-white">{req.country || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><FileText size={10} /> Doc Type:</span><span className="text-[9px] font-headline text-white">{req.documentType || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><Search size={10} /> Doc Number:</span><span className="text-[9px] font-headline text-primary">{req.documentNumber || 'N/A'}</span></div>
                </div>

                {req.documentUrl && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" /><span className="text-[8px] font-headline font-bold tracking-widest uppercase">View Document</span></button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]"><DialogHeader><DialogTitle className="text-[10px] font-headline font-bold tracking-widest uppercase text-center mb-4">KYC Evidence</DialogTitle></DialogHeader><div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black"><img src={req.documentUrl} alt="KYC Proof" className="w-full h-full object-contain" /></div></DialogContent>
                  </Dialog>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveKyc(req)} className="flex-1 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => { setActiveKycRequest(req); setIsRejectModalOpen(true); }} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* KYC Rejection Reason Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-6 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              <ShieldAlert className="text-red-500 h-4 w-4" /> Reject Identity Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2">
                <MessageSquare size={12} /> Specify Reason for Declining
              </Label>
              <Textarea 
                placeholder="EX: DOCUMENT EXPIRED OR BLURRY IMAGE..." 
                className="min-h-[120px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3 focus:border-red-500/50" 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="flex-1 h-12 rounded-xl text-[10px] font-headline uppercase">Abort</Button>
              <Button onClick={handleRejectKyc} disabled={!rejectionReason.trim() || isSubmittingRejection} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-headline uppercase">
                {isSubmittingRejection ? <Loader2 className="animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
