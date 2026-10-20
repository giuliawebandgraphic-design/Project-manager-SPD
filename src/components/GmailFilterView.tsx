import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mail, 
  ExternalLink, 
  Search, 
  Filter, 
  Check, 
  Copy, 
  Send, 
  Sparkles, 
  Folder, 
  Clock, 
  Eye, 
  EyeOff,
  Inbox
} from 'lucide-react';
import { ClientEmail } from '../types';

interface GmailFilterViewProps {
  onOpenProjectDetail: (projectId: string) => void;
}

export const GmailFilterView: React.FC<GmailFilterViewProps> = ({
  onOpenProjectDetail,
}) => {
  const { emails, markEmailRead, projects, getProjectById, openGmailSearchForClient } = useApp();

  const [onlyUnread, setOnlyUnread] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<ClientEmail | null>(emails[0] || null);

  // Template response generator
  const [selectedTemplate, setSelectedTemplate] = useState<string>('bozza_pronta');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const filteredEmails = emails.filter(mail => {
    if (onlyUnread && !mail.isUnread) return false;
    if (selectedProjectId !== 'all' && mail.projectId !== selectedProjectId) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        mail.subject.toLowerCase().includes(q) ||
        mail.clientName.toLowerCase().includes(q) ||
        mail.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const templates: Record<string, { title: string; subject: string; body: string }> = {
    bozza_pronta: {
      title: 'Bozze Pronte per Revisione',
      subject: 'Sage Paper Design — Prime bozze digitali per la vostra suite di nozze',
      body: `Carissimi,\n\nSiamo davvero felici di condividere con voi le prime bozze digitali della vostra suite di nozze!\n\nTroverete i file ad alta risoluzione nella vostra cartella Google Drive dedicata. Abbiamo curato con particolare attenzione l'impaginazione dei testi e i dettagli calligrafici come concordato nella nostra ultima call.\n\nVi preghiamo di verificare con cura nomi, date, orari e coordinate dell'evento. Attendiamo le vostre gentili osservazioni per procedere con gli affinamenti.\n\nUn caro saluto,\nSage Paper Design Atelier`
    },
    richiesta_nomi: {
      title: 'Richiesta Elenco Invitati per Calligrafia',
      subject: 'Sage Paper Design — Invio elenco definitivo per scrittura a mano delle buste',
      body: `Gentili sposi,\n\nI lavori per la vostra suite proseguono a meraviglia! Per iniziare la fase di calligrafia a mano con inchiostro e pennino sulle buste artigianali, abbiamo bisogno del file definitivo con l'elenco degli invitati e i rispettivi indirizzi.\n\nPotete caricarlo direttamente nella cartella Drive del progetto o inviarcelo in risposta a questa email.\n\nGrazie mille,\nSage Paper Design Atelier`
    },
    conferma_saldo: {
      title: 'Avviso Confezionamento & Saldo Spedizione',
      subject: 'Sage Paper Design — Completamento lavorazioni e coordinate saldo finale',
      body: `Carissimi,\n\nAbbiamo terminato con successo la sigillatura con ceralacca e il confezionamento delle vostre partecipazioni!\n\nIn allegato trovate la Scheda Cliente aggiornata con le foto in anteprima della suite e il riepilogo del saldo finale prima della partenza del corriere espresso assicurato.\n\nRestiamo a vostra disposizione,\nSage Paper Design Atelier`
    }
  };

  const handleCopyTemplate = () => {
    const t = templates[selectedTemplate];
    if (!t) return;
    navigator.clipboard.writeText(`Oggetto: ${t.subject}\n\n${t.body}`);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleOpenDraftInGmail = (recipientEmail?: string) => {
    const t = templates[selectedTemplate];
    const to = recipientEmail || selectedEmail?.clientEmail || '';
    const subject = encodeURIComponent(t?.subject || 'Sage Paper Design');
    const body = encodeURIComponent(t?.body || '');
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E7DFD5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C7D6F] font-medium mb-1">
            <span>Integrazione Gmail & Comunicazioni Clienti</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#231F1C]">
            Filtro Email da Leggere & Hub Gmail
          </h1>
          <p className="text-sm text-[#665B51] mt-1 font-light max-w-2xl">
            Tieni traccia delle risposte dei clienti, filtra le email non lette con query dirette su Gmail e invia risposte rapide professionali.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://mail.google.com/mail/u/0/#search/is%3Aunread"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#A2574A] hover:bg-[#8D4438] text-[#FAF8F5] text-xs font-medium rounded transition-colors shadow-sm cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Apri Tutte le Non Lette in Gmail</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Filter and Switcher Toolbar */}
      <div className="bg-[#FAF8F5] border border-[#DFD6C9] p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A8D7E]" />
            <input
              type="text"
              placeholder="Cerca email cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs text-[#2C2723]"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#FFFFFF] px-3 py-1 rounded border border-[#DFD6C9]">
            <input
              type="checkbox"
              id="unreadFilter"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="text-[#3B342F]"
            />
            <label htmlFor="unreadFilter" className="text-xs text-[#4F4439] cursor-pointer font-medium">
              Mostra solo email da leggere (is:unread)
            </label>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#FFFFFF] border border-[#DFD6C9] rounded px-3 py-1.5 text-xs text-[#4F4439]"
          >
            <option value="all">Tutti i progetti clienti</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-[#8C7D6F] font-mono">
          {filteredEmails.length} messaggi trovati
        </span>
      </div>

      {/* 2-Column Layout: Left (Email List), Right (Email Reader + Reply Template) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Email Thread List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredEmails.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-dashed border-[#DFD6C9] rounded p-8 text-center text-xs text-[#8A7D71]">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Nessuna email corrispondente ai criteri selezionati.
            </div>
          ) : (
            filteredEmails.map((mail) => {
              const isSelected = selectedEmail?.id === mail.id;
              const project = mail.projectId ? getProjectById(mail.projectId) : undefined;

              return (
                <div
                  key={mail.id}
                  onClick={() => setSelectedEmail(mail)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-[#FFFFFF] border-[#3B342F] shadow-sm ring-1 ring-[#3B342F]' 
                      : mail.isUnread 
                        ? 'bg-[#FFFFFF] border-[#D9CEBF] shadow-2xs' 
                        : 'bg-[#FAF8F5] border-[#E9E1D5] opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {mail.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#A2574A]" />
                      )}
                      <span className={`text-xs font-semibold ${mail.isUnread ? 'text-[#231F1C]' : 'text-[#645649]'}`}>
                        {mail.clientName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8C7D6F] font-mono">
                      {mail.date} · {mail.time}
                    </span>
                  </div>

                  <div className={`text-xs ${mail.isUnread ? 'font-semibold text-[#231F1C]' : 'font-medium text-[#4D4238]'}`}>
                    {mail.subject}
                  </div>

                  <p className="text-[11px] text-[#786B5E] mt-1 line-clamp-2 leading-relaxed">
                    {mail.snippet}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F2ECE3] text-[10px] text-[#8A7E73]">
                    <span>{project ? project.code : 'Generale'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGmailSearchForClient(mail.clientEmail, true);
                      }}
                      className="text-[#A2574A] hover:underline flex items-center gap-0.5"
                    >
                      <span>Gmail</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Email Full View + Quick Stationery Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedEmail ? (
            <div className="bg-[#FFFFFF] border border-[#DFD6C9] rounded p-6 space-y-5 shadow-xs">
              {/* Email Reader Header */}
              <div className="border-b border-[#F0EAE1] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl text-[#231F1C]">{selectedEmail.subject}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F6355] mt-1">
                    <span>Da: <strong>{selectedEmail.clientName}</strong> ({selectedEmail.clientEmail})</span>
                    <span aria-hidden="true">·</span>
                    <span>Ricevuta il {selectedEmail.date} alle {selectedEmail.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => markEmailRead(selectedEmail.id, !selectedEmail.isUnread)}
                    className="p-1.5 text-xs text-[#7B7065] hover:text-[#231F1C] bg-[#FAF8F5] border border-[#DFD6C9] rounded transition-colors"
                    title={selectedEmail.isUnread ? "Segna come letta" : "Segna come non letta"}
                  >
                    {selectedEmail.isUnread ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => openGmailSearchForClient(selectedEmail.clientEmail)}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DFD6C9] text-xs font-medium text-[#231F1C] rounded hover:bg-[#F2ECE3] transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#A2574A]" />
                    <span>Cerca su Gmail</span>
                  </button>
                </div>
              </div>

              {/* Email Full Message Body */}
              <div className="text-xs text-[#3E342B] leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-5 rounded border border-[#EDE5D8]">
                {selectedEmail.body}
              </div>

              {/* Stationery Quick Reply Generator */}
              <div className="border-t border-[#F0EAE1] pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C28C48]" />
                    <h4 className="font-serif text-base text-[#231F1C]">
                      Risposta Rapida Precompilata per Sposi
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyTemplate}
                      className="text-xs text-[#5B7B61] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedTemplate ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTemplate ? 'Copiato!' : 'Copia Testo'}</span>
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(templates).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                        selectedTemplate === key
                          ? 'bg-[#3B342F] text-[#FAF8F5]'
                          : 'bg-[#FAF8F5] border border-[#DFD6C9] text-[#615448] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>

                {/* Template Preview */}
                <div className="bg-[#FAF8F5] p-4 rounded border border-[#DFD6C9] space-y-2 text-xs">
                  <div className="font-semibold text-[#231F1C]">
                    Oggetto: {templates[selectedTemplate]?.subject}
                  </div>
                  <p className="text-[#64564A] whitespace-pre-line text-[11px] leading-relaxed">
                    {templates[selectedTemplate]?.body}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleOpenDraftInGmail(selectedEmail.clientEmail)}
                    className="px-4 py-2 bg-[#3B342F] text-[#FAF8F5] text-xs font-medium rounded hover:bg-[#25201C] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apri Bozza su Gmail per {selectedEmail.clientName}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#DFD6C9] rounded p-12 text-center text-xs text-[#8A7D71]">
              Seleziona un'email dalla lista per visualizzarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
