import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Mail, 
  FolderKanban, 
  Sparkles, 
  Clock, 
  PieChart, 
  Cloud, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  RotateCcw, 
  Trash2, 
  FileText,
  Tag
} from 'lucide-react';

interface HeaderProps {
  onOpenNewProject: () => void;
  onOpenNewCallNote: () => void;
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewProject,
  onOpenNewCallNote,
  onOpenNewTask,
  onOpenNewExpense,
}) => {
  const { 
    todayDate, 
    getTotalHoursForDate, 
    getMaxHoursForDate,
    emails,
    currentUser,
    isCloudConnected,
    isSyncing,
    loginWithGoogle,
    logoutUser,
    loadDemoData,
    clearAllData,
    setActiveView
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = emails.filter(e => e.isUnread).length;
  const todayHours = getTotalHoursForDate(todayDate);
  const maxHours = getMaxHoursForDate(todayDate);
  const loadPercentage = maxHours > 0 ? Math.round((todayHours / maxHours) * 100) : 0;

  const formattedDate = new Date(todayDate).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md px-6 lg:px-8 py-4 border-b border-[#E8E2D7] font-sans">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Atelier Welcome */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#26332A] tracking-tight">
              Ciao, Sage Paper Design 🌿
            </h1>
          </div>
          <p className="text-xs text-[#68766B] mt-0.5 font-medium">
            Oggi hai <strong className="text-[#26332A]">{todayHours.toFixed(1)} ore</strong> di lavorazioni artigianali ({loadPercentage}% della capacità).
          </p>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          
          {/* Cloud Database Status Badge */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D7] text-xs shadow-xs"
            title="Database Firestore collegato in tempo reale. Le modifiche sono istantaneamente salvate online."
          >
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-[#5B7B63] animate-pulse' : 'bg-[#9BB4A2]'}`} />
            <span className="font-semibold text-[#26332A] hidden sm:inline">
              {isSyncing ? 'Sincronizzazione...' : isCloudConnected ? 'Cloud Online' : 'Connessione...'}
            </span>
            {isSyncing && <RefreshCw className="w-3 h-3 text-[#5B7B63] animate-spin" />}
          </div>

          {/* Current Date Pill */}
          <button 
            onClick={() => setActiveView('agenda')}
            className="hidden md:flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] px-3.5 py-1.5 rounded-2xl shadow-xs text-xs font-semibold text-[#26332A] transition-colors cursor-pointer capitalize"
            title="Vai all'Agenda Odierna"
          >
            <span className="text-[#5B7B63]">📅 {formattedDate}</span>
          </button>

          {/* Quick Gmail Direct Button */}
          <a
            href="https://mail.google.com/mail/u/0/#search/is%3Aunread"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] text-[#4A574E] px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs transition-colors"
            title="Apri email non lette su Gmail"
          >
            <Mail className="w-3.5 h-3.5 text-[#5B7B63]" />
            <span className="hidden md:inline">Gmail</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#B57C68]" />
            )}
          </a>

          {/* User Account / Google Sign-in */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#26332A] shadow-xs cursor-pointer"
                title={currentUser.email || 'Utente'}
              >
                <div className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#D5E0D8] flex items-center justify-center text-[10px] font-bold text-[#5B7B63]">
                  {currentUser.displayName ? currentUser.displayName[0] : 'S'}
                </div>
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {currentUser.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#26332A] shadow-xs cursor-pointer"
                title="Accedi con Google per sincronizzare tra dispositivi"
              >
                <LogIn className="w-3.5 h-3.5 text-[#5B7B63]" />
                <span className="hidden sm:inline">Accedi</span>
              </button>
            )}

            {isUserMenuOpen && currentUser && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#E8E2D7] rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-[#F2EEE7]">
                  <div className="font-bold text-[#26332A] truncate">{currentUser.displayName || 'Sage Paper Design'}</div>
                  <div className="text-[11px] text-[#7D8B80] truncate">{currentUser.email}</div>
                </div>

                <button
                  onClick={() => loadDemoData()}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#5B7B63]" />
                  <span>Carica Dati Demo Atelier</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Vuoi svuotare tutti i dati dal database cloud per iniziare da zero?')) {
                      clearAllData();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FDF2F0] text-[#B57C68] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota Database Cloud</span>
                </button>

                <div className="border-t border-[#F2EEE7] my-1" />

                <button
                  onClick={() => logoutUser()}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#7D8B80] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnetti</span>
                </button>
              </div>
            )}
          </div>

          {/* Sage Green Circular Action Button (NO YELLOW, NO BLACK) */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C8E75] to-[#5B7B63] hover:brightness-105 active:scale-95 text-[#FFFFFF] flex items-center justify-center shadow-md shadow-[#5B7B63]/25 transition-all cursor-pointer font-bold"
              title="Aggiungi nuovo elemento"
            >
              <Plus className="w-5 h-5 text-[#FFFFFF]" />
            </button>

            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E8E2D7] rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsMenuOpen(false)}
              >
                <button 
                  onClick={onOpenNewProject}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center">
                    <FolderKanban className="w-3.5 h-3.5" />
                  </div>
                  <span>Nuovo Progetto Suite</span>
                </button>

                <button 
                  onClick={() => setActiveView('preventivi')}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#F2F7F4] text-[#5B7B63] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Nuovo Preventivo Sposi</span>
                </button>

                <button 
                  onClick={() => setActiveView('prodotti')}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span>Nuovo Articolo Listino</span>
                </button>

                <button 
                  onClick={onOpenNewTask}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] text-[#5B7B63] border border-[#E8E2D7] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>Nuova Lavorazione Task</span>
                </button>

                <button 
                  onClick={onOpenNewCallNote}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#F5F2EB] text-[#7A6C58] flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>Prendi Appunti Call Sposi</span>
                </button>

                <div className="border-t border-[#F2EEE7] my-1" />

                <button 
                  onClick={onOpenNewExpense}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F5] text-[#26332A] font-medium flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] text-[#7D8B80] flex items-center justify-center">
                    <PieChart className="w-3.5 h-3.5" />
                  </div>
                  <span>Registra Spesa Atelier</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
