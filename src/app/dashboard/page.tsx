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
  Plus,
  ArrowRight
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
    <div className="relative min-h-screen bg-gray-50 text-slate-900 font-body">
      {/* Light Theme Header */}
      <div className="relative max-w-lg mx-auto p-6 space-y-8 pb-32">
        <header className="flex justify-between items-center">
          <div className="z-10">
            <LanguageToggle />
          </div>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-headline font-black tracking-tighter text-indigo-600 leading-none">
              {t.brand}
            </h1>
            <span className="text-[10px] font-headline text-slate-400 tracking-widest uppercase font-bold">
              {t.subtitle}
            </span>
          </div>
        </header>

        {/* Modern Light Balance Hero Card */}
        <section className="relative animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/50 border border-slate-100 flex flex-col items-center text-center overflow-hidden relative">
            {/* Soft decorative background shape */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-slate-400">
              {t.totalBalance}
            </p>
            
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-5xl font-digital font-black text-slate-900">
                {balance?.toLocaleString()}
              </h2>
              <span className="text-xl font-headline text-indigo-600 font-black">USD</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-400 text-[9px] uppercase tracking-widest mb-6 font-bold">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {t.available}
            </div>

            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all group">
              <ShieldCheck className="h-3.5 w-3.5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-white">
                {t.smartProtection}
              </span>
            </button>
          </div>
        </section>

        {/* Action Buttons Row - Light Style */}
        <section className="grid grid-cols-3 gap-4">
          <Link href="/transfer" className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl shadow-md border border-slate-50 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t.send}</span>
          </Link>
          
          <Link href="/withdraw" className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl shadow-md border border-slate-50 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-all">
              <ArrowDownToLine className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t.withdraw}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{t.withdrawSub}</span>
            </div>
          </Link>

          <Link href="/marketplace" className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl shadow-md border border-slate-50 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-all">
              <LayoutGrid className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t.services}</span>
          </Link>
        </section>

        {/* Recent Transactions Section - Light Style */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-[0.1em] uppercase flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              {t.recent}
            </h3>
            <button className="text-[9px] text-indigo-600 hover:text-indigo-800 uppercase font-black tracking-widest flex items-center gap-1">
              {t.seeAll}
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">{t.noActivity}</p>
              </div>
            ) : (
              transactions.map((tx: Transaction) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center",
                      tx.type === 'receive' ? "bg-emerald-50 text-emerald-600" : 
                      "bg-slate-50 text-slate-600"
                    )}>
                      {tx.type === 'receive' ? <Plus className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-800">
                        {tx.type === 'send' && (language === 'ar' ? `تحويل إلى @${tx.recipient}` : `Sent to @${tx.recipient}`)}
                        {tx.type === 'receive' && (language === 'ar' ? 'شحن رصيد' : 'Deposit')}
                        {tx.type === 'withdraw' && (language === 'ar' ? 'طلب سحب' : 'Withdrawal')}
                        {tx.type === 'purchase' && (language === 'ar' ? tx.service : tx.service)}
                      </p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                        {language === 'ar' ? 'قبل ٢ ساعة' : '2 hours ago'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-digital text-sm font-black",
                      tx.type === 'receive' ? "text-emerald-600" : "text-slate-900"
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

      <BottomNav theme="light" />
    </div>
  );
}
