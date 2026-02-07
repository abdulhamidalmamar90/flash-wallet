
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  Loader2, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Calendar as CalendarIcon, 
  UserCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { useStore } from '@/app/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const COUNTRIES = [
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', nameEn: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪', prefix: '+971' },
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', prefix: '+965' },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', prefix: '+974' },
  { code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن', flag: '🇯🇴', prefix: '+962' },
  { code: 'IQ', nameEn: 'Iraq', nameAr: 'العراق', flag: '🇮🇶', prefix: '+964' },
];

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1 Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);

  // Step 2 Fields
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  const passwordCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password)
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

  const generateCustomId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const numbers = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    return `${firstLetter}${numbers}`;
  };

  const checkUsernameUniqueness = async (val: string) => {
    if (val.length < 3) {
      setIsUsernameValid(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const q = query(collection(db, 'users'), where('username', '==', val.toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setIsUsernameValid(true);
        setUsernameSuggestions([]);
      } else {
        setIsUsernameValid(false);
        const suggestions = [
          `${val}${Math.floor(Math.random() * 999)}`,
          `${val}_${new Date().getFullYear()}`,
          `${val}.flash`
        ];
        setUsernameSuggestions(suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsernameUniqueness(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleNextStep = () => {
    if (!firstName || !lastName || !birthDate) {
      toast({ variant: "destructive", title: language === 'ar' ? "بيانات ناقصة" : "Missing Info" });
      return;
    }
    if (!username) setUsername(`${firstName}${lastName}`.toLowerCase().replace(/\s/g, ''));
    setStep(2);
  };

  const handleGoogleRegister = async () => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const names = user.displayName?.split(' ') || [];
        await setDoc(docRef, {
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
          username: user.email?.split('@')[0].toLowerCase() || user.uid.slice(0, 8),
          email: user.email?.toLowerCase(),
          phone: '',
          gender: 'male',
          birthDate: null,
          country: 'GL',
          customId: generateCustomId(),
          balance: 0,
          role: 'user',
          verified: false,
          language: language,
          createdAt: new Date().toISOString()
        });
        toast({ title: language === 'ar' ? "تم التسجيل بنجاح! يرجى إكمال ملفك الشخصي." : "Registered via Google! Please complete your profile." });
        router.push('/profile/edit');
      } else {
        toast({ title: language === 'ar' ? "أنت تملك حساباً بالفعل." : "You already have an account." });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Auth Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameValid || !isPasswordStrong || !email || !phone) return;

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const fullPhone = `${selectedCountry.prefix}${phone.trim()}`;

      const qEmail = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const emailSnap = await getDocs(qEmail);
      if (!emailSnap.empty) {
        toast({ variant: "destructive", title: language === 'ar' ? "البريد مستخدم" : "Email in use" });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName,
        lastName,
        username: username.toLowerCase(),
        email: cleanEmail,
        phone: fullPhone,
        gender,
        birthDate: birthDate?.toISOString(),
        country: selectedCountry.code,
        customId: generateCustomId(),
        balance: 0,
        role: 'user',
        verified: false,
        language: language,
        createdAt: new Date().toISOString()
      });

      await signOut(auth);
      toast({
        title: language === 'ar' ? "تم إنشاء الحساب!" : "Wallet Created!",
        description: language === 'ar' ? "يرجى تسجيل الدخول للبدء." : "Please login to start."
      });
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const t = {
    title: language === 'ar' ? 'إنشاء محفظة' : 'CREATE WALLET',
    step1: language === 'ar' ? 'البيانات الشخصية' : 'Personal Info',
    step2: language === 'ar' ? 'بيانات الحماية' : 'Security Setup',
    firstName: language === 'ar' ? 'الاسم الأول' : 'First Name',
    lastName: language === 'ar' ? 'الاسم الأخير' : 'Last Name',
    gender: language === 'ar' ? 'الجنس' : 'Gender',
    male: language === 'ar' ? 'ذكر' : 'Male',
    female: language === 'ar' ? 'أنثى' : 'Female',
    birthDate: language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date',
    next: language === 'ar' ? 'التالي' : 'Next',
    username: language === 'ar' ? 'اسم المستخدم' : 'Username',
    checking: language === 'ar' ? 'جاري التحقق...' : 'Checking...',
    taken: language === 'ar' ? 'هذا الاسم محجوز' : 'Username taken',
    available: language === 'ar' ? 'اسم المستخدم متاح' : 'Username available',
    suggest: language === 'ar' ? 'اقتراحات:' : 'Suggestions:',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    register: language === 'ar' ? 'تفعيل المحفظة' : 'Activate Wallet',
    back: language === 'ar' ? 'رجوع' : 'Back',
    login: language === 'ar' ? 'تسجيل الدخول' : 'Login'
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]" onClick={() => setIsCountryOpen(false)}>
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: `url('${backgroundImage?.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl animate-in fade-in duration-700 max-h-[95vh] overflow-y-auto no-scrollbar">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-headline font-bold text-white tracking-tighter gold-glow-text mb-2">FLASH</h1>
          <div className="flex items-center justify-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", step >= 1 ? "bg-primary" : "bg-white/20")} />
            <div className={cn("w-10 h-1 rounded-full", step >= 2 ? "bg-primary" : "bg-white/20")} />
            <div className={cn("w-2 h-2 rounded-full", step >= 2 ? "bg-primary" : "bg-white/20")} />
          </div>
          <p className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">{step === 1 ? t.step1 : t.step2}</p>
        </header>

        {step === 1 ? (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-white/40">{t.firstName}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white/5 border-white/10 h-12 text-sm" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-white/40">{t.lastName}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white/5 border-white/10 h-12 text-sm" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.gender}</Label>
              <RadioGroup value={gender} onValueChange={(v: any) => setGender(v)} className="flex gap-4">
                <div className={cn("flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border transition-all cursor-pointer", gender === 'male' ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/10 text-white/40")}>
                  <RadioGroupItem value="male" id="male" className="sr-only" />
                  <Label htmlFor="male" className="cursor-pointer font-headline text-[10px] uppercase">{t.male}</Label>
                </div>
                <div className={cn("flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border transition-all cursor-pointer", gender === 'female' ? "bg-pink-500/10 border-pink-500 text-pink-500" : "bg-white/5 border-white/10 text-white/40")}>
                  <RadioGroupItem value="female" id="female" className="sr-only" />
                  <Label htmlFor="female" className="cursor-pointer font-headline text-[10px] uppercase">{t.female}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.birthDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-12 bg-white/5 border-white/10 justify-start text-left font-normal rounded-xl", !birthDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {birthDate ? format(birthDate, "PPP") : <span>Select Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-white/10" align="start">
                  <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleNextStep} disabled={!firstName || !lastName || !birthDate} className="w-full h-14 bg-primary text-background font-headline font-black tracking-widest rounded-2xl gold-glow mt-4">
              {t.next} <ArrowRight className={cn("ml-2", language === 'ar' && "rotate-180")} size={18} />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center"><span className="bg-[#0b0b0d] px-4 text-[8px] text-white/30 uppercase tracking-[0.3em] font-black">OR</span></div>
            </div>

            <button type="button" onClick={handleGoogleRegister} className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Sign up with Google</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.username}</Label>
              <div className="relative">
                <UserCircle className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'right-4' : 'left-4')} size={18} />
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                  className={cn("bg-white/5 border-white/10 h-12 text-sm", language === 'ar' ? 'pr-12' : 'pl-12')} 
                  placeholder="username"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingUsername ? <Loader2 className="animate-spin text-primary h-4 w-4" /> : 
                   isUsernameValid === true ? <CheckCircle2 className="text-green-500 h-4 w-4" /> :
                   isUsernameValid === false ? <XCircle className="text-red-500 h-4 w-4" /> : null}
                </div>
              </div>
              {isUsernameValid === false && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                  <p className="text-[9px] text-red-500 font-bold uppercase">{t.taken}</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map(s => (
                      <button key={s} type="button" onClick={() => setUsername(s)} className="px-2 py-1 bg-white/5 rounded-md text-[8px] text-white/60 hover:text-primary transition-colors">@{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.email}</Label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'right-4' : 'left-4')} size={18} />
                <Input value={email} type="email" onChange={(e) => setEmail(e.target.value)} className={cn("bg-white/5 border-white/10 h-12 text-sm", language === 'ar' ? 'pr-12' : 'pl-12')} placeholder="email@example.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.phone}</Label>
              <div className="flex gap-2" dir="ltr">
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }} className="h-12 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-2 min-w-[90px]">
                  <span className="text-xs">{selectedCountry.flag}</span>
                  <ChevronDown size={12} className={cn(isCountryOpen && "rotate-180")} />
                </button>
                <div className="relative flex-1">
                  <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-white/20" size={18} />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/5 border-white/10 h-12 text-sm pl-12" placeholder="123456789" required />
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
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-white/40">{t.password}</Label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'right-4' : 'left-4')} size={18} />
                <Input value={password} type={showPassword ? "text" : "password"} onChange={(e) => setPassword(e.target.value)} className={cn("bg-white/5 border-white/10 h-12 text-sm", language === 'ar' ? 'pr-12 pl-12' : 'pl-12 pr-12')} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20", language === 'ar' ? 'left-4' : 'right-4')}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl bg-white/5 border-white/10 font-headline text-[10px] uppercase">
                {t.back}
              </Button>
              <Button type="submit" disabled={loading || !isUsernameValid || !isPasswordStrong} className="flex-[2] h-14 bg-primary text-background font-headline font-black tracking-widest rounded-2xl gold-glow">
                {loading ? <Loader2 className="animate-spin" /> : t.register}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'} <Link href="/" className="text-primary cursor-pointer hover:underline">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
