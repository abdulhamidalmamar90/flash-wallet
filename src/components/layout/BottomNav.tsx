
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ArrowDownToLine, User, ScanLine, QrCode, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';
import { useState, useMemo } from 'react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useStore();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Use useMemo to stabilize the doc reference and prevent infinite loops
  const userDocRef = useMemo(() => 
    (user && db) ? doc(db, 'users', user.uid) : null, 
    [db, user?.uid]
  );
  
  const { data: profile } = useDoc(userDocRef);

  const navItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', icon: Home, href: '/dashboard' },
    { label: language === 'ar' ? 'الخدمات' : 'Services', icon: LayoutGrid, href: '/marketplace' },
    { label: 'center', icon: ScanLine, href: '#' },
    { label: language === 'ar' ? 'سحب' : 'Withdraw', icon: ArrowDownToLine, href: '/withdraw' },
    { label: language === 'ar' ? 'حسابي' : 'Profile', icon: User, href: (profile?.role === 'admin' ? '/admin' : '/dashboard') },
  ];

  const handleCopyId = () => {
    if (profile?.customId) {
      navigator.clipboard.writeText(profile.customId);
      toast({ title: language === 'ar' ? 'تم نسخ المعرف!' : 'ID copied!' });
    }
  };

  const qrCodeUrl = profile?.customId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile.customId}&color=000000&bgcolor=ffffff`
    : null;

  return (
    <>
      {/* QR Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={() => setIsQrOpen(false)}>
          <div className="bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border relative text-center max-w-[90%] w-[340px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
               <h3 className="font-headline font-black text-xl uppercase tracking-tighter">My Flash ID</h3>
               <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
                 {language === 'ar' ? 'امسح الكود للإرسال فوراً' : 'Scan to send money instantly'}
               </p>
            </div>
            <div className="bg-white p-3 rounded-2xl border-2 border-primary/20 mx-auto w-fit shadow-inner">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR" className="w-48 h-48 rounded-lg" />
              ) : (
                <div className="w-48 h-48 bg-muted flex items-center justify-center rounded-lg">
                  <QrCode className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>
            <div className="mt-6 bg-muted py-3 px-6 rounded-2xl inline-flex items-center gap-3 cursor-pointer hover:bg-muted/80 transition-all" onClick={handleCopyId}>
              <span className="font-headline font-black tracking-widest text-lg">{profile?.customId || '---'}</span>
              <Copy size={16} className="text-muted-foreground" />
            </div>
            <button onClick={() => setIsQrOpen(false)} className="absolute -bottom-20 left-1/2 -translate-x-1/2 bg-card/20 text-white p-3 rounded-full border border-white/10 backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] px-6 pb-8 pt-2 pointer-events-none">
        <div className="mx-auto max-w-lg rounded-[2.2rem] flex items-center justify-between py-2 px-2 border bg-card/80 backdrop-blur-2xl shadow-2xl border-white/5 pointer-events-auto">
          {navItems.map((item, idx) => {
            if (item.label === 'center') {
              return (
                <button
                  key="center-btn"
                  onClick={() => setIsQrOpen(true)}
                  className="relative -top-10 w-16 h-16 shrink-0 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] border-4 border-background hover:scale-105 transition-all duration-300 gold-glow"
                >
                  <ScanLine size={28} className="text-primary-foreground" />
                </button>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href + idx}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-all duration-300 rounded-2xl min-w-[64px]",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn(isActive && "gold-glow")} />
                <span className="text-[7px] font-headline font-black tracking-widest uppercase">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
