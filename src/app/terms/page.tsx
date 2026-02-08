
"use client"

import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Zap, AlertTriangle, Scale } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function TermsPage() {
  const router = useRouter();
  const { language } = useStore();

  const content = {
    en: {
      title: "TERMS OF SERVICE",
      subtitle: "Legal Governance & Operational Rules",
      sections: [
        {
          icon: Zap,
          h: "1. Activation of Identity",
          p: "By registering a FLASH ID, you enter a binding agreement with the FLASH Ecosystem. You represent that the information provided is accurate and that you are of legal age to manage digital assets in your jurisdiction."
        },
        {
          icon: Scale,
          h: "2. Asset Custody",
          p: "FLASH provides a secure interface for asset management. While we implement multi-layer encryption, you are solely responsible for maintaining the confidentiality of your Vault PIN and terminal credentials."
        },
        {
          icon: AlertTriangle,
          h: "3. Prohibited Exploitation",
          p: "Users are strictly prohibited from utilizing the FLASH network for fraudulent activities, money laundering, or unauthorized system probing. Violation of these protocols results in immediate asset freezing and entity termination."
        },
        {
          icon: FileText,
          h: "4. Settlement Terms",
          p: "Internal transfers (P2P) are final and irreversible once authorized via PIN. Withdrawal timelines are subject to global liquidity protocols and may take up to 48 hours for verification."
        }
      ]
    },
    ar: {
      title: "شروط الخدمة",
      subtitle: "الحوكمة القانونية والقواعد التشغيلية",
      sections: [
        {
          icon: Zap,
          h: "1. تفعيل الهوية",
          p: "من خلال تسجيل معرف فلاش، فإنك تدخل في اتفاقية ملزمة مع نظام فلاش البيئي. أنت تقر بأن المعلومات المقدمة دقيقة وأنك في السن القانوني لإدارة الأصول الرقمية في نطاقك القضائي."
        },
        {
          icon: Scale,
          h: "2. حضانة الأصول",
          p: "يوفر فلاش واجهة آمنة لإدارة الأصول. بينما نقوم بتنفيذ تشفير متعدد الطبقات، فأنت المسؤول الوحيد عن الحفاظ على سرية PIN الخزنة وبيانات اعتماد جهازك."
        },
        {
          icon: AlertTriangle,
          h: "3. الاستغلال المحظور",
          p: "يُمنع المستخدمون منعاً باتاً من استخدام شبكة فلاش في أنشطة احتيالية أو غسيل أموال أو فحص غير مصرح به للنظام. يؤدي انتهاك هذه البروتوكولات إلى تجميد الأصول فوراً وإنهاء الهوية."
        },
        {
          icon: FileText,
          h: "4. شروط التسوية",
          p: "التحويلات الداخلية (P2P) نهائية وغير قابلة للإلغاء بمجرد التصريح بها عبر الـ PIN. تخضع جداول السحب لبروتوكولات السيولة العالمية وقد تستغرق ما يصل إلى 48 ساعة للتحقق."
        }
      ]
    }
  };

  const t = language === 'ar' ? content.ar : content.en;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-12 animate-in fade-in duration-700">
      <header className="max-w-3xl mx-auto flex items-center gap-4 mb-12">
        <button onClick={() => router.back()} className="p-3 glass-card rounded-2xl hover:text-secondary transition-colors">
          <ChevronLeft className={cn("h-6 w-6", language === 'ar' && "rotate-180")} />
        </button>
        <div>
          <h1 className="text-xl font-headline font-bold tracking-widest uppercase text-secondary">{t.title}</h1>
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
              <div className="p-4 bg-secondary/10 rounded-2xl text-secondary shrink-0">
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

        <div className="p-8 border border-dashed border-secondary/20 rounded-[2.5rem] text-center">
          <p className="text-xs font-bold text-muted-foreground italic">
            {language === 'ar' ? 'باستخدامك لمنصة فلاش، فإنك توافق على الامتثال لهذه البروتوكولات.' : 'By utilizing the FLASH platform, you agree to comply with these operational protocols.'}
          </p>
        </div>
      </main>
    </div>
  );
}
