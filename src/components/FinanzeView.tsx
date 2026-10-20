import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Euro, 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Calendar, 
  Trash2, 
  FileSpreadsheet,
  Wallet,
  Receipt
} from 'lucide-react';
import { StudioExpense } from '../types';

interface FinanzeViewProps {
  onOpenProjectDetail: (projectId: string) => void;
  onOpenNewExpense: () => void;
}

export const FinanzeView: React.FC<FinanzeViewProps> = ({
  onOpenProjectDetail,
  onOpenNewExpense,
}) => {
  const { projects, studioExpenses, addStudioExpense, deleteStudioExpense } = useApp();

  const [activeTab, setActiveTab] = useState<'bilancio_annuo' | 'consuntivo_progetti' | 'spese_studio'>('bilancio_annuo');

  // New Expense form
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<StudioExpense['category']>('materiali_scorta');
  const [expenseRecurring, setExpenseRecurring] = useState(false);

  // Annual Totals Calculation
  const totalAgreedRevenue = projects.reduce((acc, p) => acc + p.financials.agreedPrice, 0);
  const totalCollectedDeposits = projects.reduce((acc, p) => acc + p.financials.depositPaid + p.financials.balancePaid, 0);
  const totalOutstandingReceivables = totalAgreedRevenue - totalCollectedDeposits;

  const totalProjectDirectCosts = projects.reduce((acc, p) => 
    acc + p.financials.actualMaterialCost + p.financials.actualPrintCost + (p.financials.shippingCost || p.financials.actualShippingCost || 0) + p.financials.otherExpenses, 0
  );

  const totalStudioOverheads = studioExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAllCosts = totalProjectDirectCosts + totalStudioOverheads;
  const netAnnualProfit = totalAgreedRevenue - totalAllCosts;
  const netProfitMargin = Math.round((netAnnualProfit / (totalAgreedRevenue || 1)) * 100);

  // Monthly Simulation for Wedding Seasonality (Jan - Dec)
  const monthlyData = [
    { month: 'Gen', revenue: 850, expenses: 620 },
    { month: 'Feb', revenue: 1400, expenses: 750 },
    { month: 'Mar', revenue: 2200, expenses: 980 },
    { month: 'Apr', revenue: 3100, expenses: 1400 },
    { month: 'Mag', revenue: 4800, expenses: 1850 }, // Wedding peak
    { month: 'Giu', revenue: 5400, expenses: 2100 }, // Wedding peak
    { month: 'Lug', revenue: 4200, expenses: 1650 },
    { month: 'Ago', revenue: 1900, expenses: 850 },
    { month: 'Set', revenue: 4900, expenses: 1900 }, // Autumn wedding peak
    { month: 'Ott', revenue: 3600, expenses: 1350 },
    { month: 'Nov', revenue: 1200, expenses: 780 },
    { month: 'Dic', revenue: 1600, expenses: 900 },
  ];

  const maxMonthRev = Math.max(...monthlyData.map(m => m.revenue));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || expenseAmount <= 0) return;

    addStudioExpense({
      date: new Date().toISOString().split('T')[0],
      description: expenseDesc,
      category: expenseCategory,
      amount: expenseAmount,
      recurring: expenseRecurring,
    });

    setIsAddingExpense(false);
    setExpenseDesc('');
    setExpenseAmount(0);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E7DFD5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C7D6F] font-medium mb-1">
            <span>Controllo di Gestione & Marginalità Atelier</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#231F1C]">
            Finanze, Consuntivi & Bilancio Annuo
          </h1>
          <p className="text-sm text-[#665B51] mt-1 font-light max-w-2xl">
            Monitora l'andamento economico delle singole suite nuziali, i costi reali vivi di produzione e la redditività annuale dell'atelier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingExpense(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#3B342F] text-[#FAF8F5] rounded hover:bg-[#25201C] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuova Spesa Studio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-5 rounded border border-[#E2D9CD] shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#8A7E73] font-medium block mb-1">
            Fatturato Annuo Progetti
          </span>
          <div className="font-serif text-3xl text-[#231F1C]">
            € {totalAgreedRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-[#5B7B61] mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Già incassato: € {totalCollectedDeposits.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded border border-[#E2D9CD] shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#8A7E73] font-medium block mb-1">
            Crediti da Incassare (Saldi Sposi)
          </span>
          <div className="font-serif text-3xl text-[#C28C48]">
            € {totalOutstandingReceivables.toFixed(2)}
          </div>
          <div className="text-xs text-[#7B7065] mt-2">
            Da riscuotere prima della consegna finale
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded border border-[#E2D9CD] shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#8A7E73] font-medium block mb-1">
            Spese Complessive (Vive + Fisse)
          </span>
          <div className="font-serif text-3xl text-[#A64536]">
            € {totalAllCosts.toFixed(2)}
          </div>
          <div className="text-xs text-[#7B7065] mt-2">
            Materiali: €{totalProjectDirectCosts} · Studio: €{totalStudioOverheads}
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded border border-[#E2D9CD] shadow-xs">
          <span className="text-xs uppercase tracking-wider text-[#8A7E73] font-medium block mb-1">
            Utile Netto Annuale
          </span>
          <div className="font-serif text-3xl text-[#5B7B61]">
            € {netAnnualProfit.toFixed(2)}
          </div>
          <div className="text-xs text-[#5B7B61] mt-2 font-semibold">
            Margine Medio Netto: {netProfitMargin}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E7DFD5] space-x-4">
        {[
          { id: 'bilancio_annuo', label: 'Bilancio Annuo & Stagionalità Matrimoni' },
          { id: 'consuntivo_progetti', label: 'Consuntivo & Bilancino Singoli Progetti' },
          { id: 'spese_studio', label: `Registro Spese Studio (${studioExpenses.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === t.id 
                ? 'border-[#38322D] text-[#231F1C] font-semibold' 
                : 'border-transparent text-[#7F7265] hover:text-[#231F1C]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BILANCIO ANNUO & STAGIONALITA */}
      {activeTab === 'bilancio_annuo' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#DFD6C9] rounded p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <div>
                <h3 className="font-serif text-xl text-[#231F1C]">
                  Curva di Fatturato Mensile & Stagionalità Matrimoni 2026
                </h3>
                <p className="text-xs text-[#7B7065] mt-0.5">
                  Evidenziazione dei mesi di picco (Maggio-Ottobre) per prevedere cashflow e acquisti anticipati di materie prime.
                </p>
              </div>
              <span className="text-xs font-mono text-[#5B7B61] font-semibold">
                Stagione 2026
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4">
              <div className="h-56 flex items-end gap-2 sm:gap-4 justify-between border-b border-[#E7DFD5] pb-2">
                {monthlyData.map((d) => {
                  const revHeight = Math.round((d.revenue / maxMonthRev) * 100);
                  const isPeak = d.month === 'Mag' || d.month === 'Giu' || d.month === 'Set';

                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[#231F1C] text-[#FAF8F5] text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                        <div>Entrate: €{d.revenue}</div>
                        <div>Spese: €{d.expenses}</div>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Revenue Bar */}
                        <div 
                          className={`w-full max-w-[28px] rounded-t transition-all ${
                            isPeak ? 'bg-[#5B7B61]' : 'bg-[#C28C48]/70 hover:bg-[#C28C48]'
                          }`}
                          style={{ height: `${revHeight}%` }}
                        />
                      </div>

                      <span className={`text-[11px] font-medium mt-1 ${isPeak ? 'text-[#5B7B61] font-bold' : 'text-[#7B7065]'}`}>
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 text-xs text-[#7A6E62]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#5B7B61] rounded-xs" />
                    <span>Mesi di Alta Stagione Matrimoni</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#C28C48]/70 rounded-xs" />
                    <span>Altri Mesi Lavorativi</span>
                  </div>
                </div>
                <span className="italic text-[11px]">Dati previsionali su storico atelier</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONSUNTIVO SINGOLI PROGETTI */}
      {activeTab === 'consuntivo_progetti' && (
        <div className="bg-[#FFFFFF] border border-[#DFD6C9] rounded shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#DFD6C9] text-[#7A6E63] uppercase tracking-wider font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Progetto & Sposi</th>
                <th className="py-3 px-4 text-right">Preventivo</th>
                <th className="py-3 px-4 text-right">Incassato</th>
                <th className="py-3 px-4 text-right">Spese Vive Reali</th>
                <th className="py-3 px-4 text-right">Utile Netto</th>
                <th className="py-3 px-4 text-right">Margine %</th>
                <th className="py-3 px-4 text-center">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE3]">
              {projects.map((p) => {
                const costs = p.financials.actualMaterialCost + p.financials.actualPrintCost + (p.financials.shippingCost || p.financials.actualShippingCost || 0) + p.financials.otherExpenses;
                const net = p.financials.agreedPrice - costs;
                const margin = Math.round((net / (p.financials.agreedPrice || 1)) * 100);

                return (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#231F1C]">{p.title}</div>
                      <div className="text-[11px] text-[#706457]">{p.code} · {p.clientName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#231F1C]">
                      € {p.financials.agreedPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#5B7B61]">
                      € {(p.financials.depositPaid + p.financials.balancePaid).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#A64536]">
                      € {costs.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#5B7B61]">
                      € {net.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        margin >= 60 ? 'bg-[#EAF3EB] text-[#3E6547]' : 'bg-[#FAF2E6] text-[#9E6F33]'
                      }`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenProjectDetail(p.id)}
                        className="text-[11px] text-[#584D43] hover:text-[#231F1C] hover:underline font-medium cursor-pointer"
                      >
                        Modifica Bilancino
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SPESE STUDIO */}
      {activeTab === 'spese_studio' && (
        <div className="space-y-4">
          {/* Add Expense Modal or Inline Form */}
          {isAddingExpense && (
            <form onSubmit={handleAddExpense} className="bg-[#FFFFFF] p-5 rounded border border-[#DFD6C9] space-y-3 text-xs shadow-sm">
              <h4 className="font-serif text-base text-[#231F1C] border-b border-[#F0EAE1] pb-2">
                Registra Nuova Spesa / Uscita Atelier
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#6F6355] font-medium mb-1">Descrizione Spesa</label>
                  <input
                    type="text"
                    placeholder="es. Acquisto 500 fogli Amatruda o Licenza font esclusivo"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6F6355] font-medium mb-1">Importo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6F6355] font-medium mb-1">Categoria Spesa</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
                  >
                    <option value="materiali_scorta">Materiali per Magazzino & Scorte</option>
                    <option value="fisse">Costi Fissi (Affitto laboratorio, utenze)</option>
                    <option value="software">Software & Font (Adobe, Typefaces)</option>
                    <option value="marketing">Marketing & Campionari</option>
                    <option value="laboratorio">Attrezzature Laboratorio</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={expenseRecurring}
                    onChange={(e) => setExpenseRecurring(e.target.checked)}
                    className="rounded text-[#3B342F]"
                  />
                  <label htmlFor="recurring" className="text-xs text-[#524941]">Spesa fissa ricorrente mensile</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-3 py-1.5 text-xs text-[#7A6D60]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3B342F] text-[#FAF8F5] text-xs font-medium rounded hover:bg-[#25201C]"
                >
                  Registra Spesa
                </button>
              </div>
            </form>
          )}

          {/* Expenses List */}
          <div className="bg-[#FFFFFF] border border-[#DFD6C9] rounded shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#DFD6C9] text-[#7A6E63] uppercase tracking-wider font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrizione Uscita</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Importo</th>
                  <th className="py-3 px-4 text-center">Azione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {studioExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#7B7065]">{exp.date}</td>
                    <td className="py-3 px-4 font-medium text-[#231F1C]">
                      {exp.description}
                      {exp.recurring && (
                        <span className="ml-2 text-[10px] text-[#C28C48] bg-[#FAF2E6] px-1.5 py-0.2 rounded">
                          Ricorrente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#6E6154] uppercase tracking-wider text-[10px]">
                      {exp.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#A64536]">
                      - € {exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteStudioExpense(exp.id)}
                        className="text-[#B29E8D] hover:text-[#B24D3D] transition-colors"
                        title="Elimina spesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
