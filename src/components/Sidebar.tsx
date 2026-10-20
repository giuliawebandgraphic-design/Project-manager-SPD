import React from 'react';
import { useApp, ActiveView } from '../context/AppContext';
import { 
  Clock, 
  Calendar, 
  FolderKanban, 
  FileText, 
  PieChart, 
  Package, 
  CalendarDays, 
  Mail, 
  Sparkles,
  Scissors,
  Plus,
  Tag,
  Receipt,
  Heart
} from 'lucide-react';

interface SidebarProps {
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewProject,
  onOpenNewTask,
}) => {
  const { activeView, setActiveView, tasks, emails, quotes, todayDate } = useApp();

  const pendingTodayTasks = tasks.filter(t => t.scheduledDate === todayDate && !t.completed).length;
  const unreadEmailsCount = emails.filter(e => e.isUnread).length;
  const pendingProductionTasks = tasks.filter(t => !t.completed && (t.category === 'stampa' || t.category === 'taglio' || t.category === 'sigilli' || t.category === 'nastri' || t.category === 'confezionamento_manuale')).length;
  const activeQuotesCount = quotes.filter(q => q.status === 'inviato' || q.status === 'bozza').length;

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'agenda', label: 'Oggi', icon: <Clock className="w-5 h-5" />, badge: pendingTodayTasks },
    { id: 'capacity', label: 'Capacity Planner', icon: <Calendar className="w-5 h-5" /> },
    { id: 'progetti', label: 'Progetti Suite', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'preventivi', label: 'Elabora Preventivi', icon: <Receipt className="w-5 h-5" />, badge: activeQuotesCount },
    { id: 'prodotti', label: 'Listino Prodotti', icon: <Tag className="w-5 h-5" /> },
    { id: 'produzione', label: 'Laboratorio & Stampa', icon: <Scissors className="w-5 h-5" />, badge: pendingProductionTasks },
    { id: 'scheda_cliente', label: 'Scheda Sposi', icon: <FileText className="w-5 h-5" /> },
    { id: 'finanze', label: 'Bilancio Atelier', icon: <PieChart className="w-5 h-5" /> },
    { id: 'magazzino', label: 'Magazzino & Ordini', icon: <Package className="w-5 h-5" /> },
    { id: 'appuntamenti', label: 'Incontri Sposi', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'email_gmail', label: 'Gmail', icon: <Mail className="w-5 h-5" />, badge: unreadEmailsCount },
  ];

  return (
    <aside className="w-20 md:w-64 bg-[#FFFFFF] border-r border-[#EFECE6] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 transition-all select-none">
      {/* Top Logo & Atelier Brand (Sage Green, Beige, White - No Yellow, No Black) */}
      <div className="p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C8E75] to-[#5B7B63] text-[#FFFFFF] flex items-center justify-center font-bold text-xl shadow-sm shadow-[#5B7B63]/25 shrink-0">
            🌿
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-base text-[#26332A] tracking-tight leading-none">
              Sage Studio
            </h1>
            <p className="text-[11px] text-[#68766B] font-medium mt-1">
              Atelier Management
            </p>
          </div>
        </div>

        {/* Studio Condition / Quick Card */}
        <div className="hidden md:block mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F2EB] border border-[#E8E2D7] text-center relative overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#FFFFFF] mx-auto flex items-center justify-center text-lg shadow-xs border border-[#E5DFD4]">
            ✨
          </div>
          <div className="mt-2 text-xs font-bold text-[#26332A]">
            Atelier in Attività
          </div>
          <div className="text-[11px] text-[#68766B] mt-0.5 leading-snug">
            Tutto in orario per le consegne di questa settimana
          </div>
          <button
            onClick={onOpenNewTask}
            className="mt-3 w-full py-2 px-3 bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuova Lavorazione</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 md:px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#5B7B63] text-[#FFFFFF] shadow-sm shadow-[#5B7B63]/20'
                    : 'text-[#5E6D62] hover:bg-[#F2F7F4] hover:text-[#26332A]'
                }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-[#FFFFFF]' : 'text-[#7D8B80]'
                }`}>
                  {item.icon}
                </div>
                <span className="hidden md:inline truncate">{item.label}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`hidden md:flex ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]' 
                      : 'bg-[#EBF2ED] text-[#5B7B63]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Quick Action */}
      <div className="p-4 md:p-5 border-t border-[#F2EEE7] bg-[#FAF8F5]/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF2ED] border border-[#D5E0D8] flex items-center justify-center font-bold text-sm text-[#5B7B63] shrink-0 overflow-hidden">
            <span className="text-base">👩🏻‍🎨</span>
          </div>
          <div className="hidden md:block truncate">
            <div className="text-xs font-bold text-[#26332A] truncate">
              Sage Paper Design
            </div>
            <div className="text-[11px] text-[#7D8B80] truncate">
              sagepaperdesign@gmail.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
