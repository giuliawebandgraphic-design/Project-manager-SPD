import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Quote, QuoteItem, CatalogProduct, Project } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  Printer, 
  Sparkles, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Calendar, 
  User, 
  Euro, 
  Percent, 
  Layers, 
  ShieldCheck, 
  X,
  Package,
  FolderPlus,
  ChevronRight,
  Eye,
  Check,
  Download,
  Mail,
  Loader2,
  FileDown,
  Tag
} from 'lucide-react';
import { exportElementToPdf } from '../utils/pdfExport';
import { 
  PROJECT_TYPOLOGIES, 
  ProjectTypologyKey, 
  getTypologyConfig, 
  generateProjectSerial, 
  normalizeTypologyKey 
} from '../utils/projectTypologies';

export const PreventiviView: React.FC = () => {
  const { 
    quotes, 
    addQuote, 
    updateQuote, 
    deleteQuote, 
    convertQuoteToProject, 
    products, 
    projects,
    setActiveView,
    setSelectedProjectId
  } = useApp();

  const [activeTab, setActiveTab] = useState<'elenco' | 'editor' | 'anteprima'>('elenco');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [quoteToConvertId, setQuoteToConvertId] = useState<string | null>(null);
  const [convertCategory, setConvertCategory] = useState<ProjectTypologyKey>('matrimonio');

  // Editor form state
  const [typology, setTypology] = useState<ProjectTypologyKey>('matrimonio');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventDate, setEventDate] = useState('2026-10-20');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('2026-09-15');
  const [validUntilDate, setValidUntilDate] = useState('2026-05-30');
  const [status, setStatus] = useState<Quote['status']>('bozza');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [depositPct, setDepositPct] = useState<number>(50);
  const [notes, setNotes] = useState('Gli sposi desiderano una prova campione digitale prima dell\'avvio stampa.');
  const [terms, setTerms] = useState('Acconto del 50% alla conferma per blocco data in calendario atelier. Saldo del 50% alla spedizione.');
  const [items, setItems] = useState<QuoteItem[]>([]);

  // Open editor for new quote
  const handleOpenNewQuote = () => {
    setSelectedQuoteId(null);
    setTypology('matrimonio');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setEventDate('2026-11-15');
    setTargetDeliveryDate('2026-10-01');
    
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    setValidUntilDate(validDate.toISOString().split('T')[0]);
    
    setStatus('bozza');
    setDiscountAmount(0);
    setDepositPct(50);
    setNotes('Suite su misura con dettagli artigianali e coordinato cerimonia.');
    setTerms('Acconto del 50% alla conferma per blocco data in atelier. Saldo alla consegna o spedizione.');

    // Pre-populate with first catalog item if available
    if (products.length > 0) {
      const p = products[0];
      setItems([{
        id: `item-${Date.now()}-1`,
        productId: p.id,
        name: p.name,
        specifications: p.description,
        quantity: 100,
        unitPrice: p.basePrice,
        totalPrice: p.basePrice * 100,
        materialCostPerUnit: p.materialCostPerUnit || 1.5,
        estimatedMinutesPerUnit: p.estimatedMinutesPerUnit || 2.0
      }]);
    } else {
      setItems([]);
    }

    setActiveTab('editor');
  };

  // Open editor to edit an existing quote
  const handleEditQuote = (q: Quote) => {
    setSelectedQuoteId(q.id);
    setTypology(normalizeTypologyKey(q.typology));
    setClientName(q.clientName);
    setClientEmail(q.clientEmail);
    setClientPhone(q.clientPhone);
    setEventDate(q.eventDate);
    setTargetDeliveryDate(q.targetDeliveryDate);
    setValidUntilDate(q.validUntilDate);
    setStatus(q.status);
    setDiscountAmount(q.discount);
    setDepositPct(q.depositPercentage || 50);
    setNotes(q.notes || '');
    setTerms(q.terms || '');
    setItems(q.items ? [...q.items] : []);
    setActiveTab('editor');
  };

  // Open print preview
  const handlePreviewQuote = (q: Quote) => {
    handleEditQuote(q);
    setActiveTab('anteprima');
  };

  // Add line item from catalog product
  const handleAddProductFromCatalog = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newItem: QuoteItem = {
      id: `qitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      name: prod.name,
      specifications: `${prod.suggestedPaper ? 'Supporto: ' + prod.suggestedPaper + '. ' : ''}${prod.description}`,
      quantity: prod.unit === 'forfait' || prod.unit === 'set' ? 1 : 100,
      unitPrice: prod.basePrice,
      totalPrice: prod.basePrice * (prod.unit === 'forfait' || prod.unit === 'set' ? 1 : 100),
      materialCostPerUnit: (prod.materialCostPerUnit || 0) + (prod.printCostPerUnit || 0),
      estimatedMinutesPerUnit: prod.estimatedMinutesPerUnit || 1.0
    };

    setItems(prev => [...prev, newItem]);
  };

  // Add blank manual line item
  const handleAddManualItem = () => {
    const newItem: QuoteItem = {
      id: `qitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: 'Lavorazione Artigianale Personalizzata',
      specifications: 'Dettagli su misura da definire con gli sposi',
      quantity: 100,
      unitPrice: 3.50,
      totalPrice: 350.00,
      materialCostPerUnit: 1.0,
      estimatedMinutesPerUnit: 1.5
    };
    setItems(prev => [...prev, newItem]);
  };

  // Update line item property
  const handleUpdateItem = (itemId: string, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        updated.totalPrice = Math.round(qty * price * 100) / 100;
      }
      return updated;
    }));
  };

  // Delete line item
  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [items]);

  const calculatedTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - (discountAmount || 0));
  }, [calculatedSubtotal, discountAmount]);

  const calculatedDeposit = useMemo(() => {
    return Math.round((calculatedTotal * (depositPct / 100)) * 100) / 100;
  }, [calculatedTotal, depositPct]);

  const calculatedBalance = useMemo(() => {
    return Math.max(0, calculatedTotal - calculatedDeposit);
  }, [calculatedTotal, calculatedDeposit]);

  const calculatedTotalMinutes = useMemo(() => {
    return items.reduce((sum, item) => sum + ((item.estimatedMinutesPerUnit || 0) * (item.quantity || 1)), 0);
  }, [items]);

  const calculatedTotalHours = Math.round((calculatedTotalMinutes / 60) * 10) / 10;

  const calculatedTotalCosts = useMemo(() => {
    return items.reduce((sum, item) => sum + ((item.materialCostPerUnit || 0) * (item.quantity || 1)), 0);
  }, [items]);

  const calculatedEstimatedMargin = Math.max(0, calculatedTotal - calculatedTotalCosts);
  const calculatedMarginPct = calculatedTotal > 0 ? (calculatedEstimatedMargin / calculatedTotal) * 100 : 0;

  // Save Quote
  const handleSaveQuote = () => {
    if (!clientName.trim()) {
      setFormValidationError('Inserisci il nome degli sposi o del committente.');
      return;
    }
    if (items.length === 0) {
      setFormValidationError('Aggiungi almeno un articolo o prodotto dal listino al preventivo.');
      return;
    }
    setFormValidationError(null);

    if (selectedQuoteId) {
      updateQuote(selectedQuoteId, {
        typology,
        clientName,
        clientEmail,
        clientPhone,
        eventDate,
        targetDeliveryDate,
        validUntilDate,
        status,
        items,
        subtotal: calculatedSubtotal,
        discount: discountAmount,
        totalAmount: calculatedTotal,
        depositPercentage: depositPct,
        depositAmount: calculatedDeposit,
        estimatedHours: calculatedTotalHours,
        estimatedCosts: calculatedTotalCosts,
        estimatedMargin: calculatedEstimatedMargin,
        estimatedMarginPercentage: calculatedMarginPct,
        notes,
        terms,
      });
      setToastMessage(`Preventivo ${clientName} aggiornato con successo!`);
    } else {
      const created = addQuote({
        typology,
        clientName,
        clientEmail,
        clientPhone,
        eventDate,
        targetDeliveryDate,
        createdAt: new Date().toISOString().split('T')[0],
        validUntilDate,
        status,
        items,
        subtotal: calculatedSubtotal,
        discount: discountAmount,
        totalAmount: calculatedTotal,
        depositPercentage: depositPct,
        depositAmount: calculatedDeposit,
        estimatedHours: calculatedTotalHours,
        estimatedCosts: calculatedTotalCosts,
        estimatedMargin: calculatedEstimatedMargin,
        estimatedMarginPercentage: calculatedMarginPct,
        notes,
        terms,
      });
      setSelectedQuoteId(created.id);
      setToastMessage(`Nuovo preventivo creato per ${clientName}!`);
    }

    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('elenco');
  };

  // Convert Quote into Project
  const handleConfirmConvertQuote = () => {
    if (!quoteToConvertId) return;
    try {
      const project = convertQuoteToProject(quoteToConvertId, convertCategory);
      setToastMessage(`✨ Progetto "${project.title}" (${project.code}) creato con successo!`);
      setTimeout(() => setToastMessage(null), 4000);
      setQuoteToConvertId(null);
      setSelectedProjectId(project.id);
      setActiveView('progetti');
    } catch (err) {
      console.error('Errore conversione preventivo:', err);
    }
  };

  // Export Quote to PDF
  const handleDownloadPdf = async (quoteToExport?: Quote) => {
    if (quoteToExport) {
      handlePreviewQuote(quoteToExport);
      setTimeout(async () => {
        setIsExportingPdf(true);
        try {
          const safeName = (quoteToExport.clientName || 'Sposi').replace(/[^a-zA-Z0-9]/g, '_');
          await exportElementToPdf({
            elementId: 'printable-quote-document',
            filename: `Preventivo_${quoteToExport.number}_${safeName}.pdf`,
          });
          setToastMessage(`PDF del preventivo ${quoteToExport.number} scaricato con successo!`);
          setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
          console.error('Errore export PDF:', err);
        } finally {
          setIsExportingPdf(false);
        }
      }, 350);
      return;
    }

    const currentQuote = selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId) : null;
    const qNum = currentQuote?.number || 'PREV-2026';
    const safeName = (clientName || 'Sposi').replace(/[^a-zA-Z0-9]/g, '_');

    setIsExportingPdf(true);
    try {
      await exportElementToPdf({
        elementId: 'printable-quote-document',
        filename: `Preventivo_${qNum}_${safeName}.pdf`,
      });
      setToastMessage(`PDF del preventivo ${qNum} scaricato con successo!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Errore export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Send Quote via Email (safe mailto without window.open)
  const handleSendEmailQuote = () => {
    const currentQuote = selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId) : null;
    const qNum = currentQuote?.number || 'PREV-2026';
    const recipient = clientEmail || '';
    const subject = encodeURIComponent(`Preventivo Suite Nozze — ${clientName || 'Sposi'} (${qNum})`);
    const body = encodeURIComponent(
      `Carissimi ${clientName || 'Sposi'},\n\nVi ringraziamo di cuore per aver scelto Sage Paper Design per la vostra suite di nozze.\n\nTroverete allegato il vostro preventivo personalizzato (${qNum}) con il dettaglio completo delle carte cotone, delle finiture artigianali e dei termini di consegna:\n\n• Totale Preventivo: € ${calculatedTotal.toFixed(2)}\n• Acconto alla conferma (${depositPct}%): € ${calculatedDeposit.toFixed(2)}\n• Saldo alla consegna: € ${calculatedBalance.toFixed(2)}\n• Data Evento: ${eventDate}\n• Consegna desiderata: ${targetDeliveryDate}\n\nRestiamo a vostra completa disposizione per qualsiasi variazione o per iniziare a curare insieme il vostro coordinato!\n\nUn caro saluto,\nAtelier Sage Paper Design\nsagepaperdesign@gmail.com`
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  // Filtered quotes list
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = 
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.clientEmail && q.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ? true : q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  // Aggregate Stats
  const totalQuotesValue = quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accettato' || q.status === 'convertito_in_progetto');
  const conversionRate = quotes.length > 0 ? Math.round((acceptedQuotes.length / quotes.length) * 100) : 0;

  // Status Badge Helper (strictly NO yellow, NO black)
  const renderStatusBadge = (st: Quote['status']) => {
    switch (st) {
      case 'bozza':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#7D8B80] border border-[#E5DFD4] text-[11px] font-semibold">
            <Clock className="w-3 h-3" />
            <span>Bozza</span>
          </span>
        );
      case 'inviato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#5B7B63] border border-[#D5E0D8] text-[11px] font-semibold">
            <Send className="w-3 h-3" />
            <span>Inviato al Cliente</span>
          </span>
        );
      case 'accettato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#4A6750] border border-[#C5D8C9] text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confermato dagli Sposi</span>
          </span>
        );
      case 'convertito_in_progetto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5B7B63] text-[#FFFFFF] text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Convertito in Progetto</span>
          </span>
        );
      case 'rifiutato':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF1ED] text-[#B57C68] border border-[#F2DDD5] text-[11px] font-semibold">
            <X className="w-3 h-3" />
            <span>Non Confermato</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-[#EBF2ED] border border-[#C5D8C9] text-xs font-semibold text-[#4A6750] flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5B7B63] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#5B7B63] hover:text-[#26332A] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D7] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2ED] text-[#5B7B63] text-xs font-semibold tracking-wide">
              <span>📜 Quotazioni & Preventivazione Intelligente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#26332A] tracking-tight">
              Elaboratore Preventivi Atelier
            </h1>
            <p className="text-sm text-[#68766B] max-w-2xl leading-relaxed">
              Componi preventivi raffinati pescando gli articoli direttamente dal listino prodotti. Calcola in tempo reale acconti, ore di lavorazione e margini atelier, per poi convertire con un click in progetto esecutivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('prodotti')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#D5E0D8] text-[#5B7B63] hover:bg-[#F2F7F4] text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Gestisci Listino Prodotti</span>
            </button>

            <button
              onClick={handleOpenNewQuote}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold shadow-sm shadow-[#5B7B63]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Preventivo Sposi</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E8E2D7]">
          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Preventivi Totali</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">{quotes.length}</div>
            <span className="text-[11px] text-[#5B7B63] font-medium mt-0.5 block">Storico atelier</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Valore Preventivato</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">€ {totalQuotesValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
            <span className="text-[11px] text-[#7D8B80] block mt-0.5">Totale quotazioni</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Tasso di Accettazione</span>
            <div className="text-2xl font-bold text-[#5B7B63] mt-1">{conversionRate}%</div>
            <span className="text-[11px] text-[#5B7B63] block mt-0.5">{acceptedQuotes.length} preventivi confermati</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">In Attesa Riscontro</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">
              {quotes.filter(q => q.status === 'inviato').length}
            </div>
            <span className="text-[11px] text-[#7D8B80] block mt-0.5">Inviati recentemente</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Elenco vs Editor vs Anteprima) */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D7] pb-3">
        <button
          onClick={() => setActiveTab('elenco')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'elenco'
              ? 'bg-[#5B7B63] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#68766B] border border-[#E8E2D7] hover:bg-[#FAF8F5]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Elenco Preventivi ({quotes.length})</span>
        </button>

        {activeTab !== 'elenco' && (
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'bg-[#5B7B63] text-white shadow-xs'
                : 'bg-[#FFFFFF] text-[#68766B] border border-[#E8E2D7] hover:bg-[#FAF8F5]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modifica Dati & Articoli</span>
          </button>
        )}

        {activeTab !== 'elenco' && (
          <button
            onClick={() => setActiveTab('anteprima')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'anteprima'
                ? 'bg-[#5B7B63] text-white shadow-xs'
                : 'bg-[#FFFFFF] text-[#68766B] border border-[#E8E2D7] hover:bg-[#FAF8F5]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Anteprima Sposi & Stampa</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ELENCO PREVENTIVI */}
      {activeTab === 'elenco' && (
        <div className="space-y-4">
          
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7D8B80] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca per nome sposi, codice (PREV-2026-08)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD4] focus:border-[#5B7B63] focus:ring-1 focus:ring-[#5B7B63] text-xs font-medium text-[#26332A] outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9385]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tutti' },
                { id: 'bozza', label: 'Bozze' },
                { id: 'inviato', label: 'Inviati' },
                { id: 'accettato', label: 'Confermati' },
                { id: 'convertito_in_progetto', label: 'In Progetto' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-[#5B7B63] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#68766B] border border-[#E8E2D7] hover:bg-[#F7F5F0]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table / Cards List */}
          {filteredQuotes.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F0F5F2] text-[#5B7B63] flex items-center justify-center mx-auto text-2xl">
                📜
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-bold text-base text-[#26332A]">Nessun preventivo trovato</h3>
                <p className="text-xs text-[#7D8B80] mt-1 leading-relaxed">
                  Inizia creando una nuova quotazione collegata al listino prodotti per i tuoi sposi.
                </p>
              </div>
              <button
                onClick={handleOpenNewQuote}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#5B7B63] text-white text-xs font-bold hover:bg-[#4A6750] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crea Primo Preventivo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#5B7B63] text-[10px] font-bold tracking-wider">
                          {q.number}
                        </span>
                        {(() => {
                          const qTypo = getTypologyConfig(q.typology);
                          return (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                              style={{
                                backgroundColor: qTypo.bgHex,
                                borderColor: qTypo.borderHex,
                                color: qTypo.textHex
                              }}
                              title={`Tipologia: ${qTypo.label}`}
                            >
                              <span>{qTypo.icon}</span>
                              <span>{qTypo.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                      {renderStatusBadge(q.status)}
                    </div>

                    {/* Client & Date */}
                    <h3 className="font-bold text-base text-[#26332A] mt-3 group-hover:text-[#5B7B63] transition-colors">
                      {q.clientName}
                    </h3>
                    
                    <div className="space-y-1 mt-2 text-xs text-[#68766B]">
                      {q.eventDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#5B7B63]" />
                          <span>Data Nozze: <strong>{new Date(q.eventDate).toLocaleDateString('it-IT')}</strong></span>
                        </div>
                      )}
                      {q.targetDeliveryDate && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#7D8B80]" />
                          <span>Consegna richiesta: {new Date(q.targetDeliveryDate).toLocaleDateString('it-IT')}</span>
                        </div>
                      )}
                    </div>

                    {/* Items breakdown pills */}
                    <div className="mt-4 pt-3 border-t border-[#F2ECE3] space-y-1.5">
                      <span className="text-[10px] font-semibold text-[#8C9B90] uppercase tracking-wider block">
                        Articoli Inclusi ({q.items?.length || 0})
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {q.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                            <span className="text-[#26332A] font-medium truncate max-w-[190px]">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="text-[#5B7B63] font-semibold shrink-0">
                              € {it.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary & Actions */}
                  <div className="mt-5 pt-4 border-t border-[#F2ECE3] space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-[#8C9B90] uppercase tracking-wider block">
                          Totale Preventivo
                        </span>
                        <div className="text-xl font-bold text-[#26332A]">
                          € {q.totalAmount.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#8C9B90] uppercase tracking-wider block">
                          Acconto {q.depositPercentage}%
                        </span>
                        <div className="text-xs font-bold text-[#5B7B63]">
                          € {q.depositAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handlePreviewQuote(q)}
                        className="py-2 px-1.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#5B7B63] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Anteprima a Schermo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vedi</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(q)}
                        className="py-2 px-1.5 rounded-2xl bg-[#EBF2ED] hover:bg-[#D8E6DB] text-[#5B7B63] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Scarica PDF Preventivo per gli Sposi"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleEditQuote(q)}
                        className="py-2 px-1.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#5E6D62] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Modifica Preventivo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifica</span>
                      </button>

                      {q.status !== 'convertito_in_progetto' ? (
                        <button
                          onClick={() => setQuoteToConvertId(q.id)}
                          className="py-2 px-1.5 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Converti in Progetto Atelier"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Ordina</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (q.convertedProjectId) {
                              setSelectedProjectId(q.convertedProjectId);
                              setActiveView('progetti');
                            }
                          }}
                          className="py-2 px-1.5 rounded-2xl bg-[#E6EFE9] text-[#5B7B63] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          title="Apri Progetto Collegato"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>In Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: EDITOR PREVENTIVO */}
      {activeTab === 'editor' && (
        <div className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE6] gap-4">
            <div>
              <span className="text-xs font-bold text-[#5B7B63] tracking-wide uppercase">
                {selectedQuoteId ? 'Modifica Preventivo Esistente' : 'Nuovo Preventivo Sposi'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#26332A] mt-0.5">
                Dati Preventivo & Composizione Suite
              </h2>
            </div>

            {formValidationError && (
              <div className="w-full p-3.5 rounded-2xl bg-[#F8EFEF] border border-[#E7CDCD] text-xs font-semibold text-[#8B4D4D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8B4D4D] rotate-45 shrink-0" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('anteprima')}
                className="px-4 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D7] text-[#5B7B63] hover:bg-[#F2ECE3] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Anteprima Grafica Sposi</span>
              </button>

              <button
                onClick={handleSaveQuote}
                className="px-5 py-2 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salva Preventivo</span>
              </button>
            </div>
          </div>

          {/* Scegli la Tipologia Progetto (caratterizzata con colori diversi) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#EDE8E0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#26332A] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#5B7B63]" />
                <span>Tipologia Progetto (Colori Dedicati Atelier)</span>
              </label>
              <span className="text-[11px] text-[#7D8B80]">
                Assegna la serie progressiva corretta
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {PROJECT_TYPOLOGIES.map((t) => {
                const isSelected = typology === t.key;
                const nextSerial = generateProjectSerial(t.key, projects);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTypology(t.key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                      isSelected
                        ? t.activeRingClass + ' shadow-xs'
                        : 'bg-[#FAF8F5] border-[#E8E2D7] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{t.icon}</span>
                      <span 
                        className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: isSelected ? t.colorHex : t.bgHex,
                          color: isSelected ? '#FFFFFF' : t.textHex,
                          borderColor: t.borderHex
                        }}
                      >
                        {t.prefix}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-[#26332A] leading-tight">
                        {t.label}
                      </div>
                      <div className="text-[10px] text-[#7D8B80] font-mono mt-0.5">
                        {nextSerial}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client & Date Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Nome Sposi / Cliente *
              </label>
              <input
                type="text"
                placeholder="es. Sofia Visconti & Edoardo Moretti"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Email di Contatto
              </label>
              <input
                type="email"
                placeholder="sposi@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Telefono Sposi
              </label>
              <input
                type="tel"
                placeholder="+39 347 1234567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Data Evento / Nozze
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Consegna Richiesta
              </label>
              <input
                type="date"
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Validità Preventivo
              </label>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332A] mb-1">
                Stato Preventivo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Quote['status'])}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none cursor-pointer"
              >
                <option value="bozza">Bozza in lavorazione</option>
                <option value="inviato">Inviato al cliente</option>
                <option value="accettato">Accettato / Confermato</option>
                <option value="rifiutato">Rifiutato</option>
                <option value="convertito_in_progetto">Convertito in Progetto</option>
              </select>
            </div>
          </div>

          {/* Section: Articoli e Listino Prodotti Collegato */}
          <div className="pt-4 border-t border-[#EFECE6] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#26332A]">
                  Articoli della Suite & Finiture (Collegati al Listino)
                </h3>
                <p className="text-xs text-[#7D8B80]">
                  Seleziona i prodotti dal listino per importare automaticamente descrizioni, prezzi al pubblico e tempi di lavorazione.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Catalog Quick Selector */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProductFromCatalog(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] hover:bg-[#DFECE3] text-xs font-bold border border-[#D5E0D8] outline-none cursor-pointer"
                >
                  <option value="">+ Aggiungi dal Listino Prodotti...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — € {p.basePrice.toFixed(2)}/{p.unit}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddManualItem}
                  className="px-3.5 py-2 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#26332A] text-xs font-bold border border-[#E8E2D7] transition-colors cursor-pointer"
                >
                  + Voce Libera
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-[#E8E2D7] rounded-2xl overflow-hidden bg-[#FAF8F5]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2ECE3] text-[#26332A] font-bold border-b border-[#E8E2D7]">
                    <tr>
                      <th className="p-3">Articolo / Servizio</th>
                      <th className="p-3 w-48">Specifiche & Supporto</th>
                      <th className="p-3 w-24 text-center">Quantità</th>
                      <th className="p-3 w-28 text-right">Prezzo Unit. (€)</th>
                      <th className="p-3 w-28 text-right">Totale Riga</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5DC] bg-[#FFFFFF]">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#7D8B80]">
                          Nessun articolo inserito. Clicca su "+ Aggiungi dal Listino Prodotti" qui sopra.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="w-full font-bold text-[#26332A] bg-transparent outline-none focus:bg-[#FAF8F5] rounded-lg px-1.5 py-1"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.specifications}
                              onChange={(e) => handleUpdateItem(item.id, 'specifications', e.target.value)}
                              placeholder="Note, carta, finiture..."
                              className="w-full text-[11px] text-[#68766B] bg-transparent outline-none focus:bg-[#FAF8F5] rounded-lg px-1.5 py-1"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 text-center font-bold text-[#26332A] bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] rounded-xl py-1 outline-none"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right font-bold text-[#26332A] bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] rounded-xl py-1 px-1.5 outline-none"
                            />
                          </td>
                          <td className="p-3 text-right font-bold text-[#26332A]">
                            € {item.totalPrice.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-[#9E9385] hover:text-[#B57C68] transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Pricing Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Atelier Production Metrics */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D7] rounded-2xl p-5 space-y-3">
                <span className="text-xs font-bold text-[#5B7B63] uppercase tracking-wider block">
                  Analisi Tempi & Redditività Atelier
                </span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EDE8E0]">
                    <span className="text-[11px] text-[#7D8B80] block">Ore Lavoro Stimate</span>
                    <strong className="text-base text-[#26332A] mt-0.5 block">{calculatedTotalHours} h</strong>
                    <span className="text-[10px] text-[#7D8B80]">In base ai minuti dei prodotti</span>
                  </div>

                  <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#EDE8E0]">
                    <span className="text-[11px] text-[#7D8B80] block">Costi Vivi Materiali</span>
                    <strong className="text-base text-[#26332A] mt-0.5 block">€ {calculatedTotalCosts.toFixed(2)}</strong>
                    <span className="text-[10px] text-[#7D8B80]">Carta, inchiostri, nastri, ceralacca</span>
                  </div>
                </div>

                <div className="bg-[#EBF2ED] p-3 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#5B7B63] font-bold block">Margine Lordo Stimato Atelier</span>
                    <span className="text-[11px] text-[#4A6750]">Utile al netto delle forniture</span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#4A6750]">€ {calculatedEstimatedMargin.toFixed(2)}</div>
                    <span className="text-[10px] font-bold text-[#5B7B63]">{calculatedMarginPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Client Pricing Totals */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D7] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#68766B]">Subtotale Articoli:</span>
                  <span className="font-bold text-[#26332A]">€ {calculatedSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#68766B]">Sconto Speciale Sposi (€):</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 text-right font-bold text-[#26332A] bg-[#FFFFFF] border border-[#E5DFD4] focus:border-[#5B7B63] rounded-xl py-1 px-2 outline-none"
                  />
                </div>

                <div className="border-t border-[#E8E2D7] pt-2 flex items-center justify-between">
                  <span className="font-bold text-sm text-[#26332A]">Totale Preventivo:</span>
                  <span className="font-bold text-lg text-[#5B7B63]">€ {calculatedTotal.toFixed(2)}</span>
                </div>

                {/* Deposit selection */}
                <div className="border-t border-[#E8E2D7] pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#68766B]">Percentuale Acconto Richiesto:</span>
                    <div className="flex items-center gap-1">
                      {[30, 40, 50].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDepositPct(pct)}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            depositPct === pct
                              ? 'bg-[#5B7B63] text-white'
                              : 'bg-[#FFFFFF] text-[#68766B] border border-[#E5DFD4]'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#EDE8E0]">
                      <span className="text-[10px] text-[#7D8B80] block">Acconto alla Conferma ({depositPct}%)</span>
                      <strong className="text-sm text-[#5B7B63] block mt-0.5">€ {calculatedDeposit.toFixed(2)}</strong>
                    </div>

                    <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#EDE8E0]">
                      <span className="text-[10px] text-[#7D8B80] block">Saldo alla Consegna</span>
                      <strong className="text-sm text-[#26332A] block mt-0.5">€ {calculatedBalance.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#26332A] mb-1">
                  Note Personalizzate per gli Sposi
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#26332A] mb-1">
                  Termini di Pagamento & Condizioni
                </label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none resize-none"
                />
              </div>
            </div>

            {/* Save Buttons at Bottom */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFECE6]">
              <button
                type="button"
                onClick={() => setActiveTab('elenco')}
                className="px-4 py-2 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D7] text-[#68766B] hover:bg-[#FAF8F5] text-xs font-bold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveQuote}
                className="px-6 py-2.5 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salva e Visualizza Preventivo</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: ANTEPRIMA ELEGANTE STAMPABILE PER SPOSI */}
      {activeTab === 'anteprima' && (
        <div className="space-y-6">
          
          {/* Top Bar with PDF Export, Email, Print and Convert Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FFFFFF] p-4 rounded-2xl border border-[#E8E2D7]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5B7B63]">Anteprima Ufficiale Sposi:</span>
              <span className="text-xs font-medium text-[#26332A]">{clientName || 'Sposi'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Primary PDF Download Button */}
              <button
                disabled={isExportingPdf}
                onClick={() => handleDownloadPdf()}
                className="px-5 py-2 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] disabled:bg-[#9BB4A2] text-[#FFFFFF] text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                title="Scarica documento PDF impaginato pronto da inviare agli sposi"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generazione PDF in corso...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica PDF per Sposi</span>
                  </>
                )}
              </button>

              {/* Email Send Button */}
              <button
                onClick={handleSendEmailQuote}
                className="px-4 py-2 rounded-2xl bg-[#EBF2ED] hover:bg-[#D8E6DB] text-[#4A6750] text-xs font-bold border border-[#C5D8C9] transition-colors cursor-pointer flex items-center gap-2"
                title="Apri client email con testo preventivo precompilato"
              >
                <Mail className="w-3.5 h-3.5 text-[#5B7B63]" />
                <span>Invia per Email</span>
              </button>

              {/* Native Print */}
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#26332A] text-xs font-bold border border-[#E8E2D7] transition-colors cursor-pointer flex items-center gap-2"
                title="Stampa su carta o salva tramite driver di stampa"
              >
                <Printer className="w-3.5 h-3.5 text-[#5B7B63]" />
                <span>Stampa</span>
              </button>

              {selectedQuoteId && status !== 'convertito_in_progetto' && (
                <button
                  onClick={() => {
                    setQuoteToConvertId(selectedQuoteId);
                    setConvertCategory(normalizeTypologyKey(typology));
                  }}
                  className="px-4 py-2 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#5B7B63] border border-[#D5E0D8] text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Converti in Progetto</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D7] text-[#68766B] hover:bg-[#FAF8F5] text-xs font-bold transition-colors cursor-pointer"
              >
                Modifica Voci
              </button>
            </div>
          </div>

          {/* Elegant Printable Document Card (Sage, Beige, White, No Black, No Yellow) */}
          <div 
            id="printable-quote-document"
            className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl p-8 sm:p-12 shadow-md max-w-4xl mx-auto space-y-8 text-[#26332A] print:border-none print:shadow-none print:p-0"
          >
            
            {/* Document Header */}
            <div className="flex items-start justify-between border-b border-[#EAE5DC] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold text-lg">
                    🌿
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#26332A]">
                      Sage Paper Design
                    </h1>
                    <p className="text-[11px] text-[#7D8B80] tracking-widest uppercase font-semibold">
                      Atelier di Stationery Artigianale & Calligrafia
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#7D8B80] mt-3">
                  Via dell'Artigianato Elegante • Firenze, Italia<br />
                  Email: sagepaperdesign@gmail.com
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#FAF8F5] text-[#5B7B63] border border-[#D5E0D8] text-xs font-bold tracking-wider inline-block">
                    PREVENTIVO
                  </span>
                  {(() => {
                    const tConf = getTypologyConfig(typology);
                    return (
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
                        style={{
                          backgroundColor: tConf.bgHex,
                          borderColor: tConf.borderHex,
                          color: tConf.textHex
                        }}
                      >
                        <span>{tConf.icon}</span>
                        <span>{tConf.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="text-sm font-bold text-[#26332A] mt-2">
                  {selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId)?.number || 'PREV-2026' : 'PREV-2026-BOZZA'}
                </div>
                <div className="text-[11px] text-[#7D8B80] mt-0.5">
                  Data: {new Date().toLocaleDateString('it-IT')}
                </div>
                <div className="text-[11px] text-[#5B7B63] font-semibold mt-0.5">
                  Valido fino al: {new Date(validUntilDate).toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>

            {/* Recipient Box */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EDE8E0] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#7D8B80] uppercase tracking-wider block">
                  Destinatario / Sposi
                </span>
                <div className="text-base font-bold text-[#26332A] mt-1">{clientName || 'Gentili Sposi'}</div>
                {clientEmail && <div className="text-xs text-[#68766B] mt-0.5">{clientEmail}</div>}
                {clientPhone && <div className="text-xs text-[#68766B] mt-0.5">{clientPhone}</div>}
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold text-[#7D8B80] uppercase tracking-wider block">
                  Dettagli Evento
                </span>
                <div className="text-xs text-[#26332A] mt-1">
                  Data Cerimonia: <strong>{new Date(eventDate).toLocaleDateString('it-IT')}</strong>
                </div>
                <div className="text-xs text-[#5B7B63] mt-0.5">
                  Consegna Atelier: <strong>{new Date(targetDeliveryDate).toLocaleDateString('it-IT')}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-[#26332A] tracking-wider uppercase">
                Prospetto Suite di Nozze & Lavorazioni Artigianali
              </h3>

              <div className="border border-[#E8E2D7] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#26332A] font-bold border-b border-[#E8E2D7]">
                    <tr>
                      <th className="p-3.5">Descrizione Articolo</th>
                      <th className="p-3.5 text-center w-24">Quantità</th>
                      <th className="p-3.5 text-right w-28">Prezzo Unit.</th>
                      <th className="p-3.5 text-right w-28">Totale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE3]">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                        <td className="p-3.5">
                          <div className="font-bold text-[#26332A]">{it.name}</div>
                          {it.specifications && (
                            <div className="text-[11px] text-[#7D8B80] mt-0.5 leading-relaxed">
                              {it.specifications}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-bold text-[#26332A]">{it.quantity}</td>
                        <td className="p-3.5 text-right text-[#68766B]">€ {it.unitPrice.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold text-[#26332A]">€ {it.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals & Payment Schedule */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
              <div className="max-w-md space-y-2 text-xs text-[#68766B]">
                <span className="font-bold text-[#26332A] block uppercase text-[10px] tracking-wider">
                  Condizioni & Termini di Lavorazione
                </span>
                <p className="leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE5DC]">
                  {terms || 'Acconto del 50% alla conferma per blocco data in calendario atelier. Saldo alla consegna o spedizione.'}
                </p>
                {notes && (
                  <p className="text-[11px] text-[#7D8B80] italic">
                    Note: {notes}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-72 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE8E0] space-y-2 text-xs">
                <div className="flex justify-between text-[#68766B]">
                  <span>Subtotale:</span>
                  <span className="font-medium text-[#26332A]">€ {calculatedSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#5B7B63]">
                    <span>Sconto applicato:</span>
                    <span className="font-bold">- € {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-[#E8E2D7] pt-2 flex justify-between font-bold text-sm text-[#26332A]">
                  <span>Totale Preventivo:</span>
                  <span className="text-[#5B7B63] text-base">€ {calculatedTotal.toFixed(2)}</span>
                </div>

                <div className="border-t border-[#E8E2D7] pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between text-[#5B7B63] font-semibold">
                    <span>Acconto richiesto ({depositPct}%):</span>
                    <span>€ {calculatedDeposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#7D8B80]">
                    <span>Saldo alla consegna:</span>
                    <span>€ {calculatedBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-8 border-t border-[#EAE5DC] grid grid-cols-2 gap-8 text-center text-xs text-[#7D8B80]">
              <div className="space-y-12">
                <p className="font-semibold text-[#26332A]">Per Accettazione Sposi</p>
                <div className="border-b border-[#D5E0D8] mx-8"></div>
                <p className="text-[10px]">Firma e data di conferma</p>
              </div>

              <div className="space-y-12">
                <p className="font-semibold text-[#26332A]">Sage Paper Design — Atelier</p>
                <div className="border-b border-[#D5E0D8] mx-8"></div>
                <p className="text-[10px]">Timbro e firma direzione creativa</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal: Convert Quote to Active Project */}
      {quoteToConvertId && (
        <div className="fixed inset-0 z-50 bg-[#26332A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-xl border border-[#EDE8E0] animate-in fade-in zoom-in-95 duration-200 text-[#26332A]">
            <div className="flex items-center gap-3 border-b border-[#EDE8E0] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold text-xl shadow-xs">
                <Sparkles className="w-6 h-6 text-[#5B7B63]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#26332A]">
                  Converti Preventivo in Progetto Atelier
                </h3>
                <p className="text-xs text-[#7D8B80]">
                  {quotes.find(q => q.id === quoteToConvertId)?.number} — {quotes.find(q => q.id === quoteToConvertId)?.clientName}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#68766B] leading-relaxed">
              Scegli la tipologia del progetto per assegnare il <strong>numero di serie sequenziale</strong> corretto e la relativa identità grafica:
            </p>

            {/* 5 Typologies with distinct colors */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#26332A] flex items-center justify-between">
                <span>Tipologia Progetto Assegnata:</span>
                <span className="text-[10px] text-[#7D8B80] font-normal">Colori e prefisso dedicati</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {PROJECT_TYPOLOGIES.map((t) => {
                  const isSelected = convertCategory === t.key;
                  const previewSerial = generateProjectSerial(t.key, projects);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setConvertCategory(t.key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? t.activeRingClass + ' shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EDE8E0] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <div>
                          <div className="font-bold text-xs text-[#26332A]">
                            {t.label}
                          </div>
                          <div className="text-[10px] font-mono font-bold" style={{ color: t.colorHex }}>
                            {previewSerial}
                          </div>
                        </div>
                      </div>

                      <span 
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: isSelected ? t.colorHex : t.bgHex,
                          color: isSelected ? '#FFFFFF' : t.textHex,
                          borderColor: t.borderHex
                        }}
                      >
                        {t.prefix}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview assigned serial number banner */}
            {(() => {
              const activeConf = getTypologyConfig(convertCategory);
              const assignedSerial = generateProjectSerial(convertCategory, projects);
              return (
                <div 
                  className="p-3 rounded-2xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: activeConf.bgHex,
                    borderColor: activeConf.borderHex,
                    color: activeConf.textHex
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{activeConf.icon}</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                        Numero di Serie Assegnato:
                      </span>
                      <span className="font-mono font-bold text-sm">
                        {assignedSerial}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-bold">
                    {activeConf.label}
                  </span>
                </div>
              );
            })()}

            <div className="pt-2 flex items-center justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setQuoteToConvertId(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#68766B] font-bold cursor-pointer transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertQuote}
                className="px-5 py-2.5 rounded-xl bg-[#5B7B63] hover:bg-[#4A6750] text-white font-bold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Conferma & Crea Progetto</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
