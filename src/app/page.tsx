
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, X, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { useStore } from '@/app/lib/store';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const { language } = useStore();
  
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    setMounted(true);
    const savedUid = localStorage.getItem('flash_biometrics_uid');
    if (savedUid) {
      setHasBiometrics(true);
    }
  }, []);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router, mounted]);

  const t = {
    title: 'FLASH',
    subtitle: language === 'ar' ? 'بوابة عبورك للمستقبل المالي' : 'Your Gateway to the Financial Future',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    login: language === 'ar' ? 'تسجيل الدخول' : 'Authorize Access',
    loading: language === 'ar' ? 'جاري التحقق...' : 'Verifying...',
    social: language === 'ar' ? 'أو الاستمرار بواسطة' : 'Or Continue With',
    noAccount: language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?",
    create: language === 'ar' ? 'إنشاء محفظة جديدة' : 'Create New Wallet',
    forgot: language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?',
    resetTitle: language === 'ar' ? 'استعادة الوصول' : 'Recover Access',
    resetDesc: language === 'ar' ? 'أدخل بريدك لإرسال رابط إعادة التعيين' : 'Enter email to receive reset link',
    sendReset: language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link',
    resetSent: language === 'ar' ? 'تم إرسال الرابط لبريدك' : 'Reset link sent to your email',
    errorReset: language === 'ar' ? 'فشل إرسال الرابط' : 'Failed to send reset link',
    authError: language === 'ar' ? 'بيانات الاعتماد غير صالحة. تأكد من البريد وكلمة المرور أو قم بإنشاء حساب جديد.' : 'Invalid credentials. Please check your email and password or create a new account.',
    biometricAuth: language === 'ar' ? 'تحقق من الهوية...' : 'Authenticating...',
    biometricSuccess: language === 'ar' ? 'تم التعرف على البصمة' : 'Biometric Recognized',
    biometricError: language === 'ar' ? 'فشل التحقق من البصمة' : 'Biometric verification failed'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/dashboard');
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = t.authError;
      }
      toast({
        variant: "destructive",
        title: language === 'ar' ? "خطأ في التحقق" : "Auth Error",
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    toast({ title: t.biometricAuth, description: language === 'ar' ? 'يرجى لمس حساس البصمة' : 'Please touch the fingerprint sensor' });
    
    // محاكاة عملية البصمة
    setTimeout(() => {
      const success = true; // محاكاة نجاح العملية
      if (success) {
        toast({ title: t.biometricSuccess });
        // في التطبيق الحقيقي سنقوم بتسجيل الدخول التلقائي هنا
        // للمحاكاة سنكتفي بالرسالة لأننا نحتاج بيانات الاعتماد الأصلية
      } else {
        toast({ variant: "destructive", title: t.biometricError });
      }
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDoc);
      if (!snap.exists()) {
        await setDoc(userDoc, {
          username: result.user.email?.split('@')[0],
          email: result.user.email,
          customId: `F${Math.random().toString().slice(2, 14)}`,
          balance: 0,
          role: 'user',
          verified: false,
          language: language,
          createdAt: new Date().toISOString()
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Auth Failed",
        description: error.message
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast({ title: t.resetSent });
      setIsResetOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({ variant: "destructive", title: t.errorReset, description: error.message });
    } finally {
      setResetLoading(false);
    }
  };

  if (!mounted || (authLoading && !user)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-primary font-headline text-[10px] tracking-widest uppercase animate-pulse">Initializing Flash System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      <div className="absolute top-6 right-6 z-[100]"><LanguageToggle /></div>
      <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: `url('${backgroundImage?.imageUrl || "https://images.unsplash.com/photo-1603347729548-6844517490c7"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl font-black text-white mb-2 tracking-tighter">{t.title}</h1>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Mail size={20} /></div>
            <input 
              type="email" 
              placeholder={t.email} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="group relative">
            <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Lock size={20} /></div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder={t.password} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left')} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute top-3.5 text-white/20 hover:text-primary transition-colors", language === 'ar' ? 'left-4' : 'right-4')}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end">
             <button type="button" onClick={() => setIsResetOpen(true)} className="text-[10px] text-primary/70 hover:text-primary font-bold uppercase tracking-widest transition-colors">
               {t.forgot}
             </button>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              <span>{loading ? t.loading : t.login}</span>
              <ArrowRight size={18} className={cn(language === 'ar' && 'rotate-180')} />
            </button>
            {hasBiometrics && (
              <button 
                type="button" 
                onClick={handleBiometricLogin}
                className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary hover:bg-primary/10 transition-all active:scale-90"
              >
                <Fingerprint size={28} />
              </button>
            )}
          </div>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
          <div className="relative flex justify-center"><span className="bg-transparent px-3 text-[9px] text-white/40 uppercase tracking-widest font-bold">{t.social}</span></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group">
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          <span className="font-headline font-bold text-[10px] tracking-widest uppercase">Google Access</span>
        </button>

        <p className="text-center mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {t.noAccount} <Link href="/register" className="text-primary cursor-pointer hover:underline">{t.create}</Link>
        </p>
      </div>

      {isResetOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setIsResetOpen(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsResetOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
            <div className="text-center mb-6">
               <h3 className="font-headline font-black text-xl text-white uppercase tracking-tight">{t.resetTitle}</h3>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{t.resetDesc}</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
               <div className="group relative">
                <div className={cn("absolute top-3.5 text-white/40 group-focus-within:text-primary", language === 'ar' ? 'right-4' : 'left-4')}><Mail size={18} /></div>
                <input 
                  type="email" 
                  placeholder={t.email} 
                  className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left')} 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" disabled={resetLoading} className="w-full bg-primary text-background font-headline font-black py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
                {resetLoading ? t.loading : t.sendReset}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
