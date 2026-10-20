import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AgendaOdierna } from './components/AgendaOdierna';
import { CapacityPlanner } from './components/CapacityPlanner';
import { ProjectsManager } from './components/ProjectsManager';
import { ProduzioneAtelierView } from './components/ProduzioneAtelierView';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { SchedaClienteView } from './components/SchedaClienteView';
import { FinanzeView } from './components/FinanzeView';
import { MagazzinoView } from './components/MagazzinoView';
import { AppuntamentiView } from './components/AppuntamentiView';
import { GmailFilterView } from './components/GmailFilterView';
import { ProdottiCatalogoView } from './components/ProdottiCatalogoView';
import { PreventiviView } from './components/PreventiviView';
import { NewProjectModal } from './components/NewProjectModal';
import { NewTaskModal, NewCallNoteModal } from './components/QuickModals';

const MainApp: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useApp();

  // Modals state
  const [detailedProjectId, setDetailedProjectId] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewCallNoteOpen, setIsNewCallNoteOpen] = useState(false);

  const handleOpenProjectDetail = (projectId: string) => {
    setDetailedProjectId(projectId);
  };

  const handleOpenSchedaCliente = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveView('scheda_cliente');
  };

  const handleProjectCreated = (newProjectId: string) => {
    setIsNewProjectOpen(false);
    setDetailedProjectId(newProjectId);
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#26332A] antialiased selection:bg-[#D5E3D8] selection:text-[#1E2E23]">
      {/* Left Modern Sidebar (inspired by Image 2) */}
      <Sidebar
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top Header */}
        <Header
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenNewCallNote={() => setIsNewCallNoteOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
          onOpenNewExpense={() => setActiveView('finanze')}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 pb-16">
          {activeView === 'agenda' && (
            <AgendaOdierna
              onOpenProjectDetail={handleOpenProjectDetail}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              onOpenNewCallNote={() => setIsNewCallNoteOpen(true)}
            />
          )}

          {activeView === 'capacity' && (
            <CapacityPlanner
              onOpenProjectDetail={handleOpenProjectDetail}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
            />
          )}

          {activeView === 'progetti' && (
            <ProjectsManager
              onOpenProjectDetail={handleOpenProjectDetail}
              onOpenNewProject={() => setIsNewProjectOpen(true)}
              onOpenSchedaCliente={handleOpenSchedaCliente}
            />
          )}

          {activeView === 'produzione' && (
            <ProduzioneAtelierView
              onOpenProjectDetail={handleOpenProjectDetail}
            />
          )}

          {activeView === 'scheda_cliente' && (
            <SchedaClienteView
              initialProjectId={selectedProjectId || undefined}
            />
          )}

          {activeView === 'finanze' && (
            <FinanzeView
              onOpenProjectDetail={handleOpenProjectDetail}
              onOpenNewExpense={() => setActiveView('finanze')}
            />
          )}

          {activeView === 'magazzino' && (
            <MagazzinoView />
          )}

          {activeView === 'prodotti' && (
            <ProdottiCatalogoView 
              onSelectForQuote={() => {
                setActiveView('preventivi');
              }}
            />
          )}

          {activeView === 'preventivi' && (
            <PreventiviView />
          )}

          {activeView === 'appuntamenti' && (
            <AppuntamentiView
              onOpenProjectDetail={handleOpenProjectDetail}
            />
          )}

          {activeView === 'email_gmail' && (
            <GmailFilterView
              onOpenProjectDetail={handleOpenProjectDetail}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {detailedProjectId && (
        <ProjectDetailModal
          projectId={detailedProjectId}
          onClose={() => setDetailedProjectId(null)}
          onOpenSchedaCliente={(id) => {
            setDetailedProjectId(null);
            handleOpenSchedaCliente(id);
          }}
        />
      )}

      {isNewProjectOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {isNewTaskOpen && (
        <NewTaskModal
          onClose={() => setIsNewTaskOpen(false)}
        />
      )}

      {isNewCallNoteOpen && (
        <NewCallNoteModal
          onClose={() => setIsNewCallNoteOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
