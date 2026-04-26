import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

export const BreathingExercise: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);

  const phases = {
    inhale: { duration: 4, label: 'شهيق...', color: 'bg-emerald-400' },
    hold: { duration: 4, label: 'أمسك النفس...', color: 'bg-emerald-600' },
    exhale: { duration: 4, label: 'زفير...', color: 'bg-blue-400' }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        if (phase === 'idle' || phase === 'exhale') {
          setPhase('inhale');
          setTimeLeft(phases.inhale.duration);
        } else if (phase === 'inhale') {
          setPhase('hold');
          setTimeLeft(phases.hold.duration);
        } else if (phase === 'hold') {
          setPhase('exhale');
          setTimeLeft(phases.exhale.duration);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isActive, timeLeft, phase]);

  const toggleExercise = () => {
    if (!isActive) {
      setPhase('inhale');
      setTimeLeft(phases.inhale.duration);
      setIsActive(true);
    } else {
      setIsActive(false);
      setPhase('idle');
    }
  };

  const resetExercise = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(0);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-display text-emerald-100 italic">مساحة للتنفس</h2>
        <p className="text-emerald-300 max-w-xs mx-auto">
          توقف عن كل شيء لمدة دقيقة... ركز فقط على أنفاسك.
        </p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Breathing Circle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ scale: phase === 'inhale' ? 0.8 : 1 }}
            animate={{ 
              scale: phase === 'inhale' ? 1.5 : phase === 'exhale' ? 0.8 : 1.5,
              opacity: phase === 'idle' ? 0.5 : 1
            }}
            transition={{ 
              duration: phase === 'idle' ? 0.5 : phases[phase as keyof typeof phases].duration,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute inset-0 rounded-full blur-2xl opacity-40 transition-colors duration-1000",
              phase === 'idle' ? 'bg-emerald-900' : phases[phase as keyof typeof phases].color
            )}
          />
        </AnimatePresence>

        <motion.div
          animate={{ 
            scale: phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.9 : phase === 'hold' ? 1.4 : 1,
          }}
          transition={{ 
            duration: phase === 'idle' ? 0.5 : phases[phase as keyof typeof phases].duration,
            ease: "easeInOut"
          }}
          className={cn(
            "w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center relative z-10 transition-colors duration-1000",
            phase === 'idle' ? 'border-emerald-800' : 'border-emerald-300 shadow-lg shadow-emerald-500/20'
          )}
        >
          <Wind className={cn(
            "w-12 h-12 mb-2 transition-colors",
            phase === 'idle' ? 'text-emerald-800' : 'text-emerald-100'
          )} />
          <span className="text-xl font-bold text-center px-4">
            {phase === 'idle' ? 'ابدأ' : phases[phase].label}
          </span>
          {phase !== 'idle' && (
            <span className="text-sm font-mono mt-2">{timeLeft}s</span>
          )}
        </motion.div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggleExercise}
          className="p-4 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors shadow-lg"
          id="btn-breathing-toggle"
        >
          {isActive ? <Pause /> : <Play />}
        </button>
        <button
          onClick={resetExercise}
          className="p-4 rounded-full bg-emerald-900 text-emerald-300 hover:bg-emerald-800 transition-colors"
          id="btn-breathing-reset"
        >
          <RotateCcw />
        </button>
      </div>
    </div>
  );
};
