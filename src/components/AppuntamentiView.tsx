import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarDays, 
  Video, 
  MapPin, 
  Plus, 
  Clock, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Filter
} from 'lucide-react';
import { Appointment } from '../types';

interface AppuntamentiViewProps {
  onOpenProjectDetail: (projectId: string) => void;
}

export const AppuntamentiView: React.FC<AppuntamentiViewProps> = ({
  onOpenProjectDetail,
}) => {
  const { 
    appointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    projects, 
    getProjectById,
    todayDate
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [date, setDate] = useState(todayDate);
  const [time, setTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [type, setType] = useState<Appointment['type']>('revisione_bozze');
  const [locationOrLink, setLocationOrLink] = useState('https://meet.google.com/new');
  const [notes, setNotes] = useState('');

  const filteredAppointments = appointments.filter(app => {
    if (filterType === 'all') return true;
    if (filterType === 'today') return app.date === todayDate;
    return app.type === filterType;
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addAppointment({
      projectId: projectId || undefined,
      title,
      date,
      time,
      durationMinutes,
      type,
      locationOrLink,
      notes,
      completed: false,
    });

    setIsAdding(false);
    setTitle('');
    setNotes('');
  };

  const getTypeLabel = (t: Appointment['type']) => {
    switch (t) {
      case 'call_conoscitiva': return 'Call Conoscitiva Spose';
      case 'revisione_bozze': return 'Revisione Bozze Digitali';
      case 'scelta_campionario': return 'Scelta Campionario in Studio';
      case 'ritiro_consegna': return 'Ritiro / Consegna Suite';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E7DFD5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C7D6F] font-medium mb-1">
            <span>Incontri & Call con gli Sposi</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#231F1C]">
            Appuntamenti & Revisioni
          </h1>
          <p className="text-sm text-[#665B51] mt-1 font-light max-w-2xl">
            Calendario dedicato agli incontri in atelier, alle video-call di approvazione bozze grafiche e ai ritiri campionari.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#38322D] hover:bg-[#25201C] text-[#FAF8F5] text-xs font-medium rounded transition-colors shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Fissa Nuovo Appuntamento</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Tutti gli appuntamenti' },
          { id: 'today', label: 'Solo Oggi' },
          { id: 'call_conoscitiva', label: 'Call Conoscitive' },
          { id: 'revisione_bozze', label: 'Revisioni Bozze' },
          { id: 'scelta_campionario', label: 'Campionari in Studio' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              filterType === f.id
                ? 'bg-[#3B342F] text-[#FAF8F5]'
                : 'bg-[#FFFFFF] border border-[#DFD6C9] text-[#61554A] hover:bg-[#FAF8F5]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Appointment Modal */}
      {isAdding && (
        <form onSubmit={handleCreateAppointment} className="bg-[#FFFFFF] p-6 rounded border border-[#DFD6C9] space-y-4 text-xs shadow-sm">
          <h3 className="font-serif text-lg text-[#231F1C] border-b border-[#F0EAE1] pb-2">
            Nuovo Appuntamento / Call
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Titolo Incontro</label>
              <input
                type="text"
                placeholder="es. Video-call Approvazione Bozza n.2 con Mappa Chianti"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Collega a Progetto (Opzionale)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
              >
                <option value="">Nessun progetto collegato (Call generica)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} — {p.clientName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Orario</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Durata (min)</label>
              <input
                type="number"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[#6F6355] font-medium mb-1">Tipologia</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
              >
                <option value="call_conoscitiva">Call Conoscitiva</option>
                <option value="revisione_bozze">Revisione Bozze</option>
                <option value="scelta_campionario">Scelta Campionario</option>
                <option value="ritiro_consegna">Ritiro / Consegna</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Link Google Meet o Indirizzo Fisico</label>
            <input
              type="text"
              placeholder="https://meet.google.com/xyz... oppure Atelier Sage Paper"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-[#6F6355] font-medium mb-1">Note Preparatorie</label>
            <textarea
              rows={2}
              placeholder="Cosa preparare prima della call (es. prove colore, foglio con le varianti di font)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#DFD6C9] rounded text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-[#7A6D60]"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#3B342F] text-[#FAF8F5] text-xs font-medium rounded hover:bg-[#25201C]"
            >
              Salva Appuntamento
            </button>
          </div>
        </form>
      )}

      {/* Appointments Timeline Cards */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-dashed border-[#DFD6C9] rounded p-12 text-center text-xs text-[#8A7D71]">
            Nessun appuntamento in programma per questo filtro.
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const project = app.projectId ? getProjectById(app.projectId) : undefined;
            const isToday = app.date === todayDate;

            return (
              <div 
                key={app.id}
                className={`p-5 rounded border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isToday 
                    ? 'bg-[#FFFFFF] border-[#3B342F] ring-1 ring-[#3B342F]' 
                    : 'bg-[#FFFFFF] border-[#DFD6C9]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#231F1C] bg-[#FAF8F5] border border-[#E5DDD2] px-2 py-0.5 rounded">
                      {app.date} alle {app.time} ({app.durationMinutes} min)
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[#7A6E62]">
                      {getTypeLabel(app.type)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-mono bg-[#5B7B61] text-[#FAF8F5] px-1.5 py-0.2 rounded font-semibold">
                        Oggi
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg text-[#231F1C]">{app.title}</h3>

                  {project && (
                    <div className="text-xs text-[#6F6255] flex items-center gap-1.5">
                      <span>Progetto:</span>
                      <button
                        onClick={() => onOpenProjectDetail(project.id)}
                        className="font-medium text-[#231F1C] hover:underline"
                      >
                        {project.title} ({project.clientName})
                      </button>
                    </div>
                  )}

                  {app.notes && (
                    <p className="text-xs text-[#7F7366] italic bg-[#FAF8F5] p-2 rounded border border-[#EDE5D8]">
                      "{app.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {app.locationOrLink.startsWith('http') ? (
                    <a
                      href={app.locationOrLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-[#5B7B61] hover:bg-[#49654F] text-[#FAF8F5] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Avvia Meet</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#7A6E63] flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1.5 rounded border border-[#DFD6C9]">
                      <MapPin className="w-3.5 h-3.5" /> {app.locationOrLink}
                    </span>
                  )}

                  <button
                    onClick={() => deleteAppointment(app.id)}
                    className="p-1.5 text-[#B29E8D] hover:text-[#B24D3D] transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
