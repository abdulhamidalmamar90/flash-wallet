"use client"

import { useEffect, useState } from 'react';
import { useStore, Transaction } from '@/app/lib/store';
import { 
  Send, 
  Download, 
  LayoutGrid, 
  Bell, 
  User, 
  Home, 
  ScanLine, 
  ArrowUpRight, 
  ArrowDownLeft,
  Wallet
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

  const { balance, transactions, language, username } = store;

  const t = {
    brand: "FLASH",
    welcome: language === 'ar' ? 'مرحباً بك،' : 'Welcome,',
    totalBalance: language === 'ar' ? 'الرصيد الكلي' : 'Total Balance',
    secured: language === 'ar' ? 'مؤمن ومحمي' : 'Secured & Protected',
    send: language === 'ar' ? 'إرسال' : 'Send',
    withdraw: language === 'ar' ? 'سحب' : 'Withdraw',
    services: language === 'ar' ? 'خدمات' : 'Services',
    recent: language === 'ar' ? 'آخر العمليات' : 'Recent Transactions',
    seeAll: language === 'ar' ? 'عرض الكل' : 'See All',
    home: language === 'ar' ? 'الرئيسية' : 'Home',
    wallet: language === 'ar' ? 'المحفظة' : 'Wallet',
    profile: language === 'ar' ? 'حسابي' : 'Profile',
    noActivity: language === 'ar' ? 'لا توجد عمليات' : 'No transactions found',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-body pb-32 relative overflow-hidden">
      
      {/* Aesthetic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00f3ff]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Section */}
      <header className="flex justify-between items-center p-6 pt-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <User size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] text-white/60 uppercase tracking-widest">{t.welcome}</p>
            <p className="font-headline font-bold text-sm tracking-wide">{username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="relative">
            <Bell size={24} className="text-white/80" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D4AF37] rounded-full border-2 border-[#0a0a0a]"></span>
          </div>
        </div>
      </header>

      {/* Hero Balance Card */}
      <section className="px-6 mb-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="relative w-full p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group">
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] mb-4 font-bold">{t.totalBalance}</p>
            <h1 className="text-5xl font-headline font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
              ${balance?.toLocaleString()}<span className="text-2xl text-white/20">.00</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/20">
              <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse"></span>
              <span className="text-[9px] text-[#00f3ff] tracking-[0.2em] font-black uppercase">{t.secured}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons grid */}
      <section className="px-6 grid grid-cols-3 gap-6 mb-10 relative z-10">
        <Link href="/transfer" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37] flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-all duration-300">
            <ArrowUpRight size={28} className="text-black" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.send}</span>
        </Link>

        <Link href="/withdraw" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-[#00f3ff]/30 transition-all duration-300">
            <ArrowDownLeft size={28} className="text-[#00f3ff]" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.withdraw}</span>
        </Link>

        <Link href="/marketplace" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all duration-300">
            <LayoutGrid size={28} className="text-white" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.services}</span>
        </Link>
      </section>

      {/* Transactions Feed */}
      <section className="px-6 rounded-t-[3rem] bg-white/[0.03] border-t border-white/5 min-h-[500px] backdrop-blur-md pt-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-sm font-headline font-black uppercase tracking-widest text-white">{t.recent}</h3>
          <button className="text-[10px] font-headline font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">{t.seeAll}</button>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-[2rem] border border-dashed border-white/5">
              <p className="text-white/30 text-[10px] font-headline font-bold uppercase tracking-widest">{t.noActivity}</p>
            </div>
          ) : (
            transactions.map((tx: Transaction) => (
              <div key={tx.id} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-black/40 border border-white/5 hover:border-white/15 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    tx.type === 'receive' ? "bg-[#00f3ff]/10 text-[#00f3ff]" : "bg-red-500/10 text-red-500"
                  )}>
                    {tx.type === 'receive' ? <Download size={20} /> : <Send size={20} />}
                  </div>
                  <div>
                    <p className="font-headline font-black text-[11px] uppercase tracking-wide text-white">
                       {tx.type === 'send' && (language === 'ar' ? `تحويل إلى @${tx.recipient}` : `Sent to @${tx.recipient}`)}
                       {tx.type === 'receive' && (language === 'ar' ? 'شحن رصيد' : 'Deposit')}
                       {tx.type === 'withdraw' && (language === 'ar' ? 'طلب سحب' : 'Withdrawal')}
                       {tx.type === 'purchase' && tx.service}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">
                      {language === 'ar' ? 'قبل قليل' : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-headline font-black text-sm",
                    tx.type === 'receive' ? "text-[#00f3ff]" : "text-white"
                  )}>
                    {tx.type === 'receive' ? '+' : '-'}${tx.amount}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 px-8 py-5 flex justify-between items-center z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1.5 text-[#D4AF37]">
          <Home size={22} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.home}</span>
        </Link>
        <button className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-colors">
          <Wallet size={22} />
          <span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.wallet}</span>
        </button>
        
        {/* Floating QR Center Button */}
        <div className="relative -top-10">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)] border-4 border-[#0a0a0a] active:scale-95 transition-transform">
            <ScanLine size={28} className="text-black" />
          </div>
        </div>

        <Link href="/marketplace" className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-colors">
          <LayoutGrid size={22} />
          <span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.services}</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-colors">
          <User size={22} />
          <span className="text-[8px] font-headline font-black uppercase tracking-widest">{t.profile}</span>
        </Link>
      </nav>

    </div>
  );
}
