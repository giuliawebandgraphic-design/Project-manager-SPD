import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, 
  Circle, 
  Clock, 
  Video, 
  MapPin, 
  ExternalLink, 
  ArrowRight, 
  Mail, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  Folder, 
  CalendarClock,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Play,
  Pause,
  Sun,
  Flame,
  CheckCircle2,
  Heart,
  Zap,
  Bell
} from 'lucide-react';
import { detectSmartAlerts } from '../utils/capacityEngine';

interface AgendaOdiernaProps {
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNewTask: () => void;
  onOpenNewCallNote: () => void;
}

export const AgendaOdierna: React.FC<AgendaOdiernaProps> = ({
  onOpenProjectDetail,
  onOpenNewTask,
  onOpenNewCallNote,
}) => {
  const { 
    todayDate, 
    tasks, 
    toggleTaskCompleted, 
    rescheduleTask, 
    appointments, 
    emails, 
    markEmailRead, 
    projects, 
    inventory,
    getProjectById, 
    capacitySettings,
    getTotalHoursForDate,
    getMaxHoursForDate,
    openGmailSearchForClient,
    openDriveFolderForProject,
    addCallNote,
    setActiveView
  } = useApp();

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const smartAlerts = detectSmartAlerts(projects, tasks, inventory, todayDate)
    .filter(a => !dismissedAlertIds.includes(a.id));

  // Mini calendar state
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(16);
  const [isPlayingAtelierLoFi, setIsPlayingAtelierLoFi] = useState(false);

  // Quick call note modal state
  const [quickNoteProjectId, setQuickNoteProjectId] = useState<string>(projects[0]?.id || '');
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteAction, setQuickNoteAction] = useState('');
  const [quickNoteSuccess, setQuickNoteSuccess] = useState(false);

  const todayTasks = tasks.filter(t => t.scheduledDate === todayDate);
  const pendingTasks = todayTasks.filter(t => !t.completed);
  const completedTasks = todayTasks.filter(t => t.completed);

  const todayAppointments = appointments.filter(a => a.date === todayDate);
  const unreadEmails = emails.filter(e => e.isUnread);

  const totalHoursToday = getTotalHoursForDate(todayDate);
  const maxHours = getMaxHoursForDate(todayDate);
  const loadPercentage = maxHours > 0 ? Math.min(100, Math.round((totalHoursToday / maxHours) * 100)) : 100;
  const isOverloaded = maxHours > 0 ? totalHoursToday > maxHours : totalHoursToday > 0;

  const moveTaskToTomorrow = (taskId: string) => {
    rescheduleTask(taskId, '2026-10-17');
  };

  const handleSaveQuickCallNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle || !quickNoteProjectId) return;

    addCallNote({
      projectId: quickNoteProjectId,
      date: todayDate,
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 30,
      title: quickNoteTitle,
      attendees: getProjectById(quickNoteProjectId)?.clientName || 'Cliente',
      notes: quickNoteText,
      aestheticDecisions: {},
      actionItems: quickNoteAction ? [quickNoteAction] : []
    }, true);

    setQuickNoteTitle('');
    setQuickNoteText('');
    setQuickNoteAction('');
    setQuickNoteSuccess(true);
    setTimeout(() => setQuickNoteSuccess(false), 3000);
  };

  // Calendar days grid for October 2026 (matching Image 1 & 2 calendar widget)
  const daysInOctober = [
    { num: 12, label: 'L' },
    { num: 13, label: 'M' },
    { num: 14, label: 'M' },
    { num: 15, label: 'G' },
    { num: 16, label: 'V', isToday: true },
    { num: 17, label: 'S' },
    { num: 18, label: 'D' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 3-Column Modern Grid (Faithfully modeled on Image 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ========================================================
            COLUMN 1 (Left): Weekly Pinned + Mini Calendar
            ======================================================== */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section: Weekly Pinned Projects (Image 1 top left) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E1B18] tracking-tight">
                Progetti in Evidenza
              </h2>
              <button 
                onClick={() => onOpenProjectDetail(projects[0]?.id || '')}
                className="text-[11px] font-semibold text-[#C58925] hover:underline"
              >
                Vedi tutti
              </button>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 2).map((proj, idx) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProjectDetail(proj.id)}
                  className="p-4 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF6E3] border border-[#FBEAC4] text-[#D89324] flex items-center justify-center text-lg shrink-0">
                      {idx === 0 ? '💍' : '🌿'}
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs font-bold text-[#1E1B18] group-hover:text-[#C58925] transition-colors truncate">
                        {proj.title.split('—')[0]}
                      </h3>
                      <div className="text-[11px] text-[#8E8376] truncate">
                        {new Date(proj.eventDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} · Consegna {proj.targetDeliveryDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF2E1] text-[#B87C1D]">
                      {proj.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#A69C8E] font-mono">
                      € {proj.financials.agreedPrice}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#706456] line-clamp-2 leading-relaxed bg-[#FAF9F5] p-2 rounded-xl">
                    {proj.notes}
                  </p>
                </div>
              ))}

              {/* Add New Weekly Pin Button (matching Image 1 button) */}
              <button
                onClick={() => onOpenProjectDetail(projects[0]?.id || '')}
                className="w-full p-3.5 rounded-3xl border border-dashed border-[#DFD6C9] hover:border-[#C58925] bg-[#FFFFFF]/70 hover:bg-[#FFFDF9] text-[#7A6E62] hover:text-[#1E1B18] transition-all flex items-center gap-2.5 justify-center text-xs font-semibold cursor-pointer shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-[#FAF2E1] text-[#C58925] flex items-center justify-center font-bold">
                  +
                </div>
                <span>Esplora tutti i progetti attivi</span>
              </button>
            </div>
          </div>

          {/* Section: Mini Calendar Widget (matching Image 1 bottom left & Image 2 calendar) */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1E1B18]">Ottobre 2026</h3>
                <span className="text-[10px] text-[#8E8477]">Settimana Corrente</span>
              </div>
              <div className="flex items-center gap-1 text-[#9E9385]">
                <button className="p-1 hover:text-[#1E1B18] rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:text-[#1E1B18] rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Days Row */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {daysInOctober.map((d) => {
                const isSelected = selectedCalendarDay === d.num;
                return (
                  <button
                    key={d.num}
                    onClick={() => setSelectedCalendarDay(d.num)}
                    className="flex flex-col items-center py-1.5 rounded-2xl transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] text-[#9E9385] font-medium group-hover:text-[#1E1B18]">
                      {d.label}
                    </span>
                    <span className={`w-7 h-7 mt-1 flex items-center justify-center text-xs font-bold rounded-full transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#F7C25E] to-[#E9AA3A] text-[#1E1B18] shadow-sm shadow-[#F7C25E]/40 scale-105'
                        : d.isToday
                          ? 'border border-[#F7C25E] text-[#C58925]'
                          : 'text-[#4A4237] hover:bg-[#F7F5F0]'
                    }`}>
                      {d.num}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#F2EEE7] flex items-center justify-between text-[11px] text-[#8E8376]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5B7B61]" />
                {pendingTasks.length} task oggi
              </span>
              <span className="font-mono font-semibold text-[#2C2723]">{totalHoursToday}h</span>
            </div>
          </div>

          {/* Quick Call Scratchpad */}
          <div className="p-5 rounded-3xl bg-[#FAF9F5] border border-[#EAE4D9] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C58925]" />
              <h3 className="text-xs font-bold text-[#1E1B18]">Appunti Call al Volo</h3>
            </div>
            <form onSubmit={handleSaveQuickCallNote} className="space-y-2 text-xs">
              <select
                value={quickNoteProjectId}
                onChange={(e) => setQuickNoteProjectId(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded-xl text-xs"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Oggetto call..."
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded-xl text-xs"
                required
              />
              <textarea
                rows={2}
                placeholder="Decisioni sposi (carta, font, nastri)..."
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded-xl text-xs"
              />
              <input
                type="text"
                placeholder="Azione da svolgere (Task automatico)..."
                value={quickNoteAction}
                onChange={(e) => setQuickNoteAction(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded-xl text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#1E1B18] text-[#FFFFFF] font-semibold rounded-xl hover:bg-[#332E28] transition-colors cursor-pointer"
              >
                {quickNoteSuccess ? '✓ Appunti Salvati!' : 'Salva nel Progetto'}
              </button>
            </form>
          </div>

        </div>

        {/* ========================================================
            COLUMN 2 (Center): Today's Schedule (Image 1 center timeline)
            ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Header Today's Schedule */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1E1B18] tracking-tight">
                Programma di Oggi
              </h2>
              <div className="text-xs font-semibold text-[#C58925] mt-0.5">
                Venerdì 16 Ottobre 2026
              </div>
            </div>

            <button
              onClick={onOpenNewTask}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7C25E] to-[#E9AA3A] hover:brightness-105 active:scale-95 text-[#2C2723] flex items-center justify-center font-bold text-lg shadow-sm shadow-[#F7C25E]/30 cursor-pointer"
              title="Aggiungi task di lavorazione"
            >
              +
            </button>
          </div>

          {/* SMART ATELIER ALERTS BANNER (Point 5) */}
          {smartAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#C58925]">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  Alert & Attenzioni Atelier ({smartAlerts.length})
                </span>
              </div>
              <div className="space-y-2">
                {smartAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFFBF2] to-[#FFF6E3] border border-[#F5DEB3] shadow-xs flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-[#1E1B18] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#C58925] shrink-0" />
                        <span>{alert.title}</span>
                      </div>
                      <p className="text-[#6D6255] text-[11px] leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {alert.actionType === 'open_project' && alert.projectId && (
                        <button
                          onClick={() => onOpenProjectDetail(alert.projectId!)}
                          className="px-2.5 py-1 bg-[#1E1B18] text-[#F5BF58] rounded-xl font-bold text-[10px] hover:bg-[#332E28] transition-colors cursor-pointer"
                        >
                          {alert.actionLabel || 'Apri Commessa'}
                        </button>
                      )}
                      {alert.actionType === 'open_gmail' && (
                        <button
                          onClick={() => setActiveView('email_gmail')}
                          className="px-2.5 py-1 bg-[#1E1B18] text-[#F5BF58] rounded-xl font-bold text-[10px] hover:bg-[#332E28] transition-colors cursor-pointer"
                        >
                          {alert.actionLabel || 'Vai a Gmail'}
                        </button>
                      )}
                      {alert.actionType === 'open_supplier' && (
                        <button
                          onClick={() => setActiveView('magazzino')}
                          className="px-2.5 py-1 bg-[#1E1B18] text-[#F5BF58] rounded-xl font-bold text-[10px] hover:bg-[#332E28] transition-colors cursor-pointer"
                        >
                          {alert.actionLabel || 'Magazzino'}
                        </button>
                      )}
                      <button
                        onClick={() => setDismissedAlertIds(prev => [...prev, alert.id])}
                        className="text-[10px] text-[#A69C8E] hover:text-[#1E1B18] cursor-pointer"
                      >
                        Ignora
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Cards (Matching Image 1 cards: yellow highlight for active + clean white cards) */}
          <div className="space-y-3.5">
            {todayTasks.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] text-center text-xs text-[#8E8477]">
                Nessuna lavorazione programmata per oggi.
              </div>
            ) : (
              todayTasks.map((task, index) => {
                const project = getProjectById(task.projectId);
                // First pending task gets the prominent soft golden yellow card from Image 1!
                const isHighlightCard = !task.completed && index === 0;

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-3xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] border relative group ${
                      task.completed
                        ? 'bg-[#FAF9F5] border-[#E8E2D7] opacity-60'
                        : isHighlightCard
                          ? 'bg-gradient-to-r from-[#FFF2D6] to-[#FFEEC4] border-[#F2DEB5] text-[#2C2723]'
                          : 'bg-[#FFFFFF] border-[#EFECE5] hover:border-[#DFD6C9]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox button */}
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          task.completed
                            ? 'bg-[#5B7B61] text-white'
                            : isHighlightCard
                              ? 'bg-[#F5BF58] hover:bg-[#E9AA3A] text-white'
                              : 'border-2 border-[#D9D0C3] hover:border-[#F5BF58]'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            isHighlightCard ? 'text-[#9C6811]' : 'text-[#8E8376]'
                          }`}>
                            {task.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#1E1B18] bg-[#FFFFFF]/60 px-2 py-0.5 rounded-lg">
                            {task.estimatedHours}h
                          </span>
                        </div>

                        <div className={`text-sm font-bold leading-snug ${
                          task.completed ? 'line-through text-[#7A7063]' : 'text-[#1E1B18]'
                        }`}>
                          {task.title}
                        </div>

                        {task.notes && (
                          <div className={`mt-2 p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                            isHighlightCard ? 'bg-[#FFFFFF]/60 text-[#594A37]' : 'bg-[#FAF9F5] text-[#695F54]'
                          }`}>
                            {task.notes}
                          </div>
                        )}

                        {/* Project Footer Tag & Reschedule */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 text-xs">
                          {project ? (
                            <button
                              onClick={() => onOpenProjectDetail(project.id)}
                              className="font-bold text-[11px] text-[#3E342B] hover:text-[#C58925] truncate max-w-[200px]"
                            >
                              💍 {project.clientName}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#8E8376]">Atelier</span>
                          )}

                          <div className="flex items-center gap-2">
                            {project && (
                              <button
                                onClick={() => openDriveFolderForProject(project.id)}
                                className="text-[11px] font-semibold text-[#5B7B61] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Folder className="w-3 h-3 text-[#5B7B61]" /> Drive
                              </button>
                            )}

                            <button
                              onClick={() => moveTaskToTomorrow(task.id)}
                              className="text-[10px] font-medium text-[#7C7063] hover:text-[#1E1B18] bg-[#FFFFFF]/70 px-2 py-1 rounded-xl cursor-pointer"
                              title="Riprogramma a domani"
                            >
                              A domani →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMN 3 (Right): Upcoming Appointment Hero Card, Daily Progress Ring & Widgets
            ======================================================== */}
        <div className="lg:col-span-4 space-y-6">

          {/* Section: Upcoming Appointment Hero Card (Matching Image 2 top center hero card!) */}
          {todayAppointments.length > 0 ? (
            <div className="rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Illustration / Card Banner */}
              <div className="h-28 bg-gradient-to-r from-[#D7E8DC] via-[#EAF3EC] to-[#F7F2E7] p-4 flex items-center justify-between relative">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#4E7557] bg-white/70 px-2 py-0.5 rounded-full">
                    Prossimo Incontro Sposi
                  </span>
                  <div className="font-bold text-sm text-[#233527] mt-1">
                    {todayAppointments[0].title}
                  </div>
                </div>
                <div className="text-3xl">🕊️</div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FAF2E1] border border-[#EFE4CE] flex items-center justify-center text-sm font-bold text-[#8A5B11]">
                      SV
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1E1B18]">Sofia Visconti & Edoardo</div>
                      <div className="text-[11px] text-[#8E8376]">Revisione Bozze & Packaging</div>
                    </div>
                  </div>

                  {/* Bright Green Video-Call Button (exact style from Image 2!) */}
                  {todayAppointments[0].locationOrLink.startsWith('http') && (
                    <a
                      href={todayAppointments[0].locationOrLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-2xl bg-[#6C8E75] hover:bg-[#587961] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video-call</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#7A6F62] bg-[#FAF9F5] p-3 rounded-2xl">
                  <div className="flex items-center gap-1 font-semibold text-[#2C2723]">
                    <Clock className="w-3.5 h-3.5 text-[#C58925]" />
                    <span>{todayAppointments[0].time}</span>
                  </div>
                  <span>·</span>
                  <span>{todayAppointments[0].durationMinutes} minuti</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] text-center text-xs text-[#8E8477]">
              Nessun appuntamento sposi per oggi.
            </div>
          )}

          {/* Section: Daily Progress Ring Gauge (Exact match from Image 2 "Daily progress 80%"!) */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E8477]">
                Progresso Atelier Oggi
              </span>
              <h3 className="text-sm font-bold text-[#1E1B18] mt-0.5">
                Capacità Giornaliera
              </h3>
              <p className="text-[11px] text-[#7A6F62] mt-1 max-w-[160px] leading-snug">
                {totalHoursToday.toFixed(1)}h programmate su {maxHours}h max sostenibili.
              </p>
            </div>

            {/* Circular Progress Ring with % */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#F2EEE7"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke={isOverloaded ? '#E06A5F' : loadPercentage >= 85 ? '#F7C25E' : '#6C8E75'}
                  strokeWidth="7"
                  strokeDasharray="201"
                  strokeDashoffset={201 - (201 * loadPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute font-black text-sm text-[#1E1B18]">
                {loadPercentage}%
              </span>
            </div>
          </div>

          {/* Section: Gmail Inbox Quick Widget (Filter for unread) */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E07A5F]" />
                <h3 className="text-xs font-bold text-[#1E1B18]">Email Clienti da Leggere</h3>
              </div>
              <a
                href="https://mail.google.com/mail/u/0/#search/is%3Aunread"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-[#E07A5F] hover:underline flex items-center gap-0.5"
              >
                <span>Gmail</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {unreadEmails.length === 0 ? (
              <div className="text-[11px] text-[#8E8477] py-2 text-center">
                Tutte le email sono state lette! ✨
              </div>
            ) : (
              <div className="space-y-2">
                {unreadEmails.slice(0, 2).map((mail) => (
                  <div
                    key={mail.id}
                    className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#EDE7DD] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1E1B18]">{mail.clientName}</span>
                      <span className="text-[#9E9385] font-mono">{mail.time}</span>
                    </div>
                    <div className="text-xs font-medium text-[#4A4237] truncate">
                      {mail.subject}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => openGmailSearchForClient(mail.clientEmail, true)}
                        className="text-[10px] font-bold text-[#E07A5F] hover:underline"
                      >
                        Rispondi su Gmail →
                      </button>
                      <button
                        onClick={() => markEmailRead(mail.id, false)}
                        className="text-[10px] text-[#8E8477] hover:text-[#1E1B18]"
                      >
                        Segna letta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Atelier Lo-Fi / Focus Widget (matching Image 1 top right audio widget) */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF9F5] to-[#F2EFE8] border border-[#EAE4D9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E07A5F] text-white flex items-center justify-center text-lg shadow-sm">
                📻
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E1B18]">Atelier Paper Mood</div>
                <div className="text-[11px] text-[#8E8477]">Musica acustica & concentrazione</div>
              </div>
            </div>

            <button
              onClick={() => setIsPlayingAtelierLoFi(!isPlayingAtelierLoFi)}
              className="w-8 h-8 rounded-full bg-[#F7C25E] hover:bg-[#E9AA3A] text-[#1E1B18] flex items-center justify-center transition-all cursor-pointer font-bold"
            >
              {isPlayingAtelierLoFi ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
