
"use client"

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  LayoutDashboard, 
  Loader2, 
  Users, 
  TrendingUp, 
  Wallet, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AgentPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile && (profile as any).role !== 'agent' && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "AGENT ACCESS ONLY" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast]);

  if (authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-secondary/20 cyan-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-secondary/10 rounded-xl transition-all text-secondary group">
            <LayoutDashboard className="h-6 w-6 group-hover:scale-110" />
          </Link>
          <div>
            <h1 className="text-xs font-headline font-bold tracking-widest uppercase">Agent Command</h1>
            <p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Sub-Shell v1.0</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-secondary border-secondary/30 py-1">Verified Agent</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary"><TrendingUp size={20} /></div>
            <Badge className="bg-green-500/20 text-green-500 text-[7px] uppercase">Active</Badge>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-headline">Portfolio Value</p>
            <p className="text-2xl font-headline font-black text-white">$0.00</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users size={20} /></div>
            <Badge variant="outline" className="text-[7px] uppercase">Network</Badge>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-headline">Managed Clients</p>
            <p className="text-2xl font-headline font-black text-white">0</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-white/5 rounded-xl text-white"><Zap size={20} /></div>
            <Badge className="bg-secondary/20 text-secondary text-[7px] uppercase">Tier 1</Badge>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-headline">Protocol Status</p>
            <p className="text-2xl font-headline font-black text-white">Operational</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center space-y-6 py-20">
        <div className="w-20 h-20 bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center text-secondary animate-pulse">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-headline font-bold uppercase tracking-widest text-white">Initializing Agent Sub-System</h2>
          <p className="text-[10px] text-muted-foreground uppercase max-w-xs mx-auto leading-relaxed">
            The Agent Management protocols are being calibrated. Functional modules will appear here following next deployment phase.
          </p>
        </div>
        <Button variant="outline" className="h-12 px-8 rounded-xl border-secondary/20 text-secondary hover:bg-secondary hover:text-background font-headline text-[9px] uppercase tracking-widest">
          Request Feature Access <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
