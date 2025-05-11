import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Library, FolderPlus, LogIn, ClipboardList, Share } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LibraryManager from './LibraryManager';

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
}
interface SharedLibrary extends UserLibrary {
  shared_by: string;
}
interface AppSidebarProps {
  selectedLibraryId: string | null;
  onLibrarySelect: (library: UserLibrary | SharedLibrary) => void;
  activeView: 'parser' | 'library';
  onViewChange: (view: 'parser' | 'library') => void;
}
const AppSidebar: React.FC<AppSidebarProps> = ({
  selectedLibraryId,
  onLibrarySelect,
  activeView,
  onViewChange
}) => {
  const [libraries, setLibraries] = useState<UserLibrary[]>([]);
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageLibrariesOpen, setManageLibrariesOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Refresh libraries when the component mounts or when user changes
  useEffect(() => {
    if (user) {
      fetchLibraries();
      fetchSharedLibraries();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('user_libraries').select('*').eq('created_by', user.id).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      setLibraries(data || []);

      // Select the first library by default if none is selected and we're in library view
      if (data && data.length > 0 && !selectedLibraryId && activeView === 'library') {
        onLibrarySelect(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching libraries:', error);
      toast({
        title: "Error fetching libraries",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSharedLibraries = async () => {
    try {
      if (!user) return;

      // Fetch libraries that have been shared with the current user
      const {
        data: permissions,
        error: permissionsError
      } = await supabase.from('shared_library_permissions').select('library_id, shared_by').eq('shared_with', user.id);
      if (permissionsError) throw permissionsError;
      if (permissions && permissions.length > 0) {
        // Get unique library IDs
        const libraryIds = [...new Set(permissions.map(p => p.library_id))].filter(Boolean) as string[];
        if (libraryIds.length > 0) {
          // Fetch the actual library details
          const {
            data: libraryData,
            error: libraryError
          } = await supabase.from('user_libraries').select('*').in('id', libraryIds);
          if (libraryError) throw libraryError;
          if (libraryData) {
            // Combine library data with who shared it
            const sharedLibs: SharedLibrary[] = libraryData.map(lib => {
              const permission = permissions.find(p => p.library_id === lib.id);
              return {
                ...lib,
                shared_by: permission?.shared_by || ''
              };
            });
            setSharedLibraries(sharedLibs);
          }
        } else {
          setSharedLibraries([]);
        }
      } else {
        setSharedLibraries([]);
      }
    } catch (error: any) {
      console.error('Error fetching shared libraries:', error);
      toast({
        title: "Error fetching shared libraries",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleManageLibraries = () => {
    setManageLibrariesOpen(true);
  };
  
  const handleSelectLibrary = (library: UserLibrary | SharedLibrary) => {
    onLibrarySelect(library);
    setManageLibrariesOpen(false);
  };
  
  const handleLibraryCreated = () => {
    // Refresh the libraries list when a new library is created
    fetchLibraries();
    fetchSharedLibraries();
  };
  
  const handleLibraryDeleted = (deletedLibraryId: string) => {
    // Check if the deleted library is the currently selected one
    if (selectedLibraryId === deletedLibraryId) {
      // Find another library to select
      const remainingLibrary = libraries.find(lib => lib.id !== deletedLibraryId) || 
                              sharedLibraries.find(lib => lib.id !== deletedLibraryId);
      
      if (remainingLibrary) {
        onLibrarySelect(remainingLibrary);
      } else {
        // If no libraries left, switch to parser view
        onViewChange('parser');
      }
    }

    // Refresh the libraries list
    fetchLibraries();
    fetchSharedLibraries();
  };

  // Helper function to check if there are no libraries available
  const noLibrariesAvailable = libraries.length === 0 && sharedLibraries.length === 0;

  if (!user) {
    // ... keep existing code (login state UI)
    return <div className="w-60 h-screen flex flex-col ">
        <div className="h-16 px-4 flex items-center border-b">
          <Link to="/" onClick={() => onViewChange('parser')} className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 244 245" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
              <g clipPath="url(#clip0_1143_6681)">
                <path d="M106.551 16.2092L16.2183 106.492C5.84442 116.86 0 130.951 0 145.627V240.035C0 242.773 2.20992 244.982 4.94949 244.982H61.7865C64.526 244.982 66.736 242.773 66.736 240.035V85.792C66.736 75.2414 75.2834 66.6987 85.8399 66.6987H238.032C240.772 66.6987 242.982 64.49 242.982 61.752V4.94673C242.982 2.20869 240.772 0 238.032 0H145.709C131.025 0 116.925 5.84116 106.533 16.2092H106.551Z" fill="currentColor" />
                <path d="M240.518 176.86L110.662 101.947C103.649 97.9133 95.8139 105.744 99.8684 112.735L174.841 242.518C175.718 244.052 177.362 245.001 179.133 245.001H238.052C240.792 245.001 243.002 242.792 243.002 240.054V181.168C243.002 179.397 242.052 177.755 240.518 176.878V176.86Z" fill="currentColor" />
              </g>
              <defs>
                <clipPath id="clip0_1143_6681">
                  <rect width="243" height="245" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="font-bold text-lg">Webflow Elements Library</span>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <LogIn className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to access your libraries</p>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Sign in
          </Button>
        </div>
      </div>;
  }

  return <>
      <div className="w-60 h-screen flex flex-col">
        <div className="h-16 px-4 flex items-center border-b">
          <Link to="/" onClick={() => onViewChange('parser')} className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 244 245" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
              <g clipPath="url(#clip0_1143_6681)">
                <path d="M106.551 16.2092L16.2183 106.492C5.84442 116.86 0 130.951 0 145.627V240.035C0 242.773 2.20992 244.982 4.94949 244.982H61.7865C64.526 244.982 66.736 242.773 66.736 240.035V85.792C66.736 75.2414 75.2834 66.6987 85.8399 66.6987H238.032C240.772 66.6987 242.982 64.49 242.982 61.752V4.94673C242.982 2.20869 240.772 0 238.032 0H145.709C131.025 0 116.925 5.84116 106.533 16.2092H106.551Z" fill="currentColor" />
                <path d="M240.518 176.86L110.662 101.947C103.649 97.9133 95.8139 105.744 99.8684 112.735L174.841 242.518C175.718 244.052 177.362 245.001 179.133 245.001H238.052C240.792 245.001 243.002 242.792 243.002 240.054V181.168C243.002 179.397 242.052 177.755 240.518 176.878V176.86Z" fill="currentColor" />
              </g>
              <defs>
                <clipPath id="clip0_1143_6681">
                  <rect width="243" height="245" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="font-bold text-base mx-[8px]">Webflow Elements</span>
          </Link>
        </div>
        
        <div className="p-4">
          <h1 className="text-lg font-semibold flex items-center">
            <span className="mr-2">Library</span>
          </h1>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="py-2">
            <button 
              onClick={() => onViewChange('parser')} 
              className={`w-full flex items-center px-4 py-2 text-sm ${activeView === 'parser' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
              <ClipboardList size={16} className="mr-2" />
              <span>Clipboard Parser</span>
            </button>
          </div>
          
          <div className="mt-4">
            <div className="px-4 py-1 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Libraries</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5" 
                onClick={handleManageLibraries} 
                title="Manage Libraries"
              >
                <FolderPlus size={14} />
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="mt-1">
                {noLibrariesAvailable ? (
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-2">No libraries</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs" 
                      onClick={handleManageLibraries}
                    >
                      <FolderPlus size={12} className="mr-1" />
                      Create Library
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* My Libraries */}
                    {libraries.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-1 text-xs text-gray-500">My Libraries</div>
                        {libraries.map(library => (
                          <button 
                            key={library.id} 
                            onClick={() => handleSelectLibrary(library)} 
                            className={`w-full flex items-center px-4 py-2 text-sm ${selectedLibraryId === library.id && activeView === 'library' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                          >
                            <Library size={16} className="mr-2" />
                            <span className="truncate">{library.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Shared With Me */}
                    {sharedLibraries.length > 0 && (
                      <div>
                        <div className="px-4 py-1 text-xs text-gray-500">Shared With Me</div>
                        {sharedLibraries.map(library => (
                          <button 
                            key={library.id} 
                            onClick={() => handleSelectLibrary(library)} 
                            className={`w-full flex items-center px-4 py-2 text-sm ${selectedLibraryId === library.id && activeView === 'library' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                          >
                            <Share size={16} className="mr-2" />
                            <span className="truncate">{library.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 mt-auto border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span>{user?.email}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      {manageLibrariesOpen && (
        <LibraryManager 
          open={manageLibrariesOpen} 
          onClose={() => setManageLibrariesOpen(false)} 
          onSelect={handleSelectLibrary} 
          selectedLibraryId={selectedLibraryId || undefined} 
          onLibraryCreated={handleLibraryCreated} 
          onLibraryDeleted={handleLibraryDeleted} 
        />
      )}
    </>;
};

export default AppSidebar;
