import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import { ProjectTask, StudioExpense } from '../types';

export const NewTaskModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addTask, projects, todayDate } = useApp();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState<ProjectTask['category']>('confezionamento_manuale');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [scheduledDate, setScheduledDate] = useState(todayDate);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return;

    addTask({
      projectId,
      title,
      category,
      department: category === 'design' ? 'grafica_design' : 'produzione_manuale',
      assignee: 'giulia',
      actualHoursLogged: 0,
      status: 'da_fare',
      estimatedHours,
      scheduledDate,
      completed: false,
      priority: 'media',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DFD6C9] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
          <h3 className="font-serif text-xl text-[#231F1C]">Nuovo Task di Lavorazione</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#8A7D71]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Progetto Sposi</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Descrizione Task</label>
            <input
              type="text"
              placeholder="es. Sfilacciatura a mano nastri di seta 110 pezzi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Ore Stimate</label>
              <input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Data nel Planner</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Fase di Lavorazione</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
            >
              <option value="confezionamento_manuale">Confezionamento Manuale (Ceralacca, nastri)</option>
              <option value="design">Design & Tipografia a schermo</option>
              <option value="fornitori">Ordinazione Carte & Materie Prime</option>
              <option value="stampa">Stampa Tipografica & Impianti</option>
              <option value="controllo_qualita">Controllo Qualità & Conteggio</option>
              <option value="spedizione">Spedizione & Consegna</option>
            </select>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Note Lavorazione (Opzionale)</label>
            <textarea
              rows={2}
              placeholder="Dettagli tecnici o attrezzi da usare..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DFD5]">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#7A6D60]">Annulla</button>
            <button type="submit" className="px-4 py-1.5 bg-[#3B342F] text-[#FAF8F5] text-xs font-medium rounded hover:bg-[#25201C]">
              Crea Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewCallNoteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addCallNote, projects, todayDate, getProjectById } = useApp();

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [paper, setPaper] = useState('');
  const [seal, setSeal] = useState('');
  const [actionItem, setActionItem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return;

    addCallNote({
      projectId,
      date: todayDate,
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 40,
      title,
      attendees: getProjectById(projectId)?.clientName || 'Sposi',
      notes,
      aestheticDecisions: {
        paperType: paper || undefined,
        sealColor: seal || undefined,
      },
      actionItems: actionItem ? [actionItem] : [],
    }, true);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DFD6C9] rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
          <h3 className="font-serif text-xl text-[#231F1C]">Prendi Appunti Call Sposi</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#8A7D71]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Seleziona Progetto</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Argomento della Call</label>
            <input
              type="text"
              placeholder="es. Scelta colori ceralacca e conferma bozza testo cerimonia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Note & Decisioni</label>
            <textarea
              rows={3}
              placeholder="Scrivi qui gli appunti presi durante la telefonata..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Carta Scelta</label>
              <input
                type="text"
                placeholder="es. Cotone Amalfi 340g"
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Ceralacca Scelta</label>
              <input
                type="text"
                placeholder="es. Salvia Perlato"
                value={seal}
                onChange={(e) => setSeal(e.target.value)}
                className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Azione da fare (crea Task automatico)</label>
            <input
              type="text"
              placeholder="es. Inviare bozza n.2 aggiornata entro domani"
              value={actionItem}
              onChange={(e) => setActionItem(e.target.value)}
              className="w-full p-2 bg-[#FFFFFF] border border-[#DFD6C9] rounded text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7DFD5]">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#7A6D60]">Annulla</button>
            <button type="submit" className="px-4 py-1.5 bg-[#3B342F] text-[#FAF8F5] text-xs font-medium rounded hover:bg-[#25201C]">
              Salva Note Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
