
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
  ImageIcon,
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
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' }, { code: 'AQ', name: 'Antarctica' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' }, { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' }, { code: 'BV', name: 'Bouvet Island' }, { code: 'BR', name: 'Brazil' },
  { code: 'IO', name: 'British Indian Ocean Territory' }, { code: 'BN', name: 'Brunei Darussalam' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' }, { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CV', name: 'Cape Verde' },
  { code: 'KY', name: 'Cayman Islands' }, { code: 'CF', name: 'Central African Republic' }, { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' }, { code: 'CX', name: 'Christmas Island' },
  { code: 'CC', name: 'Cocos (Keeling) Islands' }, { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' }, { code: 'CD', name: 'Congo, Democratic Republic' }, { code: 'CK', name: 'Cook Islands' },
  { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: 'Cote D\'Ivoire' }, { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' }, { code: 'ET', name: 'Ethiopia' }, { code: 'FK', name: 'Falkland Islands' },
  { code: 'FO', name: 'Faroe Islands' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'GF', name: 'French Guiana' }, { code: 'PF', name: 'French Polynesia' },
  { code: 'TF', name: 'French Southern Territories' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' }, { code: 'GR', name: 'Greece' }, { code: 'GL', name: 'Greenland' },
  { code: 'GD', name: 'Grenada' }, { code: 'GP', name: 'Guadeloupe' }, { code: 'GU', name: 'Guam' },
  { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' }, { code: 'HM', name: 'Heard Island and Mcdonald Islands' },
  { code: 'VA', name: 'Holy See (Vatican City State)' }, { code: 'HN', name: 'Honduras' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Lao People\'s Democratic Republic' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' }, { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macao' }, { code: 'MK', name: 'Macedonia' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MQ', name: 'Martinique' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' }, { code: 'YT', name: 'Mayotte' }, { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' }, { code: 'MS', name: 'Montserrat' }, { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NC', name: 'New Caledonia' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' }, { code: 'NU', name: 'Niue' },
  { code: 'NF', name: 'Norfolk Island' }, { code: 'MP', name: 'Northern Mariana Islands' }, { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palestine' }, { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PN', name: 'Pitcairn' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'PR', name: 'Puerto Rico' }, { code: 'QA', name: 'Qatar' }, { code: 'RE', name: 'Reunion' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russian Federation' }, { code: 'RW', name: 'Rwanda' },
  { code: 'SH', name: 'Saint Helena' }, { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' },
  { code: 'PM', name: 'Saint Pierre and Miquelon' }, { code: 'VC', name: 'Saint Vincent and The Grenadines' }, { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'Sao Tome and Principe' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' }, { code: 'CS', name: 'Serbia and Montenegro' }, { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SZ', name: 'Swaziland' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syrian Arab Republic' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' },
  { code: 'TK', name: 'Tokelau' }, { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' }, { code: 'TM', name: 'Turkmenistan' },
  { code: 'TC', name: 'Turks and Caicos Islands' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'VG', name: 'Virgin Islands, British' }, { code: 'VI', name: 'Virgin Islands, U.S.' }, { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'EH', name: 'Western Sahara' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }, { code: 'CR', name: 'Crypto Assets' }, { code: 'GL', name: 'Global / Worldwide' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  
  // Refs
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const gatewayFileInputRef = useRef<HTMLInputElement>(null);

  // Chat Admin States
  const [chatConfig, setChatConfig] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatReply, setChatReply] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isJoiningChat, setIsJoiningChat] = useState(false);
  const [isClosingChat, setIsClosingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
    iconUrl: '',
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

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGatewayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMethod((prev: any) => ({ ...prev, iconUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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

  const handleJoinChat = async (session: any) => {
    if (!db || !profile) return;
    setIsJoiningChat(true);
    try {
      await updateDoc(doc(db, 'chat_sessions', session.id), {
        status: 'active',
        joinedBy: profile.username,
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', session.id, 'messages'), {
        text: `Agent @${profile.username} joined the protocol. Reviewing your intel...`,
        senderId: 'system',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
      setActiveChat(session);
    } catch (e) { toast({ variant: "destructive", title: "Join Failed" }); } finally { setIsJoiningChat(false); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !activeChat || !db) return;
    try {
      await addDoc(collection(db, 'chat_sessions', activeChat.id, 'messages'), {
        text: chatReply.trim(),
        senderId: 'admin',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', activeChat.id), {
        lastMessage: chatReply.trim(),
        updatedAt: new Date().toISOString()
      });
      setChatReply('');
    } catch (e) { }
  };

  const handleCloseChat = async () => {
    if (!activeChat || !db) return;
    setIsClosingChat(true);
    try {
      await updateDoc(doc(db, 'chat_sessions', activeChat.id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', activeChat.id, 'messages'), {
        text: "Support Protocol Terminated. Please authorize service evaluation.",
        senderId: 'system',
        isAdmin: true,
        timestamp: new Date().toISOString()
      });
      setActiveChat(null);
      toast({ title: "SESSION TERMINATED" });
    } catch (e) { } finally { setIsClosingChat(false); }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!db || !confirm("Are you sure you want to purge this session from the ledger?")) return;
    try {
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
      toast({ title: "PROTOCOL PURGED" });
    } catch (e) { toast({ variant: "destructive", title: "Delete Failed" }); }
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

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="grid gap-4">
            {withdrawals.length === 0 ? <p className="text-center py-20 text-muted-foreground uppercase font-headline text-[10px]">No withdrawal requests in ledger.</p> : withdrawals.map((w: any) => (
              <div key={w.id} className="glass-card p-6 rounded-3xl border-white/5 flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-headline font-bold uppercase">@{w.username}</p>
                    <Badge variant={w.status === 'pending' ? 'outline' : w.status === 'approved' ? 'default' : 'destructive'} className="text-[7px] uppercase">{w.status}</Badge>
                  </div>
                  <p className="text-2xl font-headline font-black text-primary">${w.amountUsd}</p>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{new Date(w.date).toLocaleString()}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl flex-1 max-w-md">
                  <p className="text-[7px] text-muted-foreground uppercase font-black mb-2">Payout Protocol: {w.methodName}</p>
                  <p className="text-[10px] font-headline text-white font-bold">{w.localAmount} {w.currencyCode}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {Object.entries(w.details || {}).map(([k, v]: any) => (
                      <div key={k}><p className="text-[6px] text-muted-foreground uppercase">{k}:</p><p className="text-[8px] font-headline truncate">{v}</p></div>
                    ))}
                  </div>
                </div>
                {w.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction('withdraw', w.id, 'approve')} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"><Check size={20} /></button>
                    <button onClick={() => { const reason = prompt("Rejection reason?"); if(reason) handleAction('withdraw', w.id, 'reject', {reason}); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <div className="grid gap-4">
            {deposits.length === 0 ? <p className="text-center py-20 text-muted-foreground uppercase font-headline text-[10px]">No deposit signals detected.</p> : deposits.map((d: any) => (
              <div key={d.id} className="glass-card p-6 rounded-3xl border-white/5 flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-headline font-bold uppercase">@{d.username}</p>
                    <Badge variant={d.status === 'pending' ? 'outline' : d.status === 'approved' ? 'default' : 'destructive'} className="text-[7px] uppercase">{d.status}</Badge>
                  </div>
                  <p className="text-2xl font-headline font-black text-primary">${d.amount}</p>
                  <div className="space-y-1">
                    <p className="text-[7px] text-muted-foreground uppercase">Method: {d.method}</p>
                    <p className="text-[7px] text-muted-foreground uppercase">Sender: {d.senderName}</p>
                  </div>
                </div>
                <a href={d.proofUrl} target="_blank" rel="noopener noreferrer" className="flex-1 max-w-[200px] aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative group block cursor-pointer">
                  <img src={d.proofUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Info size={24} /></div>
                </a>
                {d.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction('deposit', d.id, 'approve')} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"><Check size={20} /></button>
                    <button onClick={() => { const reason = prompt("Rejection reason?"); if(reason) handleAction('deposit', d.id, 'reject', {reason}); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chats" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div>
              <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Live Support Matrix</h2>
              <p className="text-[8px] text-muted-foreground uppercase">Monitor and engage with encrypted user protocols</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[7px] text-muted-foreground uppercase font-black">Support Status</p>
                <Badge variant={chatConfig?.isActive ? "default" : "destructive"} className="text-[8px] uppercase">{chatConfig?.isActive ? "Operational" : "Offline"}</Badge>
              </div>
              <Switch checked={chatConfig?.isActive} onCheckedChange={async (val) => { await updateDoc(doc(db, 'system_settings', 'chat_config'), { isActive: val }); }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-2"><CircleDot size={14} className="text-primary animate-pulse" /> Live Channels</h3>
              <div className="grid gap-3">
                {chatSessions.length === 0 ? <p className="text-[8px] text-muted-foreground uppercase p-4 glass-card rounded-2xl text-center">No active signals detected.</p> : chatSessions.map((s: any) => (
                  <button key={s.id} onClick={() => setActiveChat(s)} className={cn("w-full glass-card p-4 rounded-2xl border-white/5 flex items-center justify-between hover:border-primary/40 transition-all text-left", activeChat?.id === s.id && "border-primary/60 bg-primary/5")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-headline text-xs">@{s.username[0]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-headline font-bold">@{s.username}</p>
                          <Badge variant="outline" className="text-[6px] h-4 border-primary/20 text-primary uppercase">{s.caseId}</Badge>
                        </div>
                        <p className="text-[8px] text-muted-foreground truncate max-w-[120px]">{s.lastMessage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[6px] text-muted-foreground uppercase">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {s.status === 'open' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-auto mt-1" />}
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-2 pt-4"><History size={14} /> Chat Archive History</h3>
              <div className="grid gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {archivedSessions.length === 0 ? <p className="text-[8px] text-muted-foreground uppercase p-4 glass-card rounded-2xl text-center">Archive is empty.</p> : archivedSessions.map((s: any) => (
                  <div key={s.id} className="glass-card p-4 rounded-2xl border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground font-headline text-[10px]">@{s.username[0]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-headline font-bold text-white/60">@{s.username}</p>
                          <span className="text-[7px] text-muted-foreground font-bold uppercase">ID: {s.caseId}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map(star => <Star key={star} size={8} className={cn(s.rating >= star ? "text-primary" : "text-white/10")} fill="currentColor" />)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSession(s.id)} className="p-2 text-red-500/40 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              {activeChat ? (
                <div className="glass-card rounded-[2.5rem] border-white/5 flex flex-col h-[650px] overflow-hidden relative">
                  <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><UserIcon size={24} /></div>
                      <div>
                        <h4 className="text-xs font-headline font-bold uppercase">Protocol: {activeChat.caseId}</h4>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">User: @{activeChat.username} • {activeChat.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeChat.status === 'open' ? (
                        <Button onClick={() => handleJoinChat(activeChat)} disabled={isJoiningChat} className="bg-primary text-background h-10 rounded-xl font-headline text-[8px] font-black uppercase gold-glow">Authorize Entry</Button>
                      ) : (
                        <Button onClick={handleCloseChat} disabled={isClosingChat} variant="destructive" className="h-10 rounded-xl font-headline text-[8px] font-black uppercase">Terminate Session</Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className={cn("p-4 rounded-2xl text-[11px] font-headline leading-relaxed", msg.isAdmin ? "bg-primary text-background rounded-tr-none gold-glow" : "bg-white/5 text-foreground rounded-tl-none border border-white/5")}>
                          {msg.text}
                        </div>
                        <span className="text-[7px] text-muted-foreground mt-2 uppercase">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    <div ref={chatScrollRef} />
                  </div>

                  {activeChat.status === 'active' && (
                    <form onSubmit={handleSendReply} className="p-5 bg-black/40 border-t border-white/5 flex gap-3">
                      <Input value={chatReply} onChange={(e) => setChatReply(e.target.value)} placeholder="TRANSMIT SECURE RESPONSE..." className="h-14 bg-white/5 border-white/10 rounded-2xl font-headline text-[10px] tracking-widest" />
                      <button type="submit" disabled={!chatReply.trim()} className="w-14 h-14 bg-primary text-background rounded-2xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-20"><SendHorizontal size={24} /></button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] border-white/5 h-[650px] flex flex-col items-center justify-center text-center space-y-6 opacity-40 grayscale">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground border border-white/10"><MessageSquare size={40} /></div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-headline font-bold uppercase tracking-widest">No Active Protocol</h3>
                    <p className="text-[10px] text-muted-foreground uppercase max-w-xs mx-auto">Select a communication channel from the ledger to engage with user entities.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <div className="grid gap-4">
            {tickets.length === 0 ? <p className="text-center py-20 text-muted-foreground uppercase font-headline text-[10px]">Registry clear of support tickets.</p> : tickets.map((t: any) => (
              <div key={t.id} className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground font-headline text-lg">@{t.username[0]}</div>
                    <div>
                      <p className="text-[10px] font-headline font-bold uppercase">@{t.username}</p>
                      <p className="text-[8px] text-muted-foreground uppercase font-black">{t.email}</p>
                    </div>
                  </div>
                  <Badge variant={t.status === 'open' ? 'outline' : 'default'} className="text-[7px] uppercase">{t.status}</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-primary font-black uppercase mb-1">{t.subject}</p>
                  <p className="text-[10px] text-white/80 leading-relaxed">{t.message}</p>
                </div>
                {t.imageUrl && (
                  <a href={t.imageUrl} target="_blank" rel="noopener noreferrer" className="max-w-[200px] rounded-xl overflow-hidden border border-white/5 block">
                    <img src={t.imageUrl} className="w-full h-auto" />
                  </a>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[7px] text-muted-foreground uppercase">{new Date(t.date).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {t.status === 'open' && <Button size="sm" onClick={async () => { await updateDoc(doc(db, 'support_tickets', t.id), {status: 'resolved'}); toast({title: "TICKET RESOLVED"}); }} className="h-8 text-[7px] uppercase bg-primary text-background font-black">Mark Resolved</Button>}
                    <button onClick={async () => { if(confirm("Purge record?")) await deleteDoc(doc(db, 'support_tickets', t.id)); }} className="p-2 text-red-500/40 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4">
            {orders.length === 0 ? <p className="text-center py-20 text-muted-foreground uppercase font-headline text-[10px]">Marketplace ledger is empty.</p> : orders.map((o: any) => (
              <div key={o.id} className="glass-card p-6 rounded-3xl border-white/5 flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-headline font-bold uppercase">@{o.username}</p>
                    <Badge variant={o.status === 'pending' ? 'outline' : o.status === 'approved' ? 'default' : 'destructive'} className="text-[7px] uppercase">{o.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShoppingBag size={16} /></div>
                    <div>
                      <p className="text-[10px] font-headline font-bold uppercase">{o.serviceName}</p>
                      <p className="text-[8px] text-muted-foreground uppercase font-black">{o.selectedVariant || "FIXED UNIT"}</p>
                    </div>
                  </div>
                  <p className="text-xl font-headline font-black text-primary">${o.price}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl flex-1 max-w-md">
                  <p className="text-[7px] text-muted-foreground uppercase font-black mb-2">User Intel Provisioned:</p>
                  <code className="text-xs text-primary font-bold block bg-black/40 p-3 rounded-lg border border-white/5">{o.userInput || "N/A"}</code>
                  <p className="text-[6px] text-muted-foreground uppercase mt-3">{new Date(o.date).toLocaleString()}</p>
                </div>
                {o.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { const code = prompt("Enter fulfillment code/key?"); if(code) handleAction('order', o.id, 'approve', {resultCode: code}); }} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"><Check size={20} /></button>
                    <button onClick={() => { const reason = prompt("Rejection reason?"); if(reason) handleAction('order', o.id, 'reject', {reason}); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-8">
          <div className="flex justify-between items-center bg-card/20 p-6 rounded-3xl border border-white/5">
            <div>
              <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary">Financial Gateways</h2>
              <p className="text-[8px] text-muted-foreground uppercase">Configure Deposit & Withdrawal Protocols</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setMethodType('deposit'); setIsAddingMethod(true); setNewMethod({ name: '', country: 'GL', currencyCode: 'USD', exchangeRate: 1, feeType: 'fixed', feeValue: 0, isActive: true, iconUrl: '', fields: [{ label: '', value: '', type: 'text' }] }); }} className="bg-secondary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest cyan-glow"><PlusCircle size={16} className="mr-2" /> Add Deposit</Button>
              <Button onClick={() => { setMethodType('withdraw'); setIsAddingMethod(true); setNewMethod({ name: '', country: 'GL', currencyCode: 'USD', exchangeRate: 1, feeType: 'fixed', feeValue: 0, isActive: true, iconUrl: '', fields: [{ label: '', type: 'text' }] }); }} className="bg-primary text-background h-12 rounded-xl font-headline text-[9px] font-black uppercase tracking-widest gold-glow"><PlusCircle size={16} className="mr-2" /> Add Withdraw</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-secondary flex items-center gap-2 px-2"><ArrowDownCircle size={14} /> Deposit Methods</h3>
              <div className="grid gap-3">
                {depositMethods.length === 0 ? <p className="text-[8px] text-muted-foreground uppercase p-4">No deposit channels established.</p> : depositMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-4 rounded-2xl border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 uppercase font-headline text-xs overflow-hidden">
                        {m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" /> : m.country}
                      </div>
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">{m.name}</p>
                        <p className="text-[7px] text-muted-foreground uppercase">Rate: 1 USD = {m.exchangeRate} {m.currencyCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={m.isActive} onCheckedChange={(val) => toggleStatus('deposit_methods', m.id, val)} />
                      <button onClick={async () => { if(confirm("Purge method?")) await deleteDoc(doc(db, 'deposit_methods', m.id)); }} className="p-2 text-red-500/40 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-2"><ArrowUpCircle size={14} /> Withdrawal Methods</h3>
              <div className="grid gap-3">
                {withdrawalMethods.length === 0 ? <p className="text-[8px] text-muted-foreground uppercase p-4">No withdrawal channels established.</p> : withdrawalMethods.map((m: any) => (
                  <div key={m.id} className="glass-card p-4 rounded-2xl border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 uppercase font-headline text-xs overflow-hidden">
                        {m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" /> : m.country}
                      </div>
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">{m.name}</p>
                        <p className="text-[7px] text-muted-foreground uppercase">Rate: 1 USD = {m.exchangeRate} {m.currencyCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={m.isActive} onCheckedChange={(val) => toggleStatus('withdrawal_methods', m.id, val)} />
                      <button onClick={async () => { if(confirm("Purge method?")) await deleteDoc(doc(db, 'withdrawal_methods', m.id)); }} className="p-2 text-red-500/40 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-all"><Trash2 size={14} /></button>
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

        <TabsContent value="kyc" className="space-y-4">
          <div className="grid gap-4">
            {verifications.length === 0 ? <p className="text-center py-20 text-muted-foreground uppercase font-headline text-[10px]">No pending verification requests.</p> : verifications.map((v: any) => (
              <div key={v.id} className="glass-card p-6 rounded-3xl border-white/5 flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-headline font-bold uppercase">@{v.username}</p>
                    <Badge variant={v.status === 'pending' ? 'outline' : v.status === 'approved' ? 'default' : 'destructive'} className="text-[7px] uppercase">{v.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-black">Full Name: {v.fullName}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-black">Document: {v.idType}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a href={v.frontUrl} target="_blank" rel="noopener noreferrer" className="w-[120px] aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5 block cursor-pointer">
                    <img src={v.frontUrl} className="w-full h-full object-cover" />
                  </a>
                  <a href={v.backUrl} target="_blank" rel="noopener noreferrer" className="w-[120px] aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5 block cursor-pointer">
                    <img src={v.backUrl} className="w-full h-full object-cover" />
                  </a>
                </div>
                {v.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction('kyc', v.id, 'approve')} className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"><Check size={20} /></button>
                    <button onClick={() => { const reason = prompt("Rejection reason?"); if(reason) handleAction('kyc', v.id, 'reject', {reason}); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Admin Dialogs */}
      <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000] max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              <Banknote size={14} className="text-primary" /> {methodType === 'deposit' ? 'New Deposit Gateway' : 'New Withdrawal Gateway'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Gateway Icon</Label>
              <div onClick={() => gatewayFileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all overflow-hidden">
                {newMethod.iconUrl ? <img src={newMethod.iconUrl} className="w-full h-full object-cover" /> : <><ImageIcon size={24} className="text-muted-foreground" /><span className="text-[8px] uppercase font-headline text-muted-foreground">Upload Gateway Logo</span></>}
                <input type="file" ref={gatewayFileInputRef} className="hidden" accept="image/*" onChange={handleGatewayImageUpload} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Gateway Name</Label>
                <Input className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs" value={newMethod.name} onChange={(e) => setNewMethod({...newMethod, name: e.target.value})} placeholder="e.g. Bank Transfer" />
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Country</Label>
                <Select value={newMethod.country} onValueChange={(val) => setNewMethod({...newMethod, country: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10 z-[1100]">
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Currency Code</Label>
                <Input className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs uppercase" value={newMethod.currencyCode} onChange={(e) => setNewMethod({...newMethod, currencyCode: e.target.value.toUpperCase()})} placeholder="USD / SAR / EGP" />
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Exchange Rate (vs USD)</Label>
                <Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs" value={newMethod.exchangeRate} onChange={(e) => setNewMethod({...newMethod, exchangeRate: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Fee Type</Label>
                <Select value={newMethod.feeType} onValueChange={(val) => setNewMethod({...newMethod, feeType: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10 z-[1100]">
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Fee Value</Label>
                <Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs" value={newMethod.feeValue} onChange={(e) => setNewMethod({...newMethod, feeValue: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center"><Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{methodType === 'deposit' ? 'Payment Details (Visible to user)' : 'Required Fields (From user)'}</Label><Button variant="ghost" onClick={() => setNewMethod({...newMethod, fields: [...newMethod.fields, {label: '', value: '', type: 'text'}]})} className="h-6 text-[7px] uppercase"><Plus size={10} /> Add Field</Button></div>
              {newMethod.fields.map((f: any, idx: number) => (
                <div key={idx} className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex gap-2">
                    <Input placeholder="Label (e.g. IBAN)" className="h-10 text-[10px] bg-background border-white/5" value={f.label} onChange={(e) => {
                      const updated = [...newMethod.fields];
                      updated[idx].label = e.target.value;
                      setNewMethod({...newMethod, fields: updated});
                    }} />
                    {methodType === 'deposit' ? (
                      <Input placeholder="Value (e.g. SA123...)" className="h-10 text-[10px] bg-background border-white/5" value={f.value} onChange={(e) => {
                        const updated = [...newMethod.fields];
                        updated[idx].value = e.target.value;
                        setNewMethod({...newMethod, fields: updated});
                      }} />
                    ) : (
                      <Select value={f.type} onValueChange={(val) => {
                        const updated = [...newMethod.fields];
                        updated[idx].type = val;
                        setNewMethod({...newMethod, fields: updated});
                      }}>
                        <SelectTrigger className="h-10 text-[10px] w-32"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-white/10 z-[1100]">
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <button onClick={() => setNewMethod({...newMethod, fields: newMethod.fields.filter((_: any, i: number) => i !== idx)})} className="text-red-500"><X size={14} /></button>
                  </div>
                  {methodType === 'withdraw' && f.type === 'select' && (
                    <Input placeholder="Options (comma separated)" className="h-8 text-[8px] bg-background border-white/5" value={f.options || ''} onChange={(e) => {
                      const updated = [...newMethod.fields];
                      updated[idx].options = e.target.value;
                      setNewMethod({...newMethod, fields: updated});
                    }} />
                  )}
                </div>
              ))}
            </div>

            <Button onClick={handleSaveMethod} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Sync Gateway</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="max-w-md glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000] max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              <ShoppingBag size={14} className="text-primary" /> {editingProductId ? "Update Asset" : "Deploy New Asset"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Asset Name</Label>
              <Input className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. PUBG MOBILE 660 UC" />
            </div>
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Category</Label>
              <Input 
                className="h-12 bg-background border-white/10 rounded-xl font-headline text-xs uppercase" 
                value={newProduct.category} 
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value.toUpperCase()})} 
                placeholder="ENTER CATEGORY (e.g. GAMES, CARDS)" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Pricing Strategy</Label>
              <Select value={newProduct.type} onValueChange={(val) => setNewProduct({...newProduct, type: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-background border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-white/10 z-[1100]">
                  <SelectItem value="fixed">FIXED PRICE</SelectItem>
                  <SelectItem value="variable">MULTIPLE PACKAGES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newProduct.type === 'fixed' ? (
              <div className="space-y-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Price ($)</Label>
                <Input type="number" className="h-12 bg-background border-white/10 rounded-xl font-headline text-lg text-primary text-center" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Variants & Packages</Label>
                {newProduct.variants.map((v: any, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <Input placeholder="Label (e.g. 100 UC)" className="h-10 text-[10px] bg-background border-white/5" value={v.label} onChange={(e) => {
                      const updated = [...newProduct.variants];
                      updated[idx].label = e.target.value;
                      setNewProduct({...newProduct, variants: updated});
                    }} />
                    <Input type="number" placeholder="Price" className="h-10 w-24 text-[10px] bg-background border-white/5" value={v.price} onChange={(e) => {
                      const updated = [...newProduct.variants];
                      updated[idx].price = parseFloat(e.target.value);
                      setNewProduct({...newProduct, variants: updated});
                    }} />
                    <button onClick={() => { const updated = newProduct.variants.filter((_: any, i: number) => i !== idx); setNewProduct({...newProduct, variants: updated}); }} className="text-red-500 p-1"><X size={14} /></button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => setNewProduct({...newProduct, variants: [...newProduct.variants, {label: '', price: 0}]})} className="w-full h-10 border-dashed border-white/10 text-[8px] uppercase"><Plus size={12} className="mr-1" /> Add Variant</Button>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-card/40 rounded-2xl border border-white/10">
              <div className="space-y-1"><Label className="text-[10px] font-headline font-bold uppercase">Requires Input</Label><p className="text-[7px] text-muted-foreground uppercase">Ask user for Player ID / Email</p></div>
              <Switch checked={newProduct.requiresInput} onCheckedChange={(val) => setNewProduct({...newProduct, requiresInput: val})} />
            </div>
            {newProduct.requiresInput && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Input Label</Label>
                <Input className="h-12 bg-background border-white/10 rounded-xl text-xs" value={newProduct.inputLabel} onChange={(e) => setNewProduct({...newProduct, inputLabel: e.target.value})} placeholder="e.g. Player ID" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Cover Image</Label>
              <div onClick={() => productFileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all overflow-hidden">
                {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="w-full h-full object-cover" /> : <><ImageIcon size={24} className="text-muted-foreground" /><span className="text-[8px] uppercase font-headline text-muted-foreground">Upload Visual Protocol</span></>}
                <input type="file" ref={productFileInputRef} className="hidden" accept="image/*" onChange={handleProductImageUpload} />
              </div>
            </div>
            <Button onClick={handleSaveProduct} className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow">Sync to Marketplace</Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
