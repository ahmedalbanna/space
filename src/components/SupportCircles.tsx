import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SupportCircle, UserProfile, CircleMember, AppEvent } from '../types';
import { Users, Plus, MessageSquare, Phone, X, Shield, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SupportCirclesProps {
  userProfile: UserProfile;
}

export const SupportCircles: React.FC<SupportCirclesProps> = ({ userProfile }) => {
  const [circles, setCircles] = useState<SupportCircle[]>([]);
  const [activeCircle, setActiveCircle] = useState<SupportCircle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircle, setNewCircle] = useState({ title: '', description: '', tags: [] as string[] });

  useEffect(() => {
    const q = query(collection(db, 'circles'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCircles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportCircle)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'circles');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeCircle) return;

    const membersUnsub = onSnapshot(collection(db, `circles/${activeCircle.id}/members`), (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data() as CircleMember));
    });

    const eventsUnsub = onSnapshot(query(collection(db, `circles/${activeCircle.id}/events`), where('createdAt', '!=', null)), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent)).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });

    return () => {
      membersUnsub();
      eventsUnsub();
    };
  }, [activeCircle]);

  const createCircle = async () => {
    try {
      const docRef = await addDoc(collection(db, 'circles'), {
        ...newCircle,
        isActive: true,
        participantCount: 0,
        createdAt: serverTimestamp(),
        moderatorId: userProfile.id
      });
      setShowCreateModal(false);
      joinCircle({ id: docRef.id, ...newCircle } as SupportCircle);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'circles');
    }
  };

  const joinCircle = async (circle: SupportCircle) => {
    try {
      await setDoc(doc(db, `circles/${circle.id}/members`, userProfile.id), {
        userId: userProfile.id,
        joinedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'circles', circle.id), {
        participantCount: increment(1)
      });
      setActiveCircle(circle);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `circles/${circle.id}/members`);
    }
  };

  const leaveCircle = async () => {
    if (!activeCircle) return;
    try {
      await deleteDoc(doc(db, `circles/${activeCircle.id}/members`, userProfile.id));
      await updateDoc(doc(db, 'circles', activeCircle.id), {
        participantCount: increment(-1)
      });
      setActiveCircle(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `circles/${activeCircle.id}/members`);
    }
  };

  const sendEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !message.trim()) return;
    try {
      await addDoc(collection(db, `circles/${activeCircle.id}/events`), {
        senderId: userProfile.id,
        type: 'message',
        payload: message,
        createdAt: serverTimestamp()
      });
      setMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `circles/${activeCircle.id}/events`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-display text-emerald-100 italic">دوائر الدعم</h2>
          <p className="text-emerald-400 text-sm">تحدث مع أشخاص يمرون بنفس تجربتك، بخصوصية تامة.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg"
          id="btn-create-circle"
        >
          <Plus size={20} />
          <span>دائرة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {circles.map(circle => (
          <motion.div
            key={circle.id}
            layoutId={circle.id}
            className="bg-emerald-900/40 p-6 rounded-2xl border border-emerald-800/50 space-y-4 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl text-emerald-100">{circle.title}</h3>
              <div className="flex items-center gap-1 text-emerald-400 text-sm">
                <Users size={16} />
                <span>{circle.participantCount}</span>
              </div>
            </div>
            <p className="text-emerald-300/70 text-sm line-clamp-2">{circle.description}</p>
            <div className="flex flex-wrap gap-2">
              {circle.tags?.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 bg-emerald-900/60 rounded-full text-emerald-400">#{tag}</span>
              ))}
            </div>
            <button
              onClick={() => joinCircle(circle)}
              className="w-full py-2 bg-emerald-900/60 text-emerald-100 rounded-xl group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-all font-medium"
            >
              انضم للمساحة
            </button>
          </motion.div>
        ))}
      </div>

      {/* Circle Modal */}
      <AnimatePresence>
        {activeCircle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-background/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-emerald-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-emerald-950">
                  <MessageSquare />
                </div>
                <div>
                  <h2 className="text-xl text-emerald-100">{activeCircle.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {members.length} متواجدون</span>
                    <span className="w-1 h-1 bg-emerald-700 rounded-full" />
                    <span className="flex items-center gap-1 text-emerald-500"><Shield size={12} /> مساحة محمية</span>
                  </div>
                </div>
              </div>
              <button onClick={leaveCircle} className="p-3 text-emerald-400 hover:text-emerald-100 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col-reverse">
              {events.map((event) => (
                <div key={event.id} className={cn(
                  "flex flex-col max-w-[80%]",
                  event.senderId === userProfile.id ? "self-end items-end" : "self-start items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm",
                    event.senderId === userProfile.id ? "bg-emerald-600 text-white rounded-tr-none" : "bg-emerald-900/60 text-emerald-100 rounded-tl-none"
                  )}>
                    {event.payload}
                  </div>
                  <span className="text-[10px] text-emerald-500/60 mt-1">
                    {event.createdAt ? formatDistanceToNow(event.createdAt.toMillis(), { addSuffix: true, locale: ar }) : 'الآن'}
                  </span>
                </div>
              ))}
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-pulse">
                  <Phone size={32} />
                </div>
                <p className="text-emerald-400 text-sm">البث الصوتي مفعل... الجميع مجهول الهوية هنا.</p>
              </div>
            </div>

            <form onSubmit={sendEvent} className="p-6 bg-emerald-950/50 backdrop-blur border-t border-emerald-900 flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="تحدث بقلب مفتوح..."
                className="flex-1 bg-emerald-900/40 border-none rounded-2xl px-6 py-4 text-emerald-100 placeholder-emerald-700 focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
              />
              <button 
                type="submit"
                className="w-14 h-14 bg-emerald-500 text-emerald-950 rounded-2xl flex items-center justify-center hover:bg-emerald-400 transition-colors"
                id="btn-send-message"
              >
                <Send className="rotate-0 rtl:rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Circle Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-brand-background/90 backdrop-blur flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-emerald-950 border border-emerald-800 p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl text-emerald-100">ابدأ دائرة دعم</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-emerald-500"><X /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-emerald-500 uppercase tracking-widest">عنوان الدائرة</label>
                  <input
                    type="text"
                    placeholder="مثلاً: التغلب على القلق..."
                    className="w-full bg-emerald-900/40 border-none rounded-xl px-4 py-3 text-emerald-100 focus:ring-2 focus:ring-emerald-500"
                    onChange={e => setNewCircle({...newCircle, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-emerald-500 uppercase tracking-widest">الوصف</label>
                  <textarea
                    placeholder="ما الذي تود التحدث عنه؟"
                    className="w-full bg-emerald-900/40 border-none rounded-xl px-4 py-3 text-emerald-100 focus:ring-2 focus:ring-emerald-500 h-24"
                    onChange={e => setNewCircle({...newCircle, description: e.target.value})}
                  />
                </div>
              </div>
              <button
                onClick={createCircle}
                className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-xl font-bold hover:bg-emerald-400 transition-colors"
                id="btn-confirm-create-circle"
              >
                افتح المساحة الآن
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
