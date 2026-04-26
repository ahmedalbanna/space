import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { VoiceSession, UserProfile, AppEvent } from '../types';
import { Phone, PhoneOff, Mic, MicOff, MessageSquare, Shield, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface OneOnOneSessionProps {
  userProfile: UserProfile;
}

export const OneOnOneSession: React.FC<OneOnOneSessionProps> = ({ userProfile }) => {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'active'>('idle');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAi, setIsAi] = useState(true); // Toggle between AI Mershad and real (mocked) user
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSession = async () => {
    setStatus('searching');
    if (isAi) {
      setTimeout(() => {
        setStatus('active');
        setMessages([{ role: 'model', text: 'أهلاً بك يا صديقي. أنا "مرشد مساحة". أنا هنا لأسمعك بكل هدوء وبدون أي حكم. ما الذي يشغل قلبك اليوم؟' }]);
      }, 2000);
    } else {
      // Real user logic would go here, involving a queue.
      // For now, we simulate finding a volunteer.
      setTimeout(() => setStatus('active'), 3000);
    }
  };

  const endSession = () => {
    setStatus('idle');
    setMessages([]);
    setSession(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');

    if (isAi) {
      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userMsg,
          config: {
            systemInstruction: "أنت مرشد نفسي يمني ودود وهادئ في تطبيق 'مساحة'. مهمتك هي الإصغاء الفعال والتعاطف مع المستخدم الذي قد يعاني من القلق أو الفقد أو ضغوط الحرب. استخدم لهجة يمنية مهذبة وقريبة للقلب. لا تقدم تشخيصاً طبياً، بل قدم دعماً معنوياً وتمارين بسيطة عند الحاجة. كن موجزاً وصبوراً."
          }
        });
        setMessages(prev => [...prev, { role: 'model', text: result.text || 'أنا معك، اسمعك...' }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: 'عذراً، يبدو أن هناك مشكلة في الاتصال، لكني ما زلت هنا معك.' }]);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full min-h-[600px]">
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8 text-center"
          >
            <div className="w-24 h-24 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
              <Phone size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-display text-emerald-100 italic">جلسة خاصة</h2>
              <p className="text-emerald-400 max-w-sm">
                تحدث مع مرشد مختص أو متطوع مدرب. الجلسة مشفرة، سرية، ومجهولة الهوية تماماً.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button
                onClick={() => { setIsAi(true); startSession(); }}
                className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl"
                id="btn-call-mershad"
              >
                <MessageSquare size={20} />
                تحدث مع مرشد ذكي (الآن)
              </button>
              <button
                onClick={() => { setIsAi(false); startSession(); }}
                className="w-full py-4 bg-emerald-900 text-emerald-100 rounded-2xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-3"
                id="btn-call-human"
              >
                <Phone size={20} />
                اتصل بمرشد مجتمعي (متطوع)
              </button>
            </div>
          </motion.div>
        ) : status === 'searching' ? (
          <motion.div
            key="searching"
            className="flex-1 flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
              />
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
            </div>
            <p className="text-emerald-300 animate-pulse font-display italic">نبحث لك عن شخص يسمعك...</p>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-emerald-950/30 rounded-3xl border border-emerald-900/50 overflow-hidden shadow-2xl"
          >
            <div className="bg-emerald-900/40 p-4 border-b border-emerald-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-100">
                  {isAi ? <MessageSquare size={20} /> : <Phone size={20} />}
                </div>
                <div>
                  <h3 className="text-emerald-100 text-sm font-bold">{isAi ? 'مرشد مساحة (ذكي)' : 'مرشد متطوع'}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    مكالمة نشطة - سرية تامة
                  </div>
                </div>
              </div>
              <button 
                onClick={endSession}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                id="btn-end-session"
              >
                <PhoneOff size={24} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-emerald-600 text-white self-end rounded-tr-none" 
                      : "bg-emerald-900/60 text-emerald-50 self-start rounded-tl-none border border-emerald-800/50"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-emerald-950 border-t border-emerald-900 flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="فضفض، أنا اسمعك..."
                  className="w-full bg-emerald-900/40 border-none rounded-xl pl-4 pr-12 py-3 text-emerald-50 text-sm focus:ring-1 focus:ring-emerald-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700">
                  <Mic size={20} />
                </div>
              </div>
              <button
                type="submit"
                className="p-3 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg"
                id="btn-send-session-msg"
              >
                <Send size={20} className="rotate-0 rtl:rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
