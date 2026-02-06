
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
  Image as ImageIcon,
  Percent,
  Coins,
  Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc, addDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

export const COUNTRIES = [
  { code: 'GL', name: 'Global / Worldwide' },
  { code: 'CR', name: 'Crypto / Digital Assets' },
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
];

const COUNTRY_CURRENCIES: Record<string, string> = {
  GL: 'USD',
  CR: 'USD',
  SA: 'SAR',
  EG: 'EGP',
  AE: 'AED',
  KW: 'KWD',
  QA: 'QAR',
  JO: 'JOD',
  IQ: 'IQD',
  LY: 'LYD',
  DZ: 'DZD',
  MA: 'MAD',
  PS: 'USD',
  LB: 'LBP',
  SY: 'SYP',
  OM: 'OMR',
  YE: 'YER',
  BH: 'BHD',
  TN: 'TND',
  SD: 'SDG',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
};

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const iconInputRef = useRef<HTMLInputElement>(null);
  
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
  const [editingWithdrawId, setEditingWithdrawId] = useState<string | null>(null);
  const [newWithdrawCountry, setNewWithdrawCountry] = useState('');
  const [newWithdrawName, setNewWithdrawName] = useState('');
  const [newWithdrawIcon, setNewWithdrawIcon] = useState<string | null>(null);
  const [newWithdrawCurrency, setNewWithdrawCurrency] = useState('');
  const [newWithdrawRate, setNewWithdrawRate] = useState('1');
  const [newWithdrawFeeType, setNewWithdrawFeeType] = useState<'fixed' | 'percentage'>('fixed');
  const [newWithdrawFeeValue, setNewWithdrawFeeValue] = useState('0');
  const [withdrawFields, setWithdrawFields] = useState<Array<{ label: string, type: 'text' | 'textarea' | 'select', options?: string }>>([]);

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

  const handleApproveWithdrawal = async (req: any) => {
    try {
      const ref = doc(db, 'withdrawals', req.id);
      await updateDoc(ref, { status: 'approved' });
      await sendNotification(req.userId, "Withdrawal Confirmed", `Your request for ${req.netAmount} ${req.currencyCode} has been processed.`, 'transaction');
      toast({ title: "WITHDRAWAL APPROVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); }
  };

  const handleRejectWithdrawal = async (req: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', req.id);
        const userRef = doc(db, 'users', req.userId);
        const txRef = doc(collection(db, 'users', req.userId, 'transactions'));
        
        transaction.update(withdrawalRef, { status: 'rejected' });
        transaction.update(userRef, { balance: increment(req.amountUsd) });
        transaction.set(txRef, {
          type: 'receive',
          amount: req.amountUsd,
          status: 'completed',
          sender: 'SYSTEM REFUND',
          date: new Date().toISOString()
        });
      });
      await sendNotification(req.userId, "Withdrawal Rejected", `Your request was declined. $${req.amountUsd} have been returned to your vault.`, 'transaction');
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
      await sendNotification(req.userId, "Identity Verified", `Congratulations @${req.username}, your identity has been successfully verified.`, 'verification');
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
      await sendNotification(activeKycRequest.userId, "Identity Verification Rejected", `Your request was declined. Reason: ${rejectionReason}`, 'verification');
      toast({ title: "KYC REJECTED" });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setActiveKycRequest(null);
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); } finally { setIsSubmittingRejection(false); }
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
      toast({ title: "ROLE UPDATED" });
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

  const resetWithdrawForm = () => {
    setEditingWithdrawId(null);
    setNewWithdrawCountry('');
    setNewWithdrawName('');
    setNewWithdrawIcon(null);
    setNewWithdrawCurrency('');
    setNewWithdrawRate('1');
    setNewWithdrawFeeType('fixed');
    setNewWithdrawFeeValue('0');
    setWithdrawFields([]);
  };

  const handleCountryChange = (val: string) => {
    setNewWithdrawCountry(val);
    const localCurrency = COUNTRY_CURRENCIES[val] || 'USD';
    setNewWithdrawCurrency(localCurrency);
  };

  const handleEditWithdrawalMethod = (method: any) => {
    setEditingWithdrawId(method.id);
    setNewWithdrawCountry(method.country);
    setNewWithdrawName(method.name);
    setNewWithdrawIcon(method.iconUrl);
    setNewWithdrawCurrency(method.currencyCode);
    setNewWithdrawRate(method.exchangeRate.toString());
    setNewWithdrawFeeType(method.feeType);
    setNewWithdrawFeeValue(method.feeValue.toString());
    setWithdrawFields(method.fields || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddWithdrawMethod = async () => {
    if (!newWithdrawCountry || !newWithdrawName || !newWithdrawCurrency || withdrawFields.length === 0) {
      toast({ variant: "destructive", title: "MISSING FIELDS", description: "Method name, Currency, and at least one form field are required." });
      return;
    }
    try {
      const data = {
        country: newWithdrawCountry,
        name: newWithdrawName,
        iconUrl: newWithdrawIcon,
        currencyCode: newWithdrawCurrency.toUpperCase(),
        exchangeRate: parseFloat(newWithdrawRate) || 1,
        feeType: newWithdrawFeeType,
        feeValue: parseFloat(newWithdrawFeeValue) || 0,
        fields: withdrawFields,
        isActive: true
      };

      if (editingWithdrawId) {
        await updateDoc(doc(db, 'withdrawal_methods', editingWithdrawId), data);
        toast({ title: "METHOD UPDATED" });
      } else {
        await addDoc(collection(db, 'withdrawal_methods'), data);
        toast({ title: "WITHDRAW METHOD ADDED" });
      }
      resetWithdrawForm();
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewWithdrawIcon(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addField = () => {
    setWithdrawFields([...withdrawFields, { label: '', type: 'text' }]);
  };

  const removeField = (index: number) => {
    setWithdrawFields(withdrawFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: string) => {
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
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><ArrowUpCircle className="h-3 w-3 sm:mr-2" /> Withdrawals</TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><ArrowDownCircle className="h-3 w-3 sm:mr-2" /> Deposits</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><ShieldCheck className="h-3 w-3 sm:mr-2" /> KYC</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><Users className="h-3 w-3 sm:mr-2" /> Ledger</TabsTrigger>
          <TabsTrigger value="config" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><Settings2 className="h-3 w-3 sm:mr-2" /> Dep-Cfg</TabsTrigger>
          <TabsTrigger value="withdraw_config" className="rounded-xl font-headline text-[7px] sm:text-[9px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background px-1"><WalletCards className="h-3 w-3 sm:mr-2" /> Wit-Cfg</TabsTrigger>
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
                  <div className="text-right">
                    <p className="text-lg font-headline font-black text-primary">${req.amountUsd}</p>
                    <p className="text-[7px] text-muted-foreground uppercase">Net: {req.netAmount} {req.currencyCode}</p>
                  </div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[7px] text-muted-foreground uppercase font-black">User Intel</p>
                  {req.details && Object.entries(req.details).map(([label, value]: [string, any]) => (
                    <div key={label} className="flex justify-between items-start">
                      <span className="text-[8px] text-muted-foreground uppercase">{label}:</span>
                      <span className="text-[9px] font-headline text-white text-right break-all ml-4">{value}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => handleApproveWithdrawal(req)} className="flex-1 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Approve</span></button>
                    <button onClick={() => handleRejectWithdrawal(req)} className="flex-1 h-12 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[10px] font-headline font-bold tracking-widest uppercase">Reject</span></button>
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

                {req.proofUrl && (
                  <Dialog>
                    <DialogTrigger asChild><button className="w-full h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-3 w-3 text-secondary group-hover:scale-110" /><span className="text-[8px] font-headline font-bold uppercase">View Proof</span></button></DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]"><div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black"><img src={req.proofUrl} alt="Deposit Proof" className="w-full h-full object-contain" /></div></DialogContent>
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
              <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest">Payment Data</Label><Textarea placeholder="ACCOUNT DETAILS" className="min-h-[100px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3" value={newMethodDetails} onChange={(e) => setNewMethodDetails(e.target.value)} /></div>
            </div>
            <button onClick={handleAddDepositMethod} className="w-full h-12 bg-primary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"><Plus size={16} /> Deploy New Method</button>
          </div>
        </TabsContent>

        <TabsContent value="withdraw_config" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-secondary/10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-secondary">
                <WalletCards size={14} /> {editingWithdrawId ? "Modify Global Gateway" : "Global Gateway Architect"}
              </h3>
              {editingWithdrawId && (
                <button onClick={resetWithdrawForm} className="text-[8px] font-headline font-bold uppercase tracking-widest text-red-500 hover:underline">Cancel Editing</button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Target Country</Label>
                  <Select value={newWithdrawCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="SELECT REGION" /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Method Name</Label>
                    <Input placeholder="EX: BARAKA BANK" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawName} onChange={(e) => setNewWithdrawName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Method Icon</Label>
                    <div onClick={() => iconInputRef.current?.click()} className="h-12 bg-background/50 border-dashed border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-secondary/5 transition-all overflow-hidden">
                      {newWithdrawIcon ? <img src={newWithdrawIcon} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}
                      <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Currency Code</Label>
                    <Select value={newWithdrawCurrency} onValueChange={setNewWithdrawCurrency}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="CURRENCY" /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="USD" className="text-[10px] uppercase">USD - Dollar</SelectItem>
                        {newWithdrawCountry && COUNTRY_CURRENCIES[newWithdrawCountry] && COUNTRY_CURRENCIES[newWithdrawCountry] !== 'USD' && (
                          <SelectItem value={COUNTRY_CURRENCIES[newWithdrawCountry]} className="text-[10px] uppercase">
                            {COUNTRY_CURRENCIES[newWithdrawCountry]} - Local
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Ex. Rate (1 USD = ?)</Label>
                    <Input type="number" placeholder="1.00" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawRate} onChange={(e) => setNewWithdrawRate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Commission Type</Label>
                    <Select value={newWithdrawFeeType} onValueChange={(val: any) => setNewWithdrawFeeType(val)}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="fixed" className="text-[10px] uppercase">Fixed Amount</SelectItem>
                        <SelectItem value="percentage" className="text-[10px] uppercase">Percentage %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Fee Value</Label>
                    <Input type="number" placeholder="0.00" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawFeeValue} onChange={(e) => setNewWithdrawFeeValue(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">P2P Form Structure</Label><button onClick={addField} className="p-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary hover:text-background transition-all"><Plus size={14} /></button></div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {withdrawFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex gap-2 items-center">
                        <Input placeholder="INPUT LABEL" className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} />
                        <Select value={field.type} onValueChange={(val: any) => updateField(idx, 'type', val)}>
                          <SelectTrigger className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            <SelectItem value="text" className="text-[9px] uppercase">Text</SelectItem>
                            <SelectItem value="textarea" className="text-[9px] uppercase">Area</SelectItem>
                            <SelectItem value="select" className="text-[9px] uppercase">Select</SelectItem>
                          </SelectContent>
                        </Select>
                        <button onClick={() => removeField(idx)} className="p-2 text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      {field.type === 'select' && <Input placeholder="OPTIONS (COMMA SEPARATED)" className="h-9 bg-background/30 border-white/5 rounded-lg text-[8px] uppercase" value={field.options || ''} onChange={(e) => updateField(idx, 'options', e.target.value)} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleAddWithdrawMethod} className="w-full h-14 bg-secondary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cyan-glow">
              {editingWithdrawId ? <Save size={16} /> : <Plus size={16} />} 
              {editingWithdrawId ? "Update Secure Gateway" : "Deploy Secure Gateway"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withdrawalMethods.map((m: any) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                    {m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" /> : <div className="text-secondary font-headline font-bold text-xs">{m.country}</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-headline font-bold uppercase truncate">{m.name}</p>
                    <p className="text-[8px] text-primary/60 uppercase">1 USD = {m.exchangeRate} {m.currencyCode}</p>
                    <p className="text-[7px] text-muted-foreground uppercase">Fee: {m.feeValue}{m.feeType === 'percentage' ? '%' : ' ' + m.currencyCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditWithdrawalMethod(m)} className="p-2 text-primary/40 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteMethod(m.id, 'withdraw')} className="p-2 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
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
                    <div><p className="text-[11px] font-headline font-bold uppercase tracking-tight">@{u.username}</p><p className="text-[8px] text-muted-foreground uppercase">{u.email}</p></div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1"><p className="text-lg font-headline font-black text-primary">${u.balance?.toLocaleString()}</p></div>
                </div>
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Access Authority:</Label>
                    <Select defaultValue={u.role || 'user'} onValueChange={(val) => handleUpdateRole(u.id, val)}>
                      <SelectTrigger className="h-8 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase w-[100px] font-headline"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10"><SelectItem value="user" className="text-[9px] uppercase">User</SelectItem><SelectItem value="admin" className="text-[9px] uppercase text-primary font-bold">Admin</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {editingUserId === u.id ? (
                    <div className="flex gap-2 animate-in slide-in-from-right-2"><Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-10 bg-background border-primary/20 rounded-xl text-xs" /><button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="w-10 h-10 bg-primary text-background rounded-xl flex items-center justify-center shrink-0"><Save size={16} /></button></div>
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
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><Globe size={10} /> Country:</span><span className="text-[9px] font-headline text-white">{req.country || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><FileText size={10} /> Doc Type:</span><span className="text-[9px] font-headline text-white">{req.documentType || 'N/A'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><Search size={10} /> Doc Number:</span><span className="text-[9px] font-headline text-primary">{req.documentNumber || 'N/A'}</span></div>
                </div>
                {req.documentUrl && (
                  <Dialog>
                    <DialogTrigger asChild><button className="w-full h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-3 w-3 text-primary group-hover:scale-110" /><span className="text-[8px] font-headline font-bold uppercase">View Document</span></button></DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]"><div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black"><img src={req.documentUrl} alt="KYC Proof" className="w-full h-full object-contain" /></div></DialogContent>
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

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-6 rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><ShieldAlert className="text-red-500 h-4 w-4" /> Reject Identity Request</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest font-black text-muted-foreground flex items-center gap-2"><MessageSquare size={12} /> Specify Reason</Label><Textarea placeholder="EX: DOCUMENT EXPIRED..." className="min-h-[120px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="flex-1 h-12 rounded-xl text-[10px] font-headline uppercase">Abort</Button><Button onClick={handleRejectKyc} disabled={!rejectionReason.trim() || isSubmittingRejection} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-headline uppercase">{isSubmittingRejection ? <Loader2 className="animate-spin" /> : "Confirm Rejection"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
