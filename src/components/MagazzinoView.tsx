import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Trash2, 
  Truck, 
  ShoppingBag,
  Sparkles,
  Clock,
  Check,
  Calendar,
  Building,
  ArrowRight,
  FileText,
  Boxes
} from 'lucide-react';
import { InventoryItem, SupplierOrder } from '../types';

export const MagazzinoView: React.FC = () => {
  const { 
    inventory, 
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
    todayDate
  } = useApp();

  const [activeTab, setActiveTab] = useState<'giacenze' | 'ordini_fornitori'>('giacenze');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [justGeneratedOrders, setJustGeneratedOrders] = useState(false);

  // New Item Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('carta');
  const [unit, setUnit] = useState<InventoryItem['unit']>('fogli');
  const [currentStock, setCurrentStock] = useState<number>(100);
  const [minStockAlert, setMinStockAlert] = useState<number>(50);
  const [unitCost, setUnitCost] = useState<number>(1.20);
  const [supplier, setSupplier] = useState('');
  const [colorOrVariant, setColorOrVariant] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [supplierLeadTimeDays, setSupplierLeadTimeDays] = useState<number>(4);

  // New Order Form State
  const [orderSupplier, setOrderSupplier] = useState('Cartiera Amatruda Amalfi');
  const [orderItemName, setOrderItemName] = useState('');
  const [orderQty, setOrderQty] = useState(100);
  const [orderCost, setOrderCost] = useState(150);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('2026-10-22');

  // Auto-calculated demands from active stationery projects
  const materialDemands = getCalculatedMaterialDemands();
  const shortagesCount = materialDemands.filter(d => d.shortage > 0).length;

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.colorOrVariant && item.colorOrVariant.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addInventoryItem({
      name,
      category,
      unit,
      currentStock,
      minStockAlert,
      unitCost,
      supplier,
      colorOrVariant,
      storageLocation,
      supplierLeadTimeDays,
    });

    setIsAddingItem(false);
    setName('');
    setSupplier('');
    setColorOrVariant('');
    setStorageLocation('');
  };

  const handleGenerateOrders = () => {
    generateSupplierOrderFromShortages();
    setJustGeneratedOrders(true);
    setActiveTab('ordini_fornitori');
    setTimeout(() => setJustGeneratedOrders(false), 3000);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNum = `ORD-2026-${String(supplierOrders.length + 11).padStart(3, '0')}`;
    const matchingInv = inventory.find(i => i.name.toLowerCase().includes(orderItemName.toLowerCase())) || inventory[0];

    addSupplierOrder({
      orderNumber: orderNum,
      supplierName: orderSupplier,
      orderDate: todayDate,
      expectedDeliveryDate: orderDeliveryDate,
      status: 'da_ordinare',
      items: [
        {
          inventoryItemId: matchingInv?.id || 'inv-1',
          itemName: orderItemName || matchingInv?.name || 'Materia prima',
          quantity: orderQty,
          unit: matchingInv?.unit || 'pz',
          unitCost: orderCost / (orderQty || 1),
        }
      ],
      totalCost: orderCost,
      notes: 'Ordine fornitore inserito manualmente'
    });

    setIsAddingOrder(false);
    setOrderItemName('');
  };

  const getOrderStatusConfig = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'da_ordinare':
        return { label: 'Da Ordinare', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ordinato':
        return { label: 'Inviato al Fornitore', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'spedito':
        return { label: 'Spedito con Corriere', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'ricevuto':
        return { label: 'Ricevuto in Studio (A Magazzino)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C58925]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Materie Prime, Fabbisogni & Approvvigionamenti</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E1B18] tracking-tight mt-1.5">
            Magazzino Atelier & Ordini Fornitori
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8376] mt-1 max-w-2xl font-medium leading-relaxed">
            Monitora le giacenze fisiche, verifica il consumo automatico previsto per ciascuna suite di matrimonio e genera gli ordini d'acquisto con lead time precisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {shortagesCount > 0 && (
            <button
              onClick={handleGenerateOrders}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFF3D6] to-[#FFE8B3] border border-[#F2DEB5] text-[#9A640F] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#C58925]" />
              <span>Genera Ordini da Sottoscorta ({shortagesCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingItem(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#1E1B18] hover:bg-[#332E28] active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5BF58]" />
            <span>Nuova Materia Prima</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Giacenze vs Ordini Fornitori */}
      <div className="flex items-center space-x-2 border-b border-[#EFECE5] pb-2">
        <button
          onClick={() => setActiveTab('giacenze')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'giacenze'
              ? 'bg-[#1E1B18] text-white shadow-sm'
              : 'bg-[#FAF9F5] border border-[#E8E2D7] text-[#7A6F62] hover:text-[#1E1B18]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Giacenze & Consumi Suite ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ordini_fornitori')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'ordini_fornitori'
              ? 'bg-[#1E1B18] text-white shadow-sm'
              : 'bg-[#FAF9F5] border border-[#E8E2D7] text-[#7A6F62] hover:text-[#1E1B18]'
          }`}
        >
          <Truck className="w-4 h-4 text-[#C58925]" />
          <span>Ordini Fornitori & Ricevimento Merci ({supplierOrders.length})</span>
          {shortagesCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E06A5F] absolute -top-1 -right-1" />
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: GIACENZE & CONSUMI
          ======================================================== */}
      {activeTab === 'giacenze' && (
        <div className="space-y-6">
          {/* Sottoscorta alert banner */}
          {materialDemands.some(d => d.shortage > 0) && (
            <div className="p-5 rounded-3xl bg-[#FFF9EE] border border-[#F5DEB3] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9A640F] font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Fabbisogno Lavorazioni Superiore alla Giacenza Attuale</span>
                </div>
                <button
                  onClick={handleGenerateOrders}
                  className="text-xs font-bold text-[#9A640F] underline hover:text-[#6E4405] cursor-pointer"
                >
                  Crea Lista Acquisti Subito →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {materialDemands.filter(d => d.shortage > 0).map(d => (
                  <div key={d.itemId} className="p-3.5 bg-white rounded-2xl border border-[#EFE5D0] flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-[#1E1B18]">{d.itemName}</div>
                      <div className="text-[11px] text-[#7A6F62] mt-0.5">
                        In magazzino: <strong className="text-[#1E1B18]">{d.currentStock}</strong> · Fabbisogno: <strong className="text-[#1E1B18]">{d.requiredQty}</strong>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#F5EFE0] flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#E06A5F]">
                        Deficit: {d.shortage} unità
                      </span>
                      <span className="text-[10px] text-[#8E8376]">
                        {d.involvedProjects.length} commesse coinvolte
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#EFECE5] p-3 rounded-2xl shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8D7E]" />
              <input
                type="text"
                placeholder="Cerca per carta, ceralacca, colore o cartiera (es. Amalfi, Salvia, Fedrigoni)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs text-[#2C2723] focus:outline-none focus:border-[#C58925]"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl px-3.5 py-2 text-[#3E342B] font-bold"
            >
              <option value="all">Tutte le categorie</option>
              <option value="carta">Carta Cotone & Pregiata</option>
              <option value="buste">Buste Artigianali</option>
              <option value="ceralacca">Ceralacca & Sigilli</option>
              <option value="nastri">Nastri in Pura Seta</option>
              <option value="inchiostri">Inchiostri Calligrafici</option>
              <option value="accessori">Accessori & Packaging</option>
            </select>
          </div>

          {/* Add Item Modal Form */}
          {isAddingItem && (
            <form onSubmit={handleCreateItem} className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs animate-in fade-in">
              <h3 className="font-bold text-sm text-[#1E1B18] border-b border-[#F2EEE7] pb-2">
                Aggiungi Nuova Materia Prima a Magazzino
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#6F6355] font-bold mb-1">Nome Articolo & Grammatura</label>
                  <input
                    type="text"
                    placeholder="es. Carta Cotone Amalfi 340g bordi intonsi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium"
                  >
                    <option value="carta">Carta Cotone</option>
                    <option value="buste">Buste Artigianali</option>
                    <option value="ceralacca">Ceralacca</option>
                    <option value="nastri">Nastri in Seta</option>
                    <option value="inchiostri">Inchiostri</option>
                    <option value="accessori">Packaging / Scatole</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Unità di Misura</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                  >
                    <option value="fogli">Fogli</option>
                    <option value="pezzi">Pezzi</option>
                    <option value="metri">Metri</option>
                    <option value="grammi">Grammi</option>
                    <option value="boccette">Boccette</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Giacenza Attuale</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Soglia Minima Allerta</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Costo Unitario (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Fornitore / Cartiera</label>
                  <input
                    type="text"
                    placeholder="es. Cartiera Amatruda Amalfi"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Colore / Variante</label>
                  <input
                    type="text"
                    placeholder="es. Salvia Chiaro Perlato"
                    value={colorOrVariant}
                    onChange={(e) => setColorOrVariant(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Lead Time Consegna (Giorni)</label>
                  <input
                    type="number"
                    value={supplierLeadTimeDays}
                    onChange={(e) => setSupplierLeadTimeDays(parseInt(e.target.value) || 4)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 text-xs text-[#8E8376] hover:text-[#1E1B18]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E1B18] text-white font-bold text-xs rounded-xl"
                >
                  Salva Articolo
                </button>
              </div>
            </form>
          )}

          {/* Inventory Table */}
          <div className="bg-[#FFFFFF] border border-[#EFECE5] rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] border-b border-[#EFECE5] text-[#8E8376] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-5">Articolo & Specifiche</th>
                    <th className="py-3.5 px-4">Fornitore & Lead Time</th>
                    <th className="py-3.5 px-4 text-center">Giacenza Studio</th>
                    <th className="py-3.5 px-4 text-center">Fabbisogno Lavorazioni</th>
                    <th className="py-3.5 px-4 text-center">Disponibilità Libera</th>
                    <th className="py-3.5 px-4 text-right">Costo Unit.</th>
                    <th className="py-3.5 px-5 text-center">Azioni Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE7]">
                  {filteredInventory.map((item) => {
                    const demand = materialDemands.find(d => d.itemId === item.id);
                    const requiredQty = demand?.requiredQty || 0;
                    const freeStock = item.currentStock - requiredQty;
                    const isShort = freeStock < 0 || item.currentStock <= item.minStockAlert;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-sm text-[#1E1B18]">{item.name}</div>
                          <div className="text-[11px] text-[#7A6F62] flex items-center gap-2 mt-0.5">
                            <span className="uppercase font-bold tracking-wider text-[#C58925]">{item.category}</span>
                            {item.colorOrVariant && <span>· {item.colorOrVariant}</span>}
                            {item.storageLocation && <span>· 📍 {item.storageLocation}</span>}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs text-[#52483D]">
                          <div className="font-bold text-[#1E1B18]">{item.supplier}</div>
                          <div className="text-[11px] text-[#8E8376]">
                            Consegna in ~{item.supplierLeadTimeDays || 4} giorni lavorativi
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-sm text-[#1E1B18]">
                            {item.currentStock}
                          </span>
                          <span className="text-[10px] text-[#8E8376] block">{item.unit}</span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-[#8C5815]">
                            {requiredQty > 0 ? `${requiredQty} ${item.unit}` : '—'}
                          </span>
                          {requiredQty > 0 && (
                            <span className="text-[10px] text-[#8E8376] block">impegnati per commesse</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className={`font-mono font-black text-sm ${
                            freeStock < 0 ? 'text-[#E06A5F]' : 'text-[#558260]'
                          }`}>
                            {freeStock} {item.unit}
                          </span>
                          {freeStock < 0 && (
                            <span className="text-[9px] font-bold text-white bg-[#E06A5F] px-1.5 py-0.2 rounded-md block mt-0.5">
                              SOTTOSCORTA
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-xs text-[#1E1B18]">
                          € {item.unitCost.toFixed(2)}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => adjustStock(item.id, -10)}
                              className="w-7 h-7 rounded-xl bg-[#FAF9F5] hover:bg-[#E8E2D7] border border-[#E8E2D7] text-[#1E1B18] flex items-center justify-center cursor-pointer transition-colors"
                              title="-10 unità"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => adjustStock(item.id, 10)}
                              className="w-7 h-7 rounded-xl bg-[#FAF9F5] hover:bg-[#E8E2D7] border border-[#E8E2D7] text-[#1E1B18] flex items-center justify-center cursor-pointer transition-colors"
                              title="+10 unità"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteInventoryItem(item.id)}
                              className="w-7 h-7 rounded-xl text-[#B29E8D] hover:text-[#E06A5F] hover:bg-rose-50 flex items-center justify-center transition-colors ml-1"
                              title="Elimina"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ORDINI FORNITORI & RICEVIMENTO MERCI (Points 17 & 18)
          ======================================================== */}
      {activeTab === 'ordini_fornitori' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#1E1B18]">
                Ordini d'Acquisto a Cartiere & Fornitori Artigianali
              </h3>
              <p className="text-xs text-[#8E8376] mt-0.5">
                Traccia lo stato di avanzamento: <em>Da ordinare → Ordinato → Spedito → Ricevuto</em>. Quando marchi come Ricevuto, il magazzino si aggiorna all'istante.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateOrders}
                className="px-4 py-2 bg-[#FFF3D6] hover:bg-[#FFE8B3] text-[#9A640F] font-bold text-xs rounded-xl border border-[#F2DEB5] cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Genera Ordini da Fabbisogno</span>
              </button>

              <button
                onClick={() => setIsAddingOrder(!isAddingOrder)}
                className="px-4 py-2 bg-[#1E1B18] hover:bg-[#332E28] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5BF58]" />
                <span>Nuovo Ordine Manuale</span>
              </button>
            </div>
          </div>

          {/* Add Manual Order Modal Form */}
          {isAddingOrder && (
            <form onSubmit={handleCreateManualOrder} className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-sm space-y-4 text-xs animate-in fade-in">
              <h4 className="font-bold text-sm text-[#1E1B18]">Nuovo Ordine Fornitore</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Fornitore / Cartiera</label>
                  <input
                    type="text"
                    value={orderSupplier}
                    onChange={(e) => setOrderSupplier(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Materia Prima / Articolo</label>
                  <input
                    type="text"
                    placeholder="es. 200 Buste C5 Salvia Chiaro"
                    value={orderItemName}
                    onChange={(e) => setOrderItemName(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Quantità</label>
                  <input
                    type="number"
                    value={orderQty}
                    onChange={(e) => setOrderQty(parseInt(e.target.value) || 100)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Importo Totale Ordine (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={orderCost}
                    onChange={(e) => setOrderCost(parseFloat(e.target.value) || 100)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-right"
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-bold mb-1">Consegna Prevista</label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOrder(false)}
                  className="px-4 py-2 text-xs text-[#8E8376]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E1B18] text-white font-bold text-xs rounded-xl"
                >
                  Registra Ordine
                </button>
              </div>
            </form>
          )}

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierOrders.map(order => {
              const statusCfg = getOrderStatusConfig(order.status);
              const isReceived = order.status === 'ricevuto';

              return (
                <div 
                  key={order.id}
                  className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#EFECE5] hover:border-[#DFD6C9] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#8E8376] bg-[#FAF9F5] px-2.5 py-1 rounded-xl border border-[#E8E2D7]">
                          {order.orderNumber}
                        </span>
                        <span className="font-bold text-sm text-[#1E1B18]">{order.supplierName}</span>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Order items */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E8E2D7] text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between font-medium text-[#4A4237]">
                          <span>• {it.itemName}</span>
                          <span className="font-mono font-bold text-xs text-[#1E1B18]">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Dates & tracking */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#7A6F62]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8E8376] block">Data Ordine:</span>
                        <span className="font-bold text-[#1E1B18]">{order.orderDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8E8376] block">Consegna Prevista:</span>
                        <span className="font-bold text-[#C58925]">{order.expectedDeliveryDate}</span>
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="text-[11px] text-[#558260] font-mono">
                        📦 Tracking: <strong>{order.trackingNumber}</strong>
                      </div>
                    )}
                  </div>

                  {/* Footer & Status Controls */}
                  <div className="pt-3 border-t border-[#F2EEE7] flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#8E8376] uppercase font-bold block">Totale</span>
                      <span className="font-mono font-black text-sm text-[#1E1B18]">€ {order.totalCost.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Dropdown */}
                      <select
                        value={order.status}
                        onChange={(e) => updateSupplierOrderStatus(order.id, e.target.value as any)}
                        className="text-xs bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl px-2.5 py-1.5 font-bold text-[#1E1B18] cursor-pointer"
                      >
                        <option value="da_ordinare">Da Ordinare</option>
                        <option value="ordinato">Ordinato</option>
                        <option value="spedito">Spedito</option>
                        <option value="ricevuto">Ricevuto (Aggiorna Stock)</option>
                      </select>

                      {!isReceived && (
                        <button
                          onClick={() => updateSupplierOrderStatus(order.id, 'ricevuto')}
                          className="px-3 py-1.5 rounded-xl bg-[#558260] hover:bg-[#436A4C] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Marca come Ricevuto e carica a magazzino"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Ricevuto</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteSupplierOrder(order.id)}
                        className="p-1.5 text-[#B29E8D] hover:text-[#E06A5F] rounded-lg transition-colors"
                        title="Elimina ordine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
