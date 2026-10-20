import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, 
  CallNote, 
  ProjectTask, 
  InventoryItem, 
  Appointment, 
  ClientEmail, 
  StudioExpense,
  ProjectStatus,
  AssigneeId,
  SupplierOrder,
  CatalogProduct,
  Quote,
  SuiteItem
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_CALL_NOTES, 
  INITIAL_TASKS, 
  INITIAL_INVENTORY, 
  INITIAL_APPOINTMENTS, 
  INITIAL_EMAILS, 
  INITIAL_STUDIO_EXPENSES,
  INITIAL_SUPPLIER_ORDERS,
  INITIAL_CATALOG_PRODUCTS,
  INITIAL_QUOTES
} from '../data/initialData';
import { generateBackwardTasksForProject } from '../utils/capacityEngine';
import { generateProjectSerial, getTypologyConfig } from '../utils/projectTypologies';
import { 
  db, 
  auth, 
  loginWithGoogle as authLoginWithGoogle, 
  logoutUser as authLogoutUser, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export type ActiveView = 
  | 'agenda' 
  | 'capacity' 
  | 'progetti' 
  | 'produzione'
  | 'scheda_cliente' 
  | 'finanze' 
  | 'magazzino' 
  | 'prodotti'
  | 'preventivi'
  | 'appuntamenti' 
  | 'email_gmail';

interface CapacitySettings {
  maxDailyHours: number;
  workingDays: number[]; // 1 = Lun, 2 = Mar, ..., 5 = Ven
  activeYear: number;
  dailyCapacityByWeekday: Record<number, number>; // 1=Lun: 6.5h, 2=Mar: 7h, etc.
  customCapacityByDate: Record<string, number>; // specific overrides '2026-10-20': 6.5
}

interface AppContextType {
  projects: Project[];
  callNotes: CallNote[];
  tasks: ProjectTask[];
  inventory: InventoryItem[];
  appointments: Appointment[];
  emails: ClientEmail[];
  studioExpenses: StudioExpense[];
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  todayDate: string;
  capacitySettings: CapacitySettings;
  updateCapacitySettings: (settings: Partial<CapacitySettings>) => void;
  getMaxHoursForDate: (dateStr: string) => number;
  setDayCapacity: (dateStr: string, hours: number) => void;
  setWeekdayCapacity: (dayOfWeek: number, hours: number) => void;

  // Cloud & Auth State
  currentUser: User | null;
  isCloudConnected: boolean;
  isSyncing: boolean;
  loginWithGoogle: () => Promise<any>;
  logoutUser: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Projects CRUD
  addProject: (project: Omit<Project, 'id' | 'code'> & { code?: string }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;

  // Call Notes CRUD
  addCallNote: (note: Omit<CallNote, 'id'>, createTasksFromActions?: boolean) => void;
  updateCallNote: (id: string, updates: Partial<CallNote>) => void;
  deleteCallNote: (id: string) => void;

  // Tasks CRUD
  addTask: (task: Omit<ProjectTask, 'id'>) => void;
  addMultipleTasks: (tasks: Omit<ProjectTask, 'id'>[]) => void;
  updateTask: (id: string, updates: Partial<ProjectTask>) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;
  rescheduleTask: (taskId: string, newDate: string) => void;
  reassignTaskAssignee: (taskId: string, newAssignee: AssigneeId) => void;
  logTaskActualHours: (taskId: string, hoursToAdd: number) => void;
  generateAndScheduleProjectPhases: (
    projectId: string,
    targetDeliveryDate: string,
    quantity?: number,
    hasWaxSeal?: boolean,
    hasSilkRibbon?: boolean
  ) => void;

  // Inventory CRUD
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  adjustStock: (id: string, delta: number) => void;
  deleteInventoryItem: (id: string) => void;
  getCalculatedMaterialDemands: () => {
    itemId: string;
    itemName: string;
    requiredQty: number;
    currentStock: number;
    shortage: number;
    involvedProjects: { projectTitle: string; qty: number }[];
  }[];

  // Supplier Orders (Point 17 & 18)
  supplierOrders: SupplierOrder[];
  addSupplierOrder: (order: Omit<SupplierOrder, 'id'>) => void;
  updateSupplierOrderStatus: (orderId: string, status: SupplierOrder['status']) => void;
  deleteSupplierOrder: (orderId: string) => void;
  generateSupplierOrderFromShortages: () => void;

  // Catalog Products (Listino Prodotti & Prezzi)
  products: CatalogProduct[];
  addProduct: (product: Omit<CatalogProduct, 'id' | 'code'>) => CatalogProduct;
  updateProduct: (id: string, updates: Partial<CatalogProduct>) => void;
  deleteProduct: (id: string) => void;

  // Quotes (Preventivi Collegati)
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'number'>) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  convertQuoteToProject: (quoteId: string, targetCategory?: StationeryCategory) => Project;

  // Appointments CRUD
  addAppointment: (app: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Emails CRUD
  markEmailRead: (id: string, isUnread: boolean) => void;
  addEmail: (email: Omit<ClientEmail, 'id'>) => void;
  deleteEmail: (id: string) => void;

  // Finances CRUD
  addStudioExpense: (expense: Omit<StudioExpense, 'id'>) => void;
  deleteStudioExpense: (id: string) => void;
  updateProjectFinancials: (projectId: string, financials: Project['financials']) => void;

  // Utility
  getProjectById: (id: string) => Project | undefined;
  getTasksForDate: (dateStr: string) => ProjectTask[];
  getTotalHoursForDate: (dateStr: string) => number;
  openGmailSearchForClient: (clientEmail: string, unreadOnly?: boolean) => void;
  openDriveFolderForProject: (projectId: string) => void;
  generateDriveFolderStructure: (projectId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'stationery_planner_pro_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronized with environment date
  const [todayDate] = useState<string>(() => new Date().toISOString().split('T')[0] || '2026-10-20');
  const [activeView, setActiveView] = useState<ActiveView>('agenda');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Auth & Cloud DB status
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Clean / Empty Initial State (as requested: "svuota i dati preimpostati")
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [callNotes, setCallNotes] = useState<CallNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'callNotes');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<ProjectTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'supplier_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [emails, setEmails] = useState<ClientEmail[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'emails');
    return saved ? JSON.parse(saved) : [];
  });

  const [studioExpenses, setStudioExpenses] = useState<StudioExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<CatalogProduct[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'catalog_products');
    return saved ? JSON.parse(saved) : INITIAL_CATALOG_PRODUCTS;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [capacitySettings, setCapacitySettings] = useState<CapacitySettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'capacity_settings');
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      maxDailyHours: parsed?.maxDailyHours || 6.5,
      workingDays: parsed?.workingDays || [1, 2, 3, 4, 5],
      activeYear: parsed?.activeYear || 2026,
      dailyCapacityByWeekday: parsed?.dailyCapacityByWeekday || {
        1: 6.5, // Lunedì
        2: 7.0, // Martedì
        3: 6.0, // Mercoledì
        4: 6.5, // Giovedì
        5: 5.0, // Venerdì
        6: 2.0, // Sabato
        7: 0.0, // Domenica
      },
      customCapacityByDate: parsed?.customCapacityByDate || {},
    };
  });

  // Track Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Initialize and Test Firestore Real-time connection
  useEffect(() => {
    let isMounted = true;
    testFirestoreConnection().then(connected => {
      if (isMounted) setIsCloudConnected(connected);
    });

    setIsSyncing(true);

    // 1. Projects onSnapshot
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: Project[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as Project));
        setProjects(remote);
      }
      setIsSyncing(false);
      setIsCloudConnected(true);
    }, (error) => {
      console.warn("Firestore projects snapshot warning:", error);
      setIsSyncing(false);
    });

    // 2. Tasks onSnapshot
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: ProjectTask[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as ProjectTask));
        setTasks(remote);
      }
    }, (error) => {
      console.warn("Firestore tasks snapshot warning:", error);
    });

    // 3. Inventory onSnapshot
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: InventoryItem[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as InventoryItem));
        setInventory(remote);
      }
    }, (error) => {
      console.warn("Firestore inventory snapshot warning:", error);
    });

    // 4. Supplier Orders onSnapshot
    const unsubOrders = onSnapshot(collection(db, 'supplier_orders'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: SupplierOrder[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as SupplierOrder));
        setSupplierOrders(remote);
      }
    }, (error) => {
      console.warn("Firestore supplier orders snapshot warning:", error);
    });

    // 5. Call Notes onSnapshot
    const unsubNotes = onSnapshot(collection(db, 'call_notes'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: CallNote[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as CallNote));
        setCallNotes(remote);
      }
    }, (error) => {
      console.warn("Firestore call notes snapshot warning:", error);
    });

    // 6. Appointments onSnapshot
    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: Appointment[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as Appointment));
        setAppointments(remote);
      }
    }, (error) => {
      console.warn("Firestore appointments snapshot warning:", error);
    });

    // 7. Expenses onSnapshot
    const unsubExpenses = onSnapshot(collection(db, 'studio_expenses'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: StudioExpense[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as StudioExpense));
        setStudioExpenses(remote);
      }
    }, (error) => {
      console.warn("Firestore expenses snapshot warning:", error);
    });

    // 8. Client Emails onSnapshot
    const unsubEmails = onSnapshot(collection(db, 'client_emails'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: ClientEmail[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as ClientEmail));
        setEmails(remote);
      }
    }, (error) => {
      console.warn("Firestore emails snapshot warning:", error);
    });

    // 9. Catalog Products onSnapshot
    const unsubProducts = onSnapshot(collection(db, 'catalog_products'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: CatalogProduct[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as CatalogProduct));
        setProducts(remote);
      }
    }, (error) => {
      console.warn("Firestore catalog products snapshot warning:", error);
    });

    // 10. Quotes onSnapshot
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: Quote[] = [];
        snapshot.forEach(docSnap => remote.push(docSnap.data() as Quote));
        setQuotes(remote);
      }
    }, (error) => {
      console.warn("Firestore quotes snapshot warning:", error);
    });

    return () => {
      isMounted = false;
      unsubProjects();
      unsubTasks();
      unsubInventory();
      unsubOrders();
      unsubNotes();
      unsubAppointments();
      unsubExpenses();
      unsubEmails();
      unsubProducts();
      unsubQuotes();
    };
  }, []);

  // Save changes to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'callNotes', JSON.stringify(callNotes));
  }, [callNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'supplier_orders', JSON.stringify(supplierOrders));
  }, [supplierOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'expenses', JSON.stringify(studioExpenses));
  }, [studioExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'catalog_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'capacity_settings', JSON.stringify(capacitySettings));
  }, [capacitySettings]);

  // Auth handlers
  const loginWithGoogle = async () => {
    try {
      const res = await authLoginWithGoogle();
      setCurrentUser(res.user);
      return res;
    } catch (err) {
      console.error("Google login failed", err);
      throw err;
    }
  };

  const logoutUser = async () => {
    await authLogoutUser();
    setCurrentUser(null);
  };

  // Helper to load demo data if user explicitly wants it
  const loadDemoData = async () => {
    setIsSyncing(true);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setInventory(INITIAL_INVENTORY);
    setSupplierOrders(INITIAL_SUPPLIER_ORDERS);
    setCallNotes(INITIAL_CALL_NOTES);
    setAppointments(INITIAL_APPOINTMENTS);
    setEmails(INITIAL_EMAILS);
    setStudioExpenses(INITIAL_STUDIO_EXPENSES);
    setProducts(INITIAL_CATALOG_PRODUCTS);
    setQuotes(INITIAL_QUOTES);

    // Save to Firestore
    try {
      for (const p of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects', p.id), p);
      }
      for (const t of INITIAL_TASKS) {
        await setDoc(doc(db, 'tasks', t.id), t);
      }
      for (const i of INITIAL_INVENTORY) {
        await setDoc(doc(db, 'inventory', i.id), i);
      }
      for (const o of INITIAL_SUPPLIER_ORDERS) {
        await setDoc(doc(db, 'supplier_orders', o.id), o);
      }
      for (const c of INITIAL_CALL_NOTES) {
        await setDoc(doc(db, 'call_notes', c.id), c);
      }
      for (const a of INITIAL_APPOINTMENTS) {
        await setDoc(doc(db, 'appointments', a.id), a);
      }
      for (const e of INITIAL_STUDIO_EXPENSES) {
        await setDoc(doc(db, 'studio_expenses', e.id), e);
      }
      for (const pr of INITIAL_CATALOG_PRODUCTS) {
        await setDoc(doc(db, 'catalog_products', pr.id), pr);
      }
      for (const q of INITIAL_QUOTES) {
        await setDoc(doc(db, 'quotes', q.id), q);
      }
    } catch (err) {
      console.warn("Error uploading demo data to Firestore:", err);
    }
    setIsSyncing(false);
  };

  // Clear all data (starts fresh as requested)
  const clearAllData = async () => {
    setIsSyncing(true);
    const prevProjects = [...projects];
    const prevTasks = [...tasks];
    const prevInventory = [...inventory];
    const prevOrders = [...supplierOrders];
    const prevNotes = [...callNotes];
    const prevApps = [...appointments];
    const prevExp = [...studioExpenses];
    const prevEmails = [...emails];
    const prevProducts = [...products];
    const prevQuotes = [...quotes];

    setProjects([]);
    setTasks([]);
    setInventory([]);
    setSupplierOrders([]);
    setCallNotes([]);
    setAppointments([]);
    setStudioExpenses([]);
    setEmails([]);
    setProducts([]);
    setQuotes([]);
    setSelectedProjectId(null);

    localStorage.removeItem(STORAGE_PREFIX + 'projects');
    localStorage.removeItem(STORAGE_PREFIX + 'tasks');
    localStorage.removeItem(STORAGE_PREFIX + 'inventory');
    localStorage.removeItem(STORAGE_PREFIX + 'supplier_orders');
    localStorage.removeItem(STORAGE_PREFIX + 'callNotes');
    localStorage.removeItem(STORAGE_PREFIX + 'appointments');
    localStorage.removeItem(STORAGE_PREFIX + 'expenses');
    localStorage.removeItem(STORAGE_PREFIX + 'emails');
    localStorage.removeItem(STORAGE_PREFIX + 'catalog_products');
    localStorage.removeItem(STORAGE_PREFIX + 'quotes');

    try {
      for (const p of prevProjects) await deleteDoc(doc(db, 'projects', p.id));
      for (const t of prevTasks) await deleteDoc(doc(db, 'tasks', t.id));
      for (const i of prevInventory) await deleteDoc(doc(db, 'inventory', i.id));
      for (const o of prevOrders) await deleteDoc(doc(db, 'supplier_orders', o.id));
      for (const c of prevNotes) await deleteDoc(doc(db, 'call_notes', c.id));
      for (const a of prevApps) await deleteDoc(doc(db, 'appointments', a.id));
      for (const e of prevExp) await deleteDoc(doc(db, 'studio_expenses', e.id));
      for (const em of prevEmails) await deleteDoc(doc(db, 'client_emails', em.id));
      for (const pr of prevProducts) await deleteDoc(doc(db, 'catalog_products', pr.id));
      for (const q of prevQuotes) await deleteDoc(doc(db, 'quotes', q.id));
    } catch (err) {
      console.warn("Error clearing Firestore docs:", err);
    }
    setIsSyncing(false);
  };

  // Project Actions (Sync with Firestore)
  const addProject = (projectData: Omit<Project, 'id' | 'code'> & { code?: string }): Project => {
    const code = projectData.code || generateProjectSerial(projectData.category, projects);
    const id = `proj-${Date.now()}`;
    const newProject: Project = {
      ...projectData,
      id,
      code,
      driveLinks: {
        mainFolderUrl: projectData.driveLinks?.mainFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(code + ' ' + projectData.title)}`,
        draftsUrl: projectData.driveLinks?.draftsUrl || `https://drive.google.com/drive/folders/01_Bozze_${code}`,
        finalPrintFilesUrl: projectData.driveLinks?.finalPrintFilesUrl || `https://drive.google.com/drive/folders/02_Stampa_${code}`,
        moodboardUrl: projectData.driveLinks?.moodboardUrl || '',
      }
    };

    setProjects(prev => [newProject, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'projects', id), newProject).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `projects/${id}`);
    });

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    let updatedProj: Project | undefined;
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        updatedProj = { ...p, ...updates };
        return updatedProj;
      }
      return p;
    }));

    if (updatedProj) {
      setDoc(doc(db, 'projects', id), updatedProj, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
      });
    }
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setCallNotes(prev => prev.filter(c => c.projectId !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(projects.find(p => p.id !== id)?.id || null);
    }

    deleteDoc(doc(db, 'projects', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    });
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    let updatedProj: Project | undefined;
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      let progress = p.currentStepProgress;
      if (status === 'lead') progress = 10;
      else if (status === 'preventivo') progress = 25;
      else if (status === 'bozza_in_corso') progress = 45;
      else if (status === 'approvato_stampa') progress = 60;
      else if (status === 'in_produzione') progress = 75;
      else if (status === 'confezionamento') progress = 90;
      else if (status === 'consegnato') progress = 100;

      updatedProj = { ...p, status, currentStepProgress: progress };
      return updatedProj;
    }));

    if (updatedProj) {
      setDoc(doc(db, 'projects', id), updatedProj, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
      });
    }
  };

  // Call Notes Actions
  const addCallNote = (noteData: Omit<CallNote, 'id'>, createTasksFromActions = true) => {
    const id = `call-${Date.now()}`;
    const newNote: CallNote = {
      ...noteData,
      id
    };
    setCallNotes(prev => [newNote, ...prev]);

    setDoc(doc(db, 'call_notes', id), newNote).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `call_notes/${id}`);
    });

    if (createTasksFromActions && noteData.actionItems.length > 0) {
      const createdTasks: ProjectTask[] = noteData.actionItems.map((action, idx) => ({
        id: `task-action-${Date.now()}-${idx}`,
        projectId: noteData.projectId,
        title: action,
        category: 'confezionamento_manuale',
        department: 'produzione_manuale',
        assignee: 'claudia',
        actualHoursLogged: 0,
        status: 'da_fare',
        estimatedHours: 1.5,
        scheduledDate: todayDate,
        completed: false,
        priority: 'alta',
        notes: `Generato automaticamente dalla call: "${noteData.title}" del ${noteData.date}`
      }));
      setTasks(prev => [...createdTasks, ...prev]);
      createdTasks.forEach(t => {
        setDoc(doc(db, 'tasks', t.id), t).catch(console.warn);
      });
    }
  };

  const updateCallNote = (id: string, updates: Partial<CallNote>) => {
    let updatedNote: CallNote | undefined;
    setCallNotes(prev => prev.map(c => {
      if (c.id === id) {
        updatedNote = { ...c, ...updates };
        return updatedNote;
      }
      return c;
    }));

    if (updatedNote) {
      setDoc(doc(db, 'call_notes', id), updatedNote, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `call_notes/${id}`);
      });
    }
  };

  const deleteCallNote = (id: string) => {
    setCallNotes(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, 'call_notes', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `call_notes/${id}`);
    });
  };

  // Tasks Actions
  const addTask = (taskData: Omit<ProjectTask, 'id'>) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: ProjectTask = {
      ...taskData,
      id
    };
    setTasks(prev => [newTask, ...prev]);

    setDoc(doc(db, 'tasks', id), newTask).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${id}`);
    });
  };

  const addMultipleTasks = (newTasksList: Omit<ProjectTask, 'id'>[]) => {
    const mapped: ProjectTask[] = newTasksList.map((t, idx) => ({
      ...t,
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
    }));
    setTasks(prev => [...mapped, ...prev]);

    mapped.forEach(t => {
      setDoc(doc(db, 'tasks', t.id), t).catch(console.warn);
    });
  };

  const updateTask = (id: string, updates: Partial<ProjectTask>) => {
    let updatedTask: ProjectTask | undefined;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        updatedTask = { ...t, ...updates };
        return updatedTask;
      }
      return t;
    }));

    if (updatedTask) {
      setDoc(doc(db, 'tasks', id), updatedTask, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
      });
    }
  };

  const toggleTaskCompleted = (id: string) => {
    let updatedTask: ProjectTask | undefined;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        updatedTask = { ...t, completed: !t.completed };
        return updatedTask;
      }
      return t;
    }));

    if (updatedTask) {
      setDoc(doc(db, 'tasks', id), updatedTask, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
      });
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'tasks', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    });
  };

  const rescheduleTask = (taskId: string, newDate: string) => {
    updateTask(taskId, { scheduledDate: newDate });
  };

  const reassignTaskAssignee = (taskId: string, newAssignee: AssigneeId) => {
    updateTask(taskId, { assignee: newAssignee });
  };

  const logTaskActualHours = (taskId: string, hoursToAdd: number) => {
    const t = tasks.find(item => item.id === taskId);
    if (!t) return;
    const current = t.actualHoursLogged || 0;
    updateTask(taskId, { actualHoursLogged: Number((current + hoursToAdd).toFixed(2)) });
  };

  const generateAndScheduleProjectPhases = (
    projectId: string,
    targetDeliveryDate: string,
    quantity = 100,
    hasWaxSeal = true,
    hasSilkRibbon = true
  ) => {
    const generatedPhases = generateBackwardTasksForProject(
      projectId,
      targetDeliveryDate,
      quantity,
      hasWaxSeal,
      hasSilkRibbon
    );
    addMultipleTasks(generatedPhases);
  };

  // Inventory Actions
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now()}`;
    const newItem: InventoryItem = {
      ...itemData,
      id
    };
    setInventory(prev => [newItem, ...prev]);

    setDoc(doc(db, 'inventory', id), newItem).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `inventory/${id}`);
    });
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    let updatedItem: InventoryItem | undefined;
    setInventory(prev => prev.map(i => {
      if (i.id === id) {
        updatedItem = { ...i, ...updates };
        return updatedItem;
      }
      return i;
    }));

    if (updatedItem) {
      setDoc(doc(db, 'inventory', id), updatedItem, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`);
      });
    }
  };

  const adjustStock = (id: string, delta: number) => {
    let updatedItem: InventoryItem | undefined;
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.currentStock + delta);
        updatedItem = { ...item, currentStock: newStock };
        return updatedItem;
      }
      return item;
    }));

    if (updatedItem) {
      setDoc(doc(db, 'inventory', id), updatedItem, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`);
      });
    }
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    deleteDoc(doc(db, 'inventory', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    });
  };

  // Automatic Calculation of Materials Needed by Active Projects
  const getCalculatedMaterialDemands = () => {
    const activeProjects = projects.filter(p => 
      p.status === 'approvato_stampa' || 
      p.status === 'in_produzione' || 
      p.status === 'confezionamento' ||
      p.status === 'bozza_in_corso'
    );

    const demandsMap: Record<string, {
      itemName: string;
      requiredQty: number;
      currentStock: number;
      involvedProjects: { projectTitle: string; qty: number }[];
    }> = {};

    inventory.forEach(invItem => {
      demandsMap[invItem.id] = {
        itemName: invItem.name,
        requiredQty: 0,
        currentStock: invItem.currentStock,
        involvedProjects: []
      };
    });

    activeProjects.forEach(proj => {
      proj.suiteItems?.forEach(item => {
        const lowerName = item.name.toLowerCase();
        const lowerSpecs = (item.specifications || '').toLowerCase();

        inventory.forEach(invItem => {
          const invLower = invItem.name.toLowerCase();
          let match = false;
          let calculatedUnits = 0;

          if (invItem.category === 'carta' && (lowerName.includes('invit') || lowerName.includes('partecipazion') || lowerSpecs.includes('amalfi') || lowerSpecs.includes('cotone'))) {
            if (invLower.includes('amalfi') || invLower.includes('cotone')) {
              match = true;
              calculatedUnits = item.quantity;
            }
          } else if (invItem.category === 'buste' && (lowerName.includes('busta') || lowerSpecs.includes('busta'))) {
            if (lowerSpecs.includes('salvia') && invLower.includes('salvia')) {
              match = true;
              calculatedUnits = item.quantity;
            } else if (lowerSpecs.includes('terracotta') && invLower.includes('terracotta')) {
              match = true;
              calculatedUnits = item.quantity;
            } else if (!lowerSpecs.includes('terracotta') && !lowerSpecs.includes('salvia') && invLower.includes('c5')) {
              match = true;
              calculatedUnits = item.quantity;
            }
          } else if (invItem.category === 'ceralacca' && (lowerName.includes('sigillo') || lowerName.includes('ceralacca') || lowerSpecs.includes('ceralacca'))) {
            match = true;
            calculatedUnits = Math.round(item.quantity * 2.5); // ~2.5g wax per seal
          } else if (invItem.category === 'nastri' && (lowerName.includes('nastro') || lowerSpecs.includes('seta'))) {
            match = true;
            calculatedUnits = Math.round(item.quantity * 0.45); // ~0.45m silk per invite
          }

          if (match && calculatedUnits > 0) {
            demandsMap[invItem.id].requiredQty += calculatedUnits;
            demandsMap[invItem.id].involvedProjects.push({
              projectTitle: proj.title,
              qty: calculatedUnits
            });
          }
        });
      });
    });

    return Object.entries(demandsMap)
      .filter(([_, data]) => data.requiredQty > 0 || data.currentStock <= (inventory.find(i => i.name === data.itemName)?.minStockAlert || 0))
      .map(([itemId, data]) => ({
        itemId,
        itemName: data.itemName,
        requiredQty: data.requiredQty,
        currentStock: data.currentStock,
        shortage: Math.max(0, data.requiredQty - data.currentStock),
        involvedProjects: data.involvedProjects
      }));
  };

  // Supplier Orders Actions (Requirement 17 & 18)
  const addSupplierOrder = (orderData: Omit<SupplierOrder, 'id'>) => {
    const id = `ord-${Date.now()}`;
    const newOrder: SupplierOrder = {
      ...orderData,
      id
    };
    setSupplierOrders(prev => [newOrder, ...prev]);

    setDoc(doc(db, 'supplier_orders', id), newOrder).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `supplier_orders/${id}`);
    });
  };

  const updateSupplierOrderStatus = (orderId: string, status: SupplierOrder['status']) => {
    let updatedOrder: SupplierOrder | undefined;
    setSupplierOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const wasAlreadyReceived = o.status === 'ricevuto';
      updatedOrder = {
        ...o,
        status,
        actualReceivedDate: status === 'ricevuto' ? todayDate : o.actualReceivedDate
      };
      
      // Automatic Stock Update when order is marked 'ricevuto' (Requirement 18)
      if (status === 'ricevuto' && !wasAlreadyReceived) {
        o.items.forEach(it => {
          adjustStock(it.inventoryItemId, it.quantity);
        });
      }
      return updatedOrder;
    }));

    if (updatedOrder) {
      setDoc(doc(db, 'supplier_orders', orderId), updatedOrder, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `supplier_orders/${orderId}`);
      });
    }
  };

  const deleteSupplierOrder = (orderId: string) => {
    setSupplierOrders(prev => prev.filter(o => o.id !== orderId));
    deleteDoc(doc(db, 'supplier_orders', orderId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `supplier_orders/${orderId}`);
    });
  };

  const generateSupplierOrderFromShortages = () => {
    const demands = getCalculatedMaterialDemands().filter(d => d.shortage > 0);
    if (demands.length === 0) return;

    // Group by supplier
    const bySupplier: Record<string, { itemId: string; itemName: string; shortage: number; unitCost: number; unit: string }[]> = {};
    demands.forEach(d => {
      const inv = inventory.find(i => i.id === d.itemId);
      const supplierName = inv?.supplier || 'Cartiera Amatruda Amalfi';
      if (!bySupplier[supplierName]) bySupplier[supplierName] = [];
      bySupplier[supplierName].push({
        itemId: d.itemId,
        itemName: d.itemName,
        shortage: d.shortage,
        unitCost: inv?.unitCost || 1.5,
        unit: inv?.unit || 'pezzi'
      });
    });

    const newOrders: SupplierOrder[] = Object.entries(bySupplier).map(([supplierName, items], idx) => {
      const orderNum = `ORD-2026-${String(supplierOrders.length + idx + 10).padStart(3, '0')}`;
      const totalCost = items.reduce((acc, it) => acc + (it.shortage * it.unitCost), 0);
      const deliveryDate = new Date(todayDate);
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      return {
        id: `ord-auto-${Date.now()}-${idx}`,
        orderNumber: orderNum,
        supplierName,
        orderDate: todayDate,
        expectedDeliveryDate: deliveryDate.toISOString().split('T')[0],
        status: 'da_ordinare',
        items: items.map(it => ({
          inventoryItemId: it.itemId,
          itemName: `${it.itemName} (${it.shortage} ${it.unit})`,
          quantity: it.shortage,
          unit: it.unit,
          unitCost: it.unitCost,
        })),
        totalCost,
        notes: 'Generato automaticamente da fabbisogno suite nozze in produzione'
      };
    });

    setSupplierOrders(prev => [...newOrders, ...prev]);
    newOrders.forEach(ord => {
      setDoc(doc(db, 'supplier_orders', ord.id), ord).catch(console.warn);
    });
  };

  // Catalog Products Actions (Listino Prodotti & Prezzi)
  const addProduct = (prodData: Omit<CatalogProduct, 'id' | 'code'>): CatalogProduct => {
    const nextNum = products.length + 1;
    const catPrefix = (prodData.category || 'art').slice(0, 3).toUpperCase();
    const code = `PRD-${catPrefix}-${String(nextNum).padStart(2, '0')}`;
    const id = `prod-${Date.now()}`;
    const newProduct: CatalogProduct = {
      ...prodData,
      id,
      code
    };
    setProducts(prev => [newProduct, ...prev]);
    setDoc(doc(db, 'catalog_products', id), newProduct).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `catalog_products/${id}`);
    });
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<CatalogProduct>) => {
    let updated: CatalogProduct | undefined;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    }));
    if (updated) {
      setDoc(doc(db, 'catalog_products', id), updated, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `catalog_products/${id}`);
      });
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteDoc(doc(db, 'catalog_products', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `catalog_products/${id}`);
    });
  };

  // Quotes Actions (Preventivi)
  const addQuote = (quoteData: Omit<Quote, 'id' | 'number'>): Quote => {
    const nextNum = quotes.length + 1;
    const number = `PREV-2026-${String(nextNum).padStart(2, '0')}`;
    const id = `quote-${Date.now()}`;
    const newQuote: Quote = {
      ...quoteData,
      id,
      number
    };
    setQuotes(prev => [newQuote, ...prev]);
    setDoc(doc(db, 'quotes', id), newQuote).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `quotes/${id}`);
    });
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    let updated: Quote | undefined;
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        updated = { ...q, ...updates };
        return updated;
      }
      return q;
    }));
    if (updated) {
      setDoc(doc(db, 'quotes', id), updated, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `quotes/${id}`);
      });
    }
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    deleteDoc(doc(db, 'quotes', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `quotes/${id}`);
    });
  };

  const convertQuoteToProject = (quoteId: string, targetCategory?: StationeryCategory): Project => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error("Preventivo non trovato");

    const category: StationeryCategory = targetCategory || quote.typology || 'matrimonio';
    const config = getTypologyConfig(category);
    const assignedSerial = generateProjectSerial(category, projects);

    const suiteItems: SuiteItem[] = (quote.items || []).map((item, idx) => ({
      id: `suite-from-quote-${Date.now()}-${idx}`,
      name: item.name,
      quantity: item.quantity,
      specifications: item.specifications || '',
      unitPrice: item.unitPrice,
      materialsUsed: []
    }));

    const maxQty = quote.items && quote.items.length > 0
      ? Math.max(...quote.items.map(i => i.quantity || 0), 100)
      : 100;

    const newProject = addProject({
      code: assignedSerial,
      title: `${quote.clientName} — ${config.label}`,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      category,
      status: 'bozza_in_corso',
      crmStage: 'confermato',
      eventDate: quote.eventDate || '2026-11-15',
      targetDeliveryDate: quote.targetDeliveryDate || '2026-10-15',
      proofDeadlineDate: '2026-09-30',
      quantities: {
        preventivata: maxQty,
        provvisoria: maxQty,
        definitiva: maxQty,
        isDefinitiveLocked: false
      },
      suiteItems,
      colorPalette: [config.colorHex, config.bgHex, '#EDE8E0'],
      notes: `Convertito dal Preventivo ${quote.number}. Tipologia: ${config.label} (${config.prefix} - ${assignedSerial}). ${quote.notes || ''}`,
      currentStepProgress: 15,
      revisions: [
        {
          id: `rev-${Date.now()}-1`,
          versionNumber: 1,
          title: 'Bozza 1 — Layout e Font Pairing',
          sentDate: new Date().toISOString().split('T')[0],
          status: 'inviata',
          isIncludedInQuote: true
        }
      ],
      maxIncludedRevisions: 3,
      postApprovalChanges: [],
      readinessChecklist: [
        { id: `chk-${Date.now()}-1`, label: 'Testi Cerimonia & Nomi Definitivi', completed: false, requiredForProduction: true },
        { id: `chk-${Date.now()}-2`, label: 'Quantità Finale Confermata', completed: false, requiredForProduction: true },
        { id: `chk-${Date.now()}-3`, label: 'Approvazione Formale Bozza Stampa', completed: false, requiredForProduction: true },
        { id: `chk-${Date.now()}-4`, label: 'Controllo Giacenze Magazzino & Ordini Fornitori', completed: false, requiredForProduction: true }
      ],
      financials: {
        agreedPrice: quote.totalAmount,
        depositPaid: quote.depositAmount,
        balancePaid: 0,
        actualMaterialCost: Math.round(quote.estimatedCosts * 0.5),
        actualPrintCost: Math.round(quote.estimatedCosts * 0.5),
        otherExpenses: 0
      },
      driveLinks: {
        mainFolderUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent(quote.clientName)}`
      }
    });

    updateQuote(quoteId, {
      status: 'convertito_in_progetto',
      convertedProjectId: newProject.id
    });

    return newProject;
  };

  // Appointments Actions
  const addAppointment = (appData: Omit<Appointment, 'id'>) => {
    const id = `app-${Date.now()}`;
    const newApp: Appointment = {
      ...appData,
      id
    };
    setAppointments(prev => [...prev, newApp]);

    setDoc(doc(db, 'appointments', id), newApp).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
    });
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    let updatedApp: Appointment | undefined;
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        updatedApp = { ...a, ...updates };
        return updatedApp;
      }
      return a;
    }));

    if (updatedApp) {
      setDoc(doc(db, 'appointments', id), updatedApp, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
      });
    }
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, 'appointments', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
    });
  };

  // Emails Actions
  const markEmailRead = (id: string, isUnread: boolean) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isUnread } : e));
    setDoc(doc(db, 'client_emails', id), { isUnread }, { merge: true }).catch(console.warn);
  };

  const addEmail = (emailData: Omit<ClientEmail, 'id'>) => {
    const id = `mail-${Date.now()}`;
    const newMail: ClientEmail = {
      ...emailData,
      id
    };
    setEmails(prev => [newMail, ...prev]);
    setDoc(doc(db, 'client_emails', id), newMail).catch(console.warn);
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    deleteDoc(doc(db, 'client_emails', id)).catch(console.warn);
  };

  // Finances Actions
  const addStudioExpense = (expenseData: Omit<StudioExpense, 'id'>) => {
    const id = `exp-${Date.now()}`;
    const newExpense: StudioExpense = {
      ...expenseData,
      id
    };
    setStudioExpenses(prev => [newExpense, ...prev]);

    setDoc(doc(db, 'studio_expenses', id), newExpense).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `studio_expenses/${id}`);
    });
  };

  const deleteStudioExpense = (id: string) => {
    setStudioExpenses(prev => prev.filter(e => e.id !== id));
    deleteDoc(doc(db, 'studio_expenses', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `studio_expenses/${id}`);
    });
  };

  const updateProjectFinancials = (projectId: string, financials: Project['financials']) => {
    updateProject(projectId, { financials });
  };

  // Capacity Settings Actions
  const updateCapacitySettings = (settings: Partial<CapacitySettings>) => {
    const updated = { ...capacitySettings, ...settings };
    setCapacitySettings(updated);
    setDoc(doc(db, 'settings', 'capacity'), updated, { merge: true }).catch(console.warn);
  };

  const getMaxHoursForDate = (dateStr: string): number => {
    if (capacitySettings.customCapacityByDate[dateStr] !== undefined) {
      return capacitySettings.customCapacityByDate[dateStr];
    }
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=Lun, 7=Dom
    if (capacitySettings.dailyCapacityByWeekday && capacitySettings.dailyCapacityByWeekday[dayOfWeek] !== undefined) {
      return capacitySettings.dailyCapacityByWeekday[dayOfWeek];
    }
    return capacitySettings.workingDays.includes(dayOfWeek) ? capacitySettings.maxDailyHours : 0;
  };

  const setDayCapacity = (dateStr: string, hours: number) => {
    updateCapacitySettings({
      customCapacityByDate: {
        ...capacitySettings.customCapacityByDate,
        [dateStr]: hours,
      }
    });
  };

  const setWeekdayCapacity = (dayOfWeek: number, hours: number) => {
    updateCapacitySettings({
      dailyCapacityByWeekday: {
        ...capacitySettings.dailyCapacityByWeekday,
        [dayOfWeek]: hours,
      }
    });
  };

  // Utility Getters
  const getProjectById = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  const getTasksForDate = (dateStr: string): ProjectTask[] => {
    return tasks.filter(t => t.scheduledDate === dateStr);
  };

  const getTotalHoursForDate = (dateStr: string): number => {
    const dayTasks = getTasksForDate(dateStr).filter(t => !t.completed && t.status !== 'in_attesa_cliente' && t.status !== 'in_attesa_fornitore');
    const tasksHours = dayTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    return Number(tasksHours.toFixed(1));
  };

  const openGmailSearchForClient = (clientEmail: string, unreadOnly = false) => {
    const query = unreadOnly ? `from:${clientEmail} is:unread` : `from:${clientEmail}`;
    window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`, '_blank');
  };

  const openDriveFolderForProject = (projectId: string) => {
    const p = getProjectById(projectId);
    if (!p) return;
    const url = p.driveLinks?.mainFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(p.code + ' ' + p.title)}`;
    window.open(url, '_blank');
  };

  const generateDriveFolderStructure = (projectId: string): string => {
    const p = getProjectById(projectId);
    const code = p?.code || 'ST-2026';
    const title = p?.title || 'Progetto';
    return `📁 Google Drive / Atelier Sage Paper / ${code} — ${title}
├── 📂 01_Briefing & Palette/
│   ├── moodboard_pinterest.pdf
│   └── campionari_carte.jpg
├── 📂 02_Bozze Grafiche/
│   ├── Bozza_1_${code}.pdf
│   └── Bozza_2_${code}_approvata.pdf
├── 📂 03_File Esecutivi Stampa/
│   ├── Cliche_OroCaldo_Partecipazione.ai
│   └── Tracciati_Taglio_Fustella.pdf
└── 📂 04_Foto Atelier & Confezionamento/
    └── scatti_finali_suite/`;
  };

  return (
    <AppContext.Provider value={{
      projects,
      callNotes,
      tasks,
      inventory,
      appointments,
      emails,
      studioExpenses,
      activeView,
      setActiveView,
      selectedProjectId,
      setSelectedProjectId,
      todayDate,
      capacitySettings,
      updateCapacitySettings,
      currentUser,
      isCloudConnected,
      isSyncing,
      loginWithGoogle,
      logoutUser,
      loadDemoData,
      clearAllData,
      addProject,
      updateProject,
      deleteProject,
      updateProjectStatus,
      addCallNote,
      updateCallNote,
      deleteCallNote,
      addTask,
      addMultipleTasks,
      updateTask,
      toggleTaskCompleted,
      deleteTask,
      rescheduleTask,
      reassignTaskAssignee,
      logTaskActualHours,
      generateAndScheduleProjectPhases,
      addInventoryItem,
      updateInventoryItem,
      adjustStock,
      deleteInventoryItem,
      getCalculatedMaterialDemands,
      supplierOrders,
      addSupplierOrder,
      updateSupplierOrderStatus,
      deleteSupplierOrder,
      generateSupplierOrderFromShortages,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      markEmailRead,
      addEmail,
      deleteEmail,
      addStudioExpense,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      quotes,
      addQuote,
      updateQuote,
      deleteQuote,
      convertQuoteToProject,
      deleteStudioExpense,
      updateProjectFinancials,
      getProjectById,
      getTasksForDate,
      getTotalHoursForDate,
      openGmailSearchForClient,
      openDriveFolderForProject,
      generateDriveFolderStructure,
      getMaxHoursForDate,
      setDayCapacity,
      setWeekdayCapacity,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
