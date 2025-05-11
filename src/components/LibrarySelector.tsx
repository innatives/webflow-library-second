
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Library, ChevronDown, Plus, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import LibraryManager from './LibraryManager';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
  shared_by?: string;
}

interface LibrarySelectorProps {
  selectedLibraryId: string | null;
  onLibraryChange: (library: UserLibrary) => void;
  disabled?: boolean;
}

const LibrarySelector: React.FC<LibrarySelectorProps> = ({ 
  selectedLibraryId,
  onLibraryChange,
  disabled = false
}) => {
  const [libraries, setLibraries] = useState<UserLibrary[]>([]);
  const [sharedLibraries, setSharedLibraries] = useState<UserLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLibrary, setSelectedLibrary] = useState<UserLibrary | null>(null);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLibraries();
    } else {
      setLibraries([]);
      setSharedLibraries([]);
      setSelectedLibrary(null);
      setLoading(false);
    }
  }, [user]);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      if (!user) {
        setLibraries([]);
        setSharedLibraries([]);
        setSelectedLibrary(null);
        setLoading(false);
        return;
      }

      // Fetch user's own libraries
      const { data: ownLibraries, error: ownError } = await supabase
        .from('user_libraries')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: true });

      if (ownError) throw ownError;
      setLibraries(ownLibraries || []);
      
      // Fetch libraries shared with the user
      const { data: permissions, error: permissionsError } = await supabase
        .from('shared_library_permissions')
        .select('library_id, shared_by')
        .eq('shared_with', user.id);

      if (permissionsError) throw permissionsError;
      
      if (permissions && permissions.length > 0) {
        // Get unique library ids
        const libraryIds = [...new Set(permissions.map(p => p.library_id))];
        
        if (libraryIds.length > 0) {
          const { data: sharedLibs, error: sharedError } = await supabase
            .from('user_libraries')
            .select('*')
            .in('id', libraryIds)
            .order('created_at', { ascending: true });
            
          if (sharedError) throw sharedError;
          
          // Add shared_by information to each library
          const sharedWithInfo = (sharedLibs || []).map(lib => {
            const permission = permissions.find(p => p.library_id === lib.id);
            return {
              ...lib,
              shared_by: permission?.shared_by || null
            };
          });
          
          setSharedLibraries(sharedWithInfo);
        }
      } else {
        setSharedLibraries([]);
      }
      
      // All available libraries (owned + shared)
      const allLibraries = [...(ownLibraries || []), ...(sharedLibraries || [])];
      
      // If there's a selectedLibraryId, find and select that library
      if (selectedLibraryId && allLibraries.length > 0) {
        const selected = allLibraries.find(lib => lib.id === selectedLibraryId);
        if (selected) {
          setSelectedLibrary(selected);
        } else if (allLibraries.length > 0) {
          // Default to the first library if selected library not found
          setSelectedLibrary(allLibraries[0]);
          onLibraryChange(allLibraries[0]);
        }
      } else if (allLibraries.length > 0 && !selectedLibraryId) {
        // If no library is selected but libraries exist, select the first one
        setSelectedLibrary(allLibraries[0]);
        onLibraryChange(allLibraries[0]);
      } else {
        setSelectedLibrary(null);
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
      setLibraries([]);
      setSharedLibraries([]);
      setSelectedLibrary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLibrary = (library: UserLibrary) => {
    if (!library) return;
    setSelectedLibrary(library);
    onLibraryChange(library);
    setOpen(false);
  };

  const handleLibrarySelected = (library: UserLibrary) => {
    if (!library) return;
    setSelectedLibrary(library);
    onLibraryChange(library);
    setManageOpen(false);
    // Refresh the libraries list
    fetchLibraries();
  };

  const handleCreateLibrary = () => {
    setManageOpen(true);
  };

  if (loading) {
    return (
      <Button variant="outline" className="w-full md:w-[200px] justify-start" disabled>
        <Library className="mr-2 h-4 w-4" />
        <span className="text-sm">Loading libraries...</span>
      </Button>
    );
  }

  // When there are no libraries at all
  const allLibraries = [...libraries, ...sharedLibraries];
  if (!allLibraries || allLibraries.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setManageOpen(true)}
          className="w-full md:w-[200px] justify-start"
          disabled={disabled}
        >
          <Library className="mr-2 h-4 w-4" />
          <span className="text-sm">Create library</span>
        </Button>
        
        {manageOpen && (
          <LibraryManager
            open={manageOpen}
            onClose={() => setManageOpen(false)}
            onSelect={handleLibrarySelected}
            selectedLibraryId={null}
          />
        )}
      </>
    );
  }

  // When there's only one library
  if (allLibraries.length === 1) {
    const library = allLibraries[0];
    const isShared = Boolean(library.shared_by);
    
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="w-full md:w-[200px] justify-between"
            disabled={disabled}
          >
            <div className="flex items-center">
              {isShared ? (
                <Share className="mr-2 h-4 w-4" />
              ) : (
                <Library className="mr-2 h-4 w-4" />
              )}
              <span className="truncate">{library.name || 'My Library'}</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateLibrary}
            disabled={disabled}
            className="shrink-0"
            title="Create New Library"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {manageOpen && (
          <LibraryManager
            open={manageOpen}
            onClose={() => setManageOpen(false)}
            onSelect={handleLibrarySelected}
            selectedLibraryId={selectedLibrary?.id}
          />
        )}
      </>
    );
  }

  // When there are multiple libraries
  return (
    <>
      <div className="flex items-center gap-2">
        <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full md:w-[200px] justify-between"
              disabled={disabled}
            >
              <div className="flex items-center">
                {selectedLibrary?.shared_by ? (
                  <Share className="mr-2 h-4 w-4" />
                ) : (
                  <Library className="mr-2 h-4 w-4" />
                )}
                <span className="truncate">{selectedLibrary?.name || 'Select library'}</span>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full md:w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search libraries..." />
              <CommandList>
                <CommandEmpty>No library found.</CommandEmpty>
                
                {/* User's own libraries */}
                {libraries.length > 0 && (
                  <CommandGroup heading="My Libraries">
                    {libraries.map((library) => (
                      <CommandItem
                        key={library.id}
                        onSelect={() => handleSelectLibrary(library)}
                        className="cursor-pointer"
                      >
                        <Library className="mr-2 h-4 w-4" />
                        <span className="truncate">{library.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* Shared libraries */}
                {sharedLibraries.length > 0 && (
                  <>
                    {libraries.length > 0 && <CommandSeparator />}
                    <CommandGroup heading="Shared With Me">
                      {sharedLibraries.map((library) => (
                        <CommandItem
                          key={library.id}
                          onSelect={() => handleSelectLibrary(library)}
                          className="cursor-pointer"
                        >
                          <Share className="mr-2 h-4 w-4" />
                          <span className="truncate">{library.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
                
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setManageOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="text-muted-foreground text-xs">Manage libraries</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleCreateLibrary}
          disabled={disabled}
          className="shrink-0"
          title="Create New Library"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {manageOpen && (
        <LibraryManager
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          onSelect={handleLibrarySelected}
          selectedLibraryId={selectedLibrary?.id}
        />
      )}
    </>
  );
};

export default LibrarySelector;
