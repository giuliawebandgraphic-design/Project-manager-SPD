import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Printer, 
  Share2, 
  Mail, 
  CheckCircle2, 
  Calendar, 
  Euro, 
  Copy, 
  Check, 
  Sparkles, 
  Folder, 
  Lock, 
  ShieldCheck, 
  Download, 
  Loader2, 
  FileDown, 
  Clock, 
  User, 
  Phone, 
  Package
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { exportElementToPdf } from '../utils/pdfExport';
import { getTypologyConfig } from '../utils/projectTypologies';

interface SchedaClienteViewProps {
  initialProjectId?: string;
}

export const SchedaClienteView: React.FC<SchedaClienteViewProps> = ({ initialProjectId }) => {
  const { 
    projects, 
    updateProject 
  } = useApp();

  const [selectedId, setSelectedId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIBAN, setCopiedIBAN] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const project = projects.find(p => p.id === selectedId) || projects[0];
  const typology = getTypologyConfig(project?.category);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-xs text-[#7D8B80]">
        Nessun progetto disponibile per la Scheda Sposi.
      </div>
    );
  }

  const steps: { key: ProjectStatus; label: string; desc: string; icon: string }[] = [
    { key: 'lead', label: '1. Briefing', desc: 'Raccolta desideri e campionari', icon: '💍' },
    { key: 'bozza_in_corso', label: '2. Proposte Grafiche', desc: 'Bozze digitali in revisione', icon: '🎨' },
    { key: 'approvato_stampa', label: '3. Approvazione Definitiva', desc: 'Testi e layout confermati', icon: '✓' },
    { key: 'in_produzione', label: '4. Stampa & Clichè', desc: 'Tipografia e stampa a caldo', icon: '🖨️' },
    { key: 'confezionamento', label: '5. Confezionamento a Mano', desc: 'Ceralacca, nastri e assemblaggio', icon: '🕯️' },
    { key: 'consegnato', label: '6. Consegna Finale', desc: 'Spedita con corriere o ritirata', icon: '📦' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === project.status);

  const totalCost = project.financials.agreedPrice;
  const depositPaid = project.financials.depositPaid;
  const balancePaid = project.financials.balancePaid;
  const remainingBalance = Math.max(0, totalCost - depositPaid - balancePaid);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/#scheda-${project.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyIBAN = () => {
    navigator.clipboard.writeText('IT44X0326803200052445896321');
    setCopiedIBAN(true);
    setTimeout(() => setCopiedIBAN(false), 2500);
  };

  // Safe email update without window.open
  const handleSendEmailUpdate = () => {
    const subject = encodeURIComponent(`Scheda Sposi Aggiornata — ${project.clientName} (${project.code})`);
    const body = encodeURIComponent(
      `Carissimi ${project.clientName},\n\nSiamo felici di condividere con voi l'aggiornamento sullo stato di avanzamento della vostra suite nuziale firmata Sage Paper Design:\n\n• Commessa: ${project.code}\n• Fase Attuale: ${project.status.replace('_', ' ').toUpperCase()}\n• Avanzamento: ${project.currentStepProgress}%\n• Data Nozze: ${new Date(project.eventDate).toLocaleDateString('it-IT')}\n• Consegna concordata: ${new Date(project.targetDeliveryDate).toLocaleDateString('it-IT')}\n• Totale Concordato: € ${totalCost.toFixed(2)}\n• Acconto Versato: € ${depositPaid.toFixed(2)}\n• Saldo Residuo: € ${remainingBalance.toFixed(2)}\n\nIn allegato trovate la Scheda Sposi ufficiale in formato PDF per verificare ogni singolo dettaglio della fornitura e i campioni scelti.\n\nRestiamo a vostra completa disposizione,\nAtelier Sage Paper Design\nsagepaperdesign@gmail.com`
    );
    window.location.href = `mailto:${project.clientEmail || ''}?subject=${subject}&body=${body}`;
  };

  // High-resolution PDF export for Scheda Sposi
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setExportSuccessMessage(null);
    try {
      const safeName = (project.clientName || 'Sposi').replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf({
        elementId: 'printable-scheda-sposi',
        filename: `Scheda_Sposi_${project.code}_${safeName}.pdf`,
      });
      setExportSuccessMessage(`Scheda PDF scaricata con successo per ${project.clientName}!`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Errore durante la generazione del PDF Scheda Sposi:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleFormalApproval = () => {
    const now = new Date().toLocaleString('it-IT');
    updateProject(project.id, {
      status: 'approvato_stampa',
      currentStepProgress: 60,
      formalApproval: {
        approvedAt: now,
        approvedBy: project.clientName,
        versionNumber: (project.revisions?.length || 1),
        isFrozen: true,
        signatureOrConfirmation: `Approvazione digitale formalizzata da ${project.clientName} in data ${now}`
      }
    });
    setShowApprovalModal(false);
  };

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200 text-[#26332A]">
      
      {/* Top Controls Bar - Project Switcher & Actions in Sage Green and Warm Beige */}
      <div className="no-print p-6 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D7] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B7B63]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scheda Sposi & Documento di Commessa Atelier</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#26332A] mt-1">
              Scheda Cliente Ufficiale — {project.clientName}
            </h2>
            <p className="text-xs text-[#68766B] mt-0.5 font-medium">
              Esporta in PDF con impaginazione sartoriale o invia via email agli sposi per condividere stato della lavorazione, dettagli della suite e coordinate per il saldo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Action: Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#5B7B63] hover:bg-[#4A6750] disabled:bg-[#9BB4A2] rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              title="Esporta Scheda Sposi in PDF ad alta risoluzione"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generazione PDF in corso...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Scarica Scheda PDF</span>
                </>
              )}
            </button>

            {/* Email notification */}
            <button
              onClick={handleSendEmailUpdate}
              className="px-4 py-2.5 text-xs font-bold text-[#4A6750] bg-[#EBF2ED] hover:bg-[#D8E6DB] border border-[#C5D8C9] rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Prepara email per gli sposi con riepilogo commessa"
            >
              <Mail className="w-4 h-4 text-[#5B7B63]" />
              <span>Invia per Email</span>
            </button>

            {/* Copy share link */}
            <button
              onClick={handleCopyPortalLink}
              className="px-4 py-2.5 text-xs font-bold text-[#26332A] bg-[#FAF8F5] border border-[#E8E2D7] hover:bg-[#F2ECE3] rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Copia link della scheda cliente per gli sposi"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#5B7B63]" /> : <Share2 className="w-4 h-4 text-[#5B7B63]" />}
              <span>{copiedLink ? 'Link Copiato!' : 'Copia Link Sposi'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 text-xs font-bold text-[#68766B] bg-[#FFFFFF] border border-[#E8E2D7] hover:bg-[#FAF8F5] rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Stampa su carta o tramite driver di stampa"
            >
              <Printer className="w-4 h-4 text-[#7D8B80]" />
              <span>Stampa</span>
            </button>
          </div>
        </div>

        {/* Success Feedback banner */}
        {exportSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-[#EBF2ED] border border-[#C5D8C9] text-xs font-semibold text-[#4A6750] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#5B7B63] shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Project Selector Pills */}
        <div className="pt-3 border-t border-[#EDE8E0] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-[#7D8B80] whitespace-nowrap mr-1">Seleziona Commessa:</span>
          {projects.map((p) => {
            const isSelected = p.id === selectedId;
            const pTypology = getTypologyConfig(p.category);

            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border shadow-2xs ${
                  isSelected
                    ? 'ring-2'
                    : 'bg-[#FAF8F5] border-[#E8E2D7] text-[#68766B] hover:bg-[#F2ECE3]'
                }`}
                style={{
                  backgroundColor: isSelected ? pTypology.bgHex : undefined,
                  borderColor: isSelected ? pTypology.colorHex : undefined,
                  color: isSelected ? pTypology.textHex : undefined,
                  outlineColor: isSelected ? pTypology.colorHex : undefined
                }}
              >
                <span>{pTypology.icon}</span>
                <span>{p.clientName}</span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : pTypology.bgHex,
                    color: pTypology.textHex
                  }}
                >
                  {p.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          THE HAUTE-COUTURE PRINTABLE SCHEDA SPOSI CARD
          (Verde Salvia, Beige Caldo, Bianco Puro — Nessun nero, nessun giallo)
          ======================================================== */}
      <div 
        id="printable-scheda-sposi"
        className="print-card bg-[#FFFFFF] border border-[#E8E2D7] rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        
        {/* Subtle decorative corner accent in soft sage tint */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#EBF2ED] via-[#F5F8F6] to-transparent pointer-events-none rounded-bl-full" />

        {/* Studio Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#EAE5DC] pb-6 gap-4 relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold text-xl shadow-2xs">
                🌿
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#26332A] tracking-wider uppercase">
                  SAGE PAPER DESIGN
                </h1>
                <div className="text-xs uppercase tracking-widest text-[#7D8B80] mt-0.5 font-semibold">
                  Atelier di Cancelleria Artigianale & Wedding Stationery — Firenze
                </div>
              </div>
            </div>
            <div className="text-xs text-[#7D8B80] mt-3">
              Via dell'Artigianato Elegante • Firenze, Italia • Email: sagepaperdesign@gmail.com
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#68766B] space-y-1 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE8E0] sm:bg-transparent sm:p-0 sm:border-none">
            <div className="flex items-center sm:justify-end gap-1.5 font-bold uppercase tracking-wider text-[11px]" style={{ color: typology.colorHex }}>
              <span>{typology.icon}</span>
              <span>Scheda Commessa — {typology.label}</span>
            </div>
            <div>Codice Identificativo: <strong className="font-mono text-sm px-2 py-0.5 rounded-md border" style={{ backgroundColor: typology.bgHex, color: typology.textHex, borderColor: typology.borderHex }}>{project.code}</strong></div>
            <div>Data Emissione Scheda: <strong>{new Date().toLocaleDateString('it-IT')}</strong></div>
            <div>Ultimo Aggiornamento: <strong>{new Date().toLocaleDateString('it-IT')}</strong></div>
          </div>
        </div>

        {/* Client & Event Hero Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6 rounded-3xl bg-[#FAF8F5] border border-[#EDE8E0]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8B80] block mb-1">
              Committenti / Sposi
            </span>
            <div className="text-xl font-bold text-[#26332A]">
              {project.clientName}
            </div>
            <div className="text-xs text-[#68766B] mt-1 space-y-0.5">
              {project.clientEmail && <div>Email: {project.clientEmail}</div>}
              {project.clientPhone && <div>Telefono: {project.clientPhone}</div>}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8B80] block mb-1">
              Data delle Nozze
            </span>
            <div className="text-xl font-bold text-[#5B7B63] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5B7B63]" />
              <span>{new Date(project.eventDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="text-xs text-[#68766B] mt-1">
              Consegna concordata con atelier: <strong className="text-[#26332A]">{new Date(project.targetDeliveryDate).toLocaleDateString('it-IT')}</strong>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D8B80] block mb-1">
              Stato della Lavorazione
            </span>
            <div className="text-xl font-bold text-[#5B7B63] uppercase">
              {project.status.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-[#68766B] mt-1">
              Progresso esecutivo stimato: <strong className="text-[#26332A]">{project.currentStepProgress}%</strong>
            </div>
          </div>
        </div>

        {/* FORMAL APPROVAL STATUS BANNER */}
        {project.formalApproval?.isFrozen ? (
          <div className="p-6 rounded-3xl bg-[#EBF2ED] border border-[#C5D8C9] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#5B7B63] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#4A6750] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Bozza Grafica Congelata & Approvata per Produzione
                  </div>
                  <h4 className="text-base font-bold text-[#26332A] mt-0.5">
                    Versione Definitiva n.{project.formalApproval.versionNumber} Convalidata dagli Sposi
                  </h4>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-[#68766B]">
                <div>Approvata formalmente da: <strong className="text-[#26332A]">{project.formalApproval.approvedBy}</strong></div>
                <div>Data convalida: <strong className="font-mono text-[#26332A]">{project.formalApproval.approvedAt}</strong></div>
              </div>
            </div>
            <p className="text-xs text-[#4A6750] leading-relaxed pt-2 border-t border-[#D5E0D8]">
              I file esecutivi di stampa sono stati congelati per l'incisione dei clichè e il taglio sartoriale delle carte cotone. La commessa procede secondo il calendario concordato.
            </p>
          </div>
        ) : (
          <div className="no-print p-6 rounded-3xl bg-[#FAF8F5] border border-[#EDE8E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5B7B63] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Convalida Esecutivi di Stampa Sposi
              </div>
              <h4 className="text-base font-bold text-[#26332A]">
                Convalida della Bozza Definitiva
              </h4>
              <p className="text-xs text-[#68766B]">
                Confermando i testi, l'impaginazione e la palette colori, l'atelier potrà avviare la tipografia e la nobilitazione a caldo.
              </p>
            </div>
            <button
              onClick={() => setShowApprovalModal(true)}
              className="px-5 py-2.5 bg-[#5B7B63] hover:bg-[#4A6750] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer flex items-center gap-2 shrink-0 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Approva Questa Versione</span>
            </button>
          </div>
        )}

        {/* Step-by-Step Progress Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#EDE8E0] pb-2">
            <h3 className="text-sm font-bold text-[#26332A] uppercase tracking-wider">
              Timeline delle Fasi di Creazione Atelier
            </h3>
            <span className="text-xs text-[#7D8B80]">Stato avanzamento commessa</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {steps.map((st, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div 
                  key={st.key}
                  className={`p-3.5 rounded-2xl border text-center text-xs space-y-1 transition-all ${
                    isCurrent 
                      ? 'bg-[#EBF2ED] border-[#5B7B63] ring-1 ring-[#5B7B63] shadow-xs' 
                      : isPast 
                        ? 'bg-[#FFFFFF] border-[#D5E0D8]' 
                        : 'bg-[#FAF8F5] border-[#EDE8E0] opacity-60'
                  }`}
                >
                  <div className="text-lg">{st.icon}</div>
                  <div className={`font-bold text-xs ${isCurrent ? 'text-[#5B7B63]' : 'text-[#26332A]'}`}>
                    {st.label}
                  </div>
                  <div className="text-[10px] text-[#7D8B80] line-clamp-2 leading-tight">
                    {st.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Elements Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#EDE8E0] pb-2">
            <h3 className="text-sm font-bold text-[#26332A] uppercase tracking-wider">
              Elementi della Suite Nuziale & Finiture Artigianali
            </h3>
            <span className="text-xs text-[#7D8B80]">{project.suiteItems.length} articoli inclusi</span>
          </div>

          <div className="border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE8E0] text-[#68766B] uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Elemento & Specifiche Tecniche</th>
                  <th className="py-3 px-4 text-center w-24">Quantità</th>
                  <th className="py-3 px-4 text-right w-28">Prezzo Unit.</th>
                  <th className="py-3 px-4 text-right w-28">Totale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {project.suiteItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-[#26332A]">{item.name}</div>
                      <div className="text-xs text-[#7D8B80] mt-0.5">{item.specifications}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-[#26332A] font-mono">
                      {item.quantity} pz
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-[#68766B]">
                      € {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#5B7B63]">
                      € {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Palette Swatches */}
        {project.colorPalette && project.colorPalette.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
            <span className="font-bold text-[#26332A]">Palette Cromatica Ufficiale della Suite:</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {project.colorPalette.map((col, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#EDE8E0]">
                  <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: col }} />
                  <span className="font-mono text-xs font-bold text-[#26332A]">{col}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Transparency Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Bank coordinates */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#26332A]">Coordinate Bancarie per Saldo Commessa</h4>
              <button
                onClick={handleCopyIBAN}
                className="text-xs font-bold text-[#5B7B63] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedIBAN ? <Check className="w-3.5 h-3.5 text-[#5B7B63]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIBAN ? 'IBAN Copiato!' : 'Copia IBAN'}</span>
              </button>
            </div>

            <div className="text-xs text-[#68766B] space-y-1">
              <div>Banca: <strong className="text-[#26332A]">Banca Sella — Atelier Sage Paper Design</strong></div>
              <div>IBAN: <strong className="font-mono text-[#26332A] text-sm">IT44 X 03268 03200 052445896321</strong></div>
              <div>Intestatario: <strong className="text-[#26332A]">Sage Paper Design Atelier S.r.l.</strong></div>
              <div>Causale: <strong className="text-[#26332A]">Saldo Suite Nozze {project.code} - {project.clientName}</strong></div>
            </div>

            <p className="text-[11px] text-[#7D8B80] italic pt-2 border-t border-[#EDE8E0]">
              Il saldo finale viene regolato al termine del confezionamento prima della spedizione assicurata o consegna a mano.
            </p>
          </div>

          {/* Pricing Totals */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2.5 text-xs">
            <div className="flex justify-between py-1 text-[#68766B]">
              <span>Totale Fornitura Concordata:</span>
              <span className="font-mono font-bold text-sm text-[#26332A]">€ {totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-[#5B7B63]">
              <span>Acconto Confermato:</span>
              <span className="font-mono font-bold text-sm">- € {depositPaid.toFixed(2)}</span>
            </div>
            {balancePaid > 0 && (
              <div className="flex justify-between py-1 text-[#5B7B63]">
                <span>Ulteriori Versamenti Effettuati:</span>
                <span className="font-mono font-bold text-sm">- € {balancePaid.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t border-[#EDE8E0] text-sm font-bold text-[#26332A]">
              <span>Residuo da Saldare:</span>
              <span className="text-xl text-[#5B7B63] font-mono">€ {remainingBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature Note */}
        <div className="pt-6 border-t border-[#EDE8E0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7D8B80] gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5B7B63]" />
            <span>Creazioni realizzate a mano con carte cotone pregiate, inchiostri botanici e cura sartoriale.</span>
          </div>
          <div className="font-bold text-xs text-[#26332A]">
            Sage Paper Design Atelier — Firenze
          </div>
        </div>

      </div>

      {/* FORMAL APPROVAL CONFIRMATION MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-[#26332A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl border border-[#EDE8E0] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-[#EDE8E0] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF2ED] text-[#5B7B63] flex items-center justify-center font-bold text-xl shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#5B7B63]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#26332A]">
                  Conferma Approvazione Formale
                </h3>
                <p className="text-xs text-[#7D8B80]">
                  Commessa {project.code} — {project.clientName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E0] space-y-2 text-xs">
              <div className="font-bold text-[#5B7B63] flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Congelamento Esecutivi di Stampa:
              </div>
              <p className="text-[#68766B] leading-relaxed">
                Questa operazione registra l'approvazione con data e ora ({new Date().toLocaleString('it-IT')}). I file grafici verranno convalidati per l'incisione dei clichè e il taglio carte.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-5 py-2.5 bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#68766B] rounded-2xl font-bold cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleFormalApproval}
                className="px-6 py-2.5 bg-[#5B7B63] hover:bg-[#4A6750] text-white rounded-2xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confermo & Approvo Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
