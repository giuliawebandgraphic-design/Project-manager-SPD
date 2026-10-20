import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  Folder, 
  ChevronRight,
  Heart,
  FileText,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Euro,
  ExternalLink,
  Layers,
  Clock,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Project, ProjectStatus, StationeryCategory } from '../types';
import { PROJECT_TYPOLOGIES, getTypologyConfig, normalizeTypologyKey } from '../utils/projectTypologies';

interface ProjectsManagerProps {
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNewProject: () => void;
  onOpenSchedaCliente: (projectId: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  onOpenProjectDetail,
  onOpenNewProject,
  onOpenSchedaCliente,
}) => {
  const { projects, openDriveFolderForProject, todayDate } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'consegnato').length;
  const totalRevenue = projects.reduce((acc, p) => acc + p.financials.agreedPrice, 0);
  const totalNetProfit = projects.reduce((acc, p) => {
    const shipping = p.financials.shippingCost ?? p.financials.actualShippingCost ?? 0;
    const costs = p.financials.actualMaterialCost + p.financials.actualPrintCost + shipping + p.financials.otherExpenses;
    return acc + (p.financials.agreedPrice - costs);
  }, 0);
  const averageMargin = Math.round((totalNetProfit / (totalRevenue || 1)) * 100);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || normalizeTypologyKey(p.category) === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'lead': 
        return { label: 'Nuovo Contatto', bg: 'bg-[#F2F7F4] text-[#5B7B63] border-[#D5E0D8]' };
      case 'preventivo': 
        return { label: 'Preventivo Inviato', bg: 'bg-[#FAF8F5] text-[#7A6C58] border-[#E8E2D7]' };
      case 'bozza_in_corso': 
        return { label: 'Bozza in Revisione', bg: 'bg-[#F7F4EE] text-[#6E7D72] border-[#DDD5C7]' };
      case 'approvato_stampa': 
        return { label: 'Approvato per Stampa', bg: 'bg-[#EBF2ED] text-[#4A6750] border-[#C5D8C9]' };
      case 'in_produzione': 
        return { label: 'In Produzione & Tipografia', bg: 'bg-[#E6EFE9] text-[#3D5743] border-[#BED3C3]' };
      case 'confezionamento': 
        return { label: 'Confezionamento Manuale', bg: 'bg-[#F5F1EA] text-[#6C5D4B] border-[#E0D8CB]' };
      case 'consegnato': 
        return { label: 'Consegnato con Successo', bg: 'bg-[#EBF2ED] text-[#5B7B63] border-[#C5D8C9]' };
    }
  };

  const getCategoryLabel = (cat: StationeryCategory) => {
    switch (cat) {
      case 'matrimonio': return 'Wedding Suite';
      case 'brand_stationery': return 'Brand Identity';
      case 'battesimo_evento': return 'Battesimo & Evento';
      case 'calligrafia_speciale': return 'Calligrafia Speciale';
    }
  };

  const getDaysUntilEvent = (eventDateStr: string) => {
    const event = new Date(eventDateStr);
    const today = new Date(todayDate);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Overview KPIs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D7] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B7B63]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atelier Portfolio & Project Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#26332A] tracking-tight mt-1.5">
              Gestione Progetti & Suite di Nozze
            </h1>
            <p className="text-xs sm:text-sm text-[#68766B] mt-1 max-w-2xl font-medium leading-relaxed">
              Supervisiona ogni commessa creativa: dalle bozze grafiche ai sigilli in ceralacca, con Scheda Sposi dedicata per ciascun cliente.
            </p>
          </div>

          <button
            onClick={onOpenNewProject}
            className="px-5 py-3 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] font-bold text-xs shadow-sm shadow-[#5B7B63]/25 flex items-center gap-2 cursor-pointer transition-all self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Progetto Stationery</span>
          </button>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#E8E2D7]">
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EDE8E0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D8B80] block">
              Commesse Attive
            </span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">
              {activeProjects} <span className="text-xs font-normal text-[#7D8B80]">su {totalProjects}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EDE8E0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D8B80] block">
              Fatturato Complessivo
            </span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">
              € {totalRevenue.toFixed(0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EDE8E0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D8B80] block">
              Utile Netto Stimato
            </span>
            <div className="text-2xl font-bold text-[#5B7B63] mt-1">
              € {totalNetProfit.toFixed(0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EDE8E0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D8B80] block">
              Margine Medio Atelier
            </span>
            <div className="text-2xl font-bold text-[#5B7B63] mt-1">
              {averageMargin}%
            </div>
          </div>
        </div>
      </div>

      {/* Typology Quick Filter Pills (caratterizzate con colori diversi) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-[#5B7B63] text-white shadow-xs'
              : 'bg-[#FFFFFF] border border-[#E8E2D7] text-[#68766B] hover:bg-[#FAF8F5]'
          }`}
        >
          <span>Tutte le Tipologie</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#7D8B80]'}`}>
            {totalProjects}
          </span>
        </button>

        {PROJECT_TYPOLOGIES.map(t => {
          const isSelected = selectedCategory === t.key;
          const count = projects.filter(p => normalizeTypologyKey(p.category) === t.key).length;

          return (
            <button
              key={t.key}
              onClick={() => setSelectedCategory(t.key)}
              className="px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shadow-2xs"
              style={{
                backgroundColor: isSelected ? t.colorHex : t.bgHex,
                borderColor: t.borderHex,
                color: isSelected ? '#FFFFFF' : t.textHex,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span 
                className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : t.textHex
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E8E2D7] p-3 rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D8B80]" />
          <input
            type="text"
            placeholder="Cerca per sposi, cliente o codice (es. Sofia, MAT-2026, BAT-2026, Como)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E5DFD4] rounded-xl text-xs text-[#26332A] focus:outline-none focus:border-[#5B7B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl px-3.5 py-2 text-[#3E342B] font-bold"
          >
            <option value="all">Tutti gli stati</option>
            <option value="bozza_in_corso">Bozza in Revisione</option>
            <option value="approvato_stampa">Approvato per Stampa</option>
            <option value="in_produzione">In Produzione</option>
            <option value="confezionamento">Confezionamento Manuale</option>
            <option value="consegnato">Consegnati</option>
          </select>
        </div>
      </div>

      {/* Projects Grid - Engaging, Spacious & Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center text-2xl">
              🌿
            </div>
            <h3 className="text-lg font-bold text-[#26332A]">Nessun Progetto in Archivio</h3>
            <p className="text-xs text-[#68766B] max-w-md mx-auto">
              Il database online Firestore è collegato e pronto. Inizia creando la tua prima wedding suite o commessa stationery.
            </p>
            <button
              onClick={onOpenNewProject}
              className="px-5 py-2.5 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crea Primo Progetto</span>
            </button>
          </div>
        )}

        {filteredProjects.map((project) => {
          const daysLeft = getDaysUntilEvent(project.eventDate);
          const statusConfig = getStatusConfig(project.status);
          const typology = getTypologyConfig(project.category);

          const shipping = project.financials.shippingCost ?? project.financials.actualShippingCost ?? 0;
          const costs = project.financials.actualMaterialCost + project.financials.actualPrintCost + shipping + project.financials.otherExpenses;
          const netMargin = project.financials.agreedPrice - costs;
          const marginPercent = Math.round((netMargin / (project.financials.agreedPrice || 1)) * 100);

          return (
            <div 
              key={project.id}
              className="bg-[#FFFFFF] border border-[#EFECE5] hover:border-[#DFD6C9] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group relative"
            >
              <div className="space-y-4">
                {/* Header Tag Line with Typology Serial Number and Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button" 
                      onClick={() => onOpenProjectDetail(project.id)}
                      className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl border shadow-2xs flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                      style={{
                        backgroundColor: typology.bgHex,
                        borderColor: typology.borderHex,
                        color: typology.textHex
                      }}
                      title="Numero di serie commessa — Clicca per aprire dettagli"
                    >
                      <span>{typology.icon}</span>
                      <span>{project.code}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => onOpenProjectDetail(project.id)}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border cursor-pointer hover:opacity-85 transition-opacity"
                      style={{
                        backgroundColor: typology.bgCardHex,
                        borderColor: typology.borderHex,
                        color: typology.colorHex
                      }}
                      title={`Tipologia: ${typology.label} — Clicca per cambiare tipologia o serie`}
                    >
                      {typology.label}
                    </button>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusConfig.bg}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Title & Wedding Couple */}
                <div>
                  <h3 
                    onClick={() => onOpenProjectDetail(project.id)}
                    className="font-bold text-lg text-[#26332A] group-hover:text-[#5B7B63] cursor-pointer transition-colors leading-snug"
                  >
                    {project.title}
                  </h3>
                  
                  <div className="text-xs text-[#68766B] flex items-center gap-1.5 mt-1.5 font-semibold">
                    <Heart className="w-3.5 h-3.5 text-[#5B7B63]" />
                    <span className="text-[#26332A]">{project.clientName}</span>
                  </div>
                </div>

                {/* Event Countdown Badge & Delivery Date */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D7] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7D8B80] block">Data Evento:</span>
                    <span className="font-bold text-[#26332A] block mt-0.5">
                      {new Date(project.eventDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`text-[10px] font-semibold block ${daysLeft > 0 && daysLeft <= 30 ? 'text-[#B57C68]' : 'text-[#7D8B80]'}`}>
                      {daysLeft > 0 ? `Tra ${daysLeft} giorni` : 'Evento concluso'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7D8B80] block">Consegna Richiesta:</span>
                    <span className="font-bold text-[#26332A] block mt-0.5">
                      {new Date(project.targetDeliveryDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#5B7B63] block">
                      Avanzamento: {project.currentStepProgress}%
                    </span>
                  </div>
                </div>

                {/* Palette Swatches & Suite Elements Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-[#7D8B80]">Elementi Suite ({project.suiteItems.length}):</span>
                    
                    {/* Palette */}
                    {project.colorPalette && project.colorPalette.length > 0 && (
                      <div className="flex items-center gap-1">
                        {project.colorPalette.map((color, idx) => (
                          <div 
                            key={idx} 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {project.suiteItems.slice(0, 2).map((item) => (
                      <div key={item.id} className="text-xs text-[#26332A] flex items-center justify-between py-1 px-2.5 rounded-xl bg-[#FAF8F5]">
                        <span className="truncate max-w-[200px]">{item.name}</span>
                        <span className="font-mono font-bold text-[11px] text-[#7D8B80]">{item.quantity} pz</span>
                      </div>
                    ))}
                    {project.suiteItems.length > 2 && (
                      <div className="text-[10px] text-[#7D8B80] text-right pr-2">
                        + altri {project.suiteItems.length - 2} elementi
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-[#F5F2EB] border border-[#E8E2D7] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#7D8B80] uppercase block">Totale Preventivo</span>
                    <span className="font-mono font-bold text-sm text-[#26332A]">
                      € {project.financials.agreedPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#7D8B80] uppercase block">Margine Atelier</span>
                    <span className="font-mono font-bold text-sm text-[#5B7B63]">
                      € {netMargin.toFixed(2)} ({marginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Scheda Sposi, Drive, Dettagli */}
              <div className="pt-4 border-t border-[#F2EEE7] flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => onOpenSchedaCliente(project.id)}
                  className="px-3.5 py-2 rounded-xl bg-[#EBF2ED] hover:bg-[#DCEAE0] text-[#4A6750] border border-[#D5E0D8] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Apri e condividi la Scheda Sposi di questo progetto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5B7B63]" />
                  <span>Scheda Sposi</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDriveFolderForProject(project.id)}
                    className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EEE7] border border-[#E8E2D7] text-[#5B7B63] hover:text-[#4A6750] transition-colors cursor-pointer"
                    title="Apri cartella Google Drive"
                  >
                    <Folder className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenProjectDetail(project.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#5B7B63] hover:bg-[#4A6750] text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Apri</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
