
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ArrowDownToLine, User, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';
import { useMemo } from 'react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

interface BottomNavProps {
  onQrClick?: () => void;
}

export function BottomNav({ onQrClick }: BottomNavProps) {
  const pathname = usePathname();
  const { language } = useStore();
  const { user } = useUser();
  const db = useFirestore();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-6 pb-8 pt-2 pointer-events-none">
      <div className="mx-auto max-w-lg rounded-[2.2rem] flex items-center justify-between py-2 px-2 border bg-card/80 backdrop-blur-2xl shadow-2xl border-white/5 pointer-events-auto">
        {navItems.map((item, idx) => {
          if (item.label === 'center') {
            return (
              <button
                key="center-btn"
                onClick={(e) => {
                  e.preventDefault();
                  onQrClick?.();
                }}
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
  );
}
