import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CatalogProduct, CatalogProductCategory } from '../types';
import { 
  Plus, 
  Search, 
  Tag, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Layers, 
  FileText, 
  Check, 
  X, 
  SlidersHorizontal,
  Clock,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

interface ProdottiCatalogoViewProps {
  onSelectForQuote?: (product: CatalogProduct) => void;
}

export const ProdottiCatalogoView: React.FC<ProdottiCatalogoViewProps> = ({ onSelectForQuote }) => {
  const { products, addProduct, updateProduct, deleteProduct, setActiveView } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CatalogProductCategory>('partecipazioni');
  const [formDescription, setFormDescription] = useState('');
  const [formBasePrice, setFormBasePrice] = useState<number>(5.50);
  const [formUnit, setFormUnit] = useState('pz');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(2.0);
  const [formMaterialCost, setFormMaterialCost] = useState<number>(1.50);
  const [formPrintCost, setFormPrintCost] = useState<number>(1.00);
  const [formSuggestedPaper, setFormSuggestedPaper] = useState('');
  const [formHasWaxSeal, setFormHasWaxSeal] = useState(false);
  const [formHasSilkRibbon, setFormHasSilkRibbon] = useState(false);

  // Open modal for new product
  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('partecipazioni');
    setFormDescription('');
    setFormBasePrice(5.50);
    setFormUnit('pz');
    setFormEstimatedMinutes(2.0);
    setFormMaterialCost(1.50);
    setFormPrintCost(1.00);
    setFormSuggestedPaper('Carta cotone naturale');
    setFormHasWaxSeal(false);
    setFormHasSilkRibbon(false);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (p: CatalogProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormDescription(p.description);
    setFormBasePrice(p.basePrice);
    setFormUnit(p.unit || 'pz');
    setFormEstimatedMinutes(p.estimatedMinutesPerUnit || 1.0);
    setFormMaterialCost(p.materialCostPerUnit || 0);
    setFormPrintCost(p.printCostPerUnit || 0);
    setFormSuggestedPaper(p.suggestedPaper || '');
    setFormHasWaxSeal(!!p.hasWaxSeal);
    setFormHasSilkRibbon(!!p.hasSilkRibbon);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        category: formCategory,
        description: formDescription,
        basePrice: Number(formBasePrice),
        unit: formUnit,
        estimatedMinutesPerUnit: Number(formEstimatedMinutes),
        materialCostPerUnit: Number(formMaterialCost),
        printCostPerUnit: Number(formPrintCost),
        suggestedPaper: formSuggestedPaper,
        hasWaxSeal: formHasWaxSeal,
        hasSilkRibbon: formHasSilkRibbon,
      });
    } else {
      addProduct({
        name: formName,
        category: formCategory,
        description: formDescription,
        basePrice: Number(formBasePrice),
        unit: formUnit,
        estimatedMinutesPerUnit: Number(formEstimatedMinutes),
        materialCostPerUnit: Number(formMaterialCost),
        printCostPerUnit: Number(formPrintCost),
        suggestedPaper: formSuggestedPaper,
        hasWaxSeal: formHasWaxSeal,
        hasSilkRibbon: formHasSilkRibbon,
      });
    }
    setIsModalOpen(false);
  };

  // Categories definition
  const categoriesList: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Tutti gli Articoli', count: products.length },
    { id: 'partecipazioni', label: 'Partecipazioni & Inviti', count: products.filter(p => p.category === 'partecipazioni').length },
    { id: 'buste', label: 'Buste & Liner Artigianali', count: products.filter(p => p.category === 'buste').length },
    { id: 'sigilli', label: 'Sigilli in Ceralacca', count: products.filter(p => p.category === 'sigilli').length },
    { id: 'nastri', label: 'Nastri in Seta', count: products.filter(p => p.category === 'nastri').length },
    { id: 'menu', label: 'Menu Ricevimento', count: products.filter(p => p.category === 'menu').length },
    { id: 'libretti', label: 'Libretti Cerimonia', count: products.filter(p => p.category === 'libretti').length },
    { id: 'tableau', label: 'Tableau & Escort Cards', count: products.filter(p => p.category === 'tableau').length },
    { id: 'accessori_packaging', label: 'Dettagli, Calligrafia & Servizi', count: products.filter(p => p.category === 'accessori_packaging' || p.category === 'servizi_grafici').length },
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.suggestedPaper && p.suggestedPaper.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' 
        ? true 
        : selectedCategory === 'accessori_packaging'
          ? (p.category === 'accessori_packaging' || p.category === 'servizi_grafici')
          : p.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Aggregate Metrics
  const avgPrice = products.length > 0 
    ? products.reduce((acc, p) => acc + p.basePrice, 0) / products.length 
    : 0;

  const totalMarginPercent = products.length > 0
    ? products.reduce((acc, p) => {
        const totalCost = (p.materialCostPerUnit || 0) + (p.printCostPerUnit || 0);
        const margin = p.basePrice > 0 ? ((p.basePrice - totalCost) / p.basePrice) * 100 : 0;
        return acc + margin;
      }, 0) / products.length
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D7] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2ED] text-[#5B7B63] text-xs font-semibold tracking-wide">
              <span>🌿 Listino & Catalogo Ufficiale</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#26332A] tracking-tight">
              Listino Prodotti & Prezzi Atelier
            </h1>
            <p className="text-sm text-[#68766B] max-w-2xl leading-relaxed">
              Definisci i prezzi al pubblico per partecipazioni su misura, buste foderate, sigilli in ceralacca, nastri in seta e servizi calligrafici. Utilizza questo listino per elaborare preventivi accurati in tempo reale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('preventivi')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#D5E0D8] text-[#5B7B63] hover:bg-[#F2F7F4] text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Vai a Elabora Preventivo</span>
            </button>

            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold shadow-sm shadow-[#5B7B63]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Prodotto / Servizio</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E8E2D7]">
          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Articoli a Listino</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">{products.length}</div>
            <span className="text-[11px] text-[#5B7B63] font-medium mt-0.5 block">Sincronizzati online</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Prezzo Medio Unitario</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">€ {avgPrice.toFixed(2)}</div>
            <span className="text-[11px] text-[#7D8B80] block mt-0.5">Media prodotti & set</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Margine Medio Atelier</span>
            <div className="text-2xl font-bold text-[#5B7B63] mt-1">{totalMarginPercent.toFixed(1)}%</div>
            <span className="text-[11px] text-[#5B7B63] block mt-0.5">Su costi vivi materiali</span>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EDE8E0]">
            <span className="text-[11px] font-semibold text-[#7D8B80] uppercase tracking-wider block">Finiture Artigianali</span>
            <div className="text-2xl font-bold text-[#26332A] mt-1">
              {products.filter(p => p.hasWaxSeal || p.hasSilkRibbon).length}
            </div>
            <span className="text-[11px] text-[#7D8B80] block mt-0.5">Con ceralacca o seta pura</span>
          </div>
        </div>
      </div>

      {/* Search and Categories Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#7D8B80] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per nome, codice (es. PRD-PAR-01), carta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD4] focus:border-[#5B7B63] focus:ring-1 focus:ring-[#5B7B63] text-xs font-medium text-[#26332A] placeholder-[#9E9385] outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9385] hover:text-[#26332A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#7D8B80] font-medium self-center">
            Visualizzati <strong className="text-[#26332A]">{filteredProducts.length}</strong> di {products.length} articoli
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#5B7B63] text-[#FFFFFF] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#68766B] border border-[#E8E2D7] hover:bg-[#F7F5F0] hover:text-[#26332A]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#FFFFFF]/25 text-white' : 'bg-[#EFECE5] text-[#7D8B80]'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F5F2] text-[#5B7B63] flex items-center justify-center mx-auto text-2xl">
            📦
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-base text-[#26332A]">Nessun articolo trovato</h3>
            <p className="text-xs text-[#7D8B80] mt-1 leading-relaxed">
              Nessun prodotto corrisponde ai criteri di ricerca attuali. Prova a modificare i filtri o aggiungi un nuovo prodotto al listino.
            </p>
          </div>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#5B7B63] text-white text-xs font-bold hover:bg-[#4A6750] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Nuovo Prodotto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const totalCost = (p.materialCostPerUnit || 0) + (p.printCostPerUnit || 0);
            const netMargin = p.basePrice - totalCost;
            const marginPercent = p.basePrice > 0 ? (netMargin / p.basePrice) * 100 : 0;

            return (
              <div
                key={p.id}
                className="bg-[#FFFFFF] border border-[#E8E2D7] hover:border-[#C5D6C9] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {/* Header card info */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EBF2ED] text-[#5B7B63] text-[10px] font-bold tracking-wider uppercase">
                        {p.code}
                      </span>
                      <span className="text-[11px] text-[#7D8B80] capitalize font-medium">
                        {p.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-xl text-[#7D8B80] hover:text-[#5B7B63] hover:bg-[#F2F7F4] transition-colors cursor-pointer"
                        title="Modifica Prodotto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Sei sicuro di voler eliminare "${p.name}" dal listino?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-[#7D8B80] hover:text-[#B57C68] hover:bg-[#FBF2EF] transition-colors cursor-pointer"
                        title="Elimina Prodotto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-sm text-[#26332A] mt-2.5 leading-snug group-hover:text-[#5B7B63] transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#68766B] mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Badges / Specs */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {p.suggestedPaper && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#5E6D62] border border-[#EAE5DC]">
                        📄 {p.suggestedPaper}
                      </span>
                    )}
                    {p.hasWaxSeal && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#EBF2ED] text-[#5B7B63]">
                        🕯️ Ceralacca
                      </span>
                    )}
                    {p.hasSilkRibbon && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#F5F2EB] text-[#7A6C58]">
                        🎀 Nastro Seta
                      </span>
                    )}
                    {p.estimatedMinutesPerUnit > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#7D8B80] border border-[#EAE5DC] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {p.estimatedMinutesPerUnit} min/{p.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Footer Actions */}
                <div className="mt-5 pt-4 border-t border-[#F2ECE3]">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8C9B90] uppercase tracking-wider block">
                        Prezzo Listino
                      </span>
                      <div className="text-xl font-bold text-[#26332A] tracking-tight">
                        € {p.basePrice.toFixed(2)}
                        <span className="text-xs font-normal text-[#7D8B80] ml-1">/{p.unit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-[#8C9B90] uppercase tracking-wider block">
                        Margine Stima
                      </span>
                      <div className="text-xs font-bold text-[#5B7B63]">
                        € {netMargin.toFixed(2)} ({marginPercent.toFixed(0)}%)
                      </div>
                    </div>
                  </div>

                  {/* Action: Use in Quote */}
                  <button
                    onClick={() => {
                      if (onSelectForQuote) {
                        onSelectForQuote(p);
                      } else {
                        setActiveView('preventivi');
                      }
                    }}
                    className="w-full mt-3 py-2 px-3 rounded-2xl bg-[#F0F5F2] hover:bg-[#5B7B63] text-[#5B7B63] hover:text-[#FFFFFF] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                  >
                    <span>Usa in Preventivo</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuovo / Modifica Prodotto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#26332A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold">
                  🌿
                </div>
                <div>
                  <h2 className="font-bold text-base text-[#26332A]">
                    {editingProduct ? 'Modifica Articolo Listino' : 'Nuovo Articolo a Listino'}
                  </h2>
                  <p className="text-[11px] text-[#7D8B80]">
                    Configura nome, descrizione, prezzo al pubblico e dettagli di produzione
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full text-[#7D8B80] hover:text-[#26332A] hover:bg-[#F5F2EB] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-[#26332A] mb-1">
                  Nome Articolo o Servizio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Partecipazione Amalfi con Impressione a Caldo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none transition-all"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#26332A] mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CatalogProductCategory)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none transition-all cursor-pointer"
                  >
                    <option value="partecipazioni">Partecipazioni & Inviti</option>
                    <option value="buste">Buste & Liner Artigianali</option>
                    <option value="sigilli">Sigilli in Ceralacca</option>
                    <option value="nastri">Nastri in Seta</option>
                    <option value="menu">Menu Cerimonia</option>
                    <option value="libretti">Libretti Messa & Cerimonia</option>
                    <option value="tableau">Tableau & Escort Cards</option>
                    <option value="ringraziamenti">Ringraziamenti & Bomboniere</option>
                    <option value="accessori_packaging">Accessori & Packaging</option>
                    <option value="servizi_grafici">Servizi Grafici & Calligrafia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26332A] mb-1">
                    Unità di Misura
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none transition-all cursor-pointer"
                  >
                    <option value="pz">Pezzi (pz)</option>
                    <option value="set">Set coordinato</option>
                    <option value="m">Metri lineari (m)</option>
                    <option value="forfait">Forfait progetto</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#26332A] mb-1">
                  Descrizione & Finiture Prodotto
                </label>
                <textarea
                  rows={2}
                  placeholder="Specifiche tecniche, formato, tipo di lavorazione artigianale..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none transition-all resize-none"
                />
              </div>

              {/* Suggested Paper */}
              <div>
                <label className="block text-xs font-bold text-[#26332A] mb-1">
                  Supporto Cartaceo Consigliato
                </label>
                <input
                  type="text"
                  placeholder="es. Carta Cotone Amalfi 340g / Fedrigoni Materica 360g"
                  value={formSuggestedPaper}
                  onChange={(e) => setFormSuggestedPaper(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] focus:border-[#5B7B63] focus:bg-[#FFFFFF] text-xs font-medium text-[#26332A] outline-none transition-all"
                />
              </div>

              {/* Price & Costs Card */}
              <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#EAE5DC] space-y-3">
                <div className="text-xs font-bold text-[#26332A] flex items-center justify-between">
                  <span>Prezzo di Listino e Analisi Costi Vivi</span>
                  <span className="text-[11px] font-semibold text-[#5B7B63]">
                    Margine: € {(formBasePrice - (formMaterialCost + formPrintCost)).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#68766B] mb-1">
                      Prezzo al Pubblico (€) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      required
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E0D8CB] focus:border-[#5B7B63] text-xs font-bold text-[#26332A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#68766B] mb-1">
                      Costo Materiale (€)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formMaterialCost}
                      onChange={(e) => setFormMaterialCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E0D8CB] focus:border-[#5B7B63] text-xs font-medium text-[#26332A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#68766B] mb-1">
                      Costo Stampa / Lavoro (€)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formPrintCost}
                      onChange={(e) => setFormPrintCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E0D8CB] focus:border-[#5B7B63] text-xs font-medium text-[#26332A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#68766B] mb-1">
                    Minuti di Lavorazione Stimati per Unità
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formEstimatedMinutes}
                    onChange={(e) => setFormEstimatedMinutes(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E0D8CB] focus:border-[#5B7B63] text-xs font-medium text-[#26332A] outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHasWaxSeal}
                    onChange={(e) => setFormHasWaxSeal(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B7B63] focus:ring-[#5B7B63] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#26332A]">Richiede Sigillo Ceralacca</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHasSilkRibbon}
                    onChange={(e) => setFormHasSilkRibbon(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B7B63] focus:ring-[#5B7B63] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#26332A]">Richiede Nastro in Seta</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFECE6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D7] text-[#68766B] hover:bg-[#FAF8F5] text-xs font-bold transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#5B7B63] hover:bg-[#4A6750] text-[#FFFFFF] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingProduct ? 'Salva Modifiche' : 'Aggiungi al Listino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
