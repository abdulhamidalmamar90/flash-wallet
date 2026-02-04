
"use client"

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useStore, Transaction } from '@/app/lib/store';
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ShoppingBag, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export default function Dashboard() {
  const store = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { balance, transactions, username, language } = store;

  const t = {
    welcome: language === 'ar' ? 'مرحباً بعودتك،' : 'Welcome back,',
    balance: language === 'ar' ? 'إجمالي الرصيد' : 'Total Balance',
    trending: language === 'ar' ? '+2.5% هذا الشهر' : '+2.5% this month',
    send: language === 'ar' ? 'إرسال' : 'Send',
    withdraw: language === 'ar' ? 'سحب' : 'Withdraw',
    services: language === 'ar' ? 'خدمات' : 'Services',
    activity: language === 'ar' ? 'النشاط الأخير' : 'Recent Activity',
    seeAll: language === 'ar' ? 'عرض الكل' : 'See All',
    noActivity: language === 'ar' ? 'لم يتم العثور على نشاط' : 'No activity found',
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="font-headline text-primary font-bold">{username.charAt(0)}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{t.welcome}</p>
            <p className="font-headline font-bold text-sm tracking-wide">{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full animate-pulse-slow" />
            <Zap className="h-6 w-6 text-secondary relative" />
          </div>
        </div>
      </header>

      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative glass-card p-8 rounded-3xl space-y-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 circuit-pattern translate-x-12 -translate-y-12" />
          <div className="space-y-1">
            <p className="text-xs font-headline text-muted-foreground tracking-[0.2em]">{t.balance}</p>
            <h2 className="text-5xl font-headline font-black text-primary tracking-tight">
              ${balance?.toLocaleString()}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-secondary text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            <span className="uppercase tracking-widest">{t.trending}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Link href="/transfer" className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl group transition-all duration-300 hover:cyan-glow">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover:bg-secondary/20 transition-all">
            <ArrowUpRight className="h-6 w-6 text-secondary" />
          </div>
          <span className="text-[10px] font-headline font-bold text-center tracking-tighter">{t.send}</span>
        </Link>
        <Link href="/withdraw" className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl group transition-all duration-300 hover:gold-glow">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
            <ArrowDownLeft className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[10px] font-headline font-bold text-center tracking-tighter">{t.withdraw}</span>
        </Link>
        <Link href="/marketplace" className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl group transition-all duration-300 hover:cyan-glow">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover:bg-secondary/20 transition-all">
            <ShoppingBag className="h-6 w-6 text-secondary" />
          </div>
          <span className="text-[10px] font-headline font-bold text-center tracking-tighter">{t.services}</span>
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-headline font-bold text-muted-foreground tracking-widest">{t.activity}</h3>
          <button className="text-[10px] text-primary hover:underline uppercase font-bold tracking-widest">{t.seeAll}</button>
        </div>
        
        <div className="space-y-3 pb-24">
          {transactions.length === 0 ? (
            <div className="text-center py-10 glass-card rounded-3xl border-dashed border-white/5">
              <p className="text-muted-foreground text-xs uppercase tracking-widest">{t.noActivity}</p>
            </div>
          ) : (
            transactions.map((tx: Transaction) => (
              <div key={tx.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    tx.type === 'send' ? "bg-red-500/10 border-red-500/20 text-red-400" : 
                    tx.type === 'withdraw' ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                    tx.type === 'purchase' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                    "bg-green-500/10 border-green-500/20 text-green-400"
                  )}>
                    {tx.type === 'send' && <ArrowUpRight className="h-5 w-5" />}
                    {tx.type === 'withdraw' && <Wallet className="h-5 w-5" />}
                    {tx.type === 'purchase' && <ShoppingBag className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {tx.type === 'send' && (language === 'ar' ? `تم الإرسال إلى @${tx.recipient}` : `Sent to @${tx.recipient}`)}
                      {tx.type === 'withdraw' && (language === 'ar' ? 'طلب سحب' : 'Withdrawal Request')}
                      {tx.type === 'purchase' && (language === 'ar' ? `قسيمة: ${tx.service}` : `Voucher: ${tx.service}`)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-headline text-sm font-bold",
                    tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase' ? "text-foreground" : "text-primary"
                  )}>
                    {tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase' ? '-' : '+'}${tx.amount}
                  </p>
                  <Badge variant="outline" className={cn(
                    "text-[8px] px-1 py-0 h-4 border-none uppercase tracking-[0.2em] font-bold",
                    tx.status === 'completed' ? "text-primary" : 
                    tx.status === 'pending' ? "text-orange-400" : "text-red-400"
                  )}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
