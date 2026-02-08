
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  ChevronLeft, 
  Camera, 
  Loader2,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Delete,
  Fingerprint,
  Plus,
  UserCircle,
  Mail,
  RefreshCw,
  Check,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { 
  updatePassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const AVATARS = [
  "https://picsum.photos/seed/avatar1/200",
  "https://picsum.photos/seed/avatar2/200",
  "https://picsum.photos/seed/avatar3/200",
  "https://picsum.photos/seed/avatar4/200",
  "https://picsum.photos/seed/avatar5/200",
];

const COUNTRIES = [
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', nameEn: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪', prefix: '+971' },
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', prefix: '+965' },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', prefix: '+974' },
  { code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', prefix: '+962' },
  { code: 'IQ', nameEn: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', prefix: '+964' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otpInputs = useRef<HTMLInputElement[]>([]);
  
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  // Profile States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // Password Change States
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // PIN States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);
  const [pinActionType, setPinActionType] = useState<'set' | 'authorize_password'>('set');

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

  const isFirstNameLocked = useMemo(() => !!profile?.firstName, [profile?.firstName]);
  const isLastNameLocked = useMemo(() => !!profile?.lastName, [profile?.lastName]);

  // Password criteria logic
  const passwordCriteria = useMemo(() => ({
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword)
  }), [newPassword]);

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setGender(profile.gender || 'male');
      if (profile.birthDate) setBirthDate(new Date(profile.birthDate));
      setUsername(profile.username || '');
      setEmail(profile.email || '');
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
      setIsEmailVerified(profile.emailVerified || false);
      setIsKycVerified(profile.verified || false);
    }
  }, [profile]);

  const handleKeyClick = (num: string) => {
    if (pinEntry.length < 4) setPinEntry(prev => prev + num);
  };

  const handleDelete = () => {
    setPinEntry(prev => prev.slice(0, -1));
  };

  const handlePinAction = async () => {
    if (pinEntry.length < 4 || !user || !db) return;

    if (pinActionType === 'set') {
      setSubmittingPin(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), { pin: pinEntry });
        setIsPinModalOpen(false);
        toast({ title: "PIN Saved" });
      } catch (e) {
        toast({ variant: "destructive", title: "Error Saving PIN" });
      } finally {
        setSubmittingPin(false);
      }
    } else if (pinActionType === 'authorize_password') {
      if (pinEntry !== profile?.pin) {
        toast({ variant: "destructive", title: language === 'ar' ? "رمز PIN غير صحيح" : "Incorrect PIN" });
        setPinEntry('');
        return;
      }
      setIsPinModalOpen(false);
      executePasswordUpdate();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);
    try {
      const updates: any = {
        gender,
        birthDate: birthDate?.toISOString(),
        avatarUrl: selectedAvatar,
      };
      
      if (!isFirstNameLocked) updates.firstName = firstName;
      if (!isLastNameLocked) updates.lastName = lastName;

      await updateDoc(doc(db, 'users', user.uid), updates);
      toast({ title: language === 'ar' ? "تم تحديث البيانات" : "Profile updated" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordChange = () => {
    if (!profile?.pin) {
      toast({ variant: "destructive", title: language === 'ar' ? "يرجى تعيين PIN أولاً" : "Set Vault PIN first" });
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handleRequestPasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch" });
      return;
    }
    if (!isPasswordStrong) {
      toast({ variant: "destructive", title: "Password Too Weak" });
      return;
    }
    setPinEntry('');
    setPinActionType('authorize_password');
    setIsPinModalOpen(true);
  };

  const executePasswordUpdate = async () => {
    if (!user || !auth) return;
    setUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: language === 'ar' ? "تم تغيير كلمة المرور" : "Password Updated" });
      setIsPasswordDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Authorization Failed", description: "Old password may be incorrect." });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!user || sendingEmail) return;
    setSendingEmail(true);
    try {
      await sendEmailVerification(user);
      toast({ 
        title: language === 'ar' ? "تم إرسال الرابط" : "Verification Sent", 
        description: language === 'ar' ? "تحقق من صندوق الوارد الخاص بك" : "Check your inbox for the link" 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSendingEmail(false);
    }
  };

  const refreshEmailStatus = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        await updateDoc(doc(db, 'users', user.uid), { emailVerified: true });
        setIsEmailVerified(true);
        toast({ title: language === 'ar' ? "تم توثيق البريد بنجاح" : "Email Verified Successfully" });
      } else {
        toast({ variant: "destructive", title: language === 'ar' ? "لم يتم التوثيق بعد" : "Not Verified Yet" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !auth || !db) return;
    setVerifyingPhone(true);
    try {
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
      
      const q = query(collection(db, 'users'), where('phone', '==', fullPhone), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].id !== user?.uid) {
        toast({ variant: "destructive", title: language === 'ar' ? "الرقم مستخدم بالفعل" : "Phone number already in use" });
        return;
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(result);
      setIsOtpOpen(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !user || !db) return;
    setVerifyingPhone(true);
    const code = otpCode.join('');
    try {
      await confirmationResult.confirm(code);
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
      await updateDoc(doc(db, 'users', user.uid), { 
        phoneVerified: true,
        phone: fullPhone
      });
      setIsPhoneVerified(true);
      setIsOtpOpen(false);
      toast({ title: language === 'ar' ? "تم توثيق الهاتف" : "Phone Verified" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid Code" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImage) {
        setSelectedAvatar(croppedImage);
        setIsCropDialogOpen(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32" onClick={() => setIsCountryOpen(false)}>
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{language === 'ar' ? 'تعديل الحساب' : 'Edit Profile'}</h1>
      </header>

      <div id="recaptcha-container"></div>

      <div className="grid grid-cols-3 gap-2">
        <div className={cn("p-3 rounded-2xl border text-center space-y-1 transition-all", isKycVerified ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
          <ShieldCheck size={16} className="mx-auto" />
          <p className="text-[7px] font-headline font-bold uppercase">{language === 'ar' ? 'الهوية' : 'Identity'}</p>
        </div>
        <div className={cn("p-3 rounded-2xl border text-center space-y-1 transition-all", isEmailVerified ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-white/30")}>
          <Mail size={16} className="mx-auto" />
          <p className="text-[7px] font-headline font-bold uppercase">{language === 'ar' ? 'البريد' : 'Email'}</p>
        </div>
        <div className={cn("p-3 rounded-2xl border text-center space-y-1 transition-all", isPhoneVerified ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-white/5 border-white/10 text-white/30")}>
          <Phone size={16} className="mx-auto" />
          <p className="text-[7px] font-headline font-bold uppercase">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative group">
          <div className={cn("w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 bg-white/5 flex items-center justify-center", profile?.verified ? "border-green-500 shadow-xl" : "border-red-500 shadow-xl")}>
            {selectedAvatar ? <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={48} className="text-white/20" />}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"><Camera size={18} /></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => { setImageToCrop(reader.result as string); setIsCropDialogOpen(true); };
              reader.readAsDataURL(file);
            }
          }} />
        </div>
        <button onClick={() => setIsAvatarOpen(!isAvatarOpen)} className="text-[8px] font-headline font-bold uppercase text-primary/60 hover:text-primary">Change Avatar</button>
        {isAvatarOpen && (
          <div className="flex flex-wrap justify-center gap-3 p-4 glass-card rounded-2xl">
            {AVATARS.map((url, i) => (
              <button key={i} onClick={() => { setSelectedAvatar(url); setIsAvatarOpen(false); }} className={cn("w-12 h-12 rounded-full overflow-hidden border-2", selectedAvatar === url ? "border-primary" : "border-transparent opacity-50")}><img src={url} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl space-y-6 border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] uppercase text-white/40">First Name</Label>
              {isFirstNameLocked && <ShieldCheck size={10} className="text-primary/40" />}
            </div>
            <Input 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              disabled={isFirstNameLocked}
              className={cn("h-12 bg-white/5 border-white/10", isFirstNameLocked ? "opacity-60 cursor-not-allowed" : "focus:border-primary/50")} 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] uppercase text-white/40">Last Name</Label>
              {isLastNameLocked && <ShieldCheck size={10} className="text-primary/40" />}
            </div>
            <Input 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              disabled={isLastNameLocked}
              className={cn("h-12 bg-white/5 border-white/10", isLastNameLocked ? "opacity-60 cursor-not-allowed" : "focus:border-primary/50")} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] uppercase text-white/40">Username</Label>
            <ShieldCheck size={10} className="text-primary/40" />
          </div>
          <div className="relative">
            <UserCircle className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'right-3' : 'left-3')} size={18} />
            <Input value={username} disabled className={cn("h-12 bg-white/5 border-white/10 opacity-60 cursor-not-allowed", language === 'ar' ? 'pr-10' : 'pl-10')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-white/40">Gender</Label>
          <RadioGroup value={gender} onValueChange={(v: any) => setGender(v)} className="flex gap-4">
            <div className={cn("flex-1 h-12 rounded-xl border flex items-center justify-center font-headline text-[10px] uppercase cursor-pointer", gender === 'male' ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-white/40")}>
              <RadioGroupItem value="male" id="male-edit" className="sr-only" />
              <Label htmlFor="male-edit" className="cursor-pointer">Male</Label>
            </div>
            <div className={cn("flex-1 h-12 rounded-xl border flex items-center justify-center font-headline text-[10px] uppercase cursor-pointer", gender === 'female' ? "bg-pink-500/10 border-pink-500 text-pink-500" : "bg-white/5 border-white/10 text-white/40")}>
              <RadioGroupItem value="female" id="female-edit" className="sr-only" />
              <Label htmlFor="female-edit" className="cursor-pointer">Female</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-white/40">Birth Date</Label>
          <Input 
            type="date"
            value={birthDate ? birthDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setBirthDate(e.target.value ? new Date(e.target.value) : undefined)}
            className="h-12 bg-white/5 border-white/10 text-white focus:border-primary/50"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-background font-headline font-black tracking-widest rounded-xl gold-glow">
          {loading ? <Loader2 className="animate-spin" /> : "Sync Base Info"}
        </Button>
      </form>

      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><Lock size={14} /> Security Protocols</h2>
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <p className="text-[10px] font-headline font-bold uppercase">Credential Management</p>
            <p className="text-[8px] text-muted-foreground uppercase leading-relaxed">Initiate a secure password change sequence within your encrypted terminal.</p>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleOpenPasswordChange}
              className="w-full h-12 border-primary/20 text-primary text-[10px] font-headline uppercase tracking-widest hover:bg-primary/10"
            >
              Update Terminal Password
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><Mail size={14} /> Email Authority</h2>
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-white/20" />
            <Input value={email} disabled className="h-12 bg-white/5 border-white/10 pl-10 opacity-60" />
          </div>
          {!isEmailVerified ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={handleVerifyEmail} disabled={sendingEmail} className="h-12 bg-primary/10 border border-primary/20 text-primary text-[9px] font-headline uppercase tracking-widest">
                {sendingEmail ? <Loader2 className="animate-spin" size={14} /> : "Send Link"}
              </Button>
              <Button type="button" onClick={refreshEmailStatus} className="h-12 bg-white/5 border border-white/10 text-white text-[9px] font-headline uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={12} /> Sync Status
              </Button>
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center gap-2 text-primary font-headline font-bold text-[10px] uppercase px-3 bg-primary/10 rounded-xl border border-primary/20 w-full">
              <CheckCircle2 size={14} /> Email Verified
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-secondary flex items-center gap-2"><Phone size={14} /> Phone Authority</h2>
        <div className="space-y-4">
          <div className="flex gap-2" dir="ltr">
            <button type="button" onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }} className="h-12 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2 min-w-[90px]" disabled={isPhoneVerified}>
              <span className="text-xs">{selectedCountry.flag}</span>
              {!isPhoneVerified && <ChevronDown size={12} className={cn(isCountryOpen && "rotate-180")} />}
            </button>
            <div className="relative flex-1">
              <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-white/20" size={18} />
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                disabled={isPhoneVerified} 
                className={cn("h-12 bg-white/5 border-white/10 pl-12", isPhoneVerified && "opacity-60 cursor-not-allowed")} 
                placeholder="123456789" 
              />
            </div>
          </div>
          {isCountryOpen && (
            <div className="absolute left-8 right-8 z-[110] bg-[#1a1a1a] border border-white/10 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
              {COUNTRIES.map(c => (
                <button key={c.code} type="button" onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); }} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-xs text-white/80">{language === 'ar' ? c.nameAr : c.nameEn}</span>
                  <span className="text-[10px] text-white/30 ml-auto">{c.prefix}</span>
                </button>
              ))}
            </div>
          )}
          {!isPhoneVerified ? (
            <Button 
              type="button" 
              onClick={handleSendOtp} 
              disabled={verifyingPhone || !phone} 
              className="w-full h-12 bg-secondary/10 border border-secondary/20 text-secondary text-[9px] font-headline uppercase tracking-widest cyan-glow"
            >
              {verifyingPhone ? <Loader2 className="animate-spin" size={14} /> : "Initiate Verification"}
            </Button>
          ) : (
            <div className="h-12 flex items-center justify-center gap-2 text-secondary font-headline font-bold text-[10px] uppercase px-3 bg-secondary/10 rounded-xl border border-secondary/20 w-full">
              <CheckCircle2 size={14} /> Phone Verified
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl gold-glow">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><KeyRound size={14} /> Security PIN</h2>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
          <div><p className="text-[10px] font-headline font-bold uppercase">{profile?.pin ? "Vault Locked" : "Set PIN"}</p></div>
          {!profile?.pin ? (
            <button onClick={() => { setPinEntry(''); setPinActionType('set'); setIsPinModalOpen(true); }} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary"><Plus size={20} /></button>
          ) : (
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><ShieldCheck size={20} /></div>
          )}
        </div>
      </div>

      {/* Change Password Dialog with criteria */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2"><Lock size={14} className="text-primary" /> Update Terminal</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[8px] uppercase tracking-widest text-white/40">Current Password</Label>
                <div className="relative">
                  <Input type={showOldPass ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="h-12 bg-white/5 border-white/10" />
                  <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors">{showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] uppercase tracking-widest text-white/40">New Password</Label>
                <div className="relative">
                  <Input type={showNewPass ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-white/5 border-white/10" />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors">{showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {/* Password Criteria indicators */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(passwordCriteria).map(([key, valid]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      {valid ? <ShieldCheck className="text-green-500" size={10} /> : <AlertCircle className="text-white/20" size={10} />}
                      <span className={cn("text-[8px] uppercase font-bold", valid ? "text-green-500" : "text-white/30")}>
                        {key === 'length' ? '8+ Chars' : key === 'upper' ? 'Uppercase' : key === 'number' ? 'Number' : 'Special Symbol'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] uppercase tracking-widest text-white/40">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-white/5 border-white/10" />
              </div>
            </div>
            <Button 
              onClick={handleRequestPasswordUpdate} 
              disabled={!oldPassword || !newPassword || newPassword !== confirmPassword || !isPasswordStrong || updatingPassword}
              className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow"
            >
              {updatingPassword ? <Loader2 className="animate-spin" /> : "PROCEED TO AUTH"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> {pinActionType === 'set' ? 'Set Vault PIN' : 'Authorize Protocol'}</DialogTitle></DialogHeader>
          <div className="mt-8 space-y-8" dir="ltr">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn("w-4 h-4 rounded-full border-2 transition-all duration-300", pinEntry.length > i ? "bg-primary border-primary scale-110 shadow-[0_0_10px_rgba(250,218,122,0.5)]" : "border-white/20")} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleKeyClick(num.toString())} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-headline font-bold hover:bg-primary/20 hover:border-primary/40 active:scale-95 transition-all">{num}</button>
              ))}
              <button onClick={handleDelete} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"><Delete size={24} /></button>
              <button onClick={() => handleKeyClick("0")} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-headline font-bold hover:bg-primary/20 hover:border-primary/40 active:scale-95 transition-all">0</button>
              <button 
                onClick={handlePinAction} 
                disabled={submittingPin || pinEntry.length < 4} 
                className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-background active:scale-95 transition-all disabled:opacity-50"
              >
                {submittingPin ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-md glass-card border-white/10 p-0 rounded-[2rem] z-[2001] overflow-hidden">
          <DialogHeader className="p-6 border-b border-white/5"><DialogTitle className="text-xs font-headline font-bold uppercase">Crop Avatar</DialogTitle></DialogHeader>
          <div className="relative w-full aspect-square">
            {imageToCrop && <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} />}
          </div>
          <div className="p-6 space-y-6">
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(v) => setZoom(v[0])} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsCropDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleApplyCrop} className="flex-1 bg-primary text-background font-bold uppercase text-[10px]">Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-secondary">Verification Code</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="flex gap-2 justify-center" dir="ltr">
              {otpCode.map((digit, i) => (
                <input 
                  key={i} 
                  ref={el => { if(el) otpInputs.current[i] = el; }} 
                  type="text" 
                  maxLength={1} 
                  value={digit} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    const newOtp = [...otpCode];
                    newOtp[i] = val;
                    setOtpCode(newOtp);
                    if (val && i < 5) otpInputs.current[i+1]?.focus();
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpCode[i] && i > 0) otpInputs.current[i-1]?.focus();
                  }}
                  className="w-10 h-14 bg-white/5 border border-white/10 text-center text-xl font-bold text-secondary outline-none rounded-lg focus:border-secondary shadow-[0_0_10px_rgba(0,255,238,0.1)]" 
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleVerifyOtp} disabled={verifyingPhone || otpCode.join('').length < 6} className="w-full h-14 bg-secondary text-background font-headline font-bold text-[10px] uppercase tracking-widest cyan-glow">
                {verifyingPhone ? <Loader2 className="animate-spin" /> : "Validate"}
              </Button>
              <Button variant="ghost" onClick={handleSendOtp} className="text-[8px] font-headline uppercase text-muted-foreground">Resend Code</Button>
              <Button variant="ghost" onClick={() => setIsOtpOpen(false)} className="text-[8px] font-headline uppercase text-red-500">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
