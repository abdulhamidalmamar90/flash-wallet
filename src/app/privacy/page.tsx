
"use client"

import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function PrivacyPage() {
  const router = useRouter();
  const { language } = useStore();

  const content = {
    en: {
      title: "PRIVACY PROTOCOL",
      subtitle: "Data Protection & Encryption Standards",
      sections: [
        {
          icon: ShieldCheck,
          h: "1. Data Sovereignty",
          p: "At FLASH, we prioritize your financial sovereignty. Your personal identifiers, including your Flash ID and biometric hashes, are encrypted using AES-256 standards and stored in isolated high-security environments."
        },
        {
          icon: Database,
          h: "2. Information Acquisition",
          p: "We collect only essential data required for financial settlements: username, email, phone number, and transaction metadata. We do not track location or sell user behavior patterns to third-party entities."
        },
        {
          icon: Lock,
          h: "3. Cryptographic Security",
          p: "All communication between your terminal and our core infrastructure is secured via TLS 1.3. Your Vault PIN is never stored in plain text and cannot be accessed by FLASH administrative staff."
        },
        {
          icon: Eye,
          h: "4. Oversight & Transparency",
          p: "Users have the right to request a full extract of their ledger and personal data at any time. We maintain a zero-knowledge architecture regarding your private financial interactions."
        }
      ]
    },
    ar: {
      title: "بروتوكول الخصوصية",
      subtitle: "معايير حماية البيانات والتشفير",
      sections: [
        {
          icon: ShieldCheck,
          h: "1. سيادة البيانات",
          p: "في فلاش، نضع سيادتك المالية على رأس أولوياتنا. يتم تشفير معرفاتك الشخصية، بما في ذلك معرف فلاش الخاص بك وبصماتك الرقمية، باستخدام معايير AES-256 وتخزينها في بيئات معزولة عالية الأمان."
        },
        {
          icon: Database,
          h: "2. الحصول على المعلومات",
          p: "نجمع فقط البيانات الأساسية المطلوبة للتسويات المالية: اسم المستخدم، البريد الإلكتروني، رقم الهاتف، وبيانات العمليات. نحن لا نتتبع الموقع أو نبيع أنماط سلوك المستخدم لجهات خارجية."
        },
        {
          icon: Lock,
          h: "3. الأمن التشفيري",
          p: "يتم تأمين جميع الاتصالات بين جهازك وبنيتنا التحتية الأساسية عبر TLS 1.3. لا يتم تخزين PIN الخزنة الخاص بك كنص عادي ولا يمكن لموظفي فلاش الوصول إليه."
        },
        {
          icon: Eye,
          h: "4. الرقابة والشفافية",
          p: "للمستخدمين الحق في طلب مستخرج كامل لسجلاتهم وبياناتهم الشخصية في أي وقت. نحن نحافظ على بنية (Zero-Knowledge) فيما يتعلق بتفاعلاتك المالية الخاصة."
        }
      ]
    }
  };

  const t = language === 'ar' ? content.ar : content.en;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-12 animate-in fade-in duration-700">
      <header className="max-w-3xl mx-auto flex items-center gap-4 mb-12">
        <button onClick={() => router.back()} className="p-3 glass-card rounded-2xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-6 w-6", language === 'ar' && "rotate-180")} />
        </button>
        <div>
          <h1 className="text-xl font-headline font-bold tracking-widest uppercase text-primary">{t.title}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.subtitle}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-8 pb-20">
        {t.sections.map((section, idx) => (
          <div key={idx} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <section.icon size={120} />
            </div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                <section.icon size={24} />
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-headline font-bold uppercase tracking-tight text-white">{section.h}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {section.p}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="p-8 border border-dashed border-primary/20 rounded-[2.5rem] text-center">
          <p className="text-[10px] font-headline text-primary/60 uppercase tracking-widest">
            {language === 'ar' ? 'آخر تحديث: فبراير 2025' : 'Last Synchronization: February 2025'}
          </p>
        </div>
      </main>
    </div>
  );
}
