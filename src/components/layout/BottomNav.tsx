
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowDownToLine, User, ScanLine, LayoutGrid, ShieldAlert, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';
import { useMemo } from 'react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function BottomNav() {
  const pathname = usePathname();
  const { language, setScannerOpen } = useStore();
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemo(() => 
    (user && db) ? doc(db, 'users', user.uid) : null, 
    [db, user?.uid]
  );
  
  const { data: profile } = useDoc(userDocRef);

  // Added '/admin' and '/agent' to hiddenPaths to hide bottom navigation
  const hiddenPaths = ['/', '/register', '/onboarding', '/splash', '/otp', '/profile/edit', '/admin', '/agent'];
  const isHiddenPage = hiddenPaths.some(path => {
    const normalizedPath = pathname?.replace(/\/$/, '') || '/';
    const normalizedTarget = path.replace(/\/$/, '') || '/';
    return normalizedPath === normalizedTarget;
  });

  if (isHiddenPage) return null;

  const navItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'HOME', icon: Home, href: '/dashboard' },
    { label: language === 'ar' ? 'الخدمات' : 'SERVICES', icon: LayoutGrid, href: '/marketplace' },
    { label: 'center', icon: ScanLine, href: '#' },
    { label: language === 'ar' ? 'سحب' : 'WITHDRAW', icon: ArrowDownToLine, href: '/withdraw' },
    { 
      label: profile?.role === 'admin' 
        ? (language === 'ar' ? 'الإدارة' : 'ADMIN') 
        : profile?.role === 'agent'
          ? (language === 'ar' ? 'الوكالة' : 'AGENT')
          : (language === 'ar' ? 'حسابي' : 'PROFILE'), 
      icon: profile?.role === 'admin' 
        ? ShieldAlert 
        : profile?.role === 'agent'
          ? Briefcase
          : User, 
      href: profile?.role === 'admin' 
        ? '/admin' 
        : profile?.role === 'agent'
          ? '/agent'
          : '/profile/edit' 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-2 pointer-events-none w-full">
      <div className="mx-auto max-w-lg rounded-[2.5rem] flex items-center justify-between py-2 px-1 border bg-card/80 backdrop-blur-2xl shadow-2xl border-white/5 pointer-events-auto">
        {navItems.map((item, idx) => {
          if (item.label === 'center') {
            return (
              <div key="center-container" className="flex-1 flex justify-center items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setScannerOpen(true);
                  }}
                  className="relative -top-10 w-16 h-16 shrink-0 rounded-[1.5rem] bg-primary flex items-center justify-center border-4 border-background hover:scale-105 transition-all duration-300 gold-glow active:scale-95"
                >
                  <ScanLine size={28} className="text-primary-foreground" />
                </button>
              </div>
            );
          }

          const isActive = pathname === item.href || pathname === `${item.href}/`;
          return (
            <div key={item.label + idx} className="flex-1 flex justify-center items-center">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 rounded-2xl w-full max-w-[70px] h-16",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                <span className="text-[8px] font-headline font-black tracking-[0.15em] uppercase text-center leading-none">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
