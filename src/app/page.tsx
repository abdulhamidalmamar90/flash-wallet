"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { language } = useStore();

  useEffect(() => {
    if (user && !authLoading) router.push('/dashboard');
  }, [user, authLoading, router]);

  const t = {
    title: 'AUTHORIZATION',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'EMAIL ADDRESS',
    password: language === 'ar' ? 'كلمة المرور' : 'PASSWORD',
    login: language === 'ar' ? 'دخول' : 'VERIFY IDENTITY',
    noAccount: language === 'ar' ? 'لا تملك حساباً؟' : "NO ACCOUNT?",
    create: language === 'ar' ? 'إنشاء هوية' : 'REGISTER',
    error: language === 'ar' ? 'فشل التحقق من الهوية' : 'Authorization failed'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      toast({ variant: "destructive", title: t.error });
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-sm w-full space-y-12">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tighter text-white mb-2">FLASH</h1>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-bold">{t.title}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="email" 
                placeholder={t.email} 
                className="w-full bg-card border border-border h-14 pl-12 pr-4 text-xs font-headline uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="password" 
                placeholder={t.password} 
                className="w-full bg-card border border-border h-14 pl-12 pr-4 text-xs font-headline uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <>{t.login} <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.noAccount} <Link href="/register" className="text-primary hover:underline">{t.create}</Link>
        </p>
      </div>
    </div>
  );
}