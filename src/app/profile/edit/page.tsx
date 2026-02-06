
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
  Mail,
  ChevronDown,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  { code: 'LY', nameEn: 'Libya', nameAr: 'ليبيا', flag: '🇱🇾', prefix: '+218' },
  { code: 'DZ', nameEn: 'Algeria', nameAr: 'الجزائر', flag: '🇩🇿', prefix: '+213' },
  { code: 'MA', nameEn: 'Morocco', nameAr: 'المغرب', flag: '🇲🇦', prefix: '+212' },
  { code: 'PS', nameEn: 'Palestine', nameAr: 'فلسطين', flag: '🇵🇸', prefix: '+970' },
  { code: 'LB', nameEn: 'Lebanon', nameAr: 'لبنان', flag: '🇱🇧', prefix: '+961' },
  { code: 'SY', nameEn: 'Syria', nameAr: 'سوريا', flag: '🇸🇾', prefix: '+963' },
  { code: 'OM', nameEn: 'Oman', nameAr: 'عمان', flag: '🇴🇲', prefix: '+968' },
  { code: 'YE', nameEn: 'Yemen', nameAr: 'اليمن', flag: '🇾🇪', prefix: '+967' },
  { code: 'BH', nameEn: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭', prefix: '+973' },
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
  const otpInputs = useRef<HTMLInputElement[]>([]);
  
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  // Phone Verification
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      const fullPhone = profile.phone || '';
      const countryMatch = COUNTRIES.find(c => fullPhone.startsWith(c.prefix));
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
    verifyBtn: language === 'ar' ? 'تحقق' : 'Verify',
    otpTitle: language === 'ar' ? 'رمز التحقق' : 'Verification Code',
    otpDesc: language === 'ar' ? 'أدخل الكود المرسل لهاتفك' : 'Enter the code sent to your phone',
    validateBtn: language === 'ar' ? 'تأكيد الرمز' : 'Validate Code',
    verified: language === 'ar' ? 'موثق' : 'Verified',
  };

  const handleSendOtp = async () => {
    if (!phone || !auth) return;
    setVerifyingPhone(true);
    
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-verifier-hidden', {
        size: 'invisible'
      });
      
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(result);
      setIsOtpOpen(true);
      toast({ title: language === 'ar' ? "تم إرسال الكود" : "OTP Sent" });
    } catch (error: any) {
      console.error("Phone Auth Error", error);
      toast({ 
        variant: "destructive", 
        title: language === 'ar' ? "فشل الإرسال" : "Failed to Send",
        description: error.message 
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setVerifyingPhone(true);
    const code = otpCode.join('');
    try {
      await confirmationResult.confirm(code);
      setIsPhoneVerified(true);
      setIsOtpOpen(false);
      toast({ title: language === 'ar' ? "تم التحقق بنجاح" : "Phone Verified" });
      if (user && db) {
        await updateDoc(doc(db, 'users', user.uid), { phoneVerified: true });
      }
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
      const updates: any = {
        username: username.trim(),
        phone: `${selectedCountry.prefix}${phone.trim()}`,
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

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) otpInputs.current[index + 1]?.focus();
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32" onClick={() => setIsCountryOpen(false)}>
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      {/* Hidden ReCAPTCHA Anchor */}
      <div id="recaptcha-verifier-hidden" className="hidden"></div>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative group">
          <div className={cn(
            "w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 bg-white/5 flex items-center justify-center",
            profile?.verified 
              ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]" 
              : "border-red-500 shadow-xl"
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
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setSelectedAvatar(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.usernameLabel}</Label>
            <div className="relative group">
              <User className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20", language === 'ar' ? "right-3" : "left-3")} />
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{t.emailLabel}</Label>
            <div className="relative group">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20", language === 'ar' ? "right-3" : "left-3")} />
              <input value={profile?.email || ''} readOnly className={cn("w-full h-12 bg-white/5 border border-white/5 rounded-xl opacity-60 font-body outline-none", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} />
            </div>
          </div>

          {/* Phone Field Forced LTR */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.phoneLabel}</Label>
            <div className="flex gap-2 relative z-50" dir="ltr">
              <div className="relative">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }}
                  className="h-12 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2 text-white/70 hover:bg-white/10 transition-all min-w-[100px]"
                >
                  <span>{selectedCountry.flag}</span>
                  <span className="text-xs">{selectedCountry.code}</span>
                  <ChevronDown size={14} className={cn(isCountryOpen && "rotate-180 transition-transform")} />
                </button>
                {isCountryOpen && (
                  <div className="absolute top-14 left-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 z-[110]">
                    {COUNTRIES.map(c => (
                      <button 
                        key={c.code}
                        type="button"
                        onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); }}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                      >
                        <span className="text-xs">{language === 'ar' ? c.nameAr : c.nameEn}</span>
                        <span className="text-xs text-white/40">{c.prefix}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-white/20" />
                  <Input 
                    type="tel" 
                    dir="ltr"
                    value={phone} 
                    onChange={(e) => { setPhone(e.target.value); setIsPhoneVerified(false); }} 
                    className="h-12 bg-white/5 border-white/10 rounded-xl font-body pl-10 pr-4 text-left" 
                    placeholder="123456789" 
                  />
                </div>
                {!isPhoneVerified ? (
                  <Button 
                    type="button"
                    onClick={handleSendOtp} 
                    disabled={verifyingPhone || !phone}
                    className="h-12 bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary hover:text-background text-[10px] font-headline font-bold uppercase shrink-0"
                  >
                    {verifyingPhone ? <Loader2 className="animate-spin" size={14} /> : t.verifyBtn}
                  </Button>
                ) : (
                  <div className="h-12 flex items-center gap-2 text-green-500 font-headline font-bold text-[8px] uppercase px-3 bg-green-500/10 rounded-xl border border-green-500/20 shrink-0">
                    <CheckCircle2 size={14} /> {t.verified}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.passLabel}</Label>
            <div className="relative group">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors", language === 'ar' ? "right-3" : "left-3")} />
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className={cn("h-12 bg-white/5 border-white/10 rounded-xl font-body", language === 'ar' ? "pr-10 text-right" : "pl-10 text-left")} 
                placeholder={t.passPlaceholder} 
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 font-headline text-md rounded-xl bg-primary text-background font-black tracking-widest gold-glow">
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : t.saveBtn}
        </Button>
      </form>

      {/* OTP Verification Modal */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-secondary">
              {t.otpTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 mt-4">
            <div className="w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-center mx-auto text-secondary">
              <Smartphone size={32} />
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{t.otpDesc}</p>
            <div className="flex gap-2 justify-center" dir="ltr">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { if(el) otpInputs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  className="w-10 h-14 bg-white/5 border border-white/10 text-center text-xl font-headline font-bold text-secondary focus:border-secondary transition-all outline-none rounded-lg"
                />
              ))}
            </div>
            <Button 
              onClick={handleVerifyOtp} 
              disabled={verifyingPhone || otpCode.join('').length < 6}
              className="w-full h-14 bg-secondary text-background font-headline font-bold text-[10px] uppercase tracking-widest cyan-glow"
            >
              {verifyingPhone ? <Loader2 className="animate-spin" /> : t.validateBtn}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
