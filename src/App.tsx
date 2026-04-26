/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthGuard } from './components/AuthGuard';
import { PrivacyMask } from './components/PrivacyMask';
import { BreathingExercise } from './components/BreathingExercise';
import { SupportCircles } from './components/SupportCircles';
import { OneOnOneSession } from './components/OneOnOneSession';
import { Heart, Wind, Users, Phone, Shield, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

type Tab = 'breathing' | 'circles' | 'session';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('breathing');

  return (
    <AuthGuard>
      {(profile) => (
        <PrivacyMask>
          <div className="min-h-screen bg-brand-background text-emerald-50 flex flex-col items-center pb-32" dir="rtl">
            
            {/* Header */}
            <header className="w-full max-w-4xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-500/20">
                  <Heart size={28} className="fill-current" />
                </div>
                <div>
                  <h1 className="text-2xl font-display italic tracking-tight">مساحة</h1>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em]">Safe Space for Yemen</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-emerald-900/30 px-4 py-2 rounded-2xl border border-emerald-900/50">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-emerald-100 font-bold">{profile.anonymousName}</span>
                  <span className="text-[10px] text-emerald-500">مجهول الهوية</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-xl">
                  {profile.avatarId ? String.fromCodePoint(0x1F600 + parseInt(profile.avatarId)) : '👤'}
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 text-emerald-700 hover:text-emerald-300 transition-colors"
                  title="تسجيل الخروج"
                  id="btn-logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="w-full max-w-4xl p-4 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center"
                >
                  {activeTab === 'breathing' && <BreathingExercise />}
                  {activeTab === 'circles' && <SupportCircles userProfile={profile} />}
                  {activeTab === 'session' && <OneOnOneSession userProfile={profile} />}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-emerald-950/80 backdrop-blur-xl border border-emerald-800 rounded-3xl p-2 flex items-center justify-between shadow-2xl shadow-black/40 z-50">
              <NavButton 
                active={activeTab === 'breathing'} 
                onClick={() => setActiveTab('breathing')} 
                icon={<Wind />} 
                label="تنفس"
                id="nav-breathing"
              />
              <NavButton 
                active={activeTab === 'circles'} 
                onClick={() => setActiveTab('circles')} 
                icon={<Users />} 
                label="دوائر"
                id="nav-circles"
              />
              <NavButton 
                active={activeTab === 'session'} 
                onClick={() => setActiveTab('session')} 
                icon={<Phone />} 
                label="جلسة"
                id="nav-session"
              />
            </nav>

            <div className="fixed top-6 right-6 pointer-events-none opacity-20 hidden lg:block">
              <Shield size={300} className="text-emerald-500" />
            </div>
          </div>
        </PrivacyMask>
      )}
    </AuthGuard>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  id: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, id }) => (
  <button
    id={id}
    onClick={onClick}
    className={cn(
      "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 relative overflow-hidden",
      active ? "text-emerald-950" : "text-emerald-500 hover:text-emerald-300"
    )}
  >
    {active && (
      <motion.div
        layoutId="nav-bg"
        className="absolute inset-0 bg-emerald-400 z-0"
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
      />
    )}
    <div className="relative z-10 flex flex-col items-center">
      {React.cloneElement(icon as React.ReactElement, { size: 20, className: active ? "stroke-[2.5px]" : "" })}
      <span className="text-[10px] mt-1 font-bold">{label}</span>
    </div>
  </button>
);
