"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, X } from 'lucide-react';
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
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { language } = useStore();
  
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    setMounted(true);
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
    errorReset: language === 'ar' ? 'فشل إرسال الرابط' : 'Failed to send reset link'
  };

  const generateCustomId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const numbers = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    return `${firstLetter}${numbers}`;
  };

  const initUser = async (uid: string, email: string) => {
    if (!db) return;
    const userDoc = doc(db, 'users', uid);
    const snap = await getDoc(userDoc);
    if (!snap.exists()) {
      await setDoc(userDoc, {
        username: email.split('@')[0],
        email: email,
        customId: generateCustomId(),
        balance: 0,
        role: 'user',
        verified: false,
        language: language,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? "خطأ في التحقق" : "Auth Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
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
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
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
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('${backgroundImage?.imageUrl || "https://images.unsplash.com/photo-1603347729548-6844517490c7"}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
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
              type="password" 
              placeholder={t.password} 
              className={cn("w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50", language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="flex justify-end">
             <button type="button" onClick={() => setIsResetOpen(true)} className="text-[10px] text-primary/70 hover:text-primary font-bold uppercase tracking-widest transition-colors">
               {t.forgot}
             </button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50">
            <span>{loading ? t.loading : t.login}</span>
            <ArrowRight size={18} className={cn(language === 'ar' && 'rotate-180')} />
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
          <div className="relative flex justify-center"><span className="bg-transparent px-3 text-[9px] text-white/40 uppercase tracking-widest font-bold">{t.social}</span></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
