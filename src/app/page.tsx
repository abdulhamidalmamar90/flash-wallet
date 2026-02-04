
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${backgroundImage?.imageUrl || "https://picsum.photos/seed/flash-bg/1920/1080"}')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-ai-hint={backgroundImage?.imageHint || "futuristic background"}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2.5rem] border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl font-black text-white mb-2 tracking-tighter">
            FLASH
          </h1>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">
            بوابة عبورك للمستقبل المالي
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Identity Field */}
          <div className="group relative">
            <div className="absolute right-4 top-3.5 text-white/40 group-focus-within:text-primary transition-colors">
              <Mail size={20} />
            </div>
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-right dir-rtl"
              required
            />
          </div>

          {/* Access Key Field */}
          <div className="group relative">
            <div className="absolute right-4 top-3.5 text-white/40 group-focus-within:text-primary transition-colors">
              <Lock size={20} />
            </div>
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-right dir-rtl"
              required
            />
          </div>

          {/* Initialize Session Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? "جاري التحقق..." : "تسجيل الدخول"}</span>
            <ArrowRight size={18} className={loading ? "animate-pulse" : ""} />
          </button>
        </form>

        {/* Social Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-3 text-[9px] text-white/40 uppercase tracking-widest font-bold">
              أو الاستمرار بواسطة
            </span>
          </div>
        </div>

        {/* Google Provider Button */}
        <button className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group">
           <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-headline font-bold text-[10px] tracking-widest uppercase">Google Access</span>
        </button>

        {/* Card Footer */}
        <p className="text-center mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          ليس لديك حساب؟ <span className="text-primary cursor-pointer hover:underline">إنشاء محفظة جديدة</span>
        </p>
      </div>
    </div>
  );
}
