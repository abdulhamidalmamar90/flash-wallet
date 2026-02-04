
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
  Wallet,
  Settings,
  LogOut,
  Copy,
  ChevronDown,
  X,
  Building2,
  Smartphone,
  CreditCard,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { code: 'SA', name: 'المملكة العربية السعودية', flag: '🇸🇦', prefix: '+966' },
  { code: 'EG', name: 'جمهورية مصر العربية', flag: '🇪🇬', prefix: '+20' },
  { code: 'AE', name: 'الإمارات العربية المتحدة', flag: '🇦🇪', prefix: '+971' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼', prefix: '+965' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦', prefix: '+974' },
  { code: 'TR', name: 'تركيا', flag: '🇹🇷', prefix: '+90' },
  { code: 'US', name: 'الولايات المتحدة', flag: '🇺🇸', prefix: '+1' },
  { code: 'UK', name: 'المملكة المتحدة', flag: '🇬🇧', prefix: '+44' },
  { code: 'DE', name: 'ألمانيا', flag: '🇩🇪', prefix: '+49' },
];

export default function Dashboard() {
  const store = useStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Withdrawal Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const userId = "883-292-10";

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
    idCopied: language === 'ar' ? 'تم نسخ معرف الحساب!' : 'Account ID copied!',
    editAccount: language === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account Info',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
    withdrawHeader: language === 'ar' ? 'سحب بنكي' : 'Bank Withdrawal',
    confirmWithdraw: language === 'ar' ? 'تأكيد طلب السحب' : 'Confirm Withdrawal',
    beneficiaryName: language === 'ar' ? 'اسم المستفيد (كما في البنك)' : 'Beneficiary Name',
    ibanLabel: language === 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN Number',
    phoneLabel: language === 'ar' ? 'رقم الهاتف المرتبط' : 'Associated Phone',
    countryLabel: language === 'ar' ? 'الدولة' : 'Country',
    showQr: language === 'ar' ? 'إظهار QR Code' : 'Show QR Code',
    myFlashId: language === 'ar' ? 'My Flash ID' : 'My Flash ID',
    scanToPay: language === 'ar' ? 'امسح الكود لإرسال الأموال فوراً' : 'Scan to send money instantly'
  };

  const handleCopyId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(userId);
    toast({
      title: t.idCopied,
      description: userId
    });
  };

  const handleConfirmWithdrawal = () => {
    toast({
      title: language === 'ar' ? 'تم استلام طلبك' : 'Request Received',
      description: language === 'ar' ? 'سيتم مراجعة طلب السحب فوراً' : 'Withdrawal request is being reviewed.',
    });
    setIsWithdrawModalOpen(false);
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white font-body pb-32 relative overflow-hidden"
      onClick={() => {
        setIsProfileOpen(false);
        setIsCountryDropdownOpen(false);
      }}
    >
      
      {/* Aesthetic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00f3ff]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* ================= QR Code Modal ================= */}
      {isQrModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div 
            className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(212,175,55,0.4)] transform scale-100 animate-in zoom-in-95 duration-300 relative text-center max-w-[90%] w-[340px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
               <h3 className="text-black font-headline font-black text-xl uppercase tracking-tighter">{t.myFlashId}</h3>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{t.scanToPay}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-[#D4AF37]/20 mx-auto w-fit shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${userId}&color=000000&bgcolor=ffffff`} 
                alt="User QR Code" 
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <div 
              className="mt-6 bg-gray-100 py-3 px-6 rounded-2xl inline-flex items-center gap-3 cursor-pointer group hover:bg-gray-200 transition-colors"
              onClick={() => handleCopyId()}
            >
              <span className="text-black font-headline font-black tracking-widest text-lg">{userId}</span>
              <Copy size={16} className="text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
            </div>
            
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
               <button 
                 onClick={() => setIsQrModalOpen(false)}
                 className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-90"
               >
                 <X size={24} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Bank Withdrawal Modal ================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsWithdrawModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg bg-[#0f0f0f] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                <Building2 className="text-[#D4AF37]" />
                {t.withdrawHeader}
              </h2>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="relative z-50">
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.countryLabel}</label>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCountryDropdownOpen(!isCountryDropdownOpen);
                  }}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3.5 hover:border-[#D4AF37]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium">{selectedCountry.name}</span>
                  </div>
                  <ChevronDown size={16} className={cn("text-white/40 transition-transform", isCountryDropdownOpen && "rotate-180")} />
                </button>

                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsCountryDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-right border-b border-white/5 last:border-0 transition-colors"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-sm text-white/80">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.beneficiaryName}</label>
                <div className="relative group">
                  <div className="absolute right-4 top-3.5 text-white/30 group-focus-within:text-[#D4AF37] transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder={language === 'ar' ? 'الاسم الثلاثي' : 'Full Legal Name'} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.ibanLabel}</label>
                <div className="relative group">
                  <div className="absolute right-4 top-3.5 text-white/30 group-focus-within:text-[#D4AF37] transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder={`${selectedCountry.code}00 0000 0000 0000 0000 00`} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all text-left font-mono"
                    style={{direction: 'ltr'}} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2 font-bold uppercase tracking-widest">{t.phoneLabel}</label>
                <div className="flex gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 flex items-center justify-center text-white/60 font-mono text-sm min-w-[70px]">
                    {selectedCountry.prefix}
                  </div>
                  <div className="relative group flex-1">
                    <div className="absolute right-4 top-3.5 text-white/30 group-focus-within:text-[#D4AF37] transition-colors">
                      <Smartphone size={18} />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="50 123 4567" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all text-left font-mono"
                      style={{direction: 'ltr'}}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button 
                onClick={handleConfirmWithdrawal}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-headline font-black py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>{t.confirmWithdraw}</span>
                <ArrowUpRight size={20} className="rotate-45" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex justify-between items-center p-6 pt-8 relative z-[60]">
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileOpen(!isProfileOpen);
            }}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:border-[#D4AF37]/30 transition-all">
              <User size={20} className="text-[#D4AF37]" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-widest">{t.welcome}</p>
              <div className="flex items-center gap-1">
                <p className="font-headline font-bold text-sm tracking-wide">{username}</p>
                <ChevronDown size={12} className={cn("text-white/40 transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className={cn(
                "absolute top-14 w-64 bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[70]",
                language === 'ar' ? 'right-0' : 'left-0'
              )}
            >
              <div className="p-4 border-b border-white/5 bg-white/5">
                <p className="text-sm font-headline font-bold text-white mb-1 uppercase">{username} Kamel</p>
                <p className="text-[10px] text-white/50 mb-3 lowercase tracking-tight">mostafa@flash.digital</p>
                
                <div 
                  className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5 group cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={(e) => handleCopyId(e)}
                >
                  <span className="text-[10px] text-[#D4AF37] font-headline tracking-wider">ID: {userId}</span>
                  <Copy size={12} className="text-white/40 group-hover:text-white transition-colors" />
                </div>

                <button 
                  onClick={() => {
                    setIsQrModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <QrCode size={14} className="text-white/40 group-hover:text-primary transition-colors" />
                  <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-white/40 group-hover:text-white">{t.showQr}</span>
                </button>
              </div>

              <div className="p-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-white transition-all text-right">
                  <Settings size={16} className="text-[#00f3ff]" />
                  {t.editAccount}
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-widest text-white/80 hover:text-red-400 transition-all text-right mt-1">
                  <LogOut size={16} />
                  {t.logout}
                </button>
              </div>
            </div>
          )}
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

        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="flex flex-col items-center gap-3 group"
        >
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-[#00f3ff]/30 transition-all duration-300">
            <ArrowDownLeft size={28} className="text-[#00f3ff]" />
          </div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-white/80">{t.withdraw}</span>
        </button>

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
        
        <div className="relative -top-10">
          <div 
            className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)] border-4 border-[#0a0a0a] active:scale-95 transition-transform cursor-pointer"
            onClick={() => setIsQrModalOpen(true)}
          >
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
