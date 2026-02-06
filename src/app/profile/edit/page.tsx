
"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Lock, 
  ChevronLeft, 
  Camera, 
  Check, 
  Loader2,
  Mail,
  ChevronDown,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Globe,
  UploadCloud,
  Clock,
  Crop as CropIcon,
  X,
  KeyRound,
  Delete,
  Fingerprint,
  Plus
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, updateDoc, addDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { updatePassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendTelegramPhoto } from '@/lib/telegram';
import { Textarea } from '@/components/ui/textarea';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { Slider } from '@/components/ui/slider';

const AVATARS = [
  "https://picsum.photos/seed/avatar1/200",
  "https://picsum.photos/seed/avatar2/200",
  "https://picsum.photos/seed/avatar3/200",
  "https://picsum.photos/seed/avatar4/200",
  "https://picsum.photos/seed/avatar5/200",
];

const COUNTRIES = [
  { code: 'GL', nameEn: 'Global / Worldwide', nameAr: 'عالمي / دولي', flag: '🌐', prefix: '' },
  { code: 'CR', nameEn: 'Crypto / Digital Assets', nameAr: 'عملات رقمية', flag: '🪙', prefix: '' },
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', nameEn: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪', prefix: '+971' },
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', prefix: '+965' },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', prefix: '+974' },
  { code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', prefix: '+962' },
  { code: 'IQ', nameEn: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', prefix: '+964' },
  { code: 'LY', nameEn: 'Libya', nameAr: 'ليبيا', flag: '🇱🇾', prefix: '+218' },
  { code: 'DZ', nameEn: 'Algeria', nameAr: 'الجزائر', flag: '🇩🇿', prefix: '+213' },
  { code: 'MA', nameEn: 'Morocco', nameAr: 'المغرب', flag: '🇲🇦', prefix: '+212' },
  { code: 'PS', nameEn: 'Palestine', nameAr: 'فلسطين', flag: '🇵🇸', prefix: '+970' },
  { code: 'LB', nameEn: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧', prefix: '+961' },
  { code: 'SY', nameEn: 'Syria', nameAr: 'سوريا', flag: '🇸🇾', prefix: '+963' },
  { code: 'OM', nameEn: 'Oman', nameAr: 'عمان', flag: '🇴🇲', prefix: '+968' },
  { code: 'YE', nameEn: 'Yemen', nameAr: 'اليمن', flag: '🇾🇪', prefix: '+967' },
  { code: 'BH', nameEn: 'Bahrain', nameAr: 'البحري', flag: '🇧🇭', prefix: '+973' },
  { code: 'TN', nameEn: 'Tunisia', nameAr: 'تونس', flag: '🇹🇳', prefix: '+216' },
  { code: 'SD', nameEn: 'Sudan', nameAr: 'السودان', flag: '🇸🇩', prefix: '+249' },
  { code: 'US', nameEn: 'USA', nameAr: 'أمريكا', flag: '🇺🇸', prefix: '+1' },
  { code: 'GB', nameEn: 'UK', nameAr: 'بريطانيا', flag: '🇬🇧', prefix: '+44' },
  { code: 'CA', nameEn: 'Canada', nameAr: 'كندا', flag: '🇨🇦', prefix: '+1' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);
  const otpInputs = useRef<HTMLInputElement[]>([]);
  
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  // Profile States
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // PIN States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);

  // Cropper States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // Phone Verification
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // KYC Verification States
  const [kycCountry, setKycCountry] = useState('');
  const [docType, setDocType] = useState('ID Card');
  const [docNumber, setDocNumber] = useState('');
  const [docImage, setDocImage] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const kycQuery = useMemo(() => {
    if (!user || !db) return null;
    return query(collection(db, 'verifications'), where('userId', '==', user.uid), limit(1));
  }, [db, user]);
  const { data: kycRequests = [] } = useCollection(kycQuery);
  const currentKyc = kycRequests[0] as any;

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      const fullPhone = profile.phone || '';
      const countryMatch = COUNTRIES.find(c => c.prefix && fullPhone.startsWith(c.prefix));
      if (countryMatch) {
        setSelectedCountry(countryMatch);
        setPhone(fullPhone.replace(countryMatch.prefix, ''));
      } else {
        setPhone(fullPhone);
      }
      setSelectedAvatar(profile.avatarUrl || AVATARS[0]);
      setIsPhoneVerified(profile.phoneVerified || false);
      setKycCountry(profile.country || '');
    }
  }, [profile]);

  const t = {
    header: language === 'ar' ? 'تعديل الحساب' : 'Edit Profile',
    usernameLabel: language === 'ar' ? 'اسم المستخدم' : 'Username',
    emailLabel: language === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    phoneLabel: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    passLabel: language === 'ar' ? 'كلمة مرور جديدة' : 'New Password',
    passPlaceholder: language === 'ar' ? 'اتركه فارغاً للحفاظ على الحالية' : 'Leave blank to keep current',
    saveBtn: language === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    success: language === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully',
    avatarHeader: language === 'ar' ? 'اختر صورتك الرمزية' : 'Choose Your Avatar',
    verifyBtn: language === 'ar' ? 'تحقق من الرقم' : 'Verify Phone',
    otpTitle: language === 'ar' ? 'رمز التحقق' : 'Verification Code',
    otpDesc: language === 'ar' ? 'أدخل الكود المرسل لهاتفك' : 'Enter the code sent to your phone',
    validateBtn: language === 'ar' ? 'تأكيد الرمز' : 'Validate Code',
    resendBtn: language === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code',
    cancelBtn: language === 'ar' ? 'إلغاء' : 'Cancel',
    verified: language === 'ar' ? 'موثق' : 'Verified',
    identityVerified: language === 'ar' ? 'هوية موثقة' : 'Identity Verified',
    awaitingVerification: language === 'ar' ? 'في انتظار التوثيق' : 'Awaiting Verification',
    phoneStatusVerified: language === 'ar' ? "رقم موثق" : "Phone Verified",
    phoneStatusUnverified: language === 'ar' ? "رقم غير موثق" : "Phone Unverified",
    kycTitle: language === 'ar' ? 'توثيق الهوية (KYC)' : 'Identity Verification (KYC)',
    residenceCountry: language === 'ar' ? 'بلد الإقامة' : 'Country of Residence',
    documentType: language === 'ar' ? 'نوع الوثيقة' : 'Document Type',
    documentNumber: language === 'ar' ? 'رقم الوثيقة' : 'Document Number',
    documentPhoto: language === 'ar' ? 'صورة الوثيقة' : 'Document Photo',
    submitKyc: language === 'ar' ? 'إرسال لطلب التوثيق' : 'SUBMIT FOR VERIFICATION',
    kycPending: language === 'ar' ? 'طلب التوثيق قيد المراجعة' : 'Verification Pending Review',
    kycRejected: language === 'ar' ? 'تم رفض التوثيق، يرجى المحاولة مرة أخرى' : 'Verification rejected, please retry',
    cropTitle: language === 'ar' ? 'ضبط الصورة' : 'Crop Image',
    applyCrop: language === 'ar' ? 'قص وحفظ' : 'Apply Crop',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    pinTitle: language === 'ar' ? 'رمز الأمان (PIN)' : 'Security PIN',
    pinSet: language === 'ar' ? 'تعيين الرمز السري' : 'Set 4-Digit PIN',
    pinLocked: language === 'ar' ? 'تم تأمين الحساب بـ PIN' : 'Vault Locked with PIN',
    pinDesc: language === 'ar' ? 'يستخدم الرمز لتأكيد السحب والتحويل' : 'Used to authorize transfers and withdrawals',
    pinLockedDesc: language === 'ar' ? 'غير قابل للتعديل لأمانك. راسل الإدارة للتصفير.' : 'PIN is locked for your security. Contact admin to reset.',
    authVault: language === 'ar' ? 'تأمين الخزنة' : 'Authorize Vault PIN',
    phoneInUse: language === 'ar' ? 'هذا الرقم مستخدم مسبقاً في حساب آخر' : 'This phone number is already in use by another account'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setSelectedAvatar(croppedImage);
          setIsCropDialogOpen(false);
          setImageToCrop(null);
        }
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Crop Error", description: "Failed to crop image." });
      }
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !auth || !db) return;
    setVerifyingPhone(true);
    try {
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
      
      // Check for phone duplicate (not current user)
      const q = query(collection(db, 'users'), where('phone', '==', fullPhone));
      const snap = await getDocs(q);
      const isUsedByOthers = snap.docs.some(doc => doc.id !== user?.uid);
      
      if (isUsedByOthers) {
        toast({ variant: "destructive", title: language === 'ar' ? "الرقم مستخدم" : "Phone in use", description: t.phoneInUse });
        setVerifyingPhone(false);
        return;
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(result);
      setIsOtpOpen(true);
      toast({ title: language === 'ar' ? "تم إرسال الكود" : "OTP Sent" });
    } catch (error: any) {
      toast({ variant: "destructive", title: language === 'ar' ? "فشل الإرسال" : "Failed to Send", description: error.message });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !user || !db) return;
    setVerifyingPhone(true);
    const code = otpCode.join('');
    const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
    try {
      await confirmationResult.confirm(code);
      // Immediately update phone and verification status in DB
      await updateDoc(doc(db, 'users', user.uid), { 
        phone: fullPhone,
        phoneVerified: true 
      });
      setIsPhoneVerified(true);
      setIsOtpOpen(false);
      toast({ title: language === 'ar' ? "تم التحقق والربط بنجاح" : "Phone Verified & Linked" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid Code", description: "The OTP entered is incorrect." });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
      
      // Check duplicate on save too
      const q = query(collection(db, 'users'), where('phone', '==', fullPhone));
      const snap = await getDocs(q);
      if (snap.docs.some(d => d.id !== user.uid)) {
        toast({ variant: "destructive", title: t.phoneInUse });
        setLoading(false);
        return;
      }

      const updates: any = {
        username: username.trim(),
        phone: fullPhone,
        country: selectedCountry.code,
        avatarUrl: selectedAvatar,
        phoneVerified: isPhoneVerified
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim());
      }
      toast({ title: t.success });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async () => {
    if (pinEntry.length !== 4 || !user || !db) return;
    setSubmittingPin(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { pin: pinEntry });
      toast({ title: language === 'ar' ? "تم تأمين PIN بنجاح" : "PIN Secured Successfully" });
      setIsPinModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "PIN Error" });
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleKycSubmit = async () => {
    if (!user || !db || !profile || !docImage || !docNumber || !kycCountry) return;
    setSubmittingKyc(true);
    try {
      const kycRef = await addDoc(collection(db, 'verifications'), {
        userId: user.uid,
        username: profile.username,
        country: kycCountry,
        documentType: docType,
        documentNumber: docNumber,
        documentUrl: docImage,
        status: 'pending',
        date: new Date().toISOString()
      });

      await sendTelegramPhoto(docImage, `
🛡️ <b>New KYC Request</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>Country:</b> ${kycCountry}
<b>Type:</b> ${docType}
<b>ID Number:</b> ${docNumber}
<b>Date:</b> ${new Date().toLocaleString()}
      `, {
        inline_keyboard: [
          [{ text: "✅ Approve", callback_data: `app_ver_${kycRef.id}` },
           { text: "❌ Reject", callback_data: `rej_ver_${kycRef.id}` }]
        ]
      });

      toast({ title: language === 'ar' ? "تم إرسال الطلب" : "Request Submitted" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const VirtualPad = ({ value, onChange, onComplete }: any) => {
    const handleAdd = (num: string) => {
      if (value.length < 4) {
        const newVal = value + num;
        onChange(newVal);
      }
    };
    const handleClear = () => onChange(value.slice(0, -1));

    return (
      <div className="space-y-8" dir="ltr">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("w-4 h-4 rounded-full border-2 transition-all duration-300", value.length > i ? "bg-primary border-primary scale-125" : "border-white/20")} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" onClick={() => handleAdd(n.toString())} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-headline font-bold hover:bg-primary hover:text-background transition-all">{n}</button>
          ))}
          <button type="button" onClick={handleClear} className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition-all"><Delete size={24} /></button>
          <button type="button" onClick={() => handleAdd('0')} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-headline font-bold hover:bg-primary hover:text-background transition-all">0</button>
          <button type="button" disabled={value.length !== 4} onClick={onComplete} className="h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary disabled:opacity-20 hover:bg-primary hover:text-background transition-all"><Check size={24} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32" onClick={() => setIsCountryOpen(false)}>
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      <div id="recaptcha-container"></div>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative group">
          <div className={cn(
            "w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 bg-white/5 flex items-center justify-center",
            profile?.verified 
              ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]" 
              : "border-red-500 shadow-xl"
          )}>
            {selectedAvatar ? <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={48} className="text-white/20" />}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-10"><Camera size={18} /></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-headline font-bold uppercase tracking-widest",
              profile?.verified ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {profile?.verified ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
              {profile?.verified ? t.identityVerified : t.awaitingVerification}
            </div>
            
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-headline font-bold uppercase tracking-widest",
              profile?.phoneVerified ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-white/5 text-white/40 border border-white/10"
            )}>
              <Smartphone size={10} className={cn(!profile?.phoneVerified && "opacity-50")} />
              {profile?.phoneVerified ? t.phoneStatusVerified : t.phoneStatusUnverified}
            </div>
          </div>
          
          <button onClick={() => setIsAvatarOpen(!isAvatarOpen)} className="text-[8px] font-headline font-bold tracking-widest uppercase text-primary/60 hover:text-primary transition-colors block mx-auto mt-2">{t.avatarHeader}</button>
        </div>

        {isAvatarOpen && (
          <div className="flex flex-wrap justify-center gap-3 p-4 glass-card rounded-2xl animate-in zoom-in-95 duration-300">
            {AVATARS.map((url, i) => (
              <button key={i} onClick={() => { setSelectedAvatar(url); setIsAvatarOpen(false); }} className={cn("w-12 h-12 rounded-full overflow-hidden border-2 transition-all", selectedAvatar === url ? "border-primary scale-110" : "border-transparent opacity-50 hover:opacity-100")}><img src={url} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.usernameLabel}</Label>
            <div className="relative group">
              <User className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20", language === 'ar' ? "right-3" : "left-3")} />
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.emailLabel}</Label>
            <div className="relative group">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20", language === 'ar' ? "right-3" : "left-3")} size={18} />
              <input value={profile?.email || ''} readOnly className={cn("w-full h-12 bg-white/5 border border-white/5 rounded-xl opacity-60 font-body outline-none", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.phoneLabel}</Label>
            <div className="flex gap-2 relative z-50" dir="ltr">
              <div className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }} className="h-12 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2 text-white/70 hover:bg-white/10 transition-all min-w-[100px]">
                  <span>{selectedCountry.flag}</span><span className="text-xs">{selectedCountry.code}</span><ChevronDown size={14} className={cn(isCountryOpen && "rotate-180 transition-transform")} />
                </button>
                {isCountryOpen && (
                  <div className="absolute top-14 left-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 z-[110]">
                    {COUNTRIES.map(c => (
                      <button key={c.code} type="button" onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0"><span className="text-xs">{language === 'ar' ? c.nameAr : c.nameEn}</span><span className="text-xs text-white/40">{c.prefix}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <Phone className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-white/20" />
                <Input type="tel" dir="ltr" value={phone} onChange={(e) => { setPhone(e.target.value); setIsPhoneVerified(false); }} className="h-12 bg-white/5 border-white/10 rounded-xl font-body pl-10 pr-4 text-left" placeholder="123456789" />
              </div>
            </div>
            
            {!profile?.phoneVerified ? (
              <Button type="button" onClick={handleSendOtp} disabled={verifyingPhone || !phone} className="w-full h-12 bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary hover:text-background text-[10px] font-headline font-bold uppercase tracking-widest">
                {verifyingPhone ? <Loader2 className="animate-spin" size={14} /> : t.verifyBtn}
              </Button>
            ) : (
              <div className="h-12 flex items-center justify-center gap-2 text-green-500 font-headline font-bold text-[10px] uppercase px-3 bg-green-500/10 rounded-xl border border-green-500/20 w-full">
                <CheckCircle2 size={14} /> {t.verified}: {profile?.phone}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.passLabel}</Label>
            <div className="relative group">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors", language === 'ar' ? "right-3" : "left-3")} />
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} placeholder={t.passPlaceholder} />
            </div>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-14 font-headline text-md rounded-xl bg-primary text-background font-black tracking-widest gold-glow">{loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : t.saveBtn}</Button>
      </form>

      {/* Security PIN Section */}
      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl gold-glow">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><KeyRound size={14} /> {t.pinTitle}</h2>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
          <div>
            <p className="text-[10px] font-headline font-bold uppercase">{profile?.pin ? t.pinLocked : t.pinSet}</p>
            <p className="text-[8px] text-muted-foreground uppercase mt-1">{profile?.pin ? t.pinLockedDesc : t.pinDesc}</p>
          </div>
          {!profile?.pin ? (
            <button onClick={() => setIsPinModalOpen(true)} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-background transition-all"><Plus size={20} /></button>
          ) : (
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><ShieldCheck size={20} /></div>
          )}
        </div>
      </div>

      {/* PIN Setup Modal */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> {t.authVault}</DialogTitle></DialogHeader>
          <div className="mt-8">
            <VirtualPad value={pinEntry} onChange={setPinEntry} onComplete={handleSavePin} />
            {submittingPin && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Verification Section */}
      {!profile?.verified && (
        <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl gold-glow">
          <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><FileText size={14} /> {t.kycTitle}</h2>
          
          {currentKyc?.status === 'pending' ? (
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center gap-3 text-center">
              <Clock className="text-blue-500 animate-pulse" size={32} />
              <p className="text-[10px] font-headline font-bold uppercase tracking-widest">{t.kycPending}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {currentKyc?.status === 'rejected' && <p className="text-[9px] text-red-500 font-bold uppercase">{t.kycRejected}</p>}
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.residenceCountry}</Label>
                <Select value={kycCountry} onValueChange={setKycCountry}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] uppercase">
                    <Globe className="mr-2 h-4 w-4 text-primary" /><SelectValue placeholder="SELECT" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="text-[10px] uppercase">{language === 'ar' ? c.nameAr : c.nameEn}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.documentType}</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] uppercase">
                    <FileText className="mr-2 h-4 w-4 text-primary" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="ID Card" className="text-[10px] uppercase">National ID</SelectItem>
                    <SelectItem value="Passport" className="text-[10px] uppercase">Passport</SelectItem>
                    <SelectItem value="Driver License" className="text-[10px] uppercase">Driver License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.documentNumber}</Label>
                <Input placeholder="XXXX-XXXX-XXXX" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl uppercase font-headline text-[10px] tracking-widest" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.documentPhoto}</Label>
                <div 
                  onClick={() => kycInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative group"
                >
                  {docImage ? (
                    <img src={docImage} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <UploadCloud size={32} className="text-white/20 group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-headline font-bold uppercase text-white/20">Upload Document Scan</span>
                    </>
                  )}
                  <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setDocImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>

              <Button onClick={handleKycSubmit} disabled={submittingKyc || !docImage || !docNumber || !kycCountry} className="w-full h-14 font-headline text-md rounded-xl bg-secondary text-background font-black tracking-widest cyan-glow">
                {submittingKyc ? <Loader2 className="animate-spin" /> : t.submitKyc}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Image Cropper Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-md glass-card border-white/10 p-0 overflow-hidden rounded-[2rem] z-[2001]">
          <DialogHeader className="p-6 border-b border-white/5">
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase flex items-center gap-2">
              <CropIcon size={16} className="text-primary" /> {t.cropTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full aspect-square bg-black/50">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Zoom Level</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(vals) => setZoom(vals[0])}
                className="py-4"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCropDialogOpen(false)} 
                className="flex-1 h-12 rounded-xl text-[10px] font-headline uppercase"
              >
                {t.cancel}
              </Button>
              <Button 
                onClick={handleApplyCrop} 
                className="flex-1 h-12 bg-primary text-background rounded-xl text-[10px] font-headline uppercase font-bold gold-glow"
              >
                {t.applyCrop}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-secondary">{t.otpTitle}</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-center mx-auto text-secondary"><Smartphone size={32} /></div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{t.otpDesc}</p>
            <div className="flex gap-2 justify-center" dir="ltr">
              {otpCode.map((digit, i) => (
                <input key={i} ref={el => { if(el) otpInputs.current[i] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpInput(i, e.target.value)} className="w-10 h-14 bg-white/5 border border-white/10 text-center text-xl font-headline font-bold text-secondary focus:border-secondary transition-all outline-none rounded-lg" />
              ))}
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={handleVerifyOtp} disabled={verifyingPhone || otpCode.join('').length < 6} className="w-full h-14 bg-secondary text-background font-headline font-bold text-[10px] uppercase tracking-widest cyan-glow">
                {verifyingPhone ? <Loader2 className="animate-spin" size={14} /> : t.validateBtn}
              </Button>
              
              <button 
                type="button" 
                onClick={handleSendOtp} 
                disabled={verifyingPhone}
                className="text-[10px] font-headline font-bold uppercase text-primary/60 hover:text-primary transition-colors py-2"
              >
                {t.resendBtn}
              </button>
              
              <button 
                type="button" 
                onClick={() => setIsOtpOpen(false)}
                className="text-[10px] font-headline font-bold uppercase text-red-500/60 hover:text-red-500 transition-colors py-2"
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
