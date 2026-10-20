import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Folder, 
  FileText, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Save, 
  Phone, 
  Mail, 
  Clock, 
  Copy, 
  Check, 
  Euro,
  Layers,
  ArrowRight,
  Heart,
  Share2,
  Printer,
  ChevronDown,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Zap,
  Users,
  Eye,
  CheckSquare,
  Download,
  Loader2,
  Tag
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  getTypologyConfig, 
  PROJECT_TYPOLOGIES, 
  ProjectTypologyKey, 
  generateProjectSerial 
} from '../utils/projectTypologies';
import { 
  Project, 
  ProjectStatus, 
  CallNote, 
  SuiteItem, 
  ProjectTask, 
  ProjectRevision,
  ReadinessChecklistItem,
  TaskProcessStatus,
  AssigneeId
} from '../types';

interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
  onOpenSchedaCliente?: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  onClose,
  onOpenSchedaCliente,
}) => {
  const { 
    projects,
    getProjectById, 
    updateProject, 
    updateProjectStatus, 
    callNotes, 
    addCallNote, 
    deleteCallNote, 
    tasks, 
    addTask, 
    updateTask,
    toggleTaskCompleted, 
    deleteTask, 
    generateAndScheduleProjectPhases,
    openDriveFolderForProject,
    openGmailSearchForClient,
    generateDriveFolderStructure,
    todayDate
  } = useApp();

  const project = getProjectById(projectId);

  const [activeTab, setActiveTab] = useState<'suite' | 'revisioni' | 'scheda_sposi' | 'calls' | 'drive' | 'bilancino' | 'tasks'>('suite');
  const [copiedFolderStructure, setCopiedFolderStructure] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [showChecklistDrawer, setShowChecklistDrawer] = useState(false);
  const [isExportingPdfModal, setIsExportingPdfModal] = useState(false);
  const [showTypologyPicker, setShowTypologyPicker] = useState(false);
  const [selectedTypologyCandidate, setSelectedTypologyCandidate] = useState<ProjectTypologyKey>('matrimonio');

  const handleDownloadModalPdf = async () => {
    if (!project) return;
    setIsExportingPdfModal(true);
    try {
      const safeName = (project.clientName || 'Sposi').replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf({
        elementId: 'modal-printable-scheda',
        filename: `Scheda_Sposi_${project.code}_${safeName}.pdf`,
      });
    } catch (err) {
      console.error('Errore export PDF dalla modal:', err);
    } finally {
      setIsExportingPdfModal(false);
    }
  };

  // New Call Note Form State
  const [isAddingCallNote, setIsAddingCallNote] = useState(false);
  const [callTitle, setCallTitle] = useState('');
  const [callNotesText, setCallNotesText] = useState('');
  const [callAttendees, setCallAttendees] = useState(project?.clientName || '');
  const [callPaper, setCallPaper] = useState('');
  const [callFont, setCallFont] = useState('');
  const [callSeal, setCallSeal] = useState('');
  const [callRibbon, setCallRibbon] = useState('');
  const [callActionItem, setCallActionItem] = useState('');

  // New Suite Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(100);
  const [newItemSpecs, setNewItemSpecs] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(5.0);

  // New Revision Form State
  const [isAddingRevision, setIsAddingRevision] = useState(false);
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionComments, setRevisionComments] = useState('');

  // New Task Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHours, setNewTaskHours] = useState(2.0);
  const [newTaskCategory, setNewTaskCategory] = useState<ProjectTask['category']>('confezionamento_manuale');
  const [newTaskDate, setNewTaskDate] = useState(todayDate);
  const [newTaskAssignee, setNewTaskAssignee] = useState<AssigneeId>('giulia');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskProcessStatus>('da_fare');
  const [newTaskBlockReason, setNewTaskBlockReason] = useState('');

  const [financials, setFinancials] = useState<Project['financials']>(project?.financials || {
    agreedPrice: 0,
    depositPaid: 0,
    balancePaid: 0,
    actualMaterialCost: 0,
    actualPrintCost: 0,
    shippingCost: 0,
    otherExpenses: 0,
  });

  if (!project) return null;

  const projectCallNotes = callNotes.filter(c => c.projectId === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  // Readiness Checklist Stats (Point 9)
  const checklist = project.readinessChecklist || [
    { id: 'c1', label: 'Testi Cerimonia & Nomi Definitivi', completed: true, requiredForProduction: true },
    { id: 'c2', label: 'Lista Indirizzi Invitati', completed: true, requiredForProduction: true },
    { id: 'c3', label: 'Quantità Finale Bloccata', completed: project.quantities?.isDefinitiveLocked || false, requiredForProduction: true },
    { id: 'c4', label: 'Approvazione Formale Bozza Stampa', completed: !!project.formalApproval?.isFrozen, requiredForProduction: true },
    { id: 'c5', label: 'Carta Cotone Verificata a Magazzino', completed: true, requiredForProduction: true },
    { id: 'c6', label: 'Ceralacca & Timbro Iniziali Pronti', completed: true, requiredForProduction: true },
    { id: 'c7', label: 'Indirizzo Consegna Confermato', completed: true, requiredForProduction: false },
    { id: 'c8', label: 'Saldo Finale Ricevuto', completed: false, requiredForProduction: false },
  ];
  const completedRequirementsCount = checklist.filter(c => c.completed).length;
  const totalRequirementsCount = checklist.length;
  const isReadyForProduction = checklist.filter(c => c.requiredForProduction).every(c => c.completed);

  // Financial Calculations (Point 19)
  const shippingAmt = financials.shippingCost ?? financials.actualShippingCost ?? 0;
  const totalActualCost = financials.actualMaterialCost + financials.actualPrintCost + shippingAmt + financials.otherExpenses;
  const totalPlannedCost = (financials.plannedMaterialCost || (financials.agreedPrice * 0.22)) + 
                           (financials.plannedPrintCost || (financials.agreedPrice * 0.18)) + 
                           (financials.plannedShippingCost || 30);
  const netMargin = financials.agreedPrice - totalActualCost;
  const marginPercentage = Math.round((netMargin / (financials.agreedPrice || 1)) * 100);
  const remainingToCollect = financials.agreedPrice - financials.depositPaid - financials.balancePaid;

  const handleToggleChecklistItem = (id: string) => {
    const updated = checklist.map(it => it.id === id ? { ...it, completed: !it.completed } : it);
    updateProject(projectId, { readinessChecklist: updated });
  };

  const handleSaveFinancials = () => {
    updateProject(projectId, { financials });
  };

  const handleToggleQuantityLock = () => {
    const currentLocked = project.quantities?.isDefinitiveLocked || false;
    const newLocked = !currentLocked;
    const definitiveQty = project.quantities?.definitiva || 100;

    // Update quantities and sync suiteItems quantities
    const updatedSuiteItems = project.suiteItems.map(item => ({
      ...item,
      quantity: definitiveQty
    }));

    const newAgreedPrice = updatedSuiteItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

    updateProject(projectId, {
      quantities: {
        ...project.quantities,
        isDefinitiveLocked: newLocked
      },
      suiteItems: updatedSuiteItems,
      financials: {
        ...financials,
        agreedPrice: newAgreedPrice
      }
    });

    setFinancials(prev => ({ ...prev, agreedPrice: newAgreedPrice }));
  };

  const handleUpdateDefinitiveQuantity = (newQty: number) => {
    updateProject(projectId, {
      quantities: {
        ...project.quantities,
        definitiva: newQty
      }
    });
  };

  const handleFormalApproval = () => {
    const now = new Date().toLocaleString('it-IT');
    const versionNum = (project.revisions?.length || 1);
    updateProject(projectId, {
      status: 'approvato_stampa',
      currentStepProgress: 60,
      formalApproval: {
        approvedAt: now,
        approvedBy: project.clientName,
        versionNumber: versionNum,
        isFrozen: true,
        signatureOrConfirmation: `Approvazione digitale formalizzata da ${project.clientName} in data ${now}`
      }
    });
  };

  const handleUnfreezeApproval = () => {
    if (confirm('Sei sicura di voler sbloccare la bozza? Eventuali modifiche dovranno essere tracciate.')) {
      updateProject(projectId, {
        formalApproval: undefined,
        status: 'bozza_in_corso'
      });
    }
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    const currentRevs = project.revisions || [];
    const nextVersion = currentRevs.length + 1;
    const isIncluded = nextVersion <= (project.maxIncludedRevisions || 3);

    const newRev: ProjectRevision = {
      id: `rev-${Date.now()}`,
      versionNumber: nextVersion,
      title: revisionTitle || `Bozza ${nextVersion} — Revisione Grafica`,
      sentDate: todayDate,
      status: 'inviata',
      isIncludedInQuote: isIncluded,
      extraCharge: isIncluded ? 0 : 45.0,
      designerNotes: revisionComments
    };

    updateProject(projectId, {
      revisions: [...currentRevs, newRev]
    });

    setIsAddingRevision(false);
    setRevisionTitle('');
    setRevisionComments('');
  };

  const handleRegenerateBackwardTimeline = () => {
    if (confirm(`Rigenerare la timeline inversa da data consegna (${project.targetDeliveryDate})? Questo distribuirà automaticamente tutte le fasi tenendo conto dei margini e delle lavorazioni atelier.`)) {
      const hasWax = project.suiteItems.some(it => it.name.toLowerCase().includes('ceralacca') || it.name.toLowerCase().includes('sigillo'));
      const hasRibbon = project.suiteItems.some(it => it.name.toLowerCase().includes('nastro') || it.name.toLowerCase().includes('seta'));
      const pieces = project.quantities?.definitiva || 100;
      generateAndScheduleProjectPhases(projectId, project.targetDeliveryDate, pieces, hasWax, hasRibbon);
      setActiveTab('tasks');
    }
  };

  const handleCreateCallNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTitle) return;

    addCallNote({
      projectId,
      date: todayDate,
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 45,
      title: callTitle,
      attendees: callAttendees,
      notes: callNotesText,
      aestheticDecisions: {
        paperType: callPaper || undefined,
        fontStyle: callFont || undefined,
        sealColor: callSeal || undefined,
        ribbonDetails: callRibbon || undefined,
      },
      actionItems: callActionItem ? [callActionItem] : [],
    }, true);

    setIsAddingCallNote(false);
    setCallTitle('');
    setCallNotesText('');
    setCallPaper('');
    setCallFont('');
    setCallSeal('');
    setCallRibbon('');
    setCallActionItem('');
  };

  const handleAddItemToSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    const newItem: SuiteItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      quantity: newItemQty,
      specifications: newItemSpecs || 'Carta cotone coordinata',
      unitPrice: newItemPrice,
    };

    updateProject(projectId, {
      suiteItems: [...project.suiteItems, newItem]
    });

    setIsAddingItem(false);
    setNewItemName('');
    setNewItemSpecs('');
  };

  const handleDeleteSuiteItem = (itemId: string) => {
    updateProject(projectId, {
      suiteItems: project.suiteItems.filter(i => i.id !== itemId)
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    addTask({
      projectId,
      title: newTaskTitle,
      category: newTaskCategory,
      department: newTaskCategory === 'design' ? 'grafica_design' : 'produzione_manuale',
      assignee: newTaskAssignee,
      actualHoursLogged: 0,
      status: newTaskStatus,
      estimatedHours: newTaskHours,
      scheduledDate: newTaskDate,
      completed: false,
      priority: 'media',
      blockReason: newTaskBlockReason || undefined
    });

    setIsAddingTask(false);
    setNewTaskTitle('');
    setNewTaskBlockReason('');
  };

  const handleCopyFolderStructure = () => {
    const text = generateDriveFolderStructure(projectId);
    navigator.clipboard.writeText(text);
    setCopiedFolderStructure(true);
    setTimeout(() => setCopiedFolderStructure(false), 2500);
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/#scheda-${project.code}`;
    navigator.clipboard.writeText(url);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2500);
  };

  const steps: { key: ProjectStatus; label: string; desc: string }[] = [
    { key: 'lead', label: '1. Briefing Iniziale', desc: 'Raccolta desideri e campionari' },
    { key: 'bozza_in_corso', label: '2. Proposte Grafiche', desc: 'Bozze digitali in revisione' },
    { key: 'approvato_stampa', label: '3. Approvato per Stampa', desc: 'Testi e impaginazione confermati' },
    { key: 'in_produzione', label: '4. Stampa & Clichè', desc: 'Fornitori e lavorazioni tipografiche' },
    { key: 'confezionamento', label: '5. Confezionamento a Mano', desc: 'Ceralacca, nastri e assemblaggio' },
    { key: 'consegnato', label: '6. Consegna Finale', desc: 'Suite pronta o spedita con corriere' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === project.status);
  const typology = getTypologyConfig(project.category);

  return (
    <div className="fixed inset-0 z-50 bg-[#26332A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-[#FAF9F5] border border-[#E8E2D7] rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#26332A]">
        
        {/* ========================================================
            MODAL HERO HEADER - Modern, Engaging, Atelier Luxury
            ======================================================== */}
        <div className="p-6 sm:p-8 bg-[#FFFFFF] border-b border-[#EDE8E0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Serial Number with Typology Colors */}
                <span 
                  className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl border shadow-2xs flex items-center gap-1.5"
                  style={{
                    backgroundColor: typology.bgHex,
                    borderColor: typology.borderHex,
                    color: typology.textHex
                  }}
                >
                  <span>{typology.icon}</span>
                  <span>{project.code}</span>
                </span>

                {/* Typology Badge & Quick Selector */}
                <select
                  value={typology.key}
                  onChange={(e) => {
                    const newKey = e.target.value as ProjectTypologyKey;
                    const newCode = generateProjectSerial(newKey, projects);
                    updateProject(projectId, { 
                      category: newKey as any,
                      code: newCode
                    });
                  }}
                  className="text-xs font-bold px-2.5 py-1 rounded-xl border shadow-2xs focus:outline-none cursor-pointer"
                  style={{
                    backgroundColor: typology.bgCardHex,
                    borderColor: typology.borderHex,
                    color: typology.colorHex
                  }}
                  title="Cambia tipologia commessa e assegna nuovo numero di serie"
                >
                  {PROJECT_TYPOLOGIES.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.icon} {t.label} ({t.prefix})
                    </option>
                  ))}
                </select>

                {/* Open full visual typology picker */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTypologyCandidate(typology.key);
                    setShowTypologyPicker(true);
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-xl border shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: typology.bgHex,
                    borderColor: typology.borderHex,
                    color: typology.textHex
                  }}
                  title="Apri selettore tipologie con colori dedicati e anteprima numero di serie"
                >
                  <Tag className="w-3 h-3" />
                  <span>Scegli Tipologia</span>
                </button>

                <span className="text-xs text-[#8E8376]">·</span>
                
                {/* Readiness badge (Point 9) */}
                <button
                  onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isReadyForProduction 
                      ? 'bg-[#EBF2ED] text-[#2E4835] border-[#C5D8C9]' 
                      : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D4A2]'
                  }`}
                  title="Clicca per aprire la checklist requisiti dati mancanti"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pronto per produzione: {completedRequirementsCount}/{totalRequirementsCount}</span>
                </button>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#1E1B18] tracking-tight">
                {project.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A6F62] mt-2 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-[#1E1B18]">
                  <Heart className="w-3.5 h-3.5 text-[#E07A5F]" />
                  {project.clientName}
                </span>
                <span>·</span>
                <a href={`mailto:${project.clientEmail}`} className="hover:text-[#1E1B18] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#C58925]" /> {project.clientEmail}
                </a>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#6C8E75]" /> {project.clientPhone}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8E8376]" /> Evento: <strong>{new Date(project.eventDate).toLocaleDateString('it-IT')}</strong>
                </span>
              </div>
            </div>

            {/* Quick Actions & Status Select */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {/* Formal Approval Indicator (Point 8) */}
              {project.formalApproval?.isFrozen ? (
                <div className="flex items-center gap-1.5 bg-[#FAF4E6] text-[#A67812] border border-[#E8D4A2] px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-[#C58925]" />
                  <span>Bozza Congelata v{project.formalApproval.versionNumber}</span>
                  <button onClick={handleUnfreezeApproval} className="text-[#8E8376] hover:text-[#1E1B18] ml-1" title="Sblocca approvazione">
                    <Unlock className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleFormalApproval}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                  title="Registra approvazione definitiva del cliente"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approva Questa Versione</span>
                </button>
              )}

              {/* Status Selector */}
              <select
                value={project.status}
                onChange={(e) => updateProjectStatus(projectId, e.target.value as ProjectStatus)}
                className="text-xs bg-white border border-[#E8E2D7] rounded-xl px-3 py-2 text-[#1E1B18] font-bold shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="lead">Lead / Nuovo Contatto</option>
                <option value="preventivo">Preventivo Inviato</option>
                <option value="bozza_in_corso">Bozza in Revisione</option>
                <option value="approvato_stampa">Approvato per Stampa</option>
                <option value="in_produzione">In Produzione & Tipografia</option>
                <option value="confezionamento">Confezionamento Manuale</option>
                <option value="consegnato">Consegnato</option>
              </select>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#8E8376] hover:text-[#1E1B18] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Quantities Banner (Point 10) */}
          <div className="mt-4 pt-4 border-t border-[#F2EEE7] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8E8376] block">Q.tà Preventivata</span>
                <span className="font-mono font-bold text-sm text-[#7A6F62]">{project.quantities?.preventivata || 100} pz</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8E8376] block">Q.tà Provvisoria</span>
                <span className="font-mono font-bold text-sm text-[#7A6F62]">{project.quantities?.provvisoria || 100} pz</span>
              </div>
              <div className="bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#E8E2D7]">
                <span className="text-[10px] uppercase font-bold text-[#C58925] block">Q.tà Definitiva Bloccata</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-[#1E1B18]">
                    {project.quantities?.definitiva || 100} pz
                  </span>
                  <button
                    onClick={handleToggleQuantityLock}
                    className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      project.quantities?.isDefinitiveLocked 
                        ? 'bg-[#1E1B18] text-[#F5BF58]' 
                        : 'bg-white border border-[#E8E2D7] text-[#8E8376]'
                    }`}
                    title={project.quantities?.isDefinitiveLocked ? 'Quantità bloccata (clicca per sbloccare)' : 'Blocca quantità definitiva e ricalcola'}
                  >
                    {project.quantities?.isDefinitiveLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRegenerateBackwardTimeline}
                className="px-3.5 py-1.5 bg-[#FFF3D6] hover:bg-[#FFE8B3] text-[#9A640F] border border-[#F2DEB5] rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Ricalcola la timeline inversa a ritroso dalla data di consegna"
              >
                <Zap className="w-3.5 h-3.5 text-[#C58925]" />
                <span>Pianifica a Ritroso ({project.targetDeliveryDate})</span>
              </button>
            </div>
          </div>
        </div>

        {/* CHECKLIST DRAWER (Point 9: Checklist Dati Mancanti) */}
        {showChecklistDrawer && (
          <div className="p-5 bg-[#FFFFFF] border-b border-[#E8E2D7] shadow-inner space-y-3 animate-in slide-in-from-top-4 duration-200 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#1E1B18] flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#C58925]" />
                  <span>Checklist Dati Mancanti & Prerequisiti Produzione</span>
                </h4>
                <p className="text-[11px] text-[#8E8376]">
                  Spunta i dati man mano che gli sposi ti inviano testi, lista invitati e approvazioni.
                </p>
              </div>
              <button onClick={() => setShowChecklistDrawer(false)} className="text-[#8E8376] hover:text-[#1E1B18]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
              {checklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklistItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    item.completed 
                      ? 'bg-[#F2F8F4] border-[#CCE8D4] text-[#285734]' 
                      : 'bg-[#FAF9F5] border-[#E8E2D7] text-[#635749] hover:bg-[#F2EFE8]'
                  }`}
                >
                  <button className="mt-0.5 shrink-0">
                    {item.completed ? <CheckCircle2 className="w-4 h-4 text-[#558260]" /> : <Circle className="w-4 h-4 text-[#C4B9AA]" />}
                  </button>
                  <div>
                    <span className={`font-bold block ${item.completed ? 'line-through text-[#558260]' : 'text-[#1E1B18]'}`}>
                      {item.label}
                    </span>
                    {item.requiredForProduction && (
                      <span className="text-[9px] uppercase font-bold text-[#C58925] block mt-0.5">
                        Necessario per tipografia
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation (Modern Segmented Toolbar) */}
        <div className="flex items-center space-x-1 px-6 bg-[#FFFFFF] border-b border-[#EFECE5] overflow-x-auto scrollbar-none">
          {[
            { id: 'suite', label: 'Suite & Distinta Base (BOM)', count: project.suiteItems.length },
            { id: 'tasks', label: 'Timeline Inversa & Lavorazioni', count: projectTasks.length, highlight: true },
            { id: 'revisioni', label: 'Bozze & Revisioni', count: project.revisions?.length || 0 },
            { id: 'scheda_sposi', label: '✨ Scheda Sposi Portal' },
            { id: 'bilancino', label: 'Bilancino & Redditività' },
            { id: 'calls', label: 'Note Call & Stile', count: projectCallNotes.length },
            { id: 'drive', label: 'Cartelle Drive' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'border-[#1E1B18] text-[#1E1B18]' 
                  : tab.highlight 
                    ? 'border-transparent text-[#C58925] hover:text-[#9C6811]'
                    : 'border-transparent text-[#8E8376] hover:text-[#1E1B18]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-[#1E1B18] text-white' : 'bg-[#FAF9F5] text-[#8E8376]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================
              TAB 1: SUITE ITEMS & DISTINTA BASE (BOM) (Point 11)
              ======================================================== */}
          {activeTab === 'suite' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFECE5] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1E1B18]">
                    Composizione Suite & Distinta Base Materiali (BOM)
                  </h3>
                  <p className="text-xs text-[#8E8376] mt-0.5">
                    Ogni articolo calcola automaticamente il consumo di carta cotone, ceralacca, buste e nastri dal magazzino.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="px-3.5 py-2 rounded-xl bg-[#1E1B18] hover:bg-[#332E28] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5BF58]" />
                  <span>Aggiungi Elemento</span>
                </button>
              </div>

              {/* Add Suite Item Form */}
              {isAddingItem && (
                <form onSubmit={handleAddItemToSuite} className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs animate-in fade-in">
                  <h4 className="font-bold text-sm text-[#1E1B18]">Nuovo Elemento per la Suite</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[#6F6355] font-bold mb-1">Nome Elemento</label>
                      <input
                        type="text"
                        placeholder="es. Menù a libretto o Talloncino Bomboniera"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[#6F6355] font-bold mb-1">Quantità (pz)</label>
                      <input
                        type="number"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold text-center"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[#6F6355] font-bold mb-1">Prezzo Unitario (€)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold text-right"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Specifiche Tecniche & Materiali</label>
                    <input
                      type="text"
                      placeholder="es. Carta Amalfi 340g, stampa foil oro a caldo, bordo strappato a mano"
                      value={newItemSpecs}
                      onChange={(e) => setNewItemSpecs(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(false)}
                      className="px-3.5 py-1.5 text-xs text-[#8E8376] hover:text-[#1E1B18]"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E1B18] text-white text-xs font-bold rounded-xl"
                    >
                      Salva Elemento
                    </button>
                  </div>
                </form>
              )}

              {/* Items Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.suiteItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] hover:border-[#DFD6C9] shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#1E1B18]">{item.name}</h4>
                        <span className="font-mono text-xs font-bold text-[#558260] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
                          {item.quantity} pz
                        </span>
                      </div>

                      <p className="text-xs text-[#7A6F62] leading-relaxed bg-[#FAF9F5] p-3 rounded-2xl">
                        {item.specifications}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F2EEE7] text-xs">
                      <div>
                        <span className="text-[10px] text-[#8E8376] uppercase font-bold block">Prezzo Unit.</span>
                        <span className="font-mono font-bold text-sm text-[#1E1B18]">€ {item.unitPrice.toFixed(2)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#8E8376] uppercase font-bold block">Totale Voce</span>
                        <span className="font-mono font-black text-sm text-[#C58925]">
                          € {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteSuiteItem(item.id)}
                        className="p-1.5 text-[#B29E8D] hover:text-[#E06A5F] rounded-lg transition-colors ml-2"
                        title="Rimuovi elemento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: TIMELINE INVERSA & LAVORAZIONI (Points 1, 2, 3, 4)
              ======================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE5] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1E1B18]">
                    Timeline Inversa & Fasi di Lavorazione
                  </h3>
                  <p className="text-xs text-[#8E8376] mt-0.5">
                    Pianificazione a ritroso dalla data di consegna ({project.targetDeliveryDate}) con gestione dipendenze e blocchi fornitore.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerateBackwardTimeline}
                    className="px-3.5 py-2 bg-[#FFF3D6] hover:bg-[#FFE8B3] text-[#9A640F] border border-[#F2DEB5] rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C58925]" />
                    <span>Rigenera Timeline Inversa</span>
                  </button>

                  <button
                    onClick={() => setIsAddingTask(!isAddingTask)}
                    className="px-4 py-2 rounded-xl bg-[#1E1B18] hover:bg-[#332E28] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F5BF58]" />
                    <span>Nuovo Task</span>
                  </button>
                </div>
              </div>

              {/* Add Task Form */}
              {isAddingTask && (
                <form onSubmit={handleCreateTask} className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[#6F6355] font-bold mb-1">Descrizione Lavorazione</label>
                      <input
                        type="text"
                        placeholder="es. Sigillatura 110 buste con ceralacca salvia"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Ore Stimate</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTaskHours}
                        onChange={(e) => setNewTaskHours(parseFloat(e.target.value) || 1)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Categoria</label>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as any)}
                        className="w-full p-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium"
                      >
                        <option value="design">Design & Grafica</option>
                        <option value="fornitori">Ordinazione Carte</option>
                        <option value="stampa">Stampa Tipografica</option>
                        <option value="taglio">Taglio Carte Cotone</option>
                        <option value="sigilli">Ceralacca & Sigilli</option>
                        <option value="nastri">Nastri in Seta</option>
                        <option value="confezionamento_manuale">Confezionamento Suite</option>
                        <option value="controllo_qualita">Controllo Qualità</option>
                        <option value="spedizione">Spedizione</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Assegnatario (Point 14)</label>
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value as any)}
                        className="w-full p-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium"
                      >
                        <option value="giulia">Giulia (Art Director)</option>
                        <option value="claudia">Claudia (Laboratorio)</option>
                        <option value="esterno">Laboratorio Esterno</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Stato (Point 4)</label>
                      <select
                        value={newTaskStatus}
                        onChange={(e) => setNewTaskStatus(e.target.value as any)}
                        className="w-full p-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium"
                      >
                        <option value="da_fare">Da fare</option>
                        <option value="in_lavorazione">In lavorazione</option>
                        <option value="in_attesa_cliente">⏸️ In attesa cliente (0h)</option>
                        <option value="in_attesa_fornitore">⏸️ In attesa fornitore (0h)</option>
                        <option value="approvato">Approvato</option>
                        <option value="in_produzione">In produzione</option>
                        <option value="pronto">Pronto</option>
                        <option value="consegnato">Consegnato</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Data Programmata</label>
                      <input
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="w-full p-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Eventuale Blocco (Point 3: "Bloccato da...")</label>
                    <input
                      type="text"
                      placeholder="es. Bloccato da approvazione bozza del cliente oppure arrivo carta da Amalfi"
                      value={newTaskBlockReason}
                      onChange={(e) => setNewTaskBlockReason(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3.5 py-1.5 text-xs text-[#8E8376]"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E1B18] text-white font-bold rounded-xl"
                    >
                      Salva Task
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                {projectTasks.map(t => {
                  const isBlocked = !!t.blockReason;
                  const isClientWait = t.status === 'in_attesa_cliente' || t.status === 'in_attesa_fornitore';

                  return (
                    <div 
                      key={t.id}
                      className={`p-4 rounded-2xl bg-[#FFFFFF] border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        t.completed 
                          ? 'border-[#EFECE5] opacity-60 bg-gray-50/50' 
                          : isBlocked 
                            ? 'border-[#F8D2CB] bg-[#FFFBFB]' 
                            : 'border-[#EFECE5]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTaskCompleted(t.id)}
                          className="text-[#6C8E75] cursor-pointer mt-0.5"
                        >
                          {t.completed ? <CheckCircle2 className="w-5 h-5 text-[#558260]" /> : <Circle className="w-5 h-5 text-[#C4B9AA]" />}
                        </button>
                        <div>
                          <div className={`font-bold ${t.completed ? 'line-through text-[#8E8376]' : 'text-[#1E1B18]'}`}>
                            {t.title}
                          </div>

                          {/* Block alert (Point 3) */}
                          {isBlocked && (
                            <div className="text-[11px] font-bold text-[#E06A5F] flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Bloccato da: {t.blockReason}</span>
                            </div>
                          )}

                          {/* Client waiting note (Point 4) */}
                          {isClientWait && (
                            <span className="text-[10px] text-[#A67812] bg-[#FAF4E6] px-2 py-0.5 rounded-md inline-block mt-1 font-bold">
                              ⏸️ In attesa feedback (non consuma ore laboratorio)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {/* Assignee badge (Point 14) */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                          t.assignee === 'claudia' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          t.assignee === 'esterno' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {t.assignee || 'giulia'}
                        </span>

                        <span className="text-[#8E8376] font-mono">{t.scheduledDate}</span>
                        <span className="font-mono font-bold text-xs bg-[#FAF9F5] px-2 py-0.5 rounded-lg border border-[#E8E2D7]">
                          {t.estimatedHours}h
                        </span>

                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-[#B29E8D] hover:text-[#E06A5F] p-1"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: REVISIONI & APPROVAZIONE FORMALE (Points 7 & 8)
              ======================================================== */}
          {activeTab === 'revisioni' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFECE5] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1E1B18]">
                    Gestione Bozze, Revisioni & Approvazione Formale
                  </h3>
                  <p className="text-xs text-[#8E8376] mt-0.5">
                    Traccia il numero di bozze inviate (max {project.maxIncludedRevisions || 3} incluse nel preventivo) e congela la versione definitiva approvata dagli sposi.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingRevision(!isAddingRevision)}
                  className="px-4 py-2 rounded-xl bg-[#1E1B18] hover:bg-[#332E28] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5BF58]" />
                  <span>Nuova Bozza Inviata</span>
                </button>
              </div>

              {/* Formal Approval Status Banner */}
              {project.formalApproval?.isFrozen ? (
                <div className="p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#D4AF37] shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-white flex items-center justify-center font-bold">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#A47614] block">
                          File Congelato & Approvato per Tipografia
                        </span>
                        <h4 className="font-black text-base text-[#1E1B18]">
                          Bozza n.{project.formalApproval.versionNumber} Convalidata Ufficialmente
                        </h4>
                      </div>
                    </div>

                    <div className="text-right text-xs text-[#7A6F62]">
                      <div>Approvata da: <strong>{project.formalApproval.approvedBy}</strong></div>
                      <div>Data: <strong className="font-mono text-[#1E1B18]">{project.formalApproval.approvedAt}</strong></div>
                    </div>
                  </div>
                  <p className="text-xs text-[#6F6456] pt-2 border-t border-[#E8DCC2]">
                    {project.formalApproval.signatureOrConfirmation}
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FFFBF2] to-[#FFF3D6] border border-[#F5DEB3] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#1E1B18]">In Attesa di Approvazione Formale</h4>
                    <p className="text-xs text-[#7A6F62] mt-0.5">
                      Quando il cliente conferma i testi definitivi, clicca su "Approva Questa Versione" per congelare i file e avviare l'incisione dei clichè.
                    </p>
                  </div>
                  <button
                    onClick={handleFormalApproval}
                    className="px-4 py-2 bg-[#1E1B18] hover:bg-[#332E28] text-[#F5BF58] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#F5BF58]" />
                    <span>Approva Versione Ora</span>
                  </button>
                </div>
              )}

              {/* Add Revision Form */}
              {isAddingRevision && (
                <form onSubmit={handleAddRevision} className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs animate-in fade-in">
                  <h4 className="font-bold text-sm text-[#1E1B18]">Registra Invio Bozza Grafica</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Titolo Bozza</label>
                      <input
                        type="text"
                        placeholder="es. Bozza 3 — Layout Finale con Mappa Acquerello"
                        value={revisionTitle}
                        onChange={(e) => setRevisionTitle(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Note del Designer</label>
                      <input
                        type="text"
                        placeholder="es. Modificati font e allineamenti come da call di ieri"
                        value={revisionComments}
                        onChange={(e) => setRevisionComments(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRevision(false)}
                      className="px-3.5 py-1.5 text-xs text-[#8E8376]"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E1B18] text-white font-bold rounded-xl"
                    >
                      Salva Bozza
                    </button>
                  </div>
                </form>
              )}

              {/* Revisions History Cards */}
              <div className="space-y-3">
                {(project.revisions || []).map(rev => (
                  <div key={rev.id} className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#FAF9F5] px-2.5 py-1 rounded-xl border border-[#E8E2D7]">
                          v{rev.versionNumber}
                        </span>
                        <h4 className="font-bold text-sm text-[#1E1B18]">{rev.title}</h4>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        rev.status === 'approvata' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        rev.status === 'modifiche_richieste' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {rev.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[#7A6F62] flex items-center gap-4 text-[11px]">
                      <span>Inviata il: <strong>{rev.sentDate}</strong></span>
                      {rev.feedbackReceivedDate && <span>Feedback ricevuto: <strong>{rev.feedbackReceivedDate}</strong></span>}
                      <span>{rev.isIncludedInQuote ? '✓ Inclusa nel preventivo' : `⚠️ Revisione Extra (+€ ${rev.extraCharge})`}</span>
                    </div>

                    {rev.clientComments && (
                      <div className="p-3 bg-[#FAF9F5] rounded-xl text-[#4A4237] italic">
                        "{rev.clientComments}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: SCHEDA SPOSI (LIVE PORTAL PREVIEW)
              ======================================================== */}
          {activeTab === 'scheda_sposi' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-sm text-[#26332A] block">
                    Scheda Sposi Ufficiale di {project.clientName}
                  </span>
                  <span className="text-[#68766B] text-xs">
                    Questo documento è pronto per essere esportato in formato PDF elegante o inviato agli sposi.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadModalPdf}
                    disabled={isExportingPdfModal}
                    className="px-4 py-2 rounded-xl bg-[#5B7B63] hover:bg-[#4A6750] disabled:bg-[#9BB4A2] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isExportingPdfModal ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generazione PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Scarica Scheda PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyPortalLink}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE3] border border-[#E8E2D7] text-[#26332A] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedPortalLink ? <Check className="w-3.5 h-3.5 text-[#5B7B63]" /> : <Share2 className="w-3.5 h-3.5 text-[#5B7B63]" />}
                    <span>{copiedPortalLink ? 'Link Copiato!' : 'Copia Link Sposi'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenSchedaCliente(projectId);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#EBF2ED] hover:bg-[#D8E6DB] text-[#4A6750] border border-[#C5D8C9] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#5B7B63]" />
                    <span>Apri Schermo Intero</span>
                  </button>
                </div>
              </div>

              {/* Embed Card Preview */}
              <div id="modal-printable-scheda" className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-6 text-[#26332A]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EAE5DC] pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold text-lg">
                      🌿
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#26332A] tracking-wider uppercase">
                        SAGE PAPER DESIGN
                      </h2>
                      <div className="text-xs uppercase tracking-widest text-[#7D8B80] mt-0.5 font-semibold">
                        Atelier di Cancelleria Artigianale & Wedding Stationery — Firenze
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs text-[#68766B]">
                    <div>Commessa <strong className="font-mono text-[#26332A]">{project.code}</strong></div>
                    <div>Data: <strong>{new Date().toLocaleDateString('it-IT')}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7D8B80] block mb-1">Committenti / Sposi</span>
                    <div className="font-bold text-base text-[#26332A]">{project.clientName}</div>
                    <div className="text-[#68766B] mt-0.5">{project.clientEmail}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7D8B80] block mb-1">Data del Matrimonio</span>
                    <div className="font-bold text-base text-[#5B7B63]">
                      {new Date(project.eventDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7D8B80] block mb-1">Stato Lavorazione</span>
                    <div className="font-bold text-base text-[#5B7B63] uppercase">{project.status.replace(/_/g, ' ')}</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {steps.map((st, idx) => {
                    const isPast = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div 
                        key={st.key}
                        className={`p-3 rounded-2xl border text-center text-xs space-y-1 ${
                          isCurrent 
                            ? 'bg-[#EBF2ED] border-[#5B7B63] ring-1 ring-[#5B7B63]' 
                            : isPast 
                              ? 'bg-white border-[#D5E0D8]' 
                              : 'bg-[#FAF8F5] border-[#EDE8E0] opacity-60'
                        }`}
                      >
                        <div className="flex justify-center">
                          {isPast ? <CheckCircle2 className="w-5 h-5 text-[#5B7B63]" /> : isCurrent ? <div className="w-5 h-5 rounded-full bg-[#5B7B63] text-white flex items-center justify-center font-bold text-[10px]">{idx + 1}</div> : <Circle className="w-5 h-5 text-[#C4B9AA]" />}
                        </div>
                        <div className={`font-bold text-[11px] mt-1 ${isCurrent ? 'text-[#5B7B63]' : 'text-[#26332A]'}`}>{st.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Suite Items Breakdown */}
                <div className="border border-[#EDE8E0] rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#68766B] font-bold border-b border-[#EDE8E0]">
                      <tr>
                        <th className="p-3">Articolo Suite</th>
                        <th className="p-3 text-center">Quantità</th>
                        <th className="p-3 text-right">Prezzo Unit.</th>
                        <th className="p-3 text-right">Totale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2ECE3]">
                      {project.suiteItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]/50">
                          <td className="p-3">
                            <span className="font-bold text-[#26332A]">{item.name}</span>
                            <span className="text-[11px] text-[#7D8B80] block">{item.specifications}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{item.quantity} pz</td>
                          <td className="p-3 text-right font-mono text-[#68766B]">€ {item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#5B7B63]">€ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: BILANCINO & REDDITIVITÀ (Point 19: Costo Reale vs Preventivato)
              ======================================================== */}
          {activeTab === 'bilancino' && (
            <div className="space-y-6">
              <div className="border-b border-[#EFECE5] pb-3">
                <h3 className="text-lg font-black text-[#1E1B18]">Bilancino Economico & Marginalità Reale</h3>
                <p className="text-xs text-[#8E8376] mt-0.5">
                  Confronta i costi preventivati con quelli effettivamente sostenuti per misurare l'utile netto atelier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs">
                  <span className="text-xs font-bold uppercase text-[#8E8376] block">Totale Preventivo</span>
                  <div className="text-2xl font-black text-[#1E1B18] mt-1">€ {financials.agreedPrice.toFixed(2)}</div>
                  <span className="text-xs text-[#8E8376] mt-1 block">Incassato: € {(financials.depositPaid + financials.balancePaid).toFixed(2)}</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs">
                  <span className="text-xs font-bold uppercase text-[#8E8376] block">Costi Reali Sostenuti</span>
                  <div className="text-2xl font-black text-[#E06A5F] mt-1">€ {totalActualCost.toFixed(2)}</div>
                  <span className="text-xs text-[#8E8376] mt-1 block">Preventivato: € {totalPlannedCost.toFixed(2)}</span>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs">
                  <span className="text-xs font-bold uppercase text-[#8E8376] block">Utile Netto Atelier</span>
                  <div className="text-2xl font-black text-[#558260] mt-1">€ {netMargin.toFixed(2)}</div>
                  <span className="text-xs font-bold text-[#558260] mt-1 block">Margine Reale: {marginPercentage}%</span>
                </div>
              </div>

              {/* Cost Inputs Form */}
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-sm text-[#1E1B18] border-b border-[#F2EEE7] pb-2">
                  Dettaglio Voci di Costo Reali vs Preventivate
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Preventivo Totale (€)</label>
                    <input
                      type="number"
                      value={financials.agreedPrice}
                      onChange={(e) => setFinancials({ ...financials, agreedPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Acconto Incassato (€)</label>
                    <input
                      type="number"
                      value={financials.depositPaid}
                      onChange={(e) => setFinancials({ ...financials, depositPaid: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Costo Carta & Nastri Reale (€)</label>
                    <input
                      type="number"
                      value={financials.actualMaterialCost}
                      onChange={(e) => setFinancials({ ...financials, actualMaterialCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Costo Tipografia Esterna Reale (€)</label>
                    <input
                      type="number"
                      value={financials.actualPrintCost}
                      onChange={(e) => setFinancials({ ...financials, actualPrintCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveFinancials}
                    className="px-5 py-2.5 rounded-2xl bg-[#1E1B18] text-white font-bold text-xs hover:bg-[#332E28] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4 text-[#F5BF58]" />
                    <span>Salva Bilancino Progetto</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: CALLS & BRIEFING
              ======================================================== */}
          {activeTab === 'calls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EFECE5] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1E1B18]">Note Riunioni & Call con gli Sposi</h3>
                  <p className="text-xs text-[#8E8376] mt-0.5">
                    Trascrivi gli accordi stilistici presi per evitare incomprensioni sui materiali e le bozze.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingCallNote(!isAddingCallNote)}
                  className="px-4 py-2 rounded-xl bg-[#1E1B18] hover:bg-[#332E28] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5BF58]" />
                  <span>Nuova Nota Call</span>
                </button>
              </div>

              {/* Add Call Note Form */}
              {isAddingCallNote && (
                <form onSubmit={handleCreateCallNote} className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs">
                  <h4 className="font-bold text-sm text-[#1E1B18]">Registra Call o Incontro</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Titolo / Argomento Call</label>
                      <input
                        type="text"
                        placeholder="es. Scelta definitiva ceralacca e campionari"
                        value={callTitle}
                        onChange={(e) => setCallTitle(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#6F6355] font-bold mb-1">Partecipanti</label>
                      <input
                        type="text"
                        value={callAttendees}
                        onChange={(e) => setCallAttendees(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#6F6355] font-bold mb-1">Appunti & Feedback Emersi</label>
                    <textarea
                      rows={3}
                      placeholder="Note dettagliate emerse dalla conversazione..."
                      value={callNotesText}
                      onChange={(e) => setCallNotesText(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7] space-y-2">
                    <span className="font-bold text-xs text-[#4A4237] block">Decisioni Stilistiche Registrate:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Tipo Carta (es. Amalfi 340g)"
                        value={callPaper}
                        onChange={(e) => setCallPaper(e.target.value)}
                        className="p-2 bg-white border border-[#E8E2D7] rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Stile Font"
                        value={callFont}
                        onChange={(e) => setCallFont(e.target.value)}
                        className="p-2 bg-white border border-[#E8E2D7] rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Colore Ceralacca"
                        value={callSeal}
                        onChange={(e) => setCallSeal(e.target.value)}
                        className="p-2 bg-white border border-[#E8E2D7] rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Finitura Nastro"
                        value={callRibbon}
                        onChange={(e) => setCallRibbon(e.target.value)}
                        className="p-2 bg-white border border-[#E8E2D7] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCallNote(false)}
                      className="px-3.5 py-1.5 text-xs text-[#8E8376]"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E1B18] text-white font-bold rounded-xl"
                    >
                      Salva Nota Call
                    </button>
                  </div>
                </form>
              )}

              {/* Notes Timeline */}
              <div className="space-y-4">
                {projectCallNotes.map(note => (
                  <div key={note.id} className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F2EEE7] pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#8E8376]">
                        <Clock className="w-3.5 h-3.5 text-[#C58925]" />
                        <span>{note.date} alle {note.time}</span>
                        <span>·</span>
                        <span>Durata: {note.durationMinutes} min</span>
                      </div>
                      <button
                        onClick={() => deleteCallNote(note.id)}
                        className="text-[#B29E8D] hover:text-[#E06A5F]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-base text-[#1E1B18]">{note.title}</h4>
                    <p className="text-xs text-[#6F6355] leading-relaxed whitespace-pre-line">{note.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: DRIVE LINKS
              ======================================================== */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="border-b border-[#EFECE5] pb-3">
                <h3 className="text-lg font-black text-[#1E1B18]">Asset Cloud & Collegamento Google Drive</h3>
                <p className="text-xs text-[#8E8376] mt-0.5">
                  Accesso immediato alla cartella Google Drive con bozze, file di stampa e moodboard Pinterest.
                </p>
              </div>

              {/* Main Drive Banner */}
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3D6] text-[#C58925] flex items-center justify-center shrink-0">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#1E1B18]">Cartella Google Drive del Progetto</h4>
                    <p className="text-xs text-[#8E8376] mt-0.5 font-mono">{project.driveLinks.mainFolderUrl}</p>
                  </div>
                </div>

                <button
                  onClick={() => openDriveFolderForProject(projectId)}
                  className="px-5 py-2.5 rounded-2xl bg-[#1E1B18] hover:bg-[#332E28] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 text-[#F5BF58]" />
                  <span>Apri Cartella Drive</span>
                </button>
              </div>

              {/* Copyable Folder Structure */}
              <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-[#E8E2D7] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8E8376]">
                    Albero Cartelle Atelier
                  </span>
                  <button
                    onClick={handleCopyFolderStructure}
                    className="text-xs font-bold text-[#558260] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFolderStructure ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFolderStructure ? 'Copiato!' : 'Copia Struttura Cartelle'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-white border border-[#E8E2D7] text-xs font-mono text-[#4A4237] overflow-x-auto leading-relaxed">
                  {generateDriveFolderStructure(projectId)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#FFFFFF] border-t border-[#EFECE5] flex items-center justify-between text-xs">
          <div className="text-[#8E8376]">
            Commessa: <strong className="text-[#1E1B18]">{project.code}</strong> · {project.clientName}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openGmailSearchForClient(project.clientEmail)}
              className="px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#E8E2D7] text-[#1E1B18] font-bold flex items-center gap-1.5 hover:bg-[#F2EEE7] cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Cerca Email</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1E1B18] text-white font-bold hover:bg-[#332E28] transition-colors cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          INTERACTIVE TYPOLOGY CHOOSER MODAL
          Allows choosing between the 5 typologies and assigning new serial number
          ======================================================== */}
      {showTypologyPicker && (
        <div className="fixed inset-0 z-60 bg-[#26332A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E8E2D7] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#26332A]">
            
            <div className="flex items-center justify-between border-b border-[#EDE8E0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center text-xl">
                  🏷️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#26332A]">
                    Scegli la Tipologia del Progetto
                  </h3>
                  <p className="text-xs text-[#7D8B80]">
                    Assegna automaticamente un nuovo numero di serie progressivo e la palette colore dedicata
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTypologyPicker(false)}
                className="p-2 text-[#7D8B80] hover:text-[#26332A] hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The 5 Typology Cards characterized with different colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {PROJECT_TYPOLOGIES.map((t) => {
                const isSelected = selectedTypologyCandidate === t.key;
                const previewSerial = generateProjectSerial(t.key, projects);

                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTypologyCandidate(t.key)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                      isSelected
                        ? t.activeRingClass + ' shadow-sm'
                        : 'bg-[#FFFFFF] border-[#EDE8E0] hover:border-[#D5E0D8] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <div className="font-bold text-sm text-[#26332A]">
                            {t.label}
                          </div>
                          <span className="text-[10px] text-[#7D8B80]">
                            {t.shortDesc}
                          </span>
                        </div>
                      </div>

                      <span 
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: isSelected ? t.colorHex : t.bgHex,
                          color: isSelected ? '#FFFFFF' : t.textHex,
                          borderColor: t.borderHex
                        }}
                      >
                        {t.prefix}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#68766B] leading-snug line-clamp-2">
                      {t.description}
                    </p>

                    {/* Preview assigned serial number */}
                    <div 
                      className="p-2 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: isSelected ? '#FFFFFF' : t.bgCardHex,
                        borderColor: t.borderHex
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold text-[#7D8B80]">
                        Numero di serie assegnato:
                      </span>
                      <span className="font-mono font-bold" style={{ color: t.colorHex }}>
                        {previewSerial}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: t.colorHex }}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selezionato</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 text-xs border-t border-[#EDE8E0]">
              <button
                type="button"
                onClick={() => setShowTypologyPicker(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D7] hover:bg-[#FAF8F5] text-[#68766B] font-bold cursor-pointer transition-colors"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetConfig = getTypologyConfig(selectedTypologyCandidate);
                  const newSerial = generateProjectSerial(selectedTypologyCandidate, projects);
                  updateProject(projectId, {
                    category: selectedTypologyCandidate,
                    code: newSerial
                  });
                  setShowTypologyPicker(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#5B7B63] hover:bg-[#4A6750] text-white font-bold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Conferma & Assegna Tipologia</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
