"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ArrowDownToLine, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';

interface BottomNavProps {
  theme?: 'dark' | 'light';
}

export function BottomNav({ theme = 'dark' }: BottomNavProps) {
  const pathname = usePathname();
  const store = useStore();
  const language = store.language;

  const navItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', icon: Home, href: '/dashboard' },
    { label: language === 'ar' ? 'الخدمات' : 'QR/Services', icon: LayoutGrid, href: '/marketplace' },
    { label: language === 'ar' ? 'سحب' : 'Withdraw', icon: ArrowDownToLine, href: '/withdraw' },
    { label: language === 'ar' ? 'حسابي' : 'Profile', icon: User, href: '/admin' },
  ];

  const isLight = theme === 'light';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-2">
      <div className={cn(
        "mx-auto max-w-lg rounded-[2rem] flex items-center justify-around py-3 px-2 border transition-all duration-300",
        isLight 
          ? "bg-white/80 backdrop-blur-xl border-slate-100 shadow-xl shadow-indigo-100/30" 
          : "glass-card border-white/5 cyan-glow-border"
      )}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-300 rounded-2xl",
                isActive 
                  ? (isLight ? "text-indigo-600 bg-indigo-50" : "text-secondary bg-secondary/10") 
                  : (isLight ? "text-slate-400 hover:text-indigo-600" : "text-white/40 hover:text-white")
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && !isLight && "neon-cyan")} />
              <span className="text-[7px] font-headline font-black tracking-widest uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
