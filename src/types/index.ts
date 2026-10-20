export type ProjectStatus = 
  | 'lead' 
  | 'preventivo' 
  | 'bozza_in_corso' 
  | 'approvato_stampa' 
  | 'in_produzione' 
  | 'confezionamento' 
  | 'consegnato';

export type TaskProcessStatus =
  | 'da_fare'
  | 'in_lavorazione'
  | 'in_attesa_cliente'
  | 'in_attesa_fornitore'
  | 'approvato'
  | 'in_produzione'
  | 'pronto'
  | 'consegnato';

export type StationeryCategory = 
  | 'matrimonio' 
  | 'battesimo' 
  | 'festa_compleanno' 
  | 'cartoleria' 
  | 'sito_web'
  | 'brand_stationery'
  | 'battesimo_evento' 
  | 'corporate_brand' 
  | 'calligrafia_speciale'
  | 'retail_product' 
  | 'market_fiera' 
  | 'internal_project';

export type TimeDepartment = 
  | 'grafica_design' 
  | 'produzione_manuale' 
  | 'comunicazione_clienti' 
  | 'amministrazione' 
  | 'appuntamenti';

export type AssigneeId = 'giulia' | 'claudia' | 'esterno';

export interface AssigneeInfo {
  id: AssigneeId;
  name: string;
  role: string;
  color: string;
  hourlyCost: number; // Costo orario per consuntivo
  dailyCapacity: Record<number, number>; // 1=Lun: 6h, etc.
}

export interface BomItem {
  inventoryItemId: string;
  name: string;
  quantityPerUnit: number; // es. 1 foglio, 0.45m nastro, 2.5g ceralacca
  unit: string;
  unitCost: number;
}

export interface SuiteItem {
  id: string;
  name: string;
  quantity: number; // Quantità di riferimento
  specifications: string;
  unitPrice: number;
  bom?: BomItem[];
  materialsUsed?: {
    inventoryItemId: string;
    quantityPerItem: number;
  }[];
}

export interface CallNote {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  time: string;
  durationMinutes: number;
  title: string;
  attendees: string;
  notes: string;
  aestheticDecisions: {
    paperType?: string;
    fontStyle?: string;
    printTechnique?: string;
    sealColor?: string;
    ribbonDetails?: string;
    packaging?: string;
  };
  actionItems: string[];
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  category: 'design' | 'fornitori' | 'stampa' | 'taglio' | 'confezionamento_manuale' | 'sigilli' | 'nastri' | 'controllo_qualita' | 'spedizione';
  department?: TimeDepartment;
  assignee?: AssigneeId;
  estimatedHours: number;
  actualHoursLogged?: number; // Da timer o consuntivo
  scheduledDate: string; // YYYY-MM-DD
  status?: TaskProcessStatus;
  completed: boolean;
  priority: 'alta' | 'media' | 'bassa';
  blockedBy?: string[]; // IDs di altri task che devono essere completati prima
  blockReason?: string; // e.g. "In attesa approvazione cliente" oppure "In attesa consegna carta Amatruda"
  phaseKey?: string; // e.g. 'briefing' | 'bozza' | 'stampa' | 'manuale' | 'consegna'
  notes?: string;
  isTimerRunning?: boolean;
}

export interface TaskTimerSession {
  id: string;
  taskId: string;
  projectId: string;
  startTime: number; // timestamp
  endTime?: number;
  durationMinutes: number;
  assignee: AssigneeId;
}

export interface ProjectRevision {
  id: string;
  versionNumber: number;
  title: string; // "Bozza 1", "Bozza 2"
  sentDate: string;
  feedbackReceivedDate?: string;
  status: 'inviata' | 'modifiche_richieste' | 'approvata';
  isIncludedInQuote: boolean;
  extraCharge?: number;
  clientComments?: string;
  designerNotes?: string;
}

export interface FormalApproval {
  approvedAt: string; // ISO string
  approvedBy: string;
  versionNumber: number;
  approvedFileUrl?: string;
  isFrozen: boolean;
  signatureOrConfirmation: string;
}

export interface PostApprovalChange {
  id: string;
  requestedAt: string;
  description: string;
  extraCost: number;
  extraHours: number;
  approved: boolean;
}

export interface ReadinessChecklistItem {
  id: string;
  label: string; // e.g. "Testi Cerimonia Definitivi", "Lista Indirizzi Invitati", "Approvazione Bozza Stampa"
  completed: boolean;
  requiredForProduction: boolean;
  notes?: string;
}

export interface ProjectFinancials {
  agreedPrice: number; // Totale preventivo concordato
  depositPaid: number; // Acconto già incassato
  balancePaid: number; // Ulteriori acconti o saldo
  depositExpectedDate?: string; // Data prevista acconto
  balanceExpectedDate?: string; // Data prevista saldo (vicino alla consegna)
  // Costi Preventivati vs Reali
  plannedMaterialCost?: number;
  plannedPrintCost?: number;
  plannedCollaboratorCost?: number;
  plannedShippingCost?: number;
  plannedPackagingCost?: number;
  actualMaterialCost: number;
  actualPrintCost: number;
  actualCollaboratorCost?: number;
  actualShippingCost?: number;
  actualPackagingCost?: number;
  shippingCost?: number;
  otherExpenses: number;
}

export interface DriveLinks {
  mainFolderUrl: string;
  briefUrl?: string;
  draftsUrl?: string;
  finalPrintFilesUrl?: string;
  productionUrl?: string;
  photosUrl?: string;
  moodboardUrl?: string;
}

export interface Project {
  id: string;
  code: string; // es. "ST-2026-08"
  title: string; // "Sofia & Edoardo — Suite Balbianello"
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  category: StationeryCategory;
  status: ProjectStatus;
  
  // Dates
  eventDate: string; // Data evento
  targetDeliveryDate: string; // Data di consegna richiesta
  proofDeadlineDate: string; // Data limite approvazione bozze
  quoteSentDate?: string; // Per CRM pipeline
  lastContactDate?: string;
  
  // CRM Pipeline & Follow-up
  crmStage: 'lead_richiesta' | 'call_fissata' | 'preventivo_inviato' | 'follow_up' | 'confermato' | 'perso';
  lossReason?: string;
  
  // Quantities Lifecycle (Preventivata, Provvisoria, Definitiva)
  quantities: {
    preventivata: number;
    provvisoria: number;
    definitiva: number;
    isDefinitiveLocked: boolean;
  };
  
  // Suite Items & BOM
  suiteItems: SuiteItem[];
  colorPalette: string[];
  notes: string;
  currentStepProgress: number; // 0 - 100%
  
  // Revisions & Approval Lock
  revisions: ProjectRevision[];
  maxIncludedRevisions: number; // default 3
  formalApproval?: FormalApproval;
  postApprovalChanges: PostApprovalChange[];
  
  // Checklist Requisiti Dati Mancanti
  readinessChecklist: ReadinessChecklistItem[];
  
  // Financials & Costs
  financials: ProjectFinancials;
  driveLinks: DriveLinks;
  
  // Client Registry Reference
  clientRegistryId?: string;
  weddingPlanner?: string;
  location?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'carta' | 'buste' | 'ceralacca' | 'nastri' | 'accessori' | 'inchiostri';
  unit: 'fogli' | 'pezzi' | 'metri' | 'grammi' | 'boccette';
  currentStock: number;
  minStockAlert: number;
  unitCost: number;
  supplier: string;
  supplierUrl?: string;
  supplierLeadTimeDays?: number; // Giorni di consegna fornitore
  colorOrVariant?: string;
  storageLocation?: string;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  actualReceivedDate?: string;
  status: 'da_ordinare' | 'ordinato' | 'spedito' | 'ricevuto';
  items: {
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    projectId?: string;
  }[];
  totalCost: number;
  notes?: string;
  trackingNumber?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: 'coppia_sposi' | 'wedding_planner' | 'brand_aziendale' | 'privato';
  weddingPlanner?: string;
  location?: string;
  notes?: string;
  totalSpent: number;
  projectsCount: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  projectId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: 'call_conoscitiva' | 'revisione_bozze' | 'scelta_campionario' | 'ritiro_consegna' | 'personale';
  isPersonalCommitment?: boolean; // Se vero, blocca la capacità oraria di quel giorno!
  locationOrLink: string;
  notes: string;
  completed: boolean;
}

export interface ClientEmail {
  id: string;
  projectId?: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  time: string;
  isUnread: boolean;
  priority: boolean;
  type: 'richiesta_preventivo' | 'approvazione_bozza' | 'modifiche_testo' | 'conferma_saldo';
}

export interface StudioExpense {
  id: string;
  date: string;
  description: string;
  category: 'fisse' | 'software' | 'materiali_scorta' | 'marketing' | 'laboratorio';
  amount: number;
  recurring: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: StationeryCategory;
  description: string;
  defaultTasks: {
    title: string;
    category: ProjectTask['category'];
    department: TimeDepartment;
    daysBeforeDelivery: number; // offset from delivery date
    estimatedHoursFormula: (qty: number) => number;
    assignee: AssigneeId;
    dependsOnPhase?: string;
  }[];
  defaultChecklist: string[];
}

export type CatalogProductCategory = 
  | 'partecipazioni' 
  | 'buste' 
  | 'menu' 
  | 'libretti' 
  | 'sigilli' 
  | 'nastri' 
  | 'tableau' 
  | 'ringraziamenti' 
  | 'accessori_packaging'
  | 'servizi_grafici';

export interface CatalogProduct {
  id: string;
  code: string; // e.g. "PRD-PAR-01"
  name: string; // e.g. "Partecipazione Amalfi con Stampa a Caldo"
  category: CatalogProductCategory;
  description: string;
  basePrice: number; // e.g. 7.50 €
  unit: string; // "pezzi", "metri", "set"
  estimatedMinutesPerUnit: number; // e.g. 1.2
  materialCostPerUnit: number; // e.g. 2.10 €
  printCostPerUnit: number; // e.g. 1.50 €
  suggestedPaper?: string;
  hasWaxSeal?: boolean;
  hasSilkRibbon?: boolean;
}

export interface QuoteItem {
  id: string;
  productId?: string;
  name: string;
  specifications: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  materialCostPerUnit: number;
  estimatedMinutesPerUnit: number;
}

export interface Quote {
  id: string;
  number: string; // e.g. "PREV-2026-01"
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  targetDeliveryDate: string;
  createdAt: string;
  validUntilDate: string;
  status: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'convertito_in_progetto';
  convertedProjectId?: string;
  typology?: StationeryCategory;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  depositPercentage: number; // e.g. 50%
  depositAmount: number;
  estimatedHours: number;
  estimatedCosts: number;
  estimatedMargin: number;
  estimatedMarginPercentage: number;
  notes: string;
  terms: string;
}

