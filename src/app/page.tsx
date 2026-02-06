
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useStore();

  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  // Handle Redirect Result for Mobile/WebView environments
  useEffect(() => {
    if (!auth || !db) return;

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          const googleEmail = result.user.email?.toLowerCase();
          const q = query(collection(db, 'users'), where('email', '==', googleEmail));
          const snap = await getDocs(q);
          
          if (snap.empty) {
            await signOut(auth);
            toast({
              variant: "destructive",
              title: language === 'ar' ? "حساب غير موجود" : "Account Missing",
              description: language === 'ar' ? 'عذراً، هذا الحساب غير مسجل لدينا. يرجى إنشاء حساب أولاً.' : 'Account not found. Please register first.'
            });
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error: any) {
        console.error("Redirect Auth Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRedirect();
  }, [auth, db, router, toast, language]);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const t = {
    title: 'AUTHORIZATION',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'EMAIL ADDRESS',
    password: language === 'ar' ? 'كلمة المرور' : 'PASSWORD',
    login: language === 'ar' ? 'دخول' : 'VERIFY IDENTITY',
    noAccount: language === 'ar' ? 'لا تملك حساباً؟' : "NO ACCOUNT?",
    create: language === 'ar' ? 'إنشاء هوية' : 'REGISTER',
    error: language === 'ar' ? 'فشل التحقق من الهوية' : 'Authorization failed',
    social: language === 'ar' ? 'أو الدخول بواسطة' : 'OR CONTINUE WITH',
    noAccountFound: language === 'ar' ? 'عذراً، هذا الحساب غير مسجل لدينا. يرجى إنشاء حساب أولاً.' : 'Account not found. Please register first.',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        errorMessage = language === 'ar' 
          ? "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور." 
          : "Invalid credentials. Please check your email and password.";
      }
      toast({ 
        variant: "destructive", 
        title: t.error,
        description: errorMessage
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Detect if we are in a WebView/Mobile environment
    const isWebView = typeof window !== 'undefined' && 
      ((window as any).Capacitor?.isNativePlatform || /WV|WebView|Android/i.test(navigator.userAgent));

    try {
      if (isWebView) {
        // Use Redirect for WebViews to bypass popup block
        await signInWithRedirect(auth, provider);
      } else {
        // Use Popup for standard browsers
        const result = await signInWithPopup(auth, provider);
        const googleEmail = result.user.email?.toLowerCase();

        const q = query(collection(db, 'users'), where('email', '==', googleEmail));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: language === 'ar' ? "حساب غير موجود" : "Account Missing",
            description: t.noAccountFound
          });
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Google Auth Failed",
        description: error.message 
      });
    } finally {
      if (!isWebView) setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-6">
      <div className="absolute top-6 right-6 z-[100]">
        <LanguageToggle />
      </div>

      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" 
        style={{ backgroundImage: `url('${backgroundImage?.imageUrl || "https://images.unsplash.com/photo-1603347729548-6844517490c7"}')` }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[10px]"></div>
      </div>

      <div className="relative z-10 max-w-sm w-full space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-2">
          <h1 className="font-headline text-5xl font-black tracking-tighter text-white gold-glow-text">FLASH</h1>
          <p className="text-[10px] text-primary uppercase tracking-[0.5em] font-bold">{t.title}</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl backdrop-blur-3xl gold-glow">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all", language === 'ar' ? "right-4" : "left-4")} size={18} />
                <input 
                  type="email" 
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder={t.email} 
                  className={cn("w-full bg-white/5 border border-white/5 h-16 text-[14px] font-body tracking-wider text-white focus:outline-none focus:border-primary/40 rounded-2xl transition-all", language === 'ar' ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="relative group">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all", language === 'ar' ? "right-4" : "left-4")} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder={t.password} 
                  className={cn("w-full bg-white/5 border border-white/5 h-16 text-[14px] font-body tracking-wider text-white focus:outline-none focus:border-primary/40 rounded-2xl transition-all", language === 'ar' ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors", language === 'ar' ? "left-4" : "right-4")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-16 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl gold-glow active:scale-95 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t.login} <ArrowRight size={16} className={cn(language === 'ar' && "rotate-180")} /></>}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
            <div className="relative flex justify-center"><span className="bg-[#0b0b0d] px-4 text-[8px] text-white/30 uppercase tracking-[0.3em] font-black">IDENTITY CONTROL</span></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-[10px] font-headline font-bold text-white uppercase tracking-widest">Google Portal</span>
          </button>
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          {t.noAccount} <Link href="/register" className="text-primary hover:text-white transition-colors ml-2">{t.create}</Link>
        </p>
      </div>
    </div>
  );
}
