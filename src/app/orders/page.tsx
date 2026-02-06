
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Hash, 
  Copy,
  AlertCircle,
  Undo2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const ordersQuery = useMemo(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'service_requests'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [db, user?.uid]);

  const { data: orders = [], loading } = useCollection(ordersQuery);

  const pendingOrders = orders.filter((o: any) => o.status === 'pending');
  const completedOrders = orders.filter((o: any) => o.status === 'completed');
  const rejectedOrders = orders.filter((o: any) => o.status === 'rejected');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "CODE COPIED" });
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">Asset History</h1>
      </header>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/40 border border-white/5 rounded-2xl h-12 p-1">
          <TabsTrigger value="pending" className="rounded-xl text-[8px] font-headline uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background">
            Processing {pendingOrders.length > 0 && `(${pendingOrders.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl text-[8px] font-headline uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background">
            Secured
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-xl text-[8px] font-headline uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-background">
            Declined
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : (
            <>
              <TabsContent value="pending" className="space-y-4">
                {pendingOrders.length === 0 ? (
                  <div className="py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
                    <Clock className="mx-auto text-muted-foreground mb-3 opacity-20" size={32} />
                    <p className="text-[10px] font-headline font-bold text-muted-foreground uppercase">No pending assets</p>
                  </div>
                ) : (
                  pendingOrders.map((o: any) => (
                    <div key={o.id} className="glass-card p-6 rounded-3xl border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><ShoppingBag size={20} /></div>
                          <div>
                            <p className="text-[10px] font-headline font-bold uppercase">{o.serviceName}</p>
                            <p className="text-[7px] text-muted-foreground uppercase">{o.selectedVariant || "Fixed Unit"}</p>
                          </div>
                        </div>
                        <p className="text-sm font-headline font-black text-primary">${o.price}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                        <span className="text-[8px] text-muted-foreground uppercase font-black">Status:</span>
                        <Badge variant="outline" className="text-[7px] uppercase border-yellow-500/40 text-yellow-500 h-5">Reviewing Protocol</Badge>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedOrders.length === 0 ? (
                  <div className="py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
                    <CheckCircle2 className="mx-auto text-muted-foreground mb-3 opacity-20" size={32} />
                    <p className="text-[10px] font-headline font-bold text-muted-foreground uppercase">No secured assets yet</p>
                  </div>
                ) : (
                  completedOrders.map((o: any) => (
                    <div key={o.id} className="glass-card p-6 rounded-3xl border-primary/10 gold-glow space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20"><CheckCircle2 size={20} /></div>
                          <div>
                            <p className="text-[10px] font-headline font-bold uppercase">{o.serviceName}</p>
                            <p className="text-[7px] text-muted-foreground uppercase">{new Date(o.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-[7px] uppercase h-5">Success</Badge>
                      </div>
                      
                      {o.resultCode && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl space-y-2">
                          <p className="text-[8px] text-green-500 font-black uppercase tracking-widest">Asset Key / Code:</p>
                          <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                            <code className="text-xs font-headline font-bold text-white tracking-widest">{o.resultCode}</code>
                            <button onClick={() => copyCode(o.resultCode)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Copy size={14} className="text-green-500" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {rejectedOrders.length === 0 ? (
                  <div className="py-20 text-center glass-card rounded-3xl border-dashed border-white/10">
                    <XCircle className="mx-auto text-muted-foreground mb-3 opacity-20" size={32} />
                    <p className="text-[10px] font-headline font-bold text-muted-foreground uppercase">System record is clean</p>
                  </div>
                ) : (
                  rejectedOrders.map((o: any) => (
                    <div key={o.id} className="glass-card p-6 rounded-3xl border-red-500/10 space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20"><XCircle size={20} /></div>
                          <div>
                            <p className="text-[10px] font-headline font-bold uppercase">{o.serviceName}</p>
                            <p className="text-[7px] text-muted-foreground uppercase">{new Date(o.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-[7px] uppercase h-5">Rejected</Badge>
                      </div>

                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle size={12} />
                          <p className="text-[8px] font-black uppercase tracking-widest">Administrator Note:</p>
                        </div>
                        <p className="text-[10px] font-headline text-white/80 italic leading-relaxed">"{o.rejectionReason || "No specific reason provided."}"</p>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Undo2 size={12} className="text-blue-400" />
                        <p className="text-[8px] font-headline font-bold uppercase text-blue-400 tracking-tight">Funds Returned: ${o.price} credited back to vault.</p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
