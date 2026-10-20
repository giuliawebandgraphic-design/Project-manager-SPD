import { 
  Project, 
  ProjectTask, 
  InventoryItem, 
  Appointment, 
  AssigneeId, 
  TaskProcessStatus, 
  TimeDepartment,
  BomItem
} from '../types';

export interface BackwardSchedulePhase {
  title: string;
  category: ProjectTask['category'];
  department: TimeDepartment;
  daysBeforeDelivery: number;
  estimatedHours: number;
  assignee: AssigneeId;
  blockedByTitle?: string;
  blockReason?: string;
  status: TaskProcessStatus;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  totalHoursNeeded: number;
  totalAvailableHours: number;
  deficitHours: number;
  suggestedAction: string;
  busyDays: { dateStr: string; booked: number; max: number; deficit: number }[];
}

export interface SmartAlert {
  id: string;
  projectId?: string;
  projectTitle?: string;
  type: 'urgente' | 'approvazione' | 'fornitore' | 'finanze' | 'followup';
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: 'open_project' | 'open_gmail' | 'open_supplier' | 'reschedule';
}

export interface BatchProductionGroup {
  id: string;
  category: ProjectTask['category'];
  name: string;
  tasksCount: number;
  totalHours: number;
  estimatedTimeSavedMinutes: number;
  projectsInvolved: { projectCode: string; projectTitle: string; taskTitle: string; hours: number }[];
  materialUsed?: string;
}

// 1. Standard Times Coefficients (minuti per pezzo)
export const STANDARD_TIME_COEFFICIENTS = {
  taglioCartaMinPerPiece: 0.8,
  sigilloCeralaccaMinPerPiece: 1.2,
  nastroSetaConfezioneMinPerPiece: 1.8,
  calligrafiaIndirizziMinPerPiece: 2.5,
  controlloQualitaMinPerPiece: 0.4,
  baseDesignHours: 3.0,
  extraSuiteItemDesignHours: 0.75,
};

// 2. Generate Automated Backward Scheduling Timeline from Delivery Date
export function generateBackwardTasksForProject(
  projectId: string,
  targetDeliveryDate: string,
  quantity: number = 100,
  hasWaxSeal: boolean = true,
  hasSilkRibbon: boolean = true
): Omit<ProjectTask, 'id'>[] {
  const delivery = new Date(targetDeliveryDate);
  if (isNaN(delivery.getTime())) return [];

  const getDateOffset = (days: number): string => {
    const d = new Date(delivery);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Standard hours computed dynamically from quantities
  const cutHours = Math.max(1, Number(((quantity * STANDARD_TIME_COEFFICIENTS.taglioCartaMinPerPiece) / 60).toFixed(1)));
  const sealHours = hasWaxSeal ? Math.max(1, Number(((quantity * STANDARD_TIME_COEFFICIENTS.sigilloCeralaccaMinPerPiece) / 60).toFixed(1))) : 0;
  const ribbonHours = hasSilkRibbon ? Math.max(1, Number(((quantity * STANDARD_TIME_COEFFICIENTS.nastroSetaConfezioneMinPerPiece) / 60).toFixed(1))) : 0;
  const qcHours = Math.max(0.5, Number(((quantity * STANDARD_TIME_COEFFICIENTS.controlloQualitaMinPerPiece + 20) / 60).toFixed(1)));

  const templatePhases: BackwardSchedulePhase[] = [
    {
      title: 'Spedizione assicurata o ritiro concordato con gli sposi',
      category: 'spedizione',
      department: 'produzione_manuale',
      daysBeforeDelivery: 0,
      estimatedHours: 0.5,
      assignee: 'giulia',
      status: 'da_fare',
    },
    {
      title: 'Confezionamento finale in scatole lusso & imballaggio anti-umidità',
      category: 'confezionamento_manuale',
      department: 'produzione_manuale',
      daysBeforeDelivery: 1,
      estimatedHours: 1.5,
      assignee: 'claudia',
      status: 'da_fare',
    },
    {
      title: 'Controllo qualità, conteggio pezzi e verifica partecipazioni neutre extra',
      category: 'controllo_qualita',
      department: 'produzione_manuale',
      daysBeforeDelivery: 2,
      estimatedHours: qcHours,
      assignee: 'giulia',
      status: 'da_fare',
    },
    ...(hasWaxSeal ? [{
      title: `Fusione ceralacca & applicazione sigilli personalizzati (${quantity} pezzi)`,
      category: 'sigilli' as any,
      department: 'produzione_manuale' as any,
      daysBeforeDelivery: 3,
      estimatedHours: sealHours,
      assignee: 'claudia' as any,
      status: 'da_fare' as any,
      blockedByTitle: 'Ricevimento carta e ceralacca dal magazzino',
    }] : []),
    ...(hasSilkRibbon ? [{
      title: `Taglio a misura e sfilacciatura a mano nastri in pura seta (${quantity} pezzi)`,
      category: 'nastri' as any,
      department: 'produzione_manuale' as any,
      daysBeforeDelivery: 4,
      estimatedHours: ribbonHours,
      assignee: 'claudia' as any,
      status: 'da_fare' as any,
    }] : []),
    {
      title: `Taglio a vivo, rifilatura bordi intonsi e cordonatura pieghe (${quantity} inviti)`,
      category: 'taglio',
      department: 'produzione_manuale',
      daysBeforeDelivery: 5,
      estimatedHours: cutHours,
      assignee: 'claudia',
      status: 'da_fare',
      blockedByTitle: 'Stampa e asciugatura inchiostri tipografici',
    },
    {
      title: 'Stampa tipografica a caldo / letterpress e debossing rilievo',
      category: 'stampa',
      department: 'produzione_manuale',
      daysBeforeDelivery: 8,
      estimatedHours: 2.5,
      assignee: 'esterno',
      status: 'da_fare',
      blockedByTitle: 'Approvazione formale bozze dal cliente',
      blockReason: 'Non è possibile incidere i clichè tipografici prima dell\'approvazione cliente',
    },
    {
      title: 'Ricevimento fornitura carte speciali cotone & buste artigianali',
      category: 'fornitori',
      department: 'amministrazione',
      daysBeforeDelivery: 11,
      estimatedHours: 0.5,
      assignee: 'giulia',
      status: 'in_attesa_fornitore',
      blockReason: 'In attesa spedizione corriere fornitore',
    },
    {
      title: 'Ordine materiali a cartiere e fornitori ceralacca',
      category: 'fornitori',
      department: 'amministrazione',
      daysBeforeDelivery: 14,
      estimatedHours: 1.0,
      assignee: 'giulia',
      status: 'da_fare',
    },
    {
      title: 'Approvazione formale bozze digitali e verifica dati cerimonia dal cliente',
      category: 'design',
      department: 'comunicazione_clienti',
      daysBeforeDelivery: 16,
      estimatedHours: 0.5,
      assignee: 'giulia',
      status: 'in_attesa_cliente',
      blockReason: 'In attesa conferma cliente (non consuma ore laboratorio)',
    },
    {
      title: 'Elaborazione Bozza Grafica n.1 con caratteri calligrafici e impaginazione',
      category: 'design',
      department: 'grafica_design',
      daysBeforeDelivery: 22,
      estimatedHours: 3.5,
      assignee: 'giulia',
      status: 'da_fare',
    },
    {
      title: 'Briefing iniziale sposi, definizione palette cromatica e moodboard',
      category: 'design',
      department: 'comunicazione_clienti',
      daysBeforeDelivery: 28,
      estimatedHours: 1.5,
      assignee: 'giulia',
      status: 'da_fare',
    }
  ];

  return templatePhases.map((phase, idx) => ({
    projectId,
    title: phase.title,
    category: phase.category,
    department: phase.department,
    assignee: phase.assignee,
    estimatedHours: phase.estimatedHours,
    actualHoursLogged: 0,
    scheduledDate: getDateOffset(phase.daysBeforeDelivery),
    status: phase.status,
    completed: false,
    priority: phase.daysBeforeDelivery <= 5 ? 'alta' : 'media',
    blockReason: phase.blockReason,
  }));
}

// 3. Feasibility & Conflict Calculator for Urgent Projects
export function checkProjectFeasibility(
  deliveryDateStr: string,
  totalHoursNeeded: number,
  existingTasks: ProjectTask[],
  appointments: Appointment[],
  getMaxHoursForDate: (d: string) => number,
  daysSpan: number = 7
): FeasibilityResult {
  const delivery = new Date(deliveryDateStr);
  const busyDays: FeasibilityResult['busyDays'] = [];
  let totalAvailableHours = 0;

  for (let i = daysSpan; i >= 0; i--) {
    const cur = new Date(delivery);
    cur.setDate(cur.getDate() - i);
    const dateStr = cur.toISOString().split('T')[0];

    // Personal commitments subtract from capacity
    const personalBusyMinutes = appointments
      .filter(a => a.date === dateStr && a.isPersonalCommitment)
      .reduce((acc, a) => acc + a.durationMinutes, 0);

    const maxHours = Math.max(0, getMaxHoursForDate(dateStr) - personalBusyMinutes / 60);

    const bookedHours = existingTasks
      .filter(t => t.scheduledDate === dateStr && !t.completed && t.status !== 'in_attesa_cliente' && t.status !== 'in_attesa_fornitore')
      .reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

    const dayFree = Math.max(0, maxHours - bookedHours);
    totalAvailableHours += dayFree;

    busyDays.push({
      dateStr,
      booked: bookedHours,
      max: maxHours,
      deficit: Math.max(0, bookedHours - maxHours)
    });
  }

  const deficitHours = Math.max(0, totalHoursNeeded - totalAvailableHours);
  const isFeasible = deficitHours <= 0;

  let suggestedAction = '';
  if (isFeasible) {
    suggestedAction = `Progetto accettabile: disponi di ${totalAvailableHours.toFixed(1)} ore libere a fronte delle ${totalHoursNeeded} ore necessarie.`;
  } else {
    suggestedAction = `Attenzione: hai ${deficitHours.toFixed(1)} ore insufficienti nel periodo. Per accettarlo devi posticipare lavorazioni non urgenti o riallocare ${Math.ceil(deficitHours)}h a Claudia.`;
  }

  return {
    isFeasible,
    totalHoursNeeded,
    totalAvailableHours,
    deficitHours,
    suggestedAction,
    busyDays
  };
}

// 4. Smart Alerts Engine
export function detectSmartAlerts(
  projects: Project[],
  tasks: ProjectTask[],
  inventory: InventoryItem[],
  todayDate: string
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const today = new Date(todayDate);

  projects.forEach(project => {
    // Alert 1: Unanswered Drafts from Client (> 3 days)
    const pendingRevision = project.revisions?.find(r => r.status === 'inviata');
    if (pendingRevision) {
      const sent = new Date(pendingRevision.sentDate);
      const diffDays = Math.floor((today.getTime() - sent.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 3) {
        alerts.push({
          id: `alert-noreply-${project.id}`,
          projectId: project.id,
          projectTitle: project.title,
          type: 'approvazione',
          title: `${project.clientName.split('&')[0]} non risponde da ${diffDays} giorni`,
          description: `Bozza inviata il ${pendingRevision.sentDate}. Sollecita il feedback per non compromettere la data di stampa.`,
          actionLabel: 'Invia Sollecito via Gmail',
          actionType: 'open_gmail',
        });
      }
    }

    // Alert 2: Approaching Production Date without Formal Approval
    const delivery = new Date(project.targetDeliveryDate);
    const daysToDelivery = Math.floor((delivery.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (daysToDelivery <= 14 && daysToDelivery > 0 && !project.formalApproval?.isFrozen && project.status !== 'consegnato') {
      alerts.push({
        id: `alert-noapproval-${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        type: 'urgente',
        title: `Mancano ${daysToDelivery} giorni alla consegna e manca l'approvazione formale`,
        description: `La commessa ${project.code} è bloccata: non è possibile incidere i clichè prima della firma digitale.`,
        actionLabel: 'Attiva Scheda Sposi',
        actionType: 'open_project',
      });
    }

    // Alert 3: Unpaid Balance Approaching Delivery (< 5 days)
    const remainingBalance = project.financials.agreedPrice - project.financials.depositPaid - project.financials.balancePaid;
    if (daysToDelivery <= 5 && daysToDelivery >= 0 && remainingBalance > 0 && project.status !== 'consegnato') {
      alerts.push({
        id: `alert-balance-${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        type: 'finanze',
        title: `Saldo di € ${remainingBalance.toFixed(0)} non ancora ricevuto per ${project.clientName.split('&')[0]}`,
        description: `Consegna prevista tra ${daysToDelivery} giorni. Verifica bonifico o invia promemoria coordinate IBAN.`,
        actionLabel: 'Promemoria Saldo',
        actionType: 'open_gmail',
      });
    }

    // Alert 4: CRM Follow-up for quotes sent > 4 days ago
    if (project.crmStage === 'preventivo_inviato' && project.quoteSentDate) {
      const qDate = new Date(project.quoteSentDate);
      const daysSinceQuote = Math.floor((today.getTime() - qDate.getTime()) / (1000 * 3600 * 24));
      if (daysSinceQuote >= 4) {
        alerts.push({
          id: `alert-crm-quote-${project.id}`,
          projectId: project.id,
          projectTitle: project.title,
          type: 'followup',
          title: `Follow-up Preventivo: inviato ${daysSinceQuote} giorni fa a ${project.clientName}`,
          description: `Nessuna risposta ricevuta. Un messaggio gentile di follow-up aumenta del 40% il tasso di conversione.`,
          actionLabel: 'Prepara Messaggio Follow-up',
          actionType: 'open_gmail',
        });
      }
    }
  });

  // Alert 5: Material Shortage Alerts
  inventory.forEach(inv => {
    if (inv.currentStock <= inv.minStockAlert) {
      alerts.push({
        id: `alert-stock-${inv.id}`,
        type: 'fornitore',
        title: `Sottoscorta: ${inv.name}`,
        description: `Giacenza rimasta: ${inv.currentStock} ${inv.unit}. Ordine da ${inv.supplier} con lead time di ${inv.supplierLeadTimeDays || 4} giorni.`,
        actionLabel: 'Genera Ordine Fornitore',
        actionType: 'open_supplier',
      });
    }
  });

  return alerts;
}

// 5. Batch Production Optimizer (Raggruppa lavorazioni simili tra più clienti)
export function findBatchProductionOpportunities(
  tasks: ProjectTask[],
  projects: Project[]
): BatchProductionGroup[] {
  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'in_attesa_cliente' && t.status !== 'in_attesa_fornitore');
  const groups: Record<string, BatchProductionGroup> = {};

  pendingTasks.forEach(task => {
    const project = projects.find(p => p.id === task.projectId);
    if (!project) return;

    let groupKey = '';
    let groupName = '';
    let savedMin = 0;

    if (task.category === 'sigilli' || task.title.toLowerCase().includes('ceralacca')) {
      groupKey = 'batch_ceralacca';
      groupName = 'Fusione Ceralacca & Sigilli a Caldo';
      savedMin = 45; // riscaldamento piastra e preparazione colore
    } else if (task.category === 'taglio' || task.title.toLowerCase().includes('taglio') || task.title.toLowerCase().includes('intonsi')) {
      groupKey = 'batch_taglio';
      groupName = 'Taglio a Misura & Rifilatura Carta Cotone';
      savedMin = 30; // impostazione taglierina e dime
    } else if (task.category === 'nastri' || task.title.toLowerCase().includes('nastro')) {
      groupKey = 'batch_nastri';
      groupName = 'Sfilacciatura & Taglio Nastri Pura Seta';
      savedMin = 25;
    } else if (task.category === 'stampa') {
      groupKey = 'batch_stampa';
      groupName = 'Spedizione File & Lavorazioni Tipografia';
      savedMin = 30;
    }

    if (groupKey) {
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          category: task.category,
          name: groupName,
          tasksCount: 0,
          totalHours: 0,
          estimatedTimeSavedMinutes: savedMin,
          projectsInvolved: [],
        };
      }

      groups[groupKey].tasksCount += 1;
      groups[groupKey].totalHours += task.estimatedHours;
      groups[groupKey].projectsInvolved.push({
        projectCode: project.code,
        projectTitle: project.title,
        taskTitle: task.title,
        hours: task.estimatedHours,
      });
    }
  });

  return Object.values(groups).filter(g => g.tasksCount >= 2);
}
