import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Loader2, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const ADJECTIVES = ['صديق', 'عابر', 'باحث', 'هادئ', 'صميم', 'كبير', 'واثق'];
const NOUNS = ['القلب', 'الروح', 'الأمل', 'النور', 'المسافة', 'اليمن', 'البحر'];

const generateAnonymousName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
};

interface AuthGuardProps {
  children: (user: UserProfile) => React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const playerDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (playerDoc.exists()) {
          setProfile({ id: currentUser.uid, ...playerDoc.data() } as UserProfile);
        } else {
          const newProfile: Partial<UserProfile> = {
            anonymousName: generateAnonymousName(),
            avatarId: Math.floor(Math.random() * 8 + 1).toString(),
            createdAt: serverTimestamp() as any,
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setProfile({ id: currentUser.uid, ...newProfile } as UserProfile);
        }
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-brand-background">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-emerald-400"
        >
          <Heart className="w-16 h-16 fill-current" />
        </motion.div>
        <p className="text-emerald-200 font-display text-xl animate-pulse">نجهز لك مساحة آمنة...</p>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children(profile)}</>;
};
