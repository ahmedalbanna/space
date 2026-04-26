import React, { useState } from 'react';
import { Mic, Circle, Square, Play, Menu, Volume2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PrivacyMaskProps {
  children: React.ReactNode;
}

export const PrivacyMask: React.FC<PrivacyMaskProps> = ({ children }) => {
  const [isMasked, setIsMasked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  if (!isMasked) {
    return (
      <div className="relative min-h-screen">
        {children}
        <button
          onClick={() => setIsMasked(true)}
          className="fixed bottom-24 left-6 z-[100] w-12 h-12 bg-emerald-950/80 border border-emerald-800 rounded-full flex items-center justify-center text-emerald-500 shadow-xl hover:scale-110 transition-transform"
          title="تفعيل وضع الخصوصية"
          id="btn-privacy-mask-on"
        >
          <Settings size={20} className="animate-spin-slow" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 text-white font-mono flex flex-col items-center justify-between p-8">
      <div className="w-full flex justify-between items-center opacity-50">
        <Menu />
        <span className="text-xs uppercase tracking-widest">Voice Recorder v2.4</span>
        <Volume2 />
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center space-y-12">
        <div className="w-full h-32 flex items-center justify-center gap-1">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: isRecording ? [10, Math.random() * 80 + 20, 10] : 10 
              }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
              className="w-1 bg-red-500 rounded-full opacity-60"
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <span className="text-4xl font-bold tracking-tighter">00:0{isRecording ? '4' : '0'}:12</span>
          <p className="text-xs text-zinc-500">STORAGE: 14.2 GB FREE</p>
        </div>

        <div className="flex items-center gap-8">
          <button className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600">
            <Play size={24} />
          </button>
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl",
              isRecording ? "bg-white text-black scale-90" : "bg-red-600 text-white hover:scale-105"
            )}
            id="btn-mask-record"
          >
            {isRecording ? <Square fill="currentColor" /> : <Mic size={32} />}
          </button>
          <button className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600">
            <Circle size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: isRecording ? '40%' : '0%' }}
            className="h-full bg-red-600" 
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>RECORDING_042.WAV</span>
          <span>44.1 KHZ / 24-BIT</span>
        </div>
      </div>

      <button
        onClick={() => setIsMasked(false)}
        className="mt-8 px-6 py-2 border border-zinc-900 rounded-full text-[10px] text-zinc-800 tracking-[0.2em] hover:text-zinc-500 transition-colors"
        id="btn-privacy-mask-off"
      >
        EXIT APP
      </button>
    </div>
  );
};
