"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Lock, 
  ChevronLeft, 
  Camera, 
  Check, 
  Loader2,
  Fingerprint,
  ShieldCheck,
  FileText,
  Globe,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, query, where, limit } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendTelegramNotification } from '@/lib/telegram';

const AVATARS = [
  "https://picsum.photos/seed/avatar1/200",
  "https://picsum.photos/seed/avatar2/200",
  "https://picsum.photos/seed/avatar3/200",
  "https://picsum.photos/seed/avatar4/200",
  "https://picsum.photos/seed/avatar5/200",
];

const COUNTRIES = [
  // Arab Countries
  { code: 'SA', name: 'Saudi Arabia', ar: 'السعودية' },
  { code: 'EG', name: 'Egypt', ar: 'مصر' },
  { code: 'AE', name: 'UAE', ar: 'الإمارات' },
  { code: 'KW', name: 'Kuwait', ar: 'الكويت' },
  { code: 'QA', name: 'Qatar', ar: 'قطر' },
  { code: 'JO', name: 'Jordan', ar: 'الأردن' },
  { code: 'IQ', name: 'Iraq', ar: 'العراق' },
  { code: 'LY', name: 'Libya', ar: 'ليبيا' },
  { code: 'DZ', name: 'Algeria', ar: 'الجزائر' },
  { code: 'MA', name: 'Morocco', ar: 'المغرب' },
  { code: 'PS', name: 'Palestine', ar: 'فلسطين' },
  { code: 'LB', name: 'Lebanon', ar: 'لبنان' },
  { code: 'SY', name: 'Syria', ar: 'سوريا' },
  { code: 'OM', name: 'Oman', ar: 'عمان' },
  { code: 'YE', name: 'Yemen', ar: 'اليمن' },
  { code: 'BH', name: 'Bahrain', ar: 'البحرين' },
  { code: 'TN', name: 'Tunisia', ar: 'تونس' },
  { code: 'SD', name: 'Sudan', ar: 'السودان' },
  // Global Countries
  { code: 'US', name: 'USA', ar: 'أمريكا' },
  { code: 'GB', name: 'UK', ar: 'بريطانيا' },
  { code: 'CA', name: 'Canada', ar: 'كندا' },
  { code: 'DE', name: 'Germany', ar: 'ألمانيا' },
  { code: 'FR', name: 'France', ar: 'فرنسا' },
  { code: 'IT', name: 'Italy', ar: 'إيطاليا' },
  { code: 'ES', name: 'Spain', ar: 'إسبانيا' },
  { code: 'TR', name: 'Turkey', ar: 'تركيا' },
  { code: 'CN', name: 'China', ar: 'الصين' },
  { code: 'JP', name: 'Japan', ar: 'اليابان' },
  { code: 'KR', name: 'South Korea', ar: 'كوريا الجنوبية' },
  { code: 'IN', name: 'India', ar: 'الهند' },
  { code: 'RU', name: 'Russia', ar: 'روسيا' },
  { code: 'BR', name: 'Brazil', ar: 'البرازيل' },
  { code: 'AU', name: 'Australia', ar: 'أستراليا' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const verifQuery = useMemo(() => user ? query(
    collection(db, 'verifications'),
    where('userId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: verifRequests } = useCollection(verifQuery);
  const pendingRequest = verifRequests?.find(r => r.status === 'pending');

  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  const [verifCountry, setVerifCountry] = useState('');
  const [verifDocType, setVerifDocType] = useState('id_card');
  const [verifDocNumber, setVerifDocNumber] = useState('');
  const [verifDocImage, setVerifDocImage] = useState<string | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
      setSelectedAvatar(profile.avatarUrl || AVATARS[0]);
      setBiometricsEnabled(profile.biometricsEnabled || false);
    }
  }, [profile]);

  const t = {
    header: language === 'ar' ? 'تعديل الحساب' : 'Edit Profile',
    emailLabel: language === 'ar' ? 'البريد الإلكتروني (لا يمكن تعديله)' : 'Email Address (Read-only)',
    phoneLabel: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    countryLabel: language === 'ar' ? 'بلد الإقامة' : 'Country of Residence',
    passLabel: language === 'ar' ? 'كلمة مرور جديدة' : 'New Password',
    passPlaceholder: language === 'ar' ? 'اتركه فارغاً إذا لا تريد التغيير' : 'Leave blank to keep current',
    biometricLabel: language === 'ar' ? 'تفعيل الدخول بالبصمة' : 'Enable Fingerprint Login',
    biometricDesc: language === 'ar' ? 'استخدم البصمة للوصول السريع لمحفظتك' : 'Use biometrics for fast vault access',
    saveBtn: language === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    success: language === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully',
    avatarHeader: language === 'ar' ? 'اختر صورتك الرمزية' : 'Choose Your Avatar',
    uploadLabel: language === 'ar' ? 'رفع صورة' : 'Upload Image',
    imageTooLarge: language === 'ar' ? 'حجم الصورة كبير جداً (الأقصى 1 ميجا)' : 'Image size too large (Max 1MB)',
    verifHeader: language === 'ar' ? 'توثيق الهوية (KYC)' : 'Identity Verification (KYC)',
    docTypeLabel: language === 'ar' ? 'نوع الوثيقة' : 'Document Type',
    docNumberLabel: language === 'ar' ? 'رقم الوثيقة' : 'Document Number',
    docImageLabel: language === 'ar' ? 'صورة الوثيقة' : 'Document Photo',
    submitVerif: language === 'ar' ? 'إرسال طلب التوثيق' : 'Submit Verification',
    idCard: language === 'ar' ? 'بطاقة هوية' : 'ID Card',
    passport: language === 'ar' ? 'جواز سفر' : 'Passport',
    verifPending: language === 'ar' ? 'طلبك قيد المراجعة' : 'Request Pending Review',
    verifPendingDesc: language === 'ar' ? 'سيتم مراجعة وثائقك من قبل فريقنا قريباً' : 'Our team will review your docs soon',
    verifiedStatus: language === 'ar' ? 'حساب موثق' : 'Account Verified',
    verifiedDesc: language === 'ar' ? 'هويتك مؤكدة وتتمتع بكامل ميزات الفلاش' : 'Identity confirmed. Full access granted.',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ variant: "destructive", title: "Error", description: t.imageTooLarge });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phone: phone.trim(),
        country: country,
        avatarUrl: selectedAvatar,
        biometricsEnabled,
      });

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

  const handleRequestVerification = async () => {
    if (!user || !db || !profile || !verifDocImage || !verifDocNumber || !verifCountry) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }

    setVerifLoading(true);
    try {
      await addDoc(collection(db, 'verifications'), {
        userId: user.uid,
        username: profile.username,
        status: 'pending',
        date: new Date().toISOString(),
        documentUrl: verifDocImage,
        details: {
          country: verifCountry,
          docType: verifDocType,
          docNumber: verifDocNumber
        }
      });

      // Telegram Notification
      await sendTelegramNotification(`
🛡️ <b>New KYC Verification Request</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>ID:</b> <code>${profile.customId}</code>
<b>Country:</b> ${verifCountry}
<b>Doc Type:</b> ${verifDocType.toUpperCase()}
<b>Doc Number:</b> <code>${verifDocNumber}</code>
<b>Date:</b> ${new Date().toLocaleString()}
      `);

      toast({ title: "Request Sent", description: t.verifPendingDesc });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setVerifLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative group">
          <div className={cn(
            "w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 bg-white/5 flex items-center justify-center",
            profile?.verified 
              ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]" 
              : "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          )}>
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-white/20" />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-10"
          >
            <Camera size={18} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setSelectedAvatar)} />
        </div>
        
        <button onClick={() => setIsAvatarOpen(!isAvatarOpen)} className="text-[10px] font-headline font-bold tracking-widest uppercase text-primary/60 hover:text-primary transition-colors">{t.avatarHeader}</button>

        {isAvatarOpen && (
          <div className="flex flex-wrap justify-center gap-3 p-4 glass-card rounded-2xl animate-in zoom-in-95 duration-300">
            {AVATARS.map((url, i) => (
              <button key={i} onClick={() => { setSelectedAvatar(url); setIsAvatarOpen(false); }} className={cn("w-12 h-12 rounded-full overflow-hidden border-2 transition-all", selectedAvatar === url ? "border-primary scale-110" : "border-transparent opacity-50 hover:opacity-100")}><img src={url} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.emailLabel}</Label>
            <div className="relative group">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20", language === 'ar' ? "right-3" : "left-3")} />
              <Input value={profile?.email || ''} disabled className={cn("h-12 bg-white/5 border-white/5 rounded-xl opacity-60 font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.phoneLabel}</Label>
            <div className="relative group">
              <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors", language === 'ar' ? "right-3" : "left-3")} />
              <Input 
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} 
                placeholder="+201234567890" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.countryLabel}</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-body text-[12px]">
                <SelectValue placeholder="SELECT COUNTRY" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                {COUNTRIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="font-body text-[12px] uppercase">
                    {language === 'ar' ? c.ar : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.passLabel}</Label>
            <div className="relative group">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors", language === 'ar' ? "right-3" : "left-3")} />
              <Input 
                type="password" 
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} 
                placeholder={t.passPlaceholder} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Fingerprint className="text-primary h-6 w-6" /></div>
              <div className={cn(language === 'ar' ? "text-right" : "text-left")}>
                <p className="text-[11px] font-headline font-bold uppercase tracking-tight text-foreground">{t.biometricLabel}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{t.biometricDesc}</p>
              </div>
            </div>
            <Switch checked={biometricsEnabled} onCheckedChange={setBiometricsEnabled} />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 font-headline text-md rounded-xl bg-primary text-background font-black tracking-widest">
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <><Check className="h-5 w-5 mr-2" /> {t.saveBtn}</>}
        </Button>
      </form>

      <section className="glass-card p-6 rounded-3xl space-y-6 border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-primary" size={20} />
          <h2 className="text-[12px] font-headline font-bold tracking-widest uppercase">{t.verifHeader}</h2>
        </div>

        {profile?.verified ? (
          <div className="flex items-center gap-4 p-5 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in zoom-in-95">
            <CheckCircle2 className="text-green-500" size={32} />
            <div>
              <p className="text-sm font-headline font-bold text-green-500 uppercase">{t.verifiedStatus}</p>
              <p className="text-[9px] text-green-500/60 uppercase tracking-widest font-black mt-1">{t.verifiedDesc}</p>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="flex items-center gap-4 p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-in fade-in">
            <Loader2 className="text-orange-500 animate-spin" size={32} />
            <div>
              <p className="text-sm font-headline font-bold text-orange-500 uppercase">{t.verifPending}</p>
              <p className="text-[9px] text-orange-500/60 uppercase tracking-widest font-black mt-1">{t.verifPendingDesc}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.countryLabel}</Label>
              <Select onValueChange={setVerifCountry}>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-body text-[12px]"><SelectValue placeholder="SELECT COUNTRY" /></SelectTrigger>
                <SelectContent className="bg-card border-white/10">{COUNTRIES.map(c => (<SelectItem key={c.code} value={c.code} className="font-body text-[12px] uppercase">{language === 'ar' ? c.ar : c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.docTypeLabel}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setVerifDocType('id_card')} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", verifDocType === 'id_card' ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-white/40")}><FileText size={18} /><span className="text-[9px] font-headline font-bold uppercase">{t.idCard}</span></button>
                <button type="button" onClick={() => setVerifDocType('passport')} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all", verifDocType === 'passport' ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-white/40")}><Globe size={18} /><span className="text-[9px] font-headline font-bold uppercase">{t.passport}</span></button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.docNumberLabel}</Label>
              <Input 
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                value={verifDocNumber} 
                onChange={(e) => setVerifDocNumber(e.target.value)} 
                placeholder="EX: A123456789" 
                className="h-12 bg-white/5 border-white/10 rounded-xl font-body text-[12px] uppercase" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.docImageLabel}</Label>
              <div onClick={() => docInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden">
                {verifDocImage ? (<img src={verifDocImage} className="w-full h-full object-cover" />) : (<><Camera className="text-white/20 group-hover:text-primary transition-colors" size={32} /><span className="text-[8px] font-headline font-bold uppercase text-white/20">{t.uploadLabel}</span></>)}
                <input type="file" ref={docInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setVerifDocImage)} />
              </div>
            </div>

            <Button onClick={handleRequestVerification} disabled={verifLoading || !verifDocImage || !verifDocNumber || !verifCountry} className="w-full h-14 font-headline text-md rounded-xl bg-secondary text-background font-black tracking-widest">
              {verifLoading ? <Loader2 className="animate-spin" /> : t.submitVerif}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
