import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus,
  Sliders, 
  ArrowRight, 
  Coffee,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Check,
  LayoutGrid,
  ListFilter,
  CalendarDays,
  Zap,
  Users,
  Palette,
  Scissors,
  MessageCircle,
  Briefcase
} from 'lucide-react';
import { ProjectTask, AssigneeId } from '../types';
import { checkProjectFeasibility, generateBackwardTasksForProject } from '../utils/capacityEngine';

interface CapacityPlannerProps {
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNewTask: () => void;
}

export const CapacityPlanner: React.FC<CapacityPlannerProps> = ({
  onOpenProjectDetail,
  onOpenNewTask,
}) => {
  const { 
    tasks, 
    projects, 
    appointments,
    getProjectById, 
    capacitySettings, 
    updateCapacitySettings,
    rescheduleTask,
    reassignTaskAssignee,
    addMultipleTasks,
    toggleTaskCompleted,
    deleteTask,
    todayDate,
    getMaxHoursForDate,
    setDayCapacity,
    setWeekdayCapacity
  } = useApp();

  const [currentWeekStart, setCurrentWeekStart] = useState<string>('2026-10-12');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // View Mode: 'cards' (spacious cards 2-3 per row) or 'rows' (full-width horizontal rows)
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');
  // Day filter: 'all' or specific dateStr
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  // Assignee filter: 'all' | 'giulia' | 'claudia' | 'esterno'
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');

  // Urgent Project Simulator State (Point 1)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simDeliveryDate, setSimDeliveryDate] = useState('2026-10-24');
  const [simPieces, setSimPieces] = useState(100);
  const [simWaxSeal, setSimWaxSeal] = useState(true);
  const [simSilkRibbon, setSimSilkRibbon] = useState(true);
  const [simProjectTitle, setSimProjectTitle] = useState('Commessa Urgente Sposi');

  // Generate 7 days for the week
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() + index);
    const dateStr = startDate.toISOString().split('T')[0];
    const dayName = startDate.toLocaleDateString('it-IT', { weekday: 'long' });
    const shortDayName = startDate.toLocaleDateString('it-IT', { weekday: 'short' });
    const formattedDate = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const shortFormattedDate = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    const dayOfWeek = startDate.getDay() === 0 ? 7 : startDate.getDay(); // 1=Lun, 7=Dom

    const maxHoursThisDay = getMaxHoursForDate(dateStr);

    return {
      dateStr,
      dayName,
      shortDayName,
      formattedDate,
      shortFormattedDate,
      dayOfWeek,
      isToday: dateStr === todayDate,
      maxHours: maxHoursThisDay,
    };
  });

  const totalWeeklyCapacityHours = weekDays.reduce((acc, d) => acc + d.maxHours, 0);

  const weeklyTasks = tasks.filter(t => 
    weekDays.some(d => d.dateStr === t.scheduledDate)
  );

  const totalWeeklyBookedHours = weeklyTasks
    .filter(t => !t.completed)
    .reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  const weeklyLoadPercentage = totalWeeklyCapacityHours > 0 
    ? Math.round((totalWeeklyBookedHours / totalWeeklyCapacityHours) * 100)
    : 100;

  // Department breakdown (Point 13)
  const deptHours = {
    grafica: weeklyTasks.filter(t => !t.completed && (t.department === 'grafica_design' || t.category === 'design')).reduce((a, b) => a + (b.estimatedHours || 0), 0),
    produzione: weeklyTasks.filter(t => !t.completed && (t.department === 'produzione_manuale' || t.category === 'taglio' || t.category === 'sigilli' || t.category === 'nastri' || t.category === 'confezionamento_manuale' || t.category === 'stampa')).reduce((a, b) => a + (b.estimatedHours || 0), 0),
    comunicazione: weeklyTasks.filter(t => !t.completed && t.department === 'comunicazione_clienti').reduce((a, b) => a + (b.estimatedHours || 0), 0),
    amministrazione: weeklyTasks.filter(t => !t.completed && (t.department === 'amministrazione' || t.category === 'fornitori')).reduce((a, b) => a + (b.estimatedHours || 0), 0),
  };

  // Collaborator breakdown (Point 14)
  const giuliaBooked = weeklyTasks.filter(t => !t.completed && t.assignee === 'giulia').reduce((a, b) => a + (b.estimatedHours || 0), 0);
  const claudiaBooked = weeklyTasks.filter(t => !t.completed && t.assignee === 'claudia').reduce((a, b) => a + (b.estimatedHours || 0), 0);
  const esternoBooked = weeklyTasks.filter(t => !t.completed && t.assignee === 'esterno').reduce((a, b) => a + (b.estimatedHours || 0), 0);

  // Simulator Feasibility Calculation (Point 1)
  const simHours = Number((simPieces * 0.08 + 5).toFixed(1));
  const simFeasibility = checkProjectFeasibility(
    simDeliveryDate,
    simHours,
    tasks,
    appointments,
    getMaxHoursForDate,
    14
  );

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const handleResetToCurrentWeek = () => {
    setCurrentWeekStart('2026-10-12');
    setSelectedDayFilter('all');
  };

  const weekdayLabels = [
    { id: 1, name: 'Lunedì' },
    { id: 2, name: 'Martedì' },
    { id: 3, name: 'Mercoledì' },
    { id: 4, name: 'Giovedì' },
    { id: 5, name: 'Venerdì' },
    { id: 6, name: 'Sabato' },
    { id: 7, name: 'Domenica' },
  ];

  const displayedDays = selectedDayFilter === 'all' 
    ? weekDays 
    : weekDays.filter(d => d.dateStr === selectedDayFilter);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Card - Spacious & Clean */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C58925]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pianificazione Carichi & Disponibilità Oraria</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E1B18] tracking-tight mt-1.5">
            Capacity Planner Settimanale
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8376] mt-1 max-w-2xl font-medium leading-relaxed">
            Gestisci comodamente il tuo tempo giorno per giorno. Imposta le ore che desideri dedicare all'atelier in ciascuna giornata e distribuisci il lavoro senza sentirti mai sopraffatta.
          </p>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week switcher */}
          <div className="flex items-center bg-[#FAF9F5] border border-[#E8E2D7] rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-[#6D6053] hover:text-[#1E1B18] hover:bg-[#FFFFFF] rounded-xl transition-colors cursor-pointer"
              title="Settimana precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetToCurrentWeek}
              className="px-4 py-1.5 text-xs font-bold text-[#1E1B18] hover:bg-[#FFFFFF] rounded-xl transition-colors cursor-pointer"
            >
              Settimana Corrente
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 text-[#6D6053] hover:text-[#1E1B18] hover:bg-[#FFFFFF] rounded-xl transition-colors cursor-pointer"
              title="Settimana successiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle: Cards vs Rows */}
          <div className="flex items-center bg-[#FAF9F5] border border-[#E8E2D7] rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-[#1E1B18] text-white shadow-xs' : 'text-[#7A6F62] hover:text-[#1E1B18]'
              }`}
              title="Vista Schede Spaziose"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Schede</span>
            </button>
            <button
              onClick={() => setViewMode('rows')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'rows' ? 'bg-[#1E1B18] text-white shadow-xs' : 'text-[#7A6F62] hover:text-[#1E1B18]'
              }`}
              title="Vista Righe Dettagliate"
            >
              <ListFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Righe</span>
            </button>
          </div>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-2xl bg-gradient-to-r from-[#FFF6E3] to-[#FFF0D4] hover:bg-[#FFE8BF] text-[#8C5815] border border-[#F5DEB3] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Simula la fattibilità di un nuovo progetto prima di accettare"
          >
            <Zap className="w-4 h-4 text-[#C58925]" />
            <span>⚡ Verifica Commessa Urgente</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
              isSettingsOpen 
                ? 'bg-[#C58925] text-white shadow-sm' 
                : 'bg-[#FAF9F5] hover:bg-[#F2EFE8] text-[#3E342B] border border-[#E8E2D7]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Orari Ricorrenti</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-br from-[#F7C25E] to-[#E9AA3A] hover:brightness-105 active:scale-95 text-[#1E1B18] rounded-2xl transition-all shadow-md shadow-[#F7C25E]/30 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Task</span>
          </button>
        </div>
      </div>

      {/* Weekdays Filter Pills (Spacious day tabs so user can see all or isolate a specific day) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedDayFilter === 'all'
              ? 'bg-[#1E1B18] text-white shadow-xs'
              : 'bg-[#FFFFFF] border border-[#E8E2D7] text-[#7A6F62] hover:bg-[#FAF9F5]'
          }`}
        >
          Tutti i 7 Giorni ({weeklyTasks.length} task)
        </button>

        {weekDays.map(day => {
          const isSelected = selectedDayFilter === day.dateStr;
          const dayCount = tasks.filter(t => t.scheduledDate === day.dateStr && !t.completed).length;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayFilter(day.dateStr)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : day.isToday
                    ? 'bg-[#FFF6E3] border border-[#F5BF58] text-[#A66D12]'
                    : 'bg-[#FFFFFF] border border-[#E8E2D7] text-[#635749] hover:bg-[#FAF9F5]'
              }`}
            >
              <span>{day.shortDayName} {day.shortFormattedDate}</span>
              {day.isToday && <span className="text-[10px] bg-[#F5BF58] text-[#1E1B18] px-1.5 py-0.2 rounded-full">Oggi</span>}
              {dayCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#EDE7DC] text-[#4A4237]'
                }`}>
                  {dayCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collaborator Filter Pills & Team Capacity Overview (Points 13 & 14) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EFECE5] shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-[#8E8376] flex items-center gap-1.5 shrink-0">
            <Users className="w-4 h-4 text-[#C58925]" /> Responsabile:
          </span>
          <button
            onClick={() => setSelectedAssigneeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedAssigneeFilter === 'all'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'bg-[#FAF9F5] text-[#6D6255] hover:bg-[#F2EEE7] border border-[#E8E2D7]'
            }`}
          >
            Tutto l'Atelier ({weeklyTasks.length} task)
          </button>
          <button
            onClick={() => setSelectedAssigneeFilter('giulia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedAssigneeFilter === 'giulia'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'bg-[#FAF9F5] text-[#6D6255] hover:bg-[#F2EEE7] border border-[#E8E2D7]'
            }`}
          >
            <span>👩‍🎨 Giulia</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[#FAF2E1] text-[#9A6214] font-bold">
              {giuliaBooked.toFixed(1)}h
            </span>
          </button>
          <button
            onClick={() => setSelectedAssigneeFilter('claudia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedAssigneeFilter === 'claudia'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'bg-[#FAF9F5] text-[#6D6255] hover:bg-[#F2EEE7] border border-[#E8E2D7]'
            }`}
          >
            <span>✂️ Claudia</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[#EBF5ED] text-[#2F6D3C] font-bold">
              {claudiaBooked.toFixed(1)}h
            </span>
          </button>
          <button
            onClick={() => setSelectedAssigneeFilter('esterno')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedAssigneeFilter === 'esterno'
                ? 'bg-[#1E1B18] text-white shadow-xs'
                : 'bg-[#FAF9F5] text-[#6D6255] hover:bg-[#F2EEE7] border border-[#E8E2D7]'
            }`}
          >
            <span>🏭 Esterno</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[#F2EFFB] text-[#5A38A8] font-bold">
              {esternoBooked.toFixed(1)}h
            </span>
          </button>
        </div>

        {/* Quick Delegation Advice */}
        <div className="text-[11px] text-[#7A6F62] flex items-center gap-2">
          {claudiaBooked < 15 ? (
            <span className="text-[#2F6D3C] font-semibold bg-[#EBF5ED] px-2.5 py-1 rounded-xl border border-[#CCE8D0]">
              ✨ Claudia ha ancora disponibilità per taglio, sigilli o confezionamento.
            </span>
          ) : (
            <span className="text-[#A46714] font-semibold bg-[#FFF5DC] px-2.5 py-1 rounded-xl border border-[#F5DEB3]">
              ⚡ Laboratorio a pieno regime questa settimana.
            </span>
          )}
        </div>
      </div>

      {/* DEPARTMENT TIME BREAKDOWN (Point 13 - Separazione Grafica / Produzione / Comunicazione / Amministrazione) */}
      <div className="p-5 rounded-3xl bg-white border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2EEE7] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B18]">
            <Palette className="w-4 h-4 text-[#C58925]" />
            <span>Ripartizione Oraria per Dipartimento Settimanale</span>
          </div>
          <span className="text-xs text-[#8E8376] font-medium">
            Ore totali assegnate: <strong>{totalWeeklyBookedHours.toFixed(1)}h</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E2D7] space-y-1">
            <div className="text-[11px] font-bold text-[#8E8376] flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>Grafica & Design</span>
            </div>
            <div className="font-mono text-base font-bold text-[#1E1B18]">
              {deptHours.grafica.toFixed(1)} h
            </div>
            <div className="text-[10px] text-[#9E9385]">
              {totalWeeklyBookedHours > 0 ? Math.round((deptHours.grafica / totalWeeklyBookedHours) * 100) : 0}% del totale
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E2D7] space-y-1">
            <div className="text-[11px] font-bold text-[#8E8376] flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>Produzione Manuale</span>
            </div>
            <div className="font-mono text-base font-bold text-[#1E1B18]">
              {deptHours.produzione.toFixed(1)} h
            </div>
            <div className="text-[10px] text-[#9E9385]">
              {totalWeeklyBookedHours > 0 ? Math.round((deptHours.produzione / totalWeeklyBookedHours) * 100) : 0}% del totale
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E2D7] space-y-1">
            <div className="text-[11px] font-bold text-[#8E8376] flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Relazioni & Clienti</span>
            </div>
            <div className="font-mono text-base font-bold text-[#1E1B18]">
              {deptHours.comunicazione.toFixed(1)} h
            </div>
            <div className="text-[10px] text-[#9E9385]">
              {totalWeeklyBookedHours > 0 ? Math.round((deptHours.comunicazione / totalWeeklyBookedHours) * 100) : 0}% del totale
            </div>
          </div>

          <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#E8E2D7] space-y-1">
            <div className="text-[11px] font-bold text-[#8E8376] flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin & Fornitori</span>
            </div>
            <div className="font-mono text-base font-bold text-[#1E1B18]">
              {deptHours.amministrazione.toFixed(1)} h
            </div>
            <div className="text-[10px] text-[#9E9385]">
              {totalWeeklyBookedHours > 0 ? Math.round((deptHours.amministrazione / totalWeeklyBookedHours) * 100) : 0}% del totale
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Weekly Settings Drawer */}
      {isSettingsOpen && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#E8E2D7] shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE5] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#1E1B18]">
                Disponibilità Oraria Predefinita per la Settimana
              </h3>
              <p className="text-xs text-[#8E8376] mt-1">
                Imposta qui le ore standard per ogni giorno della settimana. Serviranno da base per tutte le settimane future.
              </p>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="self-start sm:self-auto text-xs font-bold text-[#8E8477] hover:text-[#1E1B18] bg-white px-4 py-2 rounded-2xl border border-[#E8E2D7] transition-colors"
            >
              Chiudi Pannello
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {weekdayLabels.map((day) => {
              const currentHours = capacitySettings.dailyCapacityByWeekday?.[day.id] ?? 6.0;
              return (
                <div key={day.id} className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#E8E2D7] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#1E1B18]">{day.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      currentHours === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {currentHours === 0 ? 'Riposo' : `${currentHours}h`}
                    </span>
                  </div>

                  {/* Stepper with comfortable touch buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setWeekdayCapacity(day.id, Math.max(0, currentHours - 0.5))}
                      className="w-9 h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EEE7] border border-[#E8E2D7] font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 text-center font-black text-sm text-[#1E1B18] font-mono">
                      {currentHours.toFixed(1)} h
                    </div>
                    <button
                      onClick={() => setWeekdayCapacity(day.id, currentHours + 0.5)}
                      className="w-9 h-9 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EEE7] border border-[#E8E2D7] font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick preset buttons */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <button
                      onClick={() => setWeekdayCapacity(day.id, 0)}
                      className="py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#EFECE5] text-[10px] font-bold text-[#8E8376] hover:text-[#1E1B18] text-center"
                    >
                      0h
                    </button>
                    <button
                      onClick={() => setWeekdayCapacity(day.id, 4)}
                      className="py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#EFECE5] text-[10px] font-bold text-[#8E8376] hover:text-[#1E1B18] text-center"
                    >
                      4h
                    </button>
                    <button
                      onClick={() => setWeekdayCapacity(day.id, 6.5)}
                      className="py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#EFECE5] text-[10px] font-bold text-[#8E8376] hover:text-[#1E1B18] text-center"
                    >
                      6.5h
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7A6F62] border-t border-[#EFECE5] gap-2">
            <span className="font-semibold">
              Capacità Settimanale Complessiva: <strong className="text-[#1E1B18] text-sm">{totalWeeklyCapacityHours.toFixed(1)} ore disponibili</strong>
            </span>
            <span className="text-[#9E9385]">
              Le modifiche si aggiornano all'istante
            </span>
          </div>
        </div>
      )}

      {/* Weekly Capacity Overview Banner */}
      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-[#1E1B18]">Volume di Lavoro per la Settimana:</span>
            <span className="text-xs font-semibold text-[#8E8376] bg-[#FAF9F5] px-3 py-1 rounded-xl border border-[#E8E2D7]">
              {totalWeeklyBookedHours.toFixed(1)}h prenotate / {totalWeeklyCapacityHours.toFixed(1)}h disponibili
            </span>
          </div>
          <span className={`font-bold text-sm ${weeklyLoadPercentage > 100 ? 'text-[#E06A5F]' : 'text-[#6C8E75]'}`}>
            {weeklyLoadPercentage}% della capacità totale
          </span>
        </div>

        <div className="w-full bg-[#FAF9F5] h-3.5 rounded-full overflow-hidden border border-[#EFECE5]">
          <div 
            className={`h-full transition-all duration-300 ${
              weeklyLoadPercentage > 100 
                ? 'bg-[#E06A5F]' 
                : weeklyLoadPercentage >= 80 
                  ? 'bg-[#F7C25E]' 
                  : 'bg-[#6C8E75]'
            }`}
            style={{ width: `${Math.min(100, weeklyLoadPercentage)}%` }}
          />
        </div>
      </div>

      {/* ========================================================
          VIEW MODE 1: SPATIOUS CARDS GRID (2 or 3 per row)
          NOT CRAMPED! Every day card gets 350px-450px of breathing room!
          ======================================================== */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedDays.map((day) => {
            const dayTasks = tasks.filter(t => t.scheduledDate === day.dateStr && (selectedAssigneeFilter === 'all' || t.assignee === selectedAssigneeFilter));
            const pending = dayTasks.filter(t => !t.completed);
            const dayBookedHours = pending.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
            
            const maxHoursThisDay = day.maxHours;
            const dayLoadPercentage = maxHoursThisDay > 0 
              ? Math.round((dayBookedHours / maxHoursThisDay) * 100)
              : dayBookedHours > 0 ? 999 : 0;
              
            const isOver = maxHoursThisDay > 0 ? dayBookedHours > maxHoursThisDay : dayBookedHours > 0;
            const isOffDay = maxHoursThisDay === 0;

            return (
              <div
                key={day.dateStr}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all border shadow-[0_4px_25px_rgba(0,0,0,0.03)] ${
                  day.isToday
                    ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FFF9EE] border-[#F5BF58] ring-2 ring-[#F5BF58]/50 shadow-md'
                    : isOffDay
                      ? 'bg-[#FAF9F5]/70 border-[#E8E2D7] opacity-90'
                      : 'bg-[#FFFFFF] border-[#EFECE5] hover:border-[#DFD6C9]'
                }`}
              >
                <div className="space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#F2EEE7] pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#8E8376]">
                          {day.dayName}
                        </span>
                        {day.isToday && (
                          <span className="text-[10px] font-bold bg-[#F5BF58] text-[#1E1B18] px-2 py-0.5 rounded-full">
                            Oggi
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-[#1E1B18] mt-0.5">
                        {day.formattedDate}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-[#8E8376]">Carico Ore:</div>
                      <div className="font-mono text-base font-bold text-[#1E1B18]">
                        {dayBookedHours.toFixed(1)}h <span className="text-xs text-[#8E8376] font-normal">/ {maxHoursThisDay}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Day Availability Selector (Roomy & Comfortable!) */}
                  <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#4A4237] flex items-center gap-1.5">
                        {isOffDay ? <Moon className="w-4 h-4 text-[#A69C8E]" /> : <Sun className="w-4 h-4 text-[#C58925]" />}
                        Disponibilità Giornaliera:
                      </span>
                      <span className="font-mono font-bold text-sm text-[#1E1B18] bg-white px-2.5 py-0.5 rounded-lg border border-[#E8E2D7]">
                        {maxHoursThisDay.toFixed(1)} ore
                      </span>
                    </div>

                    {/* Stepper with large touch targets */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => setDayCapacity(day.dateStr, Math.max(0, maxHoursThisDay - 0.5))}
                        className="w-10 h-10 rounded-xl bg-white border border-[#DFD6C9] hover:bg-[#F2EEE7] font-bold text-sm flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        title="Diminuisci di 30 min"
                      >
                        <Minus className="w-4 h-4 text-[#4A4237]" />
                      </button>

                      <div className="flex-1 grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => setDayCapacity(day.dateStr, 0)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            maxHoursThisDay === 0 
                              ? 'bg-[#1E1B18] text-white shadow-xs' 
                              : 'bg-white border border-[#E8E2D7] text-[#7A6F62] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          0h
                        </button>
                        <button
                          onClick={() => setDayCapacity(day.dateStr, 4)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            maxHoursThisDay === 4 
                              ? 'bg-[#1E1B18] text-white shadow-xs' 
                              : 'bg-white border border-[#E8E2D7] text-[#7A6F62] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          4h
                        </button>
                        <button
                          onClick={() => setDayCapacity(day.dateStr, 6.5)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            maxHoursThisDay === 6.5 
                              ? 'bg-[#1E1B18] text-white shadow-xs' 
                              : 'bg-white border border-[#E8E2D7] text-[#7A6F62] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          6.5h
                        </button>
                        <button
                          onClick={() => setDayCapacity(day.dateStr, 8)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            maxHoursThisDay === 8 
                              ? 'bg-[#1E1B18] text-white shadow-xs' 
                              : 'bg-white border border-[#E8E2D7] text-[#7A6F62] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          8h
                        </button>
                      </div>

                      <button
                        onClick={() => setDayCapacity(day.dateStr, maxHoursThisDay + 0.5)}
                        className="w-10 h-10 rounded-xl bg-white border border-[#DFD6C9] hover:bg-[#F2EEE7] font-bold text-sm flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        title="Aumenta di 30 min"
                      >
                        <Plus className="w-4 h-4 text-[#4A4237]" />
                      </button>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-[#EAE4D8] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isOver ? 'bg-[#E06A5F]' : 'bg-[#6C8E75]'
                          }`}
                          style={{ width: `${Math.min(100, dayLoadPercentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        {isOver ? (
                          <span className="text-[#E06A5F] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Sovraccarico di +{(dayBookedHours - maxHoursThisDay).toFixed(1)}h
                          </span>
                        ) : isOffDay ? (
                          <span className="text-[#8E8376] font-medium">Giorno di riposo impostato</span>
                        ) : (
                          <span className="text-[#6C8E75] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Rimangono {(maxHoursThisDay - dayBookedHours).toFixed(1)} ore disponibili
                          </span>
                        )}

                        <span className="font-mono text-[#8E8376] font-bold">
                          {dayLoadPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks List - Spacious, Clean, Easy to Read! */}
                  <div className="space-y-3 min-h-[180px]">
                    <div className="text-xs font-bold text-[#8E8376] uppercase tracking-wider flex items-center justify-between">
                      <span>Lavorazioni Programmate ({pending.length})</span>
                      <button
                        onClick={onOpenNewTask}
                        className="text-[#C58925] hover:underline flex items-center gap-1 font-bold text-xs"
                      >
                        + Aggiungi
                      </button>
                    </div>

                    {pending.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#FAF9F5] border border-dashed border-[#DFD6C9] text-center text-xs text-[#8E8376] italic">
                        Nessun task programmato per questo giorno.
                      </div>
                    ) : (
                      pending.map(t => {
                        const proj = getProjectById(t.projectId);
                        const isMoving = movingTaskId === t.id;

                        return (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-[#FAF9F5] hover:bg-[#F5F2EA] border border-[#EFECE5] space-y-2.5 transition-all shadow-2xs group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF2E1] text-[#B87C1D]">
                                {t.category.replace('_', ' ')}
                              </span>
                              <span className="font-mono text-xs font-bold text-[#1E1B18] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                                <Clock className="w-3 h-3 inline mr-1 text-[#C58925]" />
                                {t.estimatedHours}h
                              </span>
                            </div>

                            <div className="font-bold text-sm text-[#1E1B18] leading-snug">
                              {t.title}
                            </div>

                            {proj && (
                              <div className="text-xs text-[#7A6F62] flex items-center gap-1.5 font-medium">
                                <span>💍 Sposi:</span>
                                <span className="font-bold text-[#1E1B18] truncate">{proj.clientName}</span>
                              </div>
                            )}

                            {t.notes && (
                              <div className="text-xs text-[#706456] bg-white p-2.5 rounded-xl border border-[#E8E2D7]">
                                {t.notes}
                              </div>
                            )}

                            {/* Actions on Task */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#EAE4D8] text-xs">
                              <button
                                onClick={() => toggleTaskCompleted(t.id)}
                                className="text-[#6C8E75] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Segna Completato</span>
                              </button>

                              <div className="relative">
                                <button
                                  onClick={() => setMovingTaskId(isMoving ? null : t.id)}
                                  className="text-[#8E8376] hover:text-[#1E1B18] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Sposta giorno</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>

                                {isMoving && (
                                  <div className="absolute right-0 bottom-8 bg-[#FFFFFF] border border-[#DFD6C9] rounded-2xl shadow-xl p-3 z-50 w-52 text-left animate-in fade-in zoom-in-95">
                                    <div className="text-xs font-bold text-[#4A4237] mb-2">
                                      Sposta questa lavorazione a:
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                      {weekDays.map(d => (
                                        <button
                                          key={d.dateStr}
                                          onClick={() => {
                                            rescheduleTask(t.id, d.dateStr);
                                            setMovingTaskId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-[#FAF9F5] rounded-xl text-xs font-medium text-[#2C2723]"
                                        >
                                          {d.dayName} ({d.shortFormattedDate})
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bottom Card Action */}
                <div className="pt-4 border-t border-[#F2EEE7] mt-4">
                  <button
                    onClick={onOpenNewTask}
                    className="w-full py-2.5 rounded-2xl bg-[#FAF9F5] hover:bg-[#F2EEE7] text-xs font-bold text-[#4A4237] hover:text-[#1E1B18] transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#E8E2D7]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Lavorazione a {day.shortDayName}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          VIEW MODE 2: EXPANSIVE TIMELINE ROWS (Wide Horizon)
          Full width rows with generous space for tasks side by side!
          ======================================================== */}
      {viewMode === 'rows' && (
        <div className="space-y-6">
          {displayedDays.map((day) => {
            const dayTasks = tasks.filter(t => t.scheduledDate === day.dateStr && (selectedAssigneeFilter === 'all' || t.assignee === selectedAssigneeFilter));
            const pending = dayTasks.filter(t => !t.completed);
            const dayBookedHours = pending.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
            
            const maxHoursThisDay = day.maxHours;
            const dayLoadPercentage = maxHoursThisDay > 0 
              ? Math.round((dayBookedHours / maxHoursThisDay) * 100)
              : dayBookedHours > 0 ? 999 : 0;
              
            const isOver = maxHoursThisDay > 0 ? dayBookedHours > maxHoursThisDay : dayBookedHours > 0;
            const isOffDay = maxHoursThisDay === 0;

            return (
              <div
                key={day.dateStr}
                className={`p-6 sm:p-8 rounded-3xl border shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all ${
                  day.isToday
                    ? 'bg-gradient-to-r from-[#FFFDF9] via-[#FFFFFF] to-[#FFF9EE] border-[#F5BF58] ring-2 ring-[#F5BF58]/40'
                    : isOffDay
                      ? 'bg-[#FAF9F5]/70 border-[#E8E2D7]'
                      : 'bg-[#FFFFFF] border-[#EFECE5]'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Day & Availability Control (4 cols) */}
                  <div className="lg:col-span-4 space-y-4 border-b lg:border-b-0 lg:border-r border-[#EFECE5] pb-6 lg:pb-0 lg:pr-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#8E8376]">
                            {day.dayName}
                          </span>
                          {day.isToday && (
                            <span className="text-[10px] font-bold bg-[#F5BF58] text-[#1E1B18] px-2 py-0.5 rounded-full">
                              Oggi
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-[#1E1B18] mt-0.5">
                          {day.formattedDate}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-[#8E8376]">Carico Ore</div>
                        <div className="font-mono text-base font-black text-[#1E1B18]">
                          {dayBookedHours.toFixed(1)}h <span className="text-xs font-normal text-[#8E8376]">/ {maxHoursThisDay}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper availability */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#4A4237]">Disponibilità Giornaliera:</span>
                        <span className="font-mono font-bold text-sm text-[#1E1B18] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                          {maxHoursThisDay.toFixed(1)} ore
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setDayCapacity(day.dateStr, Math.max(0, maxHoursThisDay - 0.5))}
                          className="w-9 h-9 rounded-xl bg-white border border-[#DFD6C9] hover:bg-[#F2EEE7] font-bold text-sm flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 grid grid-cols-4 gap-1">
                          <button
                            onClick={() => setDayCapacity(day.dateStr, 0)}
                            className={`py-1 rounded-xl text-xs font-bold cursor-pointer ${
                              maxHoursThisDay === 0 ? 'bg-[#1E1B18] text-white' : 'bg-white border border-[#E8E2D7] text-[#7A6F62]'
                            }`}
                          >
                            0h
                          </button>
                          <button
                            onClick={() => setDayCapacity(day.dateStr, 4)}
                            className={`py-1 rounded-xl text-xs font-bold cursor-pointer ${
                              maxHoursThisDay === 4 ? 'bg-[#1E1B18] text-white' : 'bg-white border border-[#E8E2D7] text-[#7A6F62]'
                            }`}
                          >
                            4h
                          </button>
                          <button
                            onClick={() => setDayCapacity(day.dateStr, 6.5)}
                            className={`py-1 rounded-xl text-xs font-bold cursor-pointer ${
                              maxHoursThisDay === 6.5 ? 'bg-[#1E1B18] text-white' : 'bg-white border border-[#E8E2D7] text-[#7A6F62]'
                            }`}
                          >
                            6.5h
                          </button>
                          <button
                            onClick={() => setDayCapacity(day.dateStr, 8)}
                            className={`py-1 rounded-xl text-xs font-bold cursor-pointer ${
                              maxHoursThisDay === 8 ? 'bg-[#1E1B18] text-white' : 'bg-white border border-[#E8E2D7] text-[#7A6F62]'
                            }`}
                          >
                            8h
                          </button>
                        </div>

                        <button
                          onClick={() => setDayCapacity(day.dateStr, maxHoursThisDay + 0.5)}
                          className="w-9 h-9 rounded-xl bg-white border border-[#DFD6C9] hover:bg-[#F2EEE7] font-bold text-sm flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-full bg-[#EAE4D8] h-2 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full ${isOver ? 'bg-[#E06A5F]' : 'bg-[#6C8E75]'}`}
                          style={{ width: `${Math.min(100, dayLoadPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Roomy Tasks Deck (8 cols) */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8E8376] uppercase tracking-wider">
                        Lavorazioni ({pending.length})
                      </span>
                      <button
                        onClick={onOpenNewTask}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EEE7] border border-[#E8E2D7] text-xs font-bold text-[#1E1B18] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C58925]" />
                        <span>Aggiungi Task</span>
                      </button>
                    </div>

                    {pending.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#FAF9F5] border border-dashed border-[#DFD6C9] text-center text-xs text-[#8E8376] italic">
                        Nessuna lavorazione programmata per {day.dayName}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pending.map(t => {
                          const proj = getProjectById(t.projectId);
                          const isMoving = movingTaskId === t.id;

                          return (
                            <div
                              key={t.id}
                              className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFECE5] hover:border-[#DFD6C9] space-y-2 relative shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FAF2E1] text-[#B87C1D]">
                                  {t.category.replace('_', ' ')}
                                </span>
                                <span className="font-mono text-xs font-bold text-[#1E1B18] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                                  {t.estimatedHours}h
                                </span>
                              </div>

                              <div className="font-bold text-sm text-[#1E1B18] leading-snug">
                                {t.title}
                              </div>

                              {proj && (
                                <div className="text-xs text-[#7A6F62] truncate font-medium">
                                  💍 {proj.clientName}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-[#EAE4D8] text-xs">
                                <button
                                  onClick={() => toggleTaskCompleted(t.id)}
                                  className="text-[#6C8E75] hover:underline font-bold cursor-pointer"
                                >
                                  ✓ Completato
                                </button>

                                <button
                                  onClick={() => setMovingTaskId(isMoving ? null : t.id)}
                                  className="text-[#8E8376] hover:text-[#1E1B18] font-bold"
                                >
                                  Sposta →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* URGENT PROJECT SIMULATOR & FEASIBILITY MODAL (Point 1 & 2) */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#EFECE5] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F2EEE7] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5BF58] to-[#E9A93A] text-[#1E1B18] flex items-center justify-center font-bold text-lg shadow-xs">
                  <Zap className="w-5 h-5 text-[#1E1B18]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1E1B18]">
                    Simulatore Commessa Urgente
                  </h3>
                  <p className="text-xs text-[#8E8376]">
                    Verifica disponibilità oraria e pianificazione automatica a ritroso
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="text-xs font-bold text-[#8E8376] hover:text-[#1E1B18] px-3 py-1.5 bg-[#FAF9F5] rounded-xl cursor-pointer"
              >
                Chiudi
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6F6355] font-semibold mb-1">Nome Commessa / Sposi</label>
                <input
                  type="text"
                  value={simProjectTitle}
                  onChange={(e) => setSimProjectTitle(e.target.value)}
                  placeholder="es. Matrimonio Urgente 24 Ottobre"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#DFD6C9] rounded-xl text-xs text-[#1E1B18] font-bold focus:outline-none focus:border-[#C58925]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6F6355] font-semibold mb-1">Data Consegna Richiesta</label>
                  <input
                    type="date"
                    value={simDeliveryDate}
                    onChange={(e) => setSimDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#DFD6C9] rounded-xl text-xs text-[#1E1B18] font-bold focus:outline-none focus:border-[#C58925]"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-semibold mb-1">Numero Pezzi (Inviti)</label>
                  <input
                    type="number"
                    value={simPieces}
                    onChange={(e) => setSimPieces(Number(e.target.value))}
                    min={10}
                    max={1000}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#DFD6C9] rounded-xl text-xs text-[#1E1B18] font-bold focus:outline-none focus:border-[#C58925]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={simWaxSeal}
                    onChange={(e) => setSimWaxSeal(e.target.checked)}
                    className="w-4 h-4 accent-[#1E1B18] rounded"
                  />
                  <span>Sigilli in Ceralacca a Caldo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={simSilkRibbon}
                    onChange={(e) => setSimSilkRibbon(e.target.checked)}
                    className="w-4 h-4 accent-[#1E1B18] rounded"
                  />
                  <span>Nastri in Pura Seta</span>
                </label>
              </div>
            </div>

            {/* Live Feasibility Diagnostic Result (Point 1) */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              simFeasibility.isFeasible 
                ? 'bg-[#F2F8F4] border-[#CCE8D4] text-[#285734]' 
                : 'bg-[#FFF7F5] border-[#F8D2CB] text-[#93372B]'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-sm">
                  {simFeasibility.isFeasible ? <CheckCircle2 className="w-4 h-4 text-[#285734]" /> : <AlertTriangle className="w-4 h-4 text-[#93372B]" />}
                  {simFeasibility.isFeasible ? 'Commessa Accettabile Senza Sovraccarico' : 'Attenzione: Capacità Oraria Insufficiente'}
                </span>
                <span className="font-mono text-xs bg-white/80 px-2 py-0.5 rounded-lg border border-black/5 font-bold">
                  {simHours}h stimate
                </span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {simFeasibility.suggestedAction}
              </p>
              
              <div className="text-[11px] pt-1 border-t border-black/5 flex items-center justify-between">
                <span>Ore disponibili nei 14 gg precedenti: <strong>{simFeasibility.totalAvailableHours.toFixed(1)}h</strong></span>
                {simFeasibility.deficitHours > 0 && (
                  <span className="text-red-700 font-bold">Deficit: -{simFeasibility.deficitHours.toFixed(1)}h</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="px-5 py-2.5 bg-[#FAF9F5] hover:bg-[#F2EEE7] text-[#635749] rounded-2xl font-bold text-xs cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  const generated = generateBackwardTasksForProject(
                    `proj-sim-${Date.now()}`,
                    simDeliveryDate,
                    simPieces,
                    simWaxSeal,
                    simSilkRibbon
                  );
                  addMultipleTasks(generated);
                  setIsSimulatorOpen(false);
                }}
                className="px-6 py-2.5 bg-[#1E1B18] hover:bg-[#322C27] text-[#F5BF58] rounded-2xl font-bold text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#F5BF58]" />
                <span>Pianifica Automaticamente a Ritroso ({simHours}h)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
