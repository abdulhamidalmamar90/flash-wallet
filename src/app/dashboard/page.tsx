"use client"

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useStore, Transaction } from '@/app/lib/store';
import { 
  Send, 
  ArrowDownToLine, 
  LayoutGrid, 
  ShieldCheck, 
  TrendingUp,
  History,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export default function Dashboard() {
  const store = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { balance, transactions, language } = store;

  const t = {
    brand: "FLASH",
    subtitle: language === 'ar' ? 'محفظة مستقبلية' : 'Future Wallet',
    totalBalance: language === 'ar' ? 'الرصيد الكلي' : 'Total Balance',
    available: language === 'ar' ? 'متاح للاستخدام فوراً' : 'Available for immediate use',
    smartProtection: language === 'ar' ? 'حماية ذكية' : 'Smart Shield',
    send: language === 'ar' ? 'إرسال' : 'Send',
    withdraw: language === 'ar' ? 'سحب' : 'Withdraw',
    withdrawSub: language === 'ar' ? 'بلا فيزا' : 'No Card',
    services: language === 'ar' ? 'خدمات' : 'Services',
    recent: language === 'ar' ? 'آخر العمليات' : 'Recent Transactions',
    seeAll: language === 'ar' ? 'عرض الكل' : 'See All',
    noActivity: language === 'ar' ? 'لا توجد عمليات' : 'No transactions found',
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 grid-overlay pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto p-6 space-y-8 pb-32">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="z-10">
            <LanguageToggle />
          </div>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-headline font-black tracking-widest text-white leading-none">
              {t.brand}
            </h1>
            <span className="text-[10px] font-headline text-secondary tracking-widest uppercase opacity-80">
              {t.subtitle}
            </span>
          </div>
        </header>

        {/* Main Balance Hero Card */}
        <section className="relative group animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="absolute -inset-0.5 bg-secondary/10 blur-2xl rounded-[2rem]" />
          <div className="relative glass-card p-8 rounded-[2rem] cyan-glow-border flex flex-col items-center text-center overflow-hidden">
            {/* Abstract decorative element */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
            
            <p className="text-[10px] font-headline uppercase tracking-[0.3em] mb-4 text-white/60">
              {t.totalBalance}
            </p>
            
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-5xl font-digital font-black gold-text">
                {balance?.toLocaleString()}
              </h2>
              <span className="text-xl font-headline text-white/40">USD</span>
            </div>
            
            <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-widest mb-6 font-medium">
              <TrendingUp className="h-3 w-3 text-secondary" />
              {t.available}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 glass-card rounded-full border-white/5 hover:bg-white/10 transition-all group">
              <ShieldCheck className="h-3 w-3 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-headline font-bold uppercase tracking-widest">
                {t.smartProtection}
              </span>
            </button>
          </div>
        </section>

        {/* Action Buttons Row */}
        <section className="grid grid-cols-3 gap-3">
          <Link href="/transfer" className="flex flex-col items-center gap-3 p-4 glass-card rounded-2xl group transition-all duration-300 hover:border-secondary/40">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover:bg-secondary/20 transition-all neon-cyan">
              <Send className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest">{t.send}</span>
          </Link>
          
          <Link href="/withdraw" className="flex flex-col items-center gap-3 p-4 glass-card rounded-2xl group transition-all duration-300 hover:border-primary/40">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-headline font-bold uppercase tracking-widest">{t.withdraw}</span>
              <span className="text-[7px] text-white/40 font-headline uppercase tracking-tighter">{t.withdrawSub}</span>
            </div>
          </Link>

          <Link href="/marketplace" className="flex flex-col items-center gap-3 p-4 glass-card rounded-2xl group transition-all duration-300 hover:border-secondary/40">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 group-hover:bg-secondary/20 transition-all neon-cyan">
              <LayoutGrid className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest">{t.services}</span>
          </Link>
        </section>

        {/* Recent Transactions Section */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-headline font-bold text-white/60 tracking-[0.2em] uppercase flex items-center gap-2">
              <History className="h-3 w-3" />
              {t.recent}
            </h3>
            <button className="text-[8px] text-secondary hover:underline uppercase font-bold tracking-widest">
              {t.seeAll}
            </button>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 glass-card rounded-2xl border-dashed border-white/5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest">{t.noActivity}</p>
              </div>
            ) : (
              transactions.map((tx: Transaction) => (
                <div key={tx.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      tx.type === 'receive' ? "bg-secondary/10 border-secondary/20 text-secondary" : 
                      "bg-white/5 border-white/10 text-white/60"
                    )}>
                      {tx.type === 'receive' ? <Plus className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        {tx.type === 'send' && (language === 'ar' ? `تحويل إلى @${tx.recipient}` : `Sent to @${tx.recipient}`)}
                        {tx.type === 'receive' && (language === 'ar' ? 'شحن رصيد' : 'Deposit')}
                        {tx.type === 'withdraw' && (language === 'ar' ? 'طلب سحب' : 'Withdrawal')}
                        {tx.type === 'purchase' && (language === 'ar' ? tx.service : tx.service)}
                      </p>
                      <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">
                        {language === 'ar' ? 'قبل ٢ ساعة' : '2 hours ago'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-headline text-xs font-bold",
                      tx.type === 'receive' ? "text-secondary" : "text-white"
                    )}>
                      {tx.type === 'receive' ? '+' : '-'}${tx.amount}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}