
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Fingerprint, User as UserIcon } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const { language } = useStore();

  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
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
    const cleanPassword = password.trim();
    if (!input || !cleanPassword) return;

    setLoading(true);
    try {
      let loginEmail = input;

      // Check if it's a username (no @)
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

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-6">
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage?.imageUrl}')` }}><div className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"></div></div>

      <div className="relative z-10 max-w-sm w-full space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-2 flex flex-col items-center">
          <h1 className="text-6xl font-headline font-bold text-white tracking-tighter gold-glow-text">FLASH</h1>
          <p className="text-[10px] text-primary uppercase tracking-[0.5em] font-bold">{t.title}</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl backdrop-blur-3xl gold-glow">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <UserIcon className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all", language === 'ar' ? "right-4" : "left-4")} size={18} />
                <input 
                  type="text" 
                  placeholder={t.identifier} 
                  className={cn("w-full bg-white/5 border border-white/5 h-16 text-[14px] font-body text-white focus:outline-none focus:border-primary/40 rounded-2xl transition-all", language === 'ar' ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left")}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required 
                />
              </div>
              <div className="relative group">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all", language === 'ar' ? "right-4" : "left-4")} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={t.password} 
                  className={cn("w-full bg-white/5 border border-white/5 h-16 text-[14px] font-body text-white focus:outline-none focus:border-primary/40 rounded-2xl transition-all", language === 'ar' ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-primary", language === 'ar' ? "left-4" : "right-4")}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-16 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl gold-glow active:scale-95 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t.login} <ArrowRight size={16} className={cn(language === 'ar' && "rotate-180")} /></>}
            </button>
          </form>

          {isBiometricAvailable && (
            <button onClick={handleBiometricLogin} className="w-full h-16 mt-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/20 transition-all text-primary group">
              <Fingerprint size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Biometric Vault</span>
            </button>
          )}
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          {t.noAccount} <Link href="/register" className="text-primary hover:text-white transition-colors ml-2">{t.create}</Link>
        </p>
      </div>
    </div>
  );
}
