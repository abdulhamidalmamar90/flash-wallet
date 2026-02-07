
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
  Star,
  History,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, runTransaction, setDoc, increment, deleteDoc, addDoc, onSnapshot, where, getDocs, limit } from 'firebase/firestore';
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

  // Archive State
  const [selectedArchive, setSelectedArchive] = useState<any>(null);
  const [archiveMessages, setArchiveMessages] = useState<any[]>([]);
  const [showFullArchive, setShowFullArchive] = useState(false);
  const [isFetchingArchive, setIsFetchingArchive] = useState(false);

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

  const chatSessionsQuery = useMemo(() => query(collection(db, 'chat_sessions')), [db]);
  const { data: allChatSessions = [] } = useCollection(chatSessionsQuery);

  const chatSessions = useMemo(() => {
    return allChatSessions
      .filter((s: any) => ['open', 'active'].includes(s.status))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allChatSessions]);

  const archivedSessions = useMemo(() => {
    return allChatSessions
      .filter((s: any) => ['closed', 'archived'].includes(s.status))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [allChatSessions]);

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
        text: "تم حل المشكلة وإغلاق المحادثة. شكراً لتواصلك مع فلاش. يرجى الضغط على زر التقييم بالأسفل.",
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

  const handleOpenArchive = async (session: any) => {
    setSelectedArchive(session);
    setShowFullArchive(false);
    setIsFetchingArchive(true);
    try {
      const q = query(collection(db, 'chat_sessions', session.id, 'messages'), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      setArchiveMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to load archive" });
    } finally {
      setIsFetchingArchive(false);
    }
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

  const handleApproveWithdrawal = async (req: any) => {
    try {
      const ref = doc(db, 'withdrawals', req.id);
      await updateDoc(ref, { status: 'approved' });
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
      toast({ title: "DEPOSIT APPROVED" });
    } catch (e: any) { toast({ variant: "destructive", title: "ERROR" }); }
  };

  const handleApproveKyc = async (req: any) => {
    try {
      await updateDoc(doc(db, 'verifications', req.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', req.userId), { verified: true });
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
        if (targetUserId) {
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
      toast({ title: "BALANCE UPDATED" });
      setEditingUserId(null);
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { role: newRole });
      toast({ title: "ROLE UPDATED" });
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); }
  };

  const handleResetPin = async (targetUserId: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { pin: null });
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
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <CircleDot size={12} className="text-primary animate-pulse" />
                <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Active Interceptions</p>
              </div>
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

              <div className="mt-auto border-t border-white/10 bg-black/20">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <History size={12} className="text-muted-foreground" />
                  <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">Archive Ledger</p>
                </div>
                <div className="h-[200px] overflow-y-auto no-scrollbar">
                  {archivedSessions.length === 0 ? (
                    <p className="text-center text-[7px] text-muted-foreground uppercase py-6 opacity-40">Ledger is clean</p>
                  ) : archivedSessions.map((s: any) => (
                    <button key={s.id} onClick={() => handleOpenArchive(s)} className="w-full p-3 border-b border-white/5 text-left transition-all hover:bg-white/5 flex justify-between items-center group">
                      <div>
                        <p className="text-[9px] font-headline font-bold uppercase text-white/60 group-hover:text-primary transition-colors">{s.caseId}</p>
                        <p className="text-[6px] text-muted-foreground uppercase">{new Date(s.updatedAt).toLocaleDateString()}</p>
                      </div>
                      {s.rating && (
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => <Star key={i} size={6} className={cn(i < s.rating ? "text-primary fill-primary" : "text-white/10")} />)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
      </Tabs>

      {/* Archive Modal */}
      <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2rem] z-[1000] overflow-hidden flex flex-col max-h-[80vh]">
          {selectedArchive && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
                  <History size={14} className="text-primary" /> Case Archive: {selectedArchive.caseId}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                {!showFullArchive ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95">
                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-muted-foreground uppercase font-black">Subject Authority:</span>
                        <span className="text-[10px] font-headline font-bold text-primary">@{selectedArchive.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-muted-foreground uppercase font-black">Creation Date:</span>
                        <span className="text-[9px] font-headline text-white/60">{new Date(selectedArchive.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Info size={10} /> Problem Description (First Transmit)</Label>
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                        <p className="text-[11px] font-headline text-white leading-relaxed italic">
                          "{archiveMessages.find(m => !m.isAdmin && m.senderId !== 'system')?.text || "No descriptive transmit found."}"
                        </p>
                      </div>
                    </div>

                    {selectedArchive.rating && (
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl flex justify-between items-center">
                        <span className="text-[8px] text-green-500 uppercase font-black">User Feedback:</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} className={cn(i < selectedArchive.rating ? "text-primary fill-primary" : "text-white/10")} />)}
                        </div>
                      </div>
                    )}

                    <Button onClick={() => setShowFullArchive(true)} className="w-full h-14 bg-white/5 border border-white/10 rounded-xl font-headline text-[9px] uppercase tracking-widest hover:bg-primary hover:text-background transition-all">
                      Open Full Protocol Log <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setShowFullArchive(false)} className="text-[8px] font-headline uppercase text-primary hover:underline flex items-center gap-1">
                        <ChevronDown className="rotate-90 h-3 w-3" /> Back to Intel
                      </button>
                      <Badge variant="outline" className="text-[6px] uppercase border-white/10">Full Log</Badge>
                    </div>
                    <div className="space-y-4">
                      {archiveMessages.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.isAdmin ? "self-end items-end" : "self-start items-start")}>
                          <div className={cn("p-3 rounded-2xl text-[9px] font-headline", msg.isAdmin ? "bg-primary/20 text-white border border-primary/20" : "bg-muted text-foreground border border-white/5")}>
                            {msg.text}
                          </div>
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
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem]">
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
