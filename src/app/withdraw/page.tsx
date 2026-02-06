"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Building2, Bitcoin, ChevronLeft, CreditCard, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, collection, increment, runTransaction } from 'firebase/firestore';
import { sendTelegramNotification } from '@/lib/telegram';

export default function WithdrawPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Bank States
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');

  // Crypto States
  const [network, setNetwork] = useState('USDT (TRC20)');
  const [walletAddress, setWalletAddress] = useState('');

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const handleWithdraw = async (type: 'bank' | 'crypto') => {
    if (!user || !amount || !profile) return;
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ variant: "destructive", title: "INVALID AMOUNT", description: "Please enter a valid amount." });
      return;
    }

    if (profile.balance < amountNum) {
      toast({ variant: "destructive", title: "INSUFFICIENT FUNDS", description: "Cannot complete withdrawal request." });
      return;
    }

    const details = type === 'bank' 
      ? { accountName, iban } 
      : { network, walletAddress };

    if (type === 'bank' && (!accountName || !iban)) {
      toast({ variant: "destructive", title: "MISSING DETAILS", description: "Please provide bank account information." });
      return;
    }

    if (type === 'crypto' && !walletAddress) {
      toast({ variant: "destructive", title: "MISSING DETAILS", description: "Please provide a wallet address." });
      return;
    }
    
    setLoading(true);
    try {
      let globalWithdrawId = "";
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-amountNum) });
        
        const globalWithdrawRef = doc(collection(db, 'withdrawals'));
        globalWithdrawId = globalWithdrawRef.id;
        transaction.set(globalWithdrawRef, {
          userId: user.uid,
          username: profile.username,
          type,
          amount: amountNum,
          details,
          status: 'pending',
          date: new Date().toISOString()
        });

        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'withdraw',
          amount: amountNum,
          status: 'pending',
          date: new Date().toISOString()
        });
      });

      // Telegram Notification with Buttons
      const detailsText = type === 'bank' 
        ? `🏦 <b>Bank Details:</b>\n- Name: ${accountName}\n- IBAN: <code>${iban}</code>`
        : `⚡ <b>Crypto Details:</b>\n- Network: ${network}\n- Address: <code>${walletAddress}</code>`;

      await sendTelegramNotification(`
💸 <b>New Withdrawal Request</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>ID:</b> <code>${profile.customId}</code>
<b>Amount:</b> $${amount}
<b>Method:</b> ${type.toUpperCase()}
${detailsText}
<b>Date:</b> ${new Date().toLocaleString()}
      `, {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `app_wit_${globalWithdrawId}` },
            { text: "❌ Reject", callback_data: `rej_wit_${globalWithdrawId}` }
          ]
        ]
      });

      toast({ title: "REQUEST PENDING", description: `Your $${amount} withdrawal request has been submitted for approval.` });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "REQUEST FAILED", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">Withdraw Funds</h1>
      </header>

      <section className="glass-card p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <Label className="text-xs tracking-[0.2em] font-headline uppercase">Amount to Withdraw</Label>
          <Input 
            type="number" 
            placeholder="0.00" 
            className="text-3xl font-headline font-bold h-20 text-center bg-background/50 border-white/10 rounded-2xl text-primary" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
        </div>

        <Tabs defaultValue="bank" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background/50 rounded-xl p-1 border border-white/5 h-12">
            <TabsTrigger value="bank" className="rounded-lg font-headline text-[10px] uppercase tracking-widest"><Building2 className="h-4 w-4 mr-2" /> Bank</TabsTrigger>
            <TabsTrigger value="crypto" className="rounded-lg font-headline text-[10px] uppercase tracking-widest"><Bitcoin className="h-4 w-4 mr-2" /> Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="pt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Account Name</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Full Legal Name" 
                    className="pl-10 rounded-xl bg-background/30 border-white/5" 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">IBAN / SWIFT</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="International Bank Account Number" 
                    className="pl-10 rounded-xl bg-background/30 border-white/5" 
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={() => handleWithdraw('bank')} className="w-full h-14 font-headline text-md rounded-xl bg-primary text-background" disabled={loading || !amount}>{loading ? "PROCESSING..." : "REQUEST BANK WIRE"}</Button>
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="pt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Network</Label>
                <select 
                  className="w-full h-10 px-3 rounded-xl bg-background/30 border border-white/5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="BTC (Legacy)">BTC (Legacy)</option>
                  <option value="ETH (ERC20)">ETH (ERC20)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest">Wallet Address</Label>
                <Input 
                  placeholder="0x..." 
                  className="rounded-xl bg-background/30 border-white/5" 
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>
              <Button onClick={() => handleWithdraw('crypto')} className="w-full h-14 font-headline text-md rounded-xl bg-secondary text-background" disabled={loading || !amount}>{loading ? "INITIALIZING..." : "REQUEST CRYPTO SEND"}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <div className="p-4 glass-card rounded-2xl border border-white/5 flex items-center justify-between">
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Vault Status</p><p className="text-sm font-headline text-primary">ENCRYPTED & READY</p></div>
        <div className="text-right"><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Balance</p><p className="text-sm font-headline text-foreground">${profile?.balance?.toLocaleString() || '0'}</p></div>
      </div>
    </div>
  );
}
