
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
  UserCircle
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, limit } from 'firebase/firestore';
import { updatePassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';

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
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
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

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setGender(profile.gender || 'male');
      if (profile.birthDate) setBirthDate(new Date(profile.birthDate));
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
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);
    try {
      const updates: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate: birthDate?.toISOString(),
        username: username.trim().toLowerCase(),
        avatarUrl: selectedAvatar,
        phoneVerified: isPhoneVerified
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim());
      }
      toast({ title: language === 'ar' ? "تم تحديث البيانات" : "Profile updated" });
      router.push('/dashboard');
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
      await updateDoc(doc(db, 'users', user.uid), { 
        phoneVerified: true 
      });
      setIsPhoneVerified(true);
      setIsOtpOpen(false);
      toast({ title: language === 'ar' ? "تم التوثيق" : "Verified" });
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

  const VirtualPad = ({ value, onChange, onComplete }: any) => {
    const handleAdd = (num: string) => { if (value.length < 4) onChange(value + num); };
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
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{language === 'ar' ? 'تعديل الحساب' : 'Edit Profile'}</h1>
      </header>

      <div id="recaptcha-container"></div>

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
            <Label className="text-[10px] uppercase text-white/40">First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-white/40">Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 bg-white/5 border-white/10" />
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

        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-white/40">Username</Label>
          <div className="relative">
            <UserCircle className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'right-3' : 'left-3')} size={18} />
            <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className={cn("h-12 bg-white/5 border-white/10", language === 'ar' ? 'pr-10' : 'pl-10')} />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] uppercase text-white/40">Phone Number</Label>
          <div className="flex gap-2" dir="ltr">
            <button type="button" onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }} className="h-12 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2">
              <span className="text-xs">{selectedCountry.flag}</span>
              <ChevronDown size={14} className={cn(isCountryOpen && "rotate-180")} />
            </button>
            <div className="relative flex-1">
              <Phone className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-white/20" />
              <Input type="tel" dir="ltr" value={phone} onChange={(e) => { setPhone(e.target.value); setIsPhoneVerified(false); }} className="h-12 bg-white/5 border-white/10 pl-10" />
            </div>
          </div>
          {isCountryOpen && (
            <div className="absolute z-[110] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 w-48">
              {COUNTRIES.map(c => (
                <button key={c.code} type="button" onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0"><span className="text-xs">{language === 'ar' ? c.nameAr : c.nameEn}</span><span className="text-xs text-white/40">{c.prefix}</span></button>
              ))}
            </div>
          )}
          {!isPhoneVerified ? (
            <Button type="button" onClick={handleSendOtp} disabled={verifyingPhone || !phone} className="w-full h-12 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-headline uppercase tracking-widest">
              {verifyingPhone ? <Loader2 className="animate-spin" size={14} /> : "Verify Phone"}
            </Button>
          ) : (
            <div className="h-12 flex items-center justify-center gap-2 text-green-500 font-headline font-bold text-[10px] uppercase px-3 bg-green-500/10 rounded-xl border border-green-500/20 w-full">
              <CheckCircle2 size={14} /> Verified
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-background font-headline font-black tracking-widest rounded-xl gold-glow">
          {loading ? <Loader2 className="animate-spin" /> : "Save Profile"}
        </Button>
      </form>

      <div className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl gold-glow">
        <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2"><KeyRound size={14} /> Security PIN</h2>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
          <div><p className="text-[10px] font-headline font-bold uppercase">{profile?.pin ? "Vault Locked" : "Set PIN"}</p></div>
          {!profile?.pin ? (
            <button onClick={() => setIsPinModalOpen(true)} className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary"><Plus size={20} /></button>
          ) : (
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><ShieldCheck size={20} /></div>
          )}
        </div>
      </div>

      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> Authorize PIN</DialogTitle></DialogHeader>
          <div className="mt-8">
            <VirtualPad value={pinEntry} onChange={setPinEntry} onComplete={async () => {
              if (pinEntry.length === 4 && user && db) {
                setSubmittingPin(true);
                await updateDoc(doc(db, 'users', user.uid), { pin: pinEntry });
                setSubmittingPin(false);
                setIsPinModalOpen(false);
                toast({ title: "PIN Saved" });
              }
            }} />
            {submittingPin && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
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
                <input key={i} ref={el => { if(el) otpInputs.current[i] = el; }} type="text" maxLength={1} value={digit} onChange={(e) => {
                  const val = e.target.value;
                  const newOtp = [...otpCode];
                  newOtp[i] = val;
                  setOtpCode(newOtp);
                  if (val && i < 5) otpInputs.current[i+1]?.focus();
                }} className="w-10 h-14 bg-white/5 border border-white/10 text-center text-xl font-bold text-secondary outline-none rounded-lg" />
              ))}
            </div>
            <Button onClick={handleVerifyOtp} disabled={verifyingPhone || otpCode.join('').length < 6} className="w-full h-14 bg-secondary text-background font-headline font-bold text-[10px] uppercase tracking-widest cyan-glow">
              {verifyingPhone ? <Loader2 className="animate-spin" /> : "Validate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
