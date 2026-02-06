
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ChevronDown, Eye, EyeOff, Globe } from 'lucide-react';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { useStore } from '@/app/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const COUNTRIES = [
  // Arab Countries
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
  // Global Countries
  { code: 'US', nameEn: 'USA', nameAr: 'أمريكا', flag: '🇺🇸', prefix: '+1' },
  { code: 'GB', nameEn: 'UK', nameAr: 'بريطانيا', flag: '🇬🇧', prefix: '+44' },
  { code: 'CA', nameEn: 'Canada', nameAr: 'كندا', flag: '🇨🇦', prefix: '+1' },
  { code: 'DE', nameEn: 'Germany', nameAr: 'ألمانيا', flag: '🇩🇪', prefix: '+49' },
  { code: 'FR', nameEn: 'France', nameAr: 'فرنسا', flag: '🇫🇷', prefix: '+33' },
  { code: 'IT', nameEn: 'Italy', nameAr: 'إيثاليا', flag: '🇮🇹', prefix: '+39' },
  { code: 'ES', nameEn: 'Spain', nameAr: 'إسبانيا', flag: '🇪🇸', prefix: '+34' },
  { code: 'TR', nameEn: 'Turkey', nameAr: 'تركيا', flag: '🇹🇷', prefix: '+90' },
  { code: 'CN', nameEn: 'China', nameAr: 'الصين', flag: '🇨🇳', prefix: '+86' },
  { code: 'JP', nameEn: 'Japan', nameAr: 'اليابان', flag: '🇯🇵', prefix: '+81' },
  { code: 'KR', nameEn: 'South Korea', nameAr: 'كوريا الجنوبية', flag: '🇰🇷', prefix: '+82' },
  { code: 'IN', nameEn: 'India', nameAr: 'الهند', flag: '🇮🇳', prefix: '+91' },
  { code: 'RU', nameEn: 'Russia', nameAr: 'روسيا', flag: '🇷🇺', prefix: '+7' },
  { code: 'BR', nameEn: 'Brazil', nameAr: 'البرازيل', flag: '🇧🇷', prefix: '+55' },
  { code: 'AU', nameEn: 'Australia', nameAr: 'أستراليا', flag: '🇦🇺', prefix: '+61' },
];

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const { language } = useStore();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const t = {
    title: language === 'ar' ? 'إنشاء محفظة' : 'CREATE WALLET',
    subtitle: language === 'ar' ? 'ابدأ رحلتك المالية الآن' : 'Start your financial journey',
    username: language === 'ar' ? 'اسم المستخدم' : 'Username',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    register: language === 'ar' ? 'تفعيل المحفظة' : 'Activate Wallet',
    loading: language === 'ar' ? 'جاري التجهيز...' : 'Initializing...',
    social: language === 'ar' ? 'أو الاستمرار بواسطة' : 'Or Continue With',
    hasAccount: language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    login: language === 'ar' ? 'تسجيل الدخول' : 'Authorize Access',
    emailInUse: language === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل.' : 'Email already in use.',
    weakPassword: language === 'ar' ? 'كلمة المرور ضعيفة جداً.' : 'Password is too weak.',
    accountExists: language === 'ar' ? 'هذا الحساب موجود بالفعل، يرجى تسجيل الدخول.' : 'This account already exists. Please login.',
  };

  const generateCustomId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const numbers = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    return `${firstLetter}${numbers}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword || !cleanUsername) return;

    setLoading(true);

    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const emailSnap = await getDocs(q);
      if (!emailSnap.empty) {
        toast({
          variant: "destructive",
          title: language === 'ar' ? "فشل الإنشاء" : "Registration Failed",
          description: t.emailInUse
        });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: cleanUsername,
        email: cleanEmail,
        phone: `${selectedCountry.prefix}${phone.trim()}`,
        country: selectedCountry.code,
        customId: generateCustomId(),
        balance: 0,
        role: 'user',
        verified: false,
        language: language,
        createdAt: new Date().toISOString()
      });

      toast({
        title: language === 'ar' ? "تم إنشاء الحساب!" : "Wallet Created!",
        description: language === 'ar' ? "أهلاً بك في فلاش." : "Welcome to FLASH."
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') message = t.emailInUse;
      if (error.code === 'auth/weak-password') message = t.weakPassword;

      toast({
        variant: "destructive",
        title: language === 'ar' ? "خطأ في التسجيل" : "Registration Failed",
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleEmail = result.user.email?.toLowerCase();
      
      const q = query(collection(db, 'users'), where('email', '==', googleEmail));
      const emailSnap = await getDocs(q);
      
      if (!emailSnap.empty) {
        toast({
          title: language === 'ar' ? "أهلاً بك مجدداً" : "Welcome Back",
          description: language === 'ar' ? "جاري تحويلك للمحفظة..." : "Redirecting to vault..."
        });
        router.push('/dashboard');
      } else {
        const userDoc = doc(db, 'users', result.user.uid);
        await setDoc(userDoc, {
          username: result.user.displayName || 'User',
          email: googleEmail,
          phone: '',
          country: selectedCountry.code,
          customId: generateCustomId(),
          balance: 0,
          role: 'user',
          verified: false,
          language: language,
          createdAt: new Date().toISOString()
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Auth Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]" onClick={() => setIsCountryOpen(false)}>
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: `url('${backgroundImage?.imageUrl || "https://images.unsplash.com/photo-1603347729548-6844517490c7"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-700 overflow-y-auto max-h-[90vh]">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl font-black text-white mb-2 tracking-tighter text-primary gold-glow-text">FLASH</h1>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><User size={18} /></div>
            <input 
              type="text" 
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder={t.username} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-[14px] font-body text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Mail size={18} /></div>
            <input 
              type="email" 
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder={t.email} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-[14px] font-body text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="flex gap-2 relative z-50">
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsCountryOpen(!isCountryOpen); }}
                className="h-full bg-white/5 border border-white/10 rounded-2xl px-3 flex items-center gap-2 text-white/70 hover:bg-white/10 transition-all min-w-[100px]"
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
            <div className="group relative flex-1">
              <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Phone size={18} /></div>
              <input 
                type="tel" 
                placeholder={t.phone} 
                className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-[14px] font-body text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Lock size={18} /></div>
            <input 
              type={showPassword ? "text" : "password"} 
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder={t.password} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-[14px] font-body text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left')} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute top-3.5 text-white/20 hover:text-primary transition-colors", language === 'ar' ? 'left-4' : 'right-4')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50">
            <span>{loading ? t.loading : t.register}</span>
            <ArrowRight size={18} className={cn(language === 'ar' && 'rotate-180')} />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
          <div className="relative flex justify-center"><span className="bg-[#0b0b0d] px-3 text-[9px] text-white/40 uppercase tracking-widest font-bold">{t.social}</span></div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="font-headline font-bold text-[10px] tracking-widest uppercase">Google Sign-up</span>
        </button>

        <p className="text-center mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {t.hasAccount} <Link href="/" className="text-primary cursor-pointer hover:underline">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
