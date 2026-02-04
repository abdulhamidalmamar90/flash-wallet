
"use client"

import { useMemo } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Check, X, Building2, Bitcoin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, increment, query, orderBy, runTransaction } from 'firebase/firestore';

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const withdrawalsQuery = useMemo(() => query(
    collection(db, 'withdrawals'),
    orderBy('date', 'desc')
  ), [db]);
  
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const handleApprove = async (id: string) => {
    const ref = doc(db, 'withdrawals', id);
    await updateDoc(ref, { status: 'approved' });
    toast({ title: "WITHDRAWAL APPROVED", description: "System has finalized the transaction." });
  };

  const handleReject = async (id: string, userId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'withdrawals', id);
        const userRef = doc(db, 'users', userId);
        
        transaction.update(reqRef, { status: 'rejected' });
        transaction.update(userRef, { balance: increment(amount) });
        
        // Also update the local transaction record for the user
        // Note: In a real app, you'd find the specific tx ID stored in the user's subcollection
      });
      toast({ variant: "destructive", title: "WITHDRAWAL REJECTED", description: "Funds have been returned to user vault." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <header className="flex justify-between items-center p-4 glass-card rounded-2xl border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-sm font-headline font-bold tracking-widest">ADMIN COMMAND</h1>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-widest font-black uppercase text-primary border-primary/30">Superuser Access</Badge>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-headline font-bold text-muted-foreground tracking-widest uppercase">Pending Requests</h3>
          <span className="text-[10px] font-headline text-primary">{withdrawals.filter(w => w.status === 'pending').length} Action(s) required</span>
        </div>

        <div className="space-y-4 pb-24">
          {withdrawals.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border-dashed border-white/5 opacity-50">
              <Clock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-[10px] font-headline uppercase tracking-widest">No requests in queue</p>
            </div>
          ) : (
            withdrawals.map((req: any) => (
              <div key={req.id} className="glass-card p-5 rounded-3xl space-y-4 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                      {req.type === 'bank' ? <Building2 className="h-5 w-5 text-primary" /> : <Bitcoin className="h-5 w-5 text-secondary" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide">@{req.username}</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">Request ID: {req.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-headline font-black text-primary">${req.amount}</p>
                    <Badge className={cn(
                      "text-[8px] px-1 py-0 h-4 border-none uppercase tracking-widest font-black",
                      req.status === 'pending' ? "bg-orange-500/20 text-orange-400" :
                      req.status === 'approved' ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400"
                    )}>
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleApprove(req.id)} className="flex-1 h-10 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-background transition-all">
                      <Check className="h-4 w-4" /><span className="text-[9px] font-headline font-bold tracking-widest">APPROVE</span>
                    </button>
                    <button onClick={() => handleReject(req.id, req.userId, req.amount)} className="flex-1 h-10 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                      <X className="h-4 w-4" /><span className="text-[9px] font-headline font-bold tracking-widest">REJECT</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      <BottomNav />
    </div>
  );
}
