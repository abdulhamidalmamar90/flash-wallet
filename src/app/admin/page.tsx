
"use client"

import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';
import { 
  Check, 
  X, 
  Loader2, 
  Users, 
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  Ticket,
  ClipboardList,
  Store as StoreIcon,
  Trash2,
  Banknote,
  Database,
  SendHorizontal,
  CircleDot,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  runTransaction, 
  increment, 
  deleteDoc, 
  addDoc, 
  onSnapshot
} from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { exportProjectSource } from '@/app/actions/project-backup';

export default function AdminPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isProjectBackingUp, setIsProjectBackingUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const chatSessionsQuery = useMemo(() => (db ? query(collection(db, 'chat_sessions'), orderBy('updatedAt', 'desc')) : null), [db]);
  const { data: chatSessions = [] } = useCollection(chatSessionsQuery);

  const withdrawalsQuery = useMemo(() => (db ? query(collection(db, 'withdrawals'), orderBy('date', 'desc')) : null), [db]);
  const { data: withdrawals = [] } = useCollection(withdrawalsQuery);

  const ordersQuery = useMemo(() => (db ? query(collection(db, 'service_requests'), orderBy('date', 'desc')) : null), [db]);
  const { data: allOrders = [] } = useCollection(ordersQuery);

  useEffect(() => {
    if (mounted && !authLoading && !profileLoading && profile && (profile as any).role !== 'admin') {
      toast({ variant: "destructive", title: "ACCESS DENIED" });
      router.push('/dashboard');
    }
  }, [profile, profileLoading, authLoading, router, toast, mounted]);

  // Chat Subscription
  useEffect(() => {
    if (!db || !activeChatId) return;
    const q = query(collection(db, 'chat_sessions', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [db, activeChatId]);

  const handleJoinChat = async (id: string) => {
    if (!db || !user || !profile) return;
    try {
      await updateDoc(doc(db, 'chat_sessions', id), {
        status: 'active',
        joinedBy: profile.username,
        updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'chat_sessions', id, 'messages'), {
        text: `Hello! I am ${profile.username}, your authorized agent. Please allow me a moment to review your request.`,
        isAdmin: true,
        senderId: user.uid,
        timestamp: new Date().toISOString()
      });
      setActiveChatId(id);
    } catch (e) {}
  };

  const handleEndChat = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'chat_sessions', id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Session Closed" });
    } catch (e) {}
  };

  const handleDeleteChat = async (id: string) => {
    if (!db || !confirm("Archive and purge this session?")) return;
    try {
      await deleteDoc(doc(db, 'chat_sessions', id));
      toast({ title: "Session Purged" });
    } catch (e) {}
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !activeChatId || !chatMessage.trim()) return;
    try {
      await addDoc(collection(db, 'chat_sessions', activeChatId, 'messages'), {
        text: chatMessage.trim(),
        isAdmin: true,
        senderId: user?.uid,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(db, 'chat_sessions', activeChatId), {
        updatedAt: new Date().toISOString(),
        lastMessage: chatMessage.trim()
      });
      setChatMessage('');
    } catch (e) {}
  };

  const handleProjectBackup = async () => {
    setIsProjectBackingUp(true);
    try {
      const base64 = await exportProjectSource();
      const blob = await (await fetch(`data:application/zip;base64,${base64}`)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FLASH_PROJECT_${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      toast({ title: "FULL PROJECT SNAPSHOT SECURED" });
    } catch (e) { toast({ variant: "destructive", title: "BACKUP FAILED" }); }
    finally { setIsProjectBackingUp(false); }
  };

  if (!mounted || authLoading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center p-5 glass-card rounded-[2rem] border-primary/20 gold-glow">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary group"><LayoutDashboard className="h-6 w-6 group-hover:scale-110" /></Link>
          <div><h1 className="text-xs font-headline font-bold tracking-widest uppercase">Admin Command</h1><p className="text-[8px] text-muted-foreground uppercase font-black">Authorized Shell v4.5.0</p></div>
        </div>
        <Badge variant="outline" className="text-[8px] tracking-[0.2em] font-black uppercase text-primary border-primary/30 py-1">System Master</Badge>
      </header>

      <Tabs defaultValue="chats" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto bg-card/40 border border-white/5 rounded-[2rem] p-2 gap-2 mb-8">
          <TabsTrigger value="chats" className="rounded-2xl font-headline text-[10px] uppercase p-4 flex items-center justify-center gap-2"><MessageSquare className="h-4 w-4" /> Chats</TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-2xl font-headline text-[10px] uppercase p-4 flex items-center justify-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Withdraws</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-2xl font-headline text-[10px] uppercase p-4 flex items-center justify-center gap-2"><ClipboardList className="h-4 w-4" /> Orders</TabsTrigger>
          <TabsTrigger value="backup" className="rounded-2xl font-headline text-[10px] uppercase p-4 flex items-center justify-center gap-2"><Database className="h-4 w-4" /> Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-6">
          <Tabs defaultValue="active_sessions">
            <TabsList className="bg-white/5 border border-white/5 rounded-xl p-1 mb-4 h-10">
              <TabsTrigger value="active_sessions" className="text-[8px] uppercase font-headline">Live Channels</TabsTrigger>
              <TabsTrigger value="chat_history" className="text-[8px] uppercase font-headline">Archive History</TabsTrigger>
            </TabsList>

            <TabsContent value="active_sessions">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                <div className="lg:col-span-1 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest">Active Channels</h3>
                    <Badge variant="outline" className="text-[6px] text-primary">{chatSessions.filter((s:any) => s.status !== 'archived').length}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                    {chatSessions.filter((s:any) => s.status !== 'archived').map((s: any) => (
                      <div key={s.id} className={cn("w-full p-4 rounded-2xl border text-left transition-all relative group", activeChatId === s.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-transparent hover:border-white/10")}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-headline font-bold uppercase">@{s.username}</p>
                          <Badge className={cn("text-[6px] h-4 uppercase", s.status === 'open' ? "bg-red-500" : "bg-green-500")}>{s.status}</Badge>
                        </div>
                        <p className="text-[8px] text-muted-foreground truncate mb-3">{s.lastMessage || 'Starting...'}</p>
                        <div className="flex gap-2">
                          <Button onClick={() => handleJoinChat(s.id)} size="sm" className="h-7 text-[7px] font-headline font-black uppercase flex-1 bg-primary text-background">Join</Button>
                          <Button onClick={() => handleEndChat(s.id)} variant="outline" size="sm" className="h-7 text-[7px] font-headline font-black uppercase flex-1 border-red-500/20 text-red-500">Close</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 glass-card rounded-[2rem] border-white/5 overflow-hidden flex flex-col">
                  {activeChatId ? (
                    <>
                      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">Case: {activeChatId.slice(0, 8)}</p>
                        <button onClick={() => setActiveChatId(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={16} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {chatMessages.map((m: any) => (
                          <div key={m.id} className={cn("flex flex-col max-w-[80%]", m.isAdmin ? "self-end items-end" : "self-start items-start")}>
                            <div className={cn("p-3 rounded-2xl text-[10px] font-financial", m.isAdmin ? "bg-primary text-background rounded-tr-none" : "bg-muted text-foreground rounded-tl-none")}>{m.text}</div>
                            <span className="text-[6px] text-muted-foreground mt-1 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleSendChatMessage} className="p-4 bg-white/5 flex gap-2">
                        <Input placeholder="TYPE RESPONSE..." className="h-12 bg-background border-white/10 rounded-xl font-headline text-[10px]" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                        <button type="submit" className="w-12 h-12 bg-primary text-background rounded-xl flex items-center justify-center transition-transform active:scale-95"><SendHorizontal size={20} /></button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <CircleDot size={48} className="opacity-10 animate-pulse" />
                      <p className="text-[10px] font-headline uppercase font-bold tracking-widest opacity-20">Select an active channel to monitor</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat_history">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatSessions.filter((s:any) => s.status === 'archived').map((s: any) => (
                  <div key={s.id} className="glass-card p-5 rounded-[2rem] border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-headline font-bold uppercase">Case #{s.caseId || s.id.slice(0,6)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">By @{s.username}</p>
                      </div>
                      <Badge className="bg-white/5 text-muted-foreground text-[7px] uppercase">Archived</Badge>
                    </div>
                    {s.rating && (
                      <div className="p-3 bg-primary/5 rounded-xl flex justify-between items-center border border-primary/10">
                        <div className="flex gap-0.5 text-primary">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < s.rating ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[8px] font-headline font-black text-primary uppercase">Score: {s.rating}/5</span>
                      </div>
                    )}
                    <div className="text-[8px] text-white/40 leading-relaxed italic p-3 bg-white/5 rounded-xl">"{s.feedback || 'No feedback left'}"</div>
                    <Button onClick={() => handleDeleteChat(s.id)} variant="destructive" className="w-full h-10 rounded-xl text-[8px] font-headline uppercase font-black tracking-widest"><Trash2 size={12} className="mr-2" /> Purge Record</Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="glass-card p-10 rounded-[3rem] border-primary/20 text-center space-y-8 gold-glow">
            <Database size={64} className="mx-auto text-primary animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-xl font-headline font-bold uppercase tracking-widest text-white">Full System Archive</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Generate a complete snapshot of all project files and database entities.</p>
            </div>
            <Button onClick={handleProjectBackup} disabled={isProjectBackingUp} className="h-16 px-10 bg-primary text-background font-headline font-black text-xs uppercase tracking-widest rounded-2xl gold-glow active:scale-95 transition-all">
              {isProjectBackingUp ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" />}
              Archive Full Codebase & Assets (ZIP)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
