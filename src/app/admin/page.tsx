
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
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc, addDoc, onSnapshot, where } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

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

const SERVICE_COLORS = [
  { id: 'text-orange-400', label: 'Orange' },
  { id: 'text-blue-400', label: 'Blue' },
  { id: 'text-green-400', label: 'Green' },
  { id: 'text-pink-400', label: 'Pink' },
  { id: 'text-purple-400', label: 'Purple' },
  { id: 'text-cyan-400', label: 'Cyan' },
  { id: 'text-primary', label: 'Gold' },
];

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const methodIconInputRef = useRef<HTMLInputElement>(null);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [activeKycRequest, setActiveKycRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Chat Admin States
  const [chatConfig, setChatConfig] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatReply, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isJoiningChat, setIsJoiningChat] = useState(false);
  const [isClosingChat, setIsClosingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [activeServiceRequest, setActiveServiceRequest] = useState<any>(null);
  const [serviceAction, setServiceAction] = useState<'complete' | 'reject' | null>(null);
  const [serviceResult, setServiceResult] = useState('');
  const [serviceRejectReason, setServiceRejectReason] = useState('');
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [newMethodCountry, setNewMethodCountry] = useState('');
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIcon, setNewMethodIcon] = useState<string | null>(null);
  const [newMethodCurrency, setNewMethodCurrency] = useState('');
  const [newMethodRate, setNewMethodRate] = useState('1');
  const [depositFields, setDepositFields] = useState<Array<{ label: string, value: string }>>([]);

  const [editingWithdrawId, setEditingWithdrawId] = useState<string | null>(null);
  const [newWithdrawCountry, setNewWithdrawCountry] = useState('');
  const [newWithdrawName, setNewWithdrawName] = useState('');
  const [newWithdrawIcon, setNewWithdrawIcon] = useState<string | null>(null);
  const [newWithdrawCurrency, setNewWithdrawCurrency] = useState('');
  const [newWithdrawRate, setNewWithdrawRate] = useState('1');
  const [newWithdrawFeeType, setNewWithdrawFeeType] = useState<'fixed' | 'percentage'>('fixed');
  const [newWithdrawFeeValue, setNewWithdrawFeeValue] = useState('0');
  const [withdrawFields, setWithdrawFields] = useState<Array<{ label: string, type: 'text' | 'textarea' | 'select', options?: string }>>([]);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceColor, setNewServiceColor] = useState('text-orange-400');
  const [newServiceImage, setNewServiceImage] = useState<string | null>(null);
  const [newServiceType, setNewServiceType] = useState<'fixed' | 'variable'>('fixed');
  const [serviceVariants, setServiceVariants] = useState<Array<{ label: string, price: string }>>([]);
  const [requiresUserInput, setRequiresUserInput] = useState(false);
  const [userInputLabel, setUserInputLabel] = useState('');
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [configCategoryFilter, setConfigCategoryFilter] = useState('ALL');

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

  const chatSessionsQuery = useMemo(() => query(collection(db, 'chat_sessions'), where('status', 'in', ['open', 'active']), orderBy('updatedAt', 'desc')), [db]);
  const { data: chatSessions = [] } = useCollection(chatSessionsQuery);

  const methodsQuery = useMemo(() => query(collection(db, 'deposit_methods')), [db]);
  const { data: depositMethods = [] } = useCollection(methodsQuery);

  const withdrawMethodsQuery = useMemo(() => query(collection(db, 'withdrawal_methods')), [db]);
  const { data: withdrawalMethods = [] } = useCollection(withdrawMethodsQuery);

  const marketplaceServicesQuery = useMemo(() => query(collection(db, 'marketplace_services')), [db]);
  const { data: marketplaceServices = [] } = useCollection(marketplaceServicesQuery);

  const serviceRequestsQuery = useMemo(() => query(collection(db, 'service_requests'), orderBy('date', 'desc')), [db]);
  const { data: serviceRequests = [] } = useCollection(serviceRequestsQuery);

  const existingCategories = useMemo(() => {
    const categories = new Set(marketplaceServices.map((s: any) => s.category?.toUpperCase() || 'UNCATEGORIZED'));
    return Array.from(categories).sort();
  }, [marketplaceServices]);

  const filteredMarketplaceServices = useMemo(() => {
    if (configCategoryFilter === 'ALL') return marketplaceServices;
    return marketplaceServices.filter((s: any) => (s.category?.toUpperCase() || 'UNCATEGORIZED') === configCategoryFilter);
  }, [marketplaceServices, configCategoryFilter]);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast]);

  // Handle Chat Config
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

  // Listen to Active Chat Messages
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
        text: "تم حل المشكلة وإغلاق المحادثة. شكراً لتواصلك مع فلاش.",
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
          type: 'refund',
          amount: req.amountUsd,
          status: 'completed',
          sender: 'WITHDRAWAL REFUND',
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
        const userRef = doc(targetUserId && doc(db, 'users', targetUserId) as any);
        const diff = amountNum - currentBalance;
        transaction.update(userRef as any, { balance: amountNum });
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

  const handleResetPin = async (targetUserId: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { pin: null });
      await sendNotification(targetUserId, "Security Reset", "Your account PIN has been reset by the administrator. Please set a new one.", 'system');
      toast({ title: "PIN RESET SUCCESSFUL" });
    } catch (e: any) { toast({ variant: "destructive", title: "RESET FAILED" }); }
  };

  const handleProcessServiceRequest = async () => {
    if (!activeServiceRequest || !serviceAction) return;
    setIsSubmittingService(true);
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'service_requests', activeServiceRequest.id);
        const userRef = doc(db, 'users', activeServiceRequest.userId);
        
        if (serviceAction === 'complete') {
          transaction.update(reqRef, { 
            status: 'completed', 
            resultCode: serviceResult.trim() 
          });
          
          const notifRef = doc(collection(db, 'users', activeServiceRequest.userId, 'notifications'));
          transaction.set(notifRef, {
            title: "Service Order Complete",
            message: `Your order for ${activeServiceRequest.serviceName} is ready. Code: ${serviceResult}`,
            type: 'transaction',
            read: false,
            date: new Date().toISOString()
          });
        } else {
          transaction.update(reqRef, { 
            status: 'rejected', 
            rejectionReason: serviceRejectReason.trim() 
          });
          transaction.update(userRef, { balance: increment(activeServiceRequest.price) });
          
          const txRef = doc(collection(db, 'users', activeServiceRequest.userId, 'transactions'));
          transaction.set(txRef, {
            type: 'refund',
            amount: activeServiceRequest.price,
            service: `REFUND: ${activeServiceRequest.serviceName}`,
            status: 'completed',
            date: new Date().toISOString()
          });

          const notifRef = doc(collection(db, 'users', activeServiceRequest.userId, 'notifications'));
          transaction.set(notifRef, {
            title: "Order Rejected & Refunded",
            message: `Your order for ${activeServiceRequest.serviceName} was declined. Reason: ${serviceRejectReason}. Funds returned.`,
            type: 'transaction',
            read: false,
            date: new Date().toISOString()
          });
        }
      });
      toast({ title: serviceAction === 'complete' ? "ORDER COMPLETED" : "ORDER REJECTED & REFUNDED" });
      setActiveServiceRequest(null);
      setServiceAction(null);
      setServiceResult('');
      setServiceRejectReason('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "PROCESSING FAILED", description: e.message });
    } finally {
      setIsSubmittingService(false);
    }
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceCategory('');
    setNewServiceColor('text-orange-400');
    setNewServiceImage(null);
    setNewServiceType('fixed');
    setServiceVariants([]);
    setRequiresUserInput(false);
    setUserInputLabel('');
    setIsServiceActive(true);
  };

  const handleServiceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewServiceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addServiceVariant = () => {
    setServiceVariants([...serviceVariants, { label: '', price: '' }]);
  };

  const removeServiceVariant = (idx: number) => {
    setServiceVariants(serviceVariants.filter((_, i) => i !== idx));
  };

  const updateServiceVariant = (idx: number, field: 'label' | 'price', val: string) => {
    const updated = [...serviceVariants];
    updated[idx][field] = val;
    setServiceVariants(updated);
  };

  const handleAddService = async () => {
    if (!newServiceName || (newServiceType === 'fixed' && !newServicePrice) || (newServiceType === 'variable' && serviceVariants.length === 0)) {
      toast({ variant: "destructive", title: "MISSING FIELDS" });
      return;
    }
    try {
      const data: any = {
        name: newServiceName,
        imageUrl: newServiceImage,
        category: newServiceCategory || 'UNCATEGORIZED',
        color: newServiceColor,
        type: newServiceType,
        requiresInput: requiresUserInput,
        inputLabel: requiresUserInput ? userInputLabel : '',
        isActive: isServiceActive
      };

      if (newServiceType === 'fixed') {
        data.price = parseFloat(newServicePrice);
      } else {
        data.variants = serviceVariants.map(v => ({ label: v.label, price: parseFloat(v.price) }));
      }
      
      if (editingServiceId) {
        await updateDoc(doc(db, 'marketplace_services', editingServiceId), data);
        toast({ title: "SERVICE UPDATED" });
      } else {
        await addDoc(collection(db, 'marketplace_services'), data);
        toast({ title: "SERVICE ADDED" });
      }
      resetServiceForm();
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleEditService = (service: any) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServiceImage(service.imageUrl || null);
    setNewServiceType(service.type || 'fixed');
    setNewServiceCategory(service.category || '');
    setNewServiceColor(service.color);
    setRequiresUserInput(service.requiresInput || false);
    setUserInputLabel(service.inputLabel || '');
    setIsServiceActive(service.isActive !== undefined ? service.isActive : true);
    
    if (service.type === 'variable') {
      setServiceVariants(service.variants.map((v: any) => ({ label: v.label, price: v.price.toString() })));
    } else {
      setNewServicePrice(service.price?.toString() || '');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'marketplace_services', id));
      toast({ title: "SERVICE REMOVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleAddDepositMethod = async () => {
    if (!newMethodCountry || !newMethodName || !newMethodCurrency || depositFields.length === 0) {
      toast({ variant: "destructive", title: "MISSING FIELDS" });
      return;
    }
    try {
      const data = {
        country: newMethodCountry,
        name: newMethodName,
        iconUrl: newMethodIcon,
        currencyCode: newMethodCurrency,
        exchangeRate: parseFloat(newMethodRate) || 1,
        fields: depositFields,
        isActive: true
      };
      
      if (editingDepositId) {
        await updateDoc(doc(db, 'deposit_methods', editingDepositId), data);
        toast({ title: "METHOD UPDATED" });
      } else {
        await addDoc(collection(db, 'deposit_methods'), data);
        toast({ title: "METHOD ADDED" });
      }
      resetDepositForm();
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const resetDepositForm = () => {
    setEditingDepositId(null);
    setNewMethodCountry('');
    setNewMethodName('');
    setNewMethodIcon(null);
    setNewMethodCurrency('');
    setNewMethodRate('1');
    setDepositFields([]);
  };

  const addDepositField = () => {
    setDepositFields([...depositFields, { label: '', value: '' }]);
  };

  const removeDepositField = (index: number) => {
    setDepositFields(depositFields.filter((_, i) => i !== index));
  };

  const updateDepositField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...depositFields];
    updated[index][key] = val;
    setDepositFields(updated);
  };

  const handleEditDepositMethod = (method: any) => {
    setEditingDepositId(method.id);
    setNewMethodCountry(method.country);
    setNewMethodName(method.name);
    setNewMethodIcon(method.iconUrl || null);
    setNewMethodCurrency(method.currencyCode || COUNTRY_CURRENCIES[method.country] || 'USD');
    setNewMethodRate(method.exchangeRate?.toString() || '1');
    setDepositFields(method.fields || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCountryChange = (val: string, type: 'withdraw' | 'deposit') => {
    if (type === 'withdraw') {
      setNewWithdrawCountry(val);
      setNewWithdrawCurrency(COUNTRY_CURRENCIES[val] || 'USD');
    } else {
      setNewMethodCountry(val);
      setNewMethodCurrency(COUNTRY_CURRENCIES[val] || 'USD');
    }
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
      toast({ variant: "destructive", title: "MISSING FIELDS" });
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

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'withdraw' | 'deposit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'withdraw') setNewWithdrawIcon(reader.result as string);
        else setNewMethodIcon(reader.result as string);
      };
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

  if (authLoading || profileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  }

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
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-9 h-auto bg-card/40 border border-white/5 rounded-2xl mb-8 p-1 gap-1 overflow-x-auto">
          <TabsTrigger value="withdrawals" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ArrowUpCircle className="h-3 w-3 mr-1" /> Withdraws</TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ArrowDownCircle className="h-3 w-3 mr-1" /> Deposits</TabsTrigger>
          <TabsTrigger value="chats" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><MessageSquare className="h-3 w-3 mr-1" /> Chats</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ShieldCheck className="h-3 w-3 mr-1" /> KYC</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><Users className="h-3 w-3 mr-1" /> Ledger</TabsTrigger>
          <TabsTrigger value="service_requests" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><ShoppingBag className="h-3 w-3 mr-1" /> Srv Req</TabsTrigger>
          <TabsTrigger value="services_config" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><Ticket className="h-3 w-3 mr-1" /> Srv Cfg</TabsTrigger>
          <TabsTrigger value="config" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><Settings2 className="h-3 w-3 mr-1" /> Dep-Cfg</TabsTrigger>
          <TabsTrigger value="withdraw_config" className="rounded-xl font-headline text-[7px] uppercase data-[state=active]:bg-primary data-[state=active]:text-background p-2"><WalletCards className="h-3 w-3 mr-1" /> Wit-Cfg</TabsTrigger>
        </TabsList>

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
              <div className="p-4 border-b border-white/5"><p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Active Sessions</p></div>
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
                      {activeChat.status === 'open' && (
                        <Button onClick={handleJoinChat} disabled={isJoiningChat} size="sm" className="h-8 bg-green-600 text-white rounded-lg text-[8px] font-headline uppercase tracking-widest"><Play size={12} className="mr-1" /> Join Chat</Button>
                      )}
                      <Button onClick={handleEndChat} disabled={isClosingChat} size="sm" className="h-8 bg-red-600 text-white rounded-lg text-[8px] font-headline uppercase tracking-widest"><LogOut size={12} className="mr-1" /> End Case</Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isAdmin ? "self-end items-end" : "self-start items-start")}>
                        <div className={cn("p-3 rounded-2xl text-[10px] font-headline", msg.isAdmin ? "bg-primary text-background rounded-tr-none shadow-lg" : "bg-muted text-foreground rounded-tl-none border border-white/10")}>
                          {msg.text}
                        </div>
                        <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    <div ref={chatScrollRef} />
                  </div>
                  {activeChat.status === 'active' ? (
                    <form onSubmit={handleSendAdminReply} className="p-4 border-t border-white/5 bg-white/5 flex gap-2">
                      <Input placeholder="TRANSMIT REPLY..." className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] font-headline" value={chatReply} onChange={(e) => setChatMessage(e.target.value)} />
                      <button type="submit" disabled={!chatReply.trim()} className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center hover:scale-105 transition-all"><SendHorizontal size={20} /></button>
                    </form>
                  ) : (
                    <div className="p-4 bg-muted/20 text-center"><p className="text-[8px] font-headline uppercase text-muted-foreground">Join protocol to enable transmission</p></div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20">
                  <MessageSquare size={64} className="mb-4" />
                  <p className="text-sm font-headline font-bold uppercase tracking-widest">Select Protocol to Intercept</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="service_requests" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceRequests.length === 0 ? <p className="col-span-full text-center text-[10px] text-muted-foreground uppercase py-10">No service requests logged</p> : serviceRequests.map((req: any) => (
              <div key={req.id} className="glass-card p-6 rounded-[2rem] space-y-5 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full", req.status === 'pending' ? "bg-yellow-500/40" : req.status === 'completed' ? "bg-green-500/40" : "bg-red-500/40")} />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5"><ShoppingBag className="h-6 w-6 text-primary" /></div>
                    <div>
                      <p className="text-[11px] font-headline font-bold uppercase tracking-tight">@{req.username}</p>
                      <p className="text-[7px] text-muted-foreground uppercase">{req.serviceName}</p>
                      {req.selectedVariant && <Badge variant="outline" className="text-[6px] mt-1 uppercase">{req.selectedVariant}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-headline font-black text-primary">${req.price}</p>
                    <Badge variant={req.status === 'completed' ? 'default' : req.status === 'rejected' ? 'destructive' : 'outline'} className="text-[6px] h-4 mt-1 uppercase">{req.status}</Badge>
                  </div>
                </div>
                {req.userInput && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[7px] text-muted-foreground uppercase mb-1">User Provided Data:</p>
                    <p className="text-[10px] font-headline font-bold text-white break-all">{req.userInput}</p>
                  </div>
                )}
                {req.status === 'completed' && req.resultCode && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-[7px] text-green-500 uppercase font-black mb-1">Voucher/Code Issued:</p>
                    <p className="text-[10px] font-headline font-bold text-white tracking-widest">{req.resultCode}</p>
                  </div>
                )}
                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-[7px] text-red-500 uppercase font-black mb-1">Rejection Reason:</p>
                    <p className="text-[10px] font-headline font-bold text-white italic">"{req.rejectionReason}"</p>
                  </div>
                )}
                {req.status === 'pending' && (
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => { setActiveServiceRequest(req); setServiceAction('complete'); }} className="flex-1 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all"><Check className="h-4 w-4" /><span className="text-[9px] font-headline font-bold uppercase">Mark Completed</span></button>
                    <button onClick={() => { setActiveServiceRequest(req); setServiceAction('reject'); }} className="flex-1 h-10 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all"><X className="h-4 w-4" /><span className="text-[9px] font-headline font-bold uppercase">Reject</span></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services_config" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-primary/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-primary"><Ticket size={14} /> {editingServiceId ? "Modify Product" : "Register Product"}</h3>
              {editingServiceId && (
                <button onClick={resetServiceForm} className="text-[8px] font-headline font-bold uppercase tracking-widest text-red-500 hover:underline">Cancel</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Product Name</Label>
                  <Input placeholder="E.G. PUBG MOBILE" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Category</Label>
                    <Input placeholder="E.G. GAMES" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newServiceCategory} onChange={(e) => setNewServiceCategory(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Product Image</Label>
                    <div onClick={() => serviceImageInputRef.current?.click()} className="h-12 bg-background/50 border-dashed border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden">
                      {newServiceImage ? <img src={newServiceImage} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}
                      <input type="file" ref={serviceImageInputRef} className="hidden" accept="image/*" onChange={handleServiceImageUpload} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Pricing Strategy</Label>
                  <Select value={newServiceType} onValueChange={(val: any) => setNewServiceType(val)}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="fixed" className="text-[10px] uppercase">Fixed Price (Single)</SelectItem>
                      <SelectItem value="variable" className="text-[10px] uppercase">Variable (Packages/Cards)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newServiceType === 'fixed' ? (
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Price (USD)</Label>
                    <Input type="number" placeholder="9.99" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><Label className="text-[8px] uppercase tracking-widest">Price Packages</Label><button onClick={addServiceVariant} className="p-1.5 bg-primary/20 text-primary rounded-lg"><Plus size={14} /></button></div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {serviceVariants.map((v, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input placeholder="LABEL (E.G. 60 UC)" className="flex-1 h-10 bg-background/50 border-white/10 text-[9px] uppercase" value={v.label} onChange={(e) => updateServiceVariant(idx, 'label', e.target.value)} />
                          <Input placeholder="PRICE $" className="w-20 h-10 bg-background/50 border-white/10 text-[9px] uppercase" type="number" value={v.price} onChange={(e) => updateServiceVariant(idx, 'price', e.target.value)} />
                          <button onClick={() => removeServiceVariant(idx)} className="p-2 text-red-500/40 hover:text-red-500"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Theme Accent</Label>
                  <Select value={newServiceColor} onValueChange={setNewServiceColor}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">{SERVICE_COLORS.map(c => (<SelectItem key={c.id} value={c.id} className={cn("text-[10px] uppercase", c.id)}>{c.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="p-5 bg-white/5 border border-white/5 rounded-[1.5rem] space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id="requiresInput" checked={requiresUserInput} onCheckedChange={(val: boolean) => setRequiresUserInput(val)} />
                    <Label htmlFor="requiresInput" className="text-[9px] font-headline font-bold uppercase tracking-tight">Require Data from User</Label>
                  </div>
                  {requiresUserInput && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Input Field Label</Label>
                      <Input placeholder="E.G. PLAYER ID" className="h-10 bg-background/50 border-white/10 text-[9px] uppercase" value={userInputLabel} onChange={(e) => setUserInputLabel(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="p-5 bg-white/5 border border-white/5 rounded-[1.5rem] flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-headline font-bold uppercase tracking-tight">Product Visibility</Label>
                    <p className="text-[7px] text-muted-foreground uppercase">Enable or Disable</p>
                  </div>
                  <Switch checked={isServiceActive} onCheckedChange={setIsServiceActive} />
                </div>
              </div>
            </div>
            <button onClick={handleAddService} className="w-full h-14 bg-primary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all gold-glow"><Ticket size={16} /> {editingServiceId ? "Update Global Product" : "Deploy Global Product"}</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Manage Inventory</h3>
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-primary" />
                <Select value={configCategoryFilter} onValueChange={setConfigCategoryFilter}>
                  <SelectTrigger className="h-10 bg-card border-white/10 rounded-xl text-[9px] uppercase w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="ALL" className="text-[9px] uppercase">Show All</SelectItem>
                    {existingCategories.map(cat => (<SelectItem key={cat} value={cat} className="text-[9px] uppercase">{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarketplaceServices.map((s: any) => (
                <div key={s.id} className={cn("glass-card p-5 rounded-2xl border-white/5 flex justify-between items-center group transition-all", !s.isActive && "opacity-50 grayscale")}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden">
                      {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" /> : <div className={cn("text-xl", s.color)}><ShoppingBag /></div>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-headline font-bold uppercase">{s.name}</p>
                        {!s.isActive && <Badge variant="destructive" className="text-[6px] h-3 px-1">OOS</Badge>}
                      </div>
                      <p className="text-[8px] text-muted-foreground uppercase">{s.category} - {s.type === 'variable' ? `${s.variants?.length} Options` : `$${s.price}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditService(s)} className="p-2 text-primary/40 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteService(s.id)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

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

                <div className="bg-background/50 p-4 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[7px] text-muted-foreground uppercase font-black">Deposit Intelligence</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><UserIcon size={10} /> Sender:</span>
                    <span className="text-[9px] font-headline text-white">{req.senderName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-muted-foreground uppercase flex items-center gap-1"><Calendar size={10} /> Date:</span>
                    <span className="text-[9px] font-headline text-white">{new Date(req.date).toLocaleString()}</span>
                  </div>
                </div>

                {req.proofUrl && (
                  <Dialog>
                    <DialogTrigger asChild><button className="w-full h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"><Camera className="h-3 w-3 text-secondary group-hover:scale-110" /><span className="text-[8px] font-headline font-bold uppercase">View Proof</span></button></DialogTrigger>
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]">
                      <DialogHeader>
                        <DialogTitle className="sr-only">Deposit Proof</DialogTitle>
                      </DialogHeader>
                      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <img src={req.proofUrl} alt="Proof" className="w-full h-full object-contain" />
                      </div>
                    </DialogContent>
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
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-primary"><Database size={14} /> {editingDepositId ? "Modify Deposit Gateway" : "Deposit Infrastructure"}</h3>
              {editingDepositId && (
                <button onClick={resetDepositForm} className="text-[8px] font-headline font-bold uppercase tracking-widest text-red-500 hover:underline">Cancel</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Country</Label>
                    <Select value={newMethodCountry} onValueChange={(val) => handleCountryChange(val, 'deposit')}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="SELECT" /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Service Name</Label>
                    <Input placeholder="E.G. BANK TRANSFER" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Currency</Label>
                    <Select value={newMethodCurrency} onValueChange={setNewMethodCurrency}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="CURRENCY" /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="USD" className="text-[10px] uppercase">USD</SelectItem>
                        {newMethodCountry && COUNTRY_CURRENCIES[newMethodCountry] && COUNTRY_CURRENCIES[newMethodCountry] !== 'USD' && (
                          <SelectItem value={COUNTRY_CURRENCIES[newMethodCountry]} className="text-[10px] uppercase">{COUNTRY_CURRENCIES[newMethodCountry]}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Rate (1 USD = ?)</Label>
                    <Input type="number" placeholder="1.00" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newMethodRate} onChange={(e) => setNewMethodRate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Method Icon</Label>
                  <div onClick={() => methodIconInputRef.current?.click()} className="h-12 bg-background/50 border-dashed border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden">
                    {newMethodIcon ? <img src={newMethodIcon} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}
                    <input type="file" ref={methodIconInputRef} className="hidden" accept="image/*" onChange={(e) => handleIconUpload(e, 'deposit')} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center"><Label className="text-[8px] uppercase tracking-widest">Data Fields</Label><button onClick={addDepositField} className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-background transition-all"><Plus size={14} /></button></div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {depositFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex gap-2 items-center">
                        <Input placeholder="LABEL" className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase" value={field.label} onChange={(e) => updateDepositField(idx, 'label', e.target.value)} />
                        <button onClick={() => removeDepositField(idx)} className="p-2 text-red-500/40 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      <Input placeholder="VALUE" className="h-10 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase" value={field.value} onChange={(e) => updateDepositField(idx, 'value', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleAddDepositMethod} className="w-full h-12 bg-primary text-background rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"><Plus size={16} /> {editingDepositId ? "Update Infrastructure" : "Deploy Infrastructure"}</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {depositMethods.map((m: any) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4 flex-1 mr-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                    {m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" /> : <div className="text-primary font-headline font-bold text-xs">{m.country}</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-headline font-bold uppercase truncate">{m.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">{m.currencyCode} - Rate: {m.exchangeRate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditDepositMethod(m)} className="p-2 text-primary/40 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteMethod(m.id, 'deposit')} className="p-2 text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="withdraw_config" className="space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border-secondary/10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest flex items-center gap-2 text-secondary">
                <WalletCards size={14} /> {editingWithdrawId ? "Modify Global Gateway" : "Global Gateway Architect"}
              </h3>
              {editingWithdrawId && (
                <button onClick={resetWithdrawForm} className="text-[8px] font-headline font-bold uppercase tracking-widest text-red-500 hover:underline">Cancel</button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase tracking-widest">Country</Label>
                  <Select value={newWithdrawCountry} onValueChange={(val) => handleCountryChange(val, 'withdraw')}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="SELECT REGION" /></SelectTrigger>
                    <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Method Name</Label>
                    <Input placeholder="EX: BARAKA BANK" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawName} onChange={(e) => setNewWithdrawName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Icon</Label>
                    <div onClick={() => iconInputRef.current?.click()} className="h-12 bg-background/50 border-dashed border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-secondary/5 transition-all overflow-hidden">
                      {newWithdrawIcon ? <img src={newWithdrawIcon} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}
                      <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={(e) => handleIconUpload(e, 'withdraw')} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Currency</Label>
                    <Select value={newWithdrawCurrency} onValueChange={setNewWithdrawCurrency}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue placeholder="CURRENCY" /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="USD" className="text-[10px] uppercase">USD</SelectItem>
                        {newWithdrawCountry && COUNTRY_CURRENCIES[newWithdrawCountry] && COUNTRY_CURRENCIES[newWithdrawCountry] !== 'USD' && (
                          <SelectItem value={COUNTRY_CURRENCIES[newWithdrawCountry]} className="text-[10px] uppercase">{COUNTRY_CURRENCIES[newWithdrawCountry]}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Ex. Rate (1 USD = ?)</Label>
                    <Input type="number" placeholder="1.00" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawRate} onChange={(e) => setNewWithdrawRate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Fee Type</Label>
                    <Select value={newWithdrawFeeType} onValueChange={(val: any) => setNewWithdrawFeeType(val)}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="fixed" className="text-[10px] uppercase">Fixed Amount</SelectItem>
                        <SelectItem value="percentage" className="text-[10px] uppercase">Percentage %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest">Fee Value</Label>
                    <Input type="number" placeholder="0.00" className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={newWithdrawFeeValue} onChange={(e) => setNewWithdrawFeeValue(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center"><Label className="text-[8px] uppercase tracking-widest">P2P Structure</Label><button onClick={addField} className="p-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary hover:text-background transition-all"><Plus size={14} /></button></div>
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
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Authority:</Label>
                    <Select defaultValue={u.role || 'user'} onValueChange={(val) => handleUpdateRole(u.id, val)}>
                      <SelectTrigger className="h-8 bg-background/50 border-white/10 rounded-lg text-[9px] uppercase w-[120px] font-headline"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="user" className="text-[9px] uppercase">User</SelectItem>
                        <SelectItem value="employee" className="text-[9px] uppercase text-blue-400 font-bold flex items-center gap-1"><Contact size={10} /> Employee</SelectItem>
                        <SelectItem value="agent" className="text-[9px] uppercase text-secondary font-bold flex items-center gap-1"><Briefcase size={10} /> Agent</SelectItem>
                        <SelectItem value="admin" className="text-[9px] uppercase text-primary font-bold">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {editingUserId === u.id ? (
                      <div className="flex gap-2 col-span-2 animate-in slide-in-from-right-2"><Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className="h-10 bg-background border-primary/20 rounded-xl text-xs" /><button onClick={() => handleUpdateBalance(u.id, u.balance || 0)} className="w-10 h-10 bg-primary text-background rounded-xl flex items-center justify-center shrink-0"><Save size={16} /></button></div>
                    ) : (
                      <button onClick={() => { setEditingUserId(u.id); setNewBalance(u.balance?.toString()); }} className="h-10 bg-white/5 border border-white/5 rounded-xl text-[9px] font-headline font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Modify Assets</button>
                    )}
                    <button onClick={() => handleResetPin(u.id)} className="h-10 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-headline font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Unlock size={12} /> Reset PIN
                    </button>
                  </div>
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
                    <DialogContent className="max-w-sm glass-card border-white/10 p-4 rounded-[2rem]">
                      <DialogHeader>
                        <DialogTitle className="sr-only">KYC Document</DialogTitle>
                      </DialogHeader>
                      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <img src={req.documentUrl} alt="KYC" className="w-full h-full object-contain" />
                      </div>
                    </DialogContent>
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
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><ShieldAlert className="text-red-500 h-4 w-4" /> Reject Identity</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Reason</Label><Textarea placeholder="REASON..." className="min-h-[120px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="flex-1 h-12 rounded-xl text-[10px] font-headline uppercase">Abort</Button><Button onClick={handleRejectKyc} disabled={!rejectionReason.trim() || isSubmittingRejection} className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-headline uppercase">{isSubmittingRejection ? <Loader2 className="animate-spin" /> : "Confirm"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeServiceRequest} onOpenChange={() => !isSubmittingService && setActiveServiceRequest(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center">
              {serviceAction === 'complete' ? "Complete Order" : "Reject & Refund"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {serviceAction === 'complete' ? (
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Voucher Code</Label>
                <Input placeholder="CODE..." className="h-12 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase" value={serviceResult} onChange={(e) => setServiceResult(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Reason</Label>
                <Textarea placeholder="REASON..." className="min-h-[100px] bg-background/50 border-white/10 rounded-xl text-[10px] uppercase pt-3" value={serviceRejectReason} onChange={(e) => setServiceRejectReason(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setActiveServiceRequest(null)} className="flex-1 h-12 rounded-xl text-[10px] font-headline uppercase" disabled={isSubmittingService}>Abort</Button>
              <Button 
                onClick={handleProcessServiceRequest} 
                disabled={isSubmittingService || (serviceAction === 'complete' && !serviceResult.trim()) || (serviceAction === 'reject' && !serviceRejectReason.trim())} 
                className={cn("flex-1 h-12 rounded-xl text-[10px] font-headline uppercase font-bold", serviceAction === 'complete' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
              >
                {isSubmittingService ? <Loader2 className="animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
