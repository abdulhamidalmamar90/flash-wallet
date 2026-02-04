
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { useStore } from '@/app/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const COUNTRIES = [
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', nameEn: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪', prefix: '+971' },
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', prefix: '+965' },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', prefix: '+974' },
  { code: 'US', nameEn: 'USA', nameAr: 'أمريكا', flag: '🇺🇸', prefix: '+1' },
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
    weakPassword: language === 'ar' ? 'كلمة المرور ضعيفة جداً.' : 'Password is too weak.'
  };

  const generateCustomId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const numbers = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    return `${firstLetter}${numbers}`;
  };

  const initUser = async (uid: string, userEmail: string, customUsername?: string, customPhone?: string) => {
    const userDoc = doc(db, 'users', uid);
    const snap = await getDoc(userDoc);
    if (!snap.exists()) {
      await setDoc(userDoc, {
        username: customUsername || userEmail.split('@')[0],
        email: userEmail,
        phone: customPhone || '',
        customId: generateCustomId(),
        balance: 0,
        role: 'user',
        verified: false,
        language: language,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await initUser(
        userCredential.user.uid, 
        email, 
        username, 
        `${selectedCountry.prefix}${phone}`
      );

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
      await initUser(result.user.uid, result.user.email || 'user');
      router.push('/dashboard');
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]" onClick={() => setIsCountryOpen(false)}>
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('${backgroundImage?.imageUrl || "https://picsum.photos/seed/flash-bg/1920/1080"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-700 overflow-y-auto max-h-[90vh]">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl font-black text-white mb-2 tracking-tighter">{t.title}</h1>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><User size={18} /></div>
            <input 
              type="text" 
              placeholder={t.username} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Mail size={18} /></div>
            <input 
              type="email" 
              placeholder={t.email} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
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
                className="h-full bg-white/5 border border-white/10 rounded-2xl px-3 flex items-center gap-2 text-white/70 hover:bg-white/10 transition-all"
              >
                <span>{selectedCountry.flag}</span>
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
                className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Lock size={18} /></div>
            <input 
              type="password" 
              placeholder={t.password} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50">
            <span>{loading ? t.loading : t.register}</span>
            <ArrowRight size={18} className={cn(language === 'ar' && 'rotate-180')} />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
          <div className="relative flex justify-center"><span className="bg-transparent px-3 text-[9px] text-white/40 uppercase tracking-widest font-bold">{t.social}</span></div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
