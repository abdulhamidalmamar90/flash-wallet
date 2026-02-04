"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Send, ShoppingBag, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Transfer', icon: Send, href: '/transfer' },
    { label: 'Market', icon: ShoppingBag, href: '/marketplace' },
    { label: 'Admin', icon: ShieldCheck, href: '/admin' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="mx-auto max-w-lg glass-card rounded-2xl flex items-center justify-around py-3 px-2 border-white/5 cyan-glow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 transition-all duration-300 rounded-xl",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "animate-pulse-slow")} />
              <span className="text-[10px] font-medium tracking-tighter uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}