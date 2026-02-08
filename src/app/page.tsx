"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Fingerprint, User as UserIcon } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const { language } = useStore();

  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    setMounted(true);
    const checkBiometrics = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await NativeBiometric.isAvailable();
          setIsBiometricAvailable(result.isAvailable);
        } catch (e) {
          console.warn("Biometric check failed:", e);
        }
      }
    };
    checkBiometrics();
  }, []);

  useEffect(() => {
    if (!auth || !db) return;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          const q = query(collection(db, 'users'), where('email', '==', result.user.email?.toLowerCase()));
          const snap = await getDocs(q);
          if (snap.empty) {
            await signOut(auth);
            toast({ variant: "destructive", title: language === 'ar' ? "حساب غير موجود" : "Account Missing" });
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    checkRedirect();
  }, [auth, db, router, toast, language]);

  useEffect(() => {
    if (user && !authLoading) router.push('/dashboard');
  }, [user, authLoading, router]);

  const t = {
    title: 'AUTHORIZATION',
    identifier: language === 'ar' ? 'البريد أو اسم المستخدم' : 'EMAIL OR USERNAME',
    password: language === 'ar' ? 'كلمة المرور' : 'PASSWORD',
    login: language === 'ar' ? 'دخول' : 'VERIFY IDENTITY',
    noAccount: language === 'ar' ? 'لا تملك حساباً؟' : "NO ACCOUNT?",
    create: language === 'ar' ? 'إنشاء هوية' : 'REGISTER',
    error: language === 'ar' ? 'فشل التحقق من الهوية' : 'Authorization failed',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    const input = identifier.trim().toLowerCase();
    const cleanPassword = password; 
    if (!input || !cleanPassword) return;

    setLoading(true);
    try {
      let loginEmail = input;

      if (!input.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', input), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error(language === 'ar' ? "اسم المستخدم غير مسجل" : "Username not found");
        }
        loginEmail = snap.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, loginEmail, cleanPassword);
    } catch (error: any) {
      let msg = language === 'ar' ? "بيانات الدخول غير صحيحة" : "Invalid credentials";
      if (error.message.includes("Username")) msg = error.message;
      toast({ variant: "destructive", title: t.error, description: msg });
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricAvailable || !auth) return;
    try {
      const verified = await NativeBiometric.verifyIdentity({
        reason: language === 'ar' ? "سجل دخولك إلى فلاش" : "Authorize login to FLASH",
        title: language === 'ar' ? "تسجيل دخول بالبصمة" : "Biometric Login",
      });
      if (verified) {
        const { value: storedCreds } = await Preferences.get({ key: 'flash_biometric_auth' });
        if (storedCreds) {
          const { e, p } = JSON.parse(storedCreds);
          setLoading(true);
          await signInWithEmailAndPassword(auth, e, p);
        } else {
          toast({ variant: "destructive", title: "Biometric not enrolled" });
        }
      }
    } catch (e) { console.error(e); }
  };

  if (!mounted || authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-6">
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage?.imageUrl}')` }}><div className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"></div></div>

      <div className="relative z-10 max-w-sm w-full space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-2 flex flex-col items-center">
          <h1 className="text-6xl font-headline font-bold text-white tracking-tighter gold-glow-text">FLASH</h1>
          <p className="text-[10px] text-primary uppercase tracking-[0.5em] font-bold">{t.title}</p>
        </div>

        <div className="glass-card p-8 sm:p-10 rounded-[3rem] border-white/10 shadow-2xl backdrop-blur-3xl gold-glow overflow-visible">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="futuristic-poda scale-[0.9] sm:scale-100">
                <div className="futuristic-glow"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="white futuristic-white"></div>
                <div className="border futuristic-border"></div>

                <div className="futuristic-main-area">
                  <input 
                    placeholder={t.identifier} 
                    type="text" 
                    name="identifier" 
                    className="futuristic-input" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required 
                    autoComplete="username"
                  />
                  <div className="futuristic-input-mask"></div>
                  <div className="futuristic-cyan-mask"></div>
                  <div className="futuristic-filterBorder"></div>
                  <div className="futuristic-filter-icon">
                    <svg
                      height="20"
                      width="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4AE35"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="futuristic-poda scale-[0.9] sm:scale-100">
                <div className="futuristic-glow"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="futuristic-darkBorderBg"></div>
                <div className="white futuristic-white"></div>
                <div className="border futuristic-border"></div>

                <div className="futuristic-main-area">
                  <input 
                    placeholder={t.password} 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    className="futuristic-input" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    autoComplete="current-password"
                  />
                  
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-[52px] text-white/30 hover:text-primary transition-all z-[10]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  <div className="futuristic-input-mask"></div>
                  <div className="futuristic-cyan-mask"></div>
                  <div className="futuristic-filterBorder"></div>
                  <div className="futuristic-filter-icon">
                    <svg
                      height="20"
                      width="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4AE35"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-2 pt-4">
              <button type="submit" disabled={loading} className="w-full h-16 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl gold-glow active:scale-95 hover:scale-[1.02] transition-all">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t.login} <ArrowRight size={16} className={cn(language === 'ar' && "rotate-180")} /></>}
              </button>
            </div>
          </form>

          {isBiometricAvailable && (
            <div className="px-2">
              <button onClick={handleBiometricLogin} className="w-full h-16 mt-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/20 transition-all text-primary group">
                <Fingerprint size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Biometric Vault</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          {t.noAccount} <Link href="/register" className="text-primary hover:text-white transition-colors ml-2">{t.create}</Link>
        </p>
      </div>
    </div>
  );
}
