
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useStore } from '@/app/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
    hasAccount: language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    login: language === 'ar' ? 'تسجيل الدخول' : 'Authorize Access'
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
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const customId = generateCustomId();

      await setDoc(doc(db, 'users', uid), {
        username: username,
        email: email,
        phone: `${selectedCountry.prefix}${phone}`,
        customId: customId,
        balance: 1000, // الهدية الترحيبية
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
      toast({
        variant: "destructive",
        title: language === 'ar' ? "خطأ في التسجيل" : "Registration Failed",
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

      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
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

          {/* حقل الهاتف مع قائمة الدول */}
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

        <p className="text-center mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {t.hasAccount} <Link href="/" className="text-primary cursor-pointer hover:underline">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
