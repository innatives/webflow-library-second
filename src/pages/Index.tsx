
import React, { useState, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import LibraryGrid from "@/components/LibraryGrid";
import ClipboardParser from "@/components/ClipboardParser";
import ClipboardParserModal from "@/components/ClipboardParserModal";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LibrarySharingManager from "@/components/LibrarySharingManager";
import LibrarySettingsManager from "@/components/LibrarySettingsManager";

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
  shared_by?: string;
}

const Index = () => {
  const [selectedLibrary, setSelectedLibrary] = useState<UserLibrary | null>(null);
  const [parserModalOpen, setParserModalOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'parser' | 'library'>('parser');
  
  const handleLibrarySelect = (library: UserLibrary) => {
    setSelectedLibrary(library);
    setActiveView('library');
  };
  
  const handleLibraryDeleted = (deletedLibraryId: string) => {
    if (selectedLibrary && selectedLibrary.id === deletedLibraryId) {
      // Reset to parser view when the selected library is deleted
      setSelectedLibrary(null);
      setActiveView('parser');
    }
  };
  
  const openParserModal = () => {
    setParserModalOpen(true);
  };
  
  // Event listener for the custom event
  useEffect(() => {
    const handleOpenLibrarySettings = (event: Event) => {
      const customEvent = event as CustomEvent<{ libraryId: string }>;
      if (selectedLibrary && customEvent.detail.libraryId === selectedLibrary.id) {
        setSettingsOpen(true);
      }
    };
    
    window.addEventListener('open-library-settings', handleOpenLibrarySettings);
    
    return () => {
      window.removeEventListener('open-library-settings', handleOpenLibrarySettings);
    };
  }, [selectedLibrary]);
  
  return (
    <div className="flex h-screen w-full">
      <AppSidebar 
        selectedLibraryId={selectedLibrary?.id || null} 
        onLibrarySelect={handleLibrarySelect} 
        activeView={activeView} 
        onViewChange={setActiveView} 
      />
      
      <div className="flex-1 overflow-auto bg-neutral-100 p-6">
        <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-3rem)]">
          {activeView === 'parser' ? (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <h1 className="text-xl font-semibold">Clipboard Parser</h1>
              </div>
              <ClipboardParser />
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">
                  {selectedLibrary ? selectedLibrary.name : "Select a Library"}
                  {selectedLibrary?.shared_by && (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      (Shared with you)
                    </span>
                  )}
                </h1>
              </div>
              
              <LibraryGrid libraryId={selectedLibrary?.id || null} />
            </div>
          )}
        </div>
        
        <Button 
          onClick={openParserModal} 
          size="icon" 
          aria-label="Add from clipboard" 
          className="floating-action-button rounded-full bg-neutral-900 hover:bg-neutral-800"
        >
          <Plus size={24} />
        </Button>
      </div>
      
      <ClipboardParserModal 
        open={parserModalOpen} 
        onClose={() => setParserModalOpen(false)} 
      />
      
      {selectedLibrary && sharingOpen && (
        <LibrarySharingManager 
          onClose={() => setSharingOpen(false)} 
          libraryId={selectedLibrary.id} 
        />
      )}
      
      {selectedLibrary && settingsOpen && (
        <LibrarySettingsManager 
          open={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
          library={selectedLibrary} 
          onLibraryUpdated={updatedLibrary => setSelectedLibrary(updatedLibrary)} 
          onLibraryDeleted={handleLibraryDeleted}
        />
      )}
    </div>
  );
};

export default Index;
