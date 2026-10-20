import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Scissors, 
  Layers, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  Flame, 
  Package, 
  Truck, 
  Search, 
  AlertTriangle,
  Zap,
  Tag
} from 'lucide-react';
import { AssigneeId } from '../types';
import { findBatchProductionOpportunities, BatchProductionGroup } from '../utils/capacityEngine';

interface ProduzioneAtelierViewProps {
  onOpenProjectDetail: (projectId: string) => void;
}

export const ProduzioneAtelierView: React.FC<ProduzioneAtelierViewProps> = ({
  onOpenProjectDetail
}) => {
  const { 
    tasks, 
    projects, 
    getProjectById, 
    toggleTaskCompleted, 
    reassignTaskAssignee, 
    logTaskActualHours 
  } = useApp();

  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Timer State for Atelier Workstation
  const [runningTimerTaskId, setRunningTimerTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [activeBatchModal, setActiveBatchModal] = useState<BatchProductionGroup | null>(null);

  // Interval for stopwatch
  useEffect(() => {
    let interval: any = null;
    if (runningTimerTaskId) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [runningTimerTaskId]);

  const handleStopTimer = (taskId: string) => {
    if (timerSeconds > 10) {
      const hoursLogged = Number((timerSeconds / 3600).toFixed(2));
      logTaskActualHours(taskId, hoursLogged);
    }
    setRunningTimerTaskId(null);
    setTimerSeconds(0);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Batch production opportunities across all active tasks
  const batchOpportunities = findBatchProductionOpportunities(tasks, projects);

  // Filter tasks
  const activeTasks = tasks.filter(t => !t.completed && t.status !== 'in_attesa_cliente' && t.status !== 'in_attesa_fornitore');

  const filteredTasks = activeTasks.filter(t => {
    const proj = getProjectById(t.projectId);
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj && proj.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj && proj.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProcess = selectedProcess === 'all' || t.category === selectedProcess;
    const matchesAssignee = selectedAssignee === 'all' || t.assignee === selectedAssignee;

    return matchesSearch && matchesProcess && matchesAssignee;
  });

  const processCategories = [
    { id: 'all', label: 'Tutti i Processi', icon: <Layers className="w-4 h-4" /> },
    { id: 'stampa', label: 'Stampa & Tipografia', icon: <Printer className="w-4 h-4 text-purple-600" /> },
    { id: 'taglio', label: 'Taglio & Rifilatura Cotone', icon: <Scissors className="w-4 h-4 text-amber-600" /> },
    { id: 'sigilli', label: 'Sigilli Ceralacca a Caldo', icon: <Flame className="w-4 h-4 text-rose-600" /> },
    { id: 'nastri', label: 'Nastri Seta & Taglio', icon: <Tag className="w-4 h-4 text-emerald-600" /> },
    { id: 'confezionamento_manuale', label: 'Assemblaggio & Confezione', icon: <Package className="w-4 h-4 text-blue-600" /> },
    { id: 'controllo_qualita', label: 'Controllo Qualità', icon: <CheckCircle2 className="w-4 h-4 text-teal-600" /> },
    { id: 'spedizione', label: 'Spedizione & Ritiro', icon: <Truck className="w-4 h-4 text-slate-600" /> },
  ];

  // Group filtered tasks by category
  const tasksByProcess = processCategories
    .filter(cat => cat.id !== 'all')
    .map(cat => ({
      ...cat,
      tasks: filteredTasks.filter(t => t.category === cat.id),
      totalHours: filteredTasks
        .filter(t => t.category === cat.id)
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
    }));

  const getAssigneeBadge = (assignee: AssigneeId) => {
    switch (assignee) {
      case 'giulia':
        return { label: 'Giulia (Design/Lead)', color: 'bg-[#FDF4E7] text-[#9A6214] border-[#F8E1C2]' };
      case 'claudia':
        return { label: 'Claudia (Atelier/Lab)', color: 'bg-[#EBF5ED] text-[#2F6D3C] border-[#CCE8D0]' };
      case 'esterno':
        return { label: 'Esterno (Tipografia)', color: 'bg-[#F2EFFB] text-[#5A38A8] border-[#DCD3F7]' };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner - Atelier Identity & Real-time Batch Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C58925]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Laboratorio & Manifattura Artigianale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E1B18] tracking-tight mt-1.5">
            Vista Produzione Atelier & Batch
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8376] mt-1 max-w-2xl font-medium leading-relaxed">
            Tutte le lavorazioni delle commesse raggruppate per processo artigianale. Raggruppa i lavori identici (stessa ceralacca, stesso taglio carta, stessi nastri) per produrre a blocchi e risparmiare ore preziose.
          </p>
        </div>

        {/* Global Workstation Controls & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7] flex items-center gap-4">
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#8E8376] uppercase">In Laboratorio</div>
              <div className="font-mono text-base font-bold text-[#1E1B18]">
                {filteredTasks.length} lavorazioni
              </div>
            </div>
            <div className="w-[1px] h-8 bg-[#E5DFD4]" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#8E8376] uppercase">Totale Ore Previste</div>
              <div className="font-mono text-base font-bold text-[#C58925]">
                {filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0).toFixed(1)} h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BATCH PRODUCTION SMART SUGGESTIONS (Point 16) */}
      {batchOpportunities.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFFBF2] via-[#FFF8E7] to-[#FFF3D6] border border-[#F5DEB3] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F5BF58] text-[#1E1B18] flex items-center justify-center font-bold text-lg shadow-xs">
                <Zap className="w-5 h-5 text-[#1E1B18]" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#1E1B18]">
                  Opportunità di Produzione in Batch Rilevate ({batchOpportunities.length})
                </h3>
                <p className="text-xs text-[#7A6F62]">
                  Lavorazioni uguali condivise tra più commesse. Produrle nella stessa sessione ti fa risparmiare fino a <strong>{batchOpportunities.reduce((a, b) => a + b.estimatedTimeSavedMinutes, 0)} minuti</strong>!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {batchOpportunities.map((batch) => (
              <div 
                key={batch.id} 
                className="p-4 rounded-2xl bg-white border border-[#EEDFBF] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#A46714] bg-[#FFF5DC] px-2.5 py-0.5 rounded-full border border-[#F5DEB3]">
                      Lotto da {batch.tasksCount} Commesse
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2C6E3D] bg-[#EAF7ED] px-2 py-0.5 rounded-full">
                      +{batch.estimatedTimeSavedMinutes} min risparmiati
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#1E1B18] mt-2">
                    {batch.name}
                  </h4>
                  <div className="text-xs text-[#7A6F62] mt-1 space-y-1">
                    {batch.projectsInvolved.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-[#594F44]">
                        <span className="truncate max-w-[180px]">• <strong>{p.projectCode}</strong>: {p.projectTitle}</span>
                        <span className="font-mono text-[#8E8376]">{p.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveBatchModal(batch)}
                  className="w-full py-2 px-3 bg-[#1E1B18] hover:bg-[#322C27] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-[#F5BF58]" />
                  <span>Apri Scheda Batch Atelier</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EFECE5] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9385]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca lavorazione, sposi o codice commessa..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs focus:outline-none focus:border-[#C58925] text-[#1E1B18] font-medium"
          />
        </div>

        {/* Process Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-[#8E8376] shrink-0">Processo:</span>
          {processCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedProcess(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedProcess === cat.id
                  ? 'bg-[#1E1B18] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6D6255] hover:bg-[#F2EEE7] border border-[#E8E2D7]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Assignee Filter (Giulia vs Claudia vs Esterno) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#8E8376]">Responsabile:</span>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-[#1E1B18] focus:outline-none focus:border-[#C58925] cursor-pointer"
          >
            <option value="all">Tutto l'Atelier</option>
            <option value="giulia">👩‍🎨 Giulia</option>
            <option value="claudia">✂️ Claudia</option>
            <option value="esterno">🏭 Esterno</option>
          </select>
        </div>
      </div>

      {/* ACTIVE TIMER BANNER (If artisan has a stopwatch running) */}
      {runningTimerTaskId && (
        <div className="sticky top-20 z-30 p-4 rounded-2xl bg-[#1E1B18] text-white shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5BF58] text-[#1E1B18] flex items-center justify-center font-bold animate-pulse">
              <Clock className="w-5 h-5 text-[#1E1B18]" />
            </div>
            <div>
              <div className="text-[11px] text-[#A69C8E] uppercase font-bold tracking-wider">
                Cronometro Laboratorio Attivo
              </div>
              <div className="font-bold text-sm text-white truncate max-w-md">
                {tasks.find(t => t.id === runningTimerTaskId)?.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-2xl font-black text-[#F5BF58] tracking-widest">
              {formatTimer(timerSeconds)}
            </div>
            <button
              onClick={() => handleStopTimer(runningTimerTaskId)}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-[#1E1B18] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Termina & Registra Ore</span>
            </button>
          </div>
        </div>
      )}

      {/* PROCESS BOARDS GRID */}
      <div className="space-y-8">
        {tasksByProcess.map((proc) => {
          if (selectedProcess !== 'all' && selectedProcess !== proc.id) return null;
          if (proc.tasks.length === 0 && selectedProcess === 'all') return null;

          return (
            <div key={proc.id} className="rounded-3xl bg-white border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 space-y-4">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2EEE7] gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7]">
                    {proc.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1E1B18]">
                      {proc.label}
                    </h3>
                    <div className="text-xs text-[#8E8376]">
                      {proc.tasks.length} lavorazioni attive nel reparto
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-[#8E8376]">Tempo stimato reparto:</span>
                  <span className="font-mono font-bold text-[#1E1B18] bg-[#FAF9F5] px-3 py-1 rounded-xl border border-[#E8E2D7]">
                    {proc.totalHours.toFixed(1)} ore
                  </span>
                </div>
              </div>

              {/* Tasks in this Process */}
              {proc.tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8E8376] italic bg-[#FAF9F5] rounded-2xl border border-dashed border-[#DFD6C9]">
                  Nessuna lavorazione in attesa in questo processo.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {proc.tasks.map((task) => {
                    const proj = getProjectById(task.projectId);
                    const isRunning = runningTimerTaskId === task.id;
                    const assigneeBadge = getAssigneeBadge(task.assignee || 'giulia');

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isRunning
                            ? 'bg-[#FFFDF7] border-[#F5BF58] ring-2 ring-[#F5BF58]/40 shadow-md'
                            : 'bg-[#FAF9F5] hover:bg-[#F6F3EC] border-[#E8E2D7] shadow-2xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${assigneeBadge.color}`}>
                              {assigneeBadge.label}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#1E1B18] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                              {task.estimatedHours}h
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-[#1E1B18] leading-snug">
                            {task.title}
                          </h4>

                          {proj && (
                            <div className="text-xs text-[#6D6255] flex items-center justify-between pt-1">
                              <button
                                onClick={() => onOpenProjectDetail(proj.id)}
                                className="font-semibold hover:underline text-[#8A5B1A] flex items-center gap-1 cursor-pointer truncate max-w-[200px]"
                              >
                                <span>{proj.code}</span> • <span>{proj.clientName}</span>
                              </button>
                              <span className="text-[10px] text-[#8E8376] font-mono">
                                Consegna: {proj.targetDeliveryDate}
                              </span>
                            </div>
                          )}

                          {task.blockReason && (
                            <div className="text-[11px] text-[#9A5147] bg-[#FDF0EE] p-2 rounded-xl border border-[#F5D0CB] flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{task.blockReason}</span>
                            </div>
                          )}
                        </div>

                        {/* Workstation Actions: Stopwatch, Reassign, Complete */}
                        <div className="pt-2 border-t border-[#EAE4D8] flex items-center justify-between gap-2 text-xs">
                          {/* Timer Button */}
                          {isRunning ? (
                            <button
                              onClick={() => handleStopTimer(task.id)}
                              className="px-2.5 py-1 bg-[#1E1B18] text-[#F5BF58] rounded-xl font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Pause className="w-3 h-3" />
                              <span>{formatTimer(timerSeconds)}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setRunningTimerTaskId(task.id)}
                              className="px-2.5 py-1 bg-white hover:bg-[#F2EEE7] text-[#1E1B18] border border-[#E8E2D7] rounded-xl font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Avvia cronometro per misurare tempo reale"
                            >
                              <Play className="w-3 h-3 text-[#2C6E3D]" />
                              <span>Avvia Timer</span>
                            </button>
                          )}

                          {/* Reassign Switcher (Point 14) */}
                          <div className="flex items-center gap-1">
                            {task.assignee !== 'claudia' && (
                              <button
                                onClick={() => reassignTaskAssignee(task.id, 'claudia')}
                                className="px-2 py-1 bg-white hover:bg-neutral-100 text-[#2F6D3C] border border-[#CCE8D0] rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Delega lavorazione a Claudia"
                              >
                                A Claudia
                              </button>
                            )}
                            {task.assignee !== 'giulia' && (
                              <button
                                onClick={() => reassignTaskAssignee(task.id, 'giulia')}
                                className="px-2 py-1 bg-white hover:bg-neutral-100 text-[#9A6214] border border-[#F8E1C2] rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Prendi in carico tu (Giulia)"
                              >
                                A Giulia
                              </button>
                            )}
                          </div>

                          {/* Mark Done */}
                          <button
                            onClick={() => toggleTaskCompleted(task.id)}
                            className="p-1.5 text-[#6C8E75] hover:text-[#4F7359] hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Segna come completato"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BATCH EXECUTION MODAL (Point 16) */}
      {activeBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#EFECE5] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F2EEE7] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF5DC] text-[#A46714] flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1E1B18]">
                    Sessione di Lavoro in Batch
                  </h3>
                  <p className="text-xs text-[#8E8376]">
                    {activeBatchModal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveBatchModal(null)}
                className="text-xs font-bold text-[#8E8376] hover:text-[#1E1B18] px-3 py-1.5 bg-[#FAF9F5] rounded-xl cursor-pointer"
              >
                Chiudi
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#F5DEB3] space-y-2 text-xs">
              <div className="font-bold text-[#A46714] flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Ottimizzazione Atelier Consigliata:
              </div>
              <p className="text-[#5A4F44]">
                Invece di scaldare la piastra sigilli o impostare la taglierina 3 volte separate durante la settimana, esegui ora tutte le lavorazioni insieme. Risparmierai circa <strong>{activeBatchModal.estimatedTimeSavedMinutes} minuti</strong> di setup e pulizia.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8376]">
                Commesse Incluse nel Lotto:
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeBatchModal.projectsInvolved.map((p, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E2D7] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#1E1B18]">{p.projectCode} — {p.projectTitle}</div>
                      <div className="text-[11px] text-[#7A6F62]">{p.taskTitle}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#C58925] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                      {p.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveBatchModal(null)}
                className="px-5 py-2.5 bg-[#FAF9F5] hover:bg-[#F2EEE7] text-[#635749] rounded-2xl font-bold text-xs cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  setActiveBatchModal(null);
                }}
                className="px-6 py-2.5 bg-[#1E1B18] hover:bg-[#322C27] text-[#F5BF58] rounded-2xl font-bold text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>Conferma & Avvia Lavorazione</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
