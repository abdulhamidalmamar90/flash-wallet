
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Lock, 
  ChevronLeft, 
  Camera, 
  Check, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AVATARS = [
  "https://picsum.photos/seed/avatar1/200",
  "https://picsum.photos/seed/avatar2/200",
  "https://picsum.photos/seed/avatar3/200",
  "https://picsum.photos/seed/avatar4/200",
  "https://picsum.photos/seed/avatar5/200",
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setSelectedAvatar(profile.avatarUrl || AVATARS[0]);
    }
  }, [profile]);

  const t = {
    header: language === 'ar' ? 'تعديل الحساب' : 'Edit Profile',
    phoneLabel: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    passLabel: language === 'ar' ? 'كلمة مرور جديدة' : 'New Password',
    passPlaceholder: language === 'ar' ? 'اتركه فارغاً إذا لا تريد التغيير' : 'Leave blank to keep current',
    saveBtn: language === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    success: language === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully',
    avatarHeader: language === 'ar' ? 'اختر صورتك الرمزية' : 'Choose Your Avatar',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        phone,
        avatarUrl: selectedAvatar,
      });

      // Update Auth Password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      toast({ title: t.success });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 gold-glow">
            <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={() => setIsAvatarOpen(!isAvatarOpen)}
            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Camera size={18} />
          </button>
        </div>
        
        {isAvatarOpen && (
          <div className="flex gap-3 p-4 glass-card rounded-2xl animate-in zoom-in-95 duration-300">
            {AVATARS.map((url, i) => (
              <button 
                key={i} 
                onClick={() => { setSelectedAvatar(url); setIsAvatarOpen(false); }}
                className={cn(
                  "w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
                  selectedAvatar === url ? "border-primary scale-110" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl space-y-6 border-white/5 shadow-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.phoneLabel}</Label>
            <div className="relative group">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl"
                placeholder="+201234567890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-widest text-white/60">{t.passLabel}</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl"
                placeholder={t.passPlaceholder}
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 font-headline text-md rounded-xl bg-primary hover:bg-primary/90 text-background font-black tracking-widest shadow-lg shadow-primary/20"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t.saving}</>
          ) : (
            <><Check className="h-5 w-5 mr-2" /> {t.saveBtn}</>
          )}
        </Button>
      </form>
    </div>
  );
}
