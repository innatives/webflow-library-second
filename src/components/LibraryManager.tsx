import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Library, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
}

interface LibraryManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (library: UserLibrary) => void;
  selectedLibraryId?: string;
  onLibraryCreated?: () => void;
  onLibraryDeleted?: (libraryId: string) => void;
}

const LibraryManager: React.FC<LibraryManagerProps> = ({ 
  open, 
  onClose, 
  onSelect,
  selectedLibraryId,
  onLibraryCreated,
  onLibraryDeleted
}) => {
  const [libraries, setLibraries] = useState<UserLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  const [editLibrary, setEditLibrary] = useState<UserLibrary | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [libraryToDelete, setLibraryToDelete] = useState<string | null>(null);
  const [deletingLibrary, setDeletingLibrary] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [libraryItems, setLibraryItems] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && open) {
      fetchLibraries();
    }
  }, [user, open]);
  
  useEffect(() => {
    if (libraryToDelete) {
      checkLibraryItems(libraryToDelete);
    }
  }, [libraryToDelete]);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('user_libraries')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setLibraries(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching libraries",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLibraryItems = async (libraryId: string) => {
    try {
      const { count, error } = await supabase
        .from('shared_clipboard_items')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId);

      if (error) throw error;
      
      setLibraryItems(count || 0);
    } catch (error: any) {
      console.error("Error checking library items:", error);
      setLibraryItems(0);
    }
  };

  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim() || !user) return;

    try {
      setCreatingLibrary(true);

      const { data, error } = await supabase
        .from('user_libraries')
        .insert({
          name: newLibraryName.trim(),
          created_by: user.id,
          is_shared: isShared
        })
        .select()
        .single();

      if (error) throw error;

      setLibraries([...libraries, data]);
      setNewLibraryName('');
      setIsShared(false);

      // Notify parent component about the new library
      if (onLibraryCreated) {
        onLibraryCreated();
      }

      toast({
        title: "Library created",
        description: `"${data.name}" library has been created.`
      });
    } catch (error: any) {
      toast({
        title: "Error creating library",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreatingLibrary(false);
    }
  };

  const handleUpdateLibrary = async () => {
    if (!editLibrary) return;

    try {
      const { data, error } = await supabase
        .from('user_libraries')
        .update({ 
          name: editLibrary.name.trim(),
          is_shared: editLibrary.is_shared 
        })
        .eq('id', editLibrary.id)
        .select()
        .single();

      if (error) throw error;

      setLibraries(libraries.map(lib => lib.id === data.id ? data : lib));
      setEditLibrary(null);

      toast({
        title: "Library updated",
        description: `"${data.name}" library has been updated.`
      });
    } catch (error: any) {
      toast({
        title: "Error updating library",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setLibraryToDelete(id);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteLibrary = async () => {
    if (!libraryToDelete || !user) {
      setDeleteDialogOpen(false);
      return;
    }

    // Prevent deletion if it's the only library
    if (libraries.length <= 1) {
      toast({
        title: "Cannot delete library",
        description: "You must have at least one library.",
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeletingLibrary(true);

      // First, delete any shared library permissions for this library
      const { error: permissionsError } = await supabase
        .from('shared_library_permissions')
        .delete()
        .eq('library_id', libraryToDelete);
        
      if (permissionsError) throw permissionsError;

      // Then, update all clipboard items to set their library_id to null
      const { error: updateError } = await supabase
        .from('shared_clipboard_items')
        .update({ library_id: null })
        .eq('library_id', libraryToDelete);

      if (updateError) throw updateError;
      
      // Finally, delete the library
      const { error: deleteError } = await supabase
        .from('user_libraries')
        .delete()
        .eq('id', libraryToDelete);

      if (deleteError) throw deleteError;

      // Update local state
      setLibraries(libraries.filter(lib => lib.id !== libraryToDelete));

      // Notify the parent component about the deletion
      if (onLibraryDeleted) {
        onLibraryDeleted(libraryToDelete);
      }

      // If the deleted library was selected, select another one
      if (selectedLibraryId === libraryToDelete && libraries.length > 0) {
        const remainingLib = libraries.find(lib => lib.id !== libraryToDelete);
        if (remainingLib) {
          onSelect(remainingLib);
        }
      }

      toast({
        title: "Library deleted",
        description: "Library has been deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error deleting library",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeletingLibrary(false);
      setDeleteDialogOpen(false);
      setLibraryToDelete(null);
      setDeleteConfirmText('');
    }
  };

  const getLibraryName = (id: string | null) => {
    if (!id) return '';
    const library = libraries.find(lib => lib.id === id);
    return library ? library.name : '';
  };

  const isDeleteButtonDisabled = deleteConfirmText !== 'DELETE' || deletingLibrary;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library size={18} /> Manage Your Libraries
            </DialogTitle>
            <DialogDescription>
              Create and manage your clipboard libraries. Select a library to save items to it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {libraries.map((library) => (
                    <Card 
                      key={library.id} 
                      className={`overflow-hidden transition ${selectedLibraryId === library.id ? 'border-primary' : ''}`}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          {editLibrary?.id === library.id ? (
                            <div className="space-y-2">
                              <Input 
                                value={editLibrary.name} 
                                onChange={e => setEditLibrary({...editLibrary, name: e.target.value})} 
                                className="w-full"
                              />
                              
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id={`share-lib-${library.id}`}
                                  checked={editLibrary.is_shared}
                                  onCheckedChange={(checked) => setEditLibrary({...editLibrary, is_shared: checked})}
                                />
                                <Label htmlFor={`share-lib-${library.id}`}>Shared library</Label>
                              </div>
                              
                              <div className="flex space-x-2 mt-2">
                                <Button size="sm" onClick={handleUpdateLibrary}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditLibrary(null)}>Cancel</Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => {
                                    setEditLibrary(null);
                                    openDeleteConfirmation(library.id);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center">
                                <button 
                                  className="font-medium text-left cursor-pointer hover:text-primary transition-colors flex-1"
                                  onClick={() => onSelect(library)}
                                >
                                  {library.name}
                                </button>
                              </div>
                              {library.is_shared && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Shared library
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {editLibrary?.id !== library.id && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setEditLibrary(library)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive/90"
                              onClick={() => openDeleteConfirmation(library.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="pt-2 border-t mt-4">
                  <h3 className="text-sm font-medium mb-2">Create new library</h3>
                  <div className="space-y-2">
                    <Input 
                      placeholder="Library name"
                      value={newLibraryName}
                      onChange={e => setNewLibraryName(e.target.value)}
                    />
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Switch 
                        id="new-lib-shared"
                        checked={isShared}
                        onCheckedChange={setIsShared}
                      />
                      <Label htmlFor="new-lib-shared">Shared library</Label>
                    </div>
                    
                    <Button 
                      onClick={handleCreateLibrary} 
                      disabled={!newLibraryName.trim() || creatingLibrary}
                      className="w-full"
                    >
                      {creatingLibrary ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Create Library
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={18} /> Delete Library
            </AlertDialogTitle>
            <AlertDialogDescription>
              {libraryItems > 0 
                ? `This library contains ${libraryItems} item${libraryItems === 1 ? '' : 's'}. Deleting it will disassociate all items from this library.` 
                : "Are you sure you want to delete this library?"}
              <br/><br/>
              The items will remain in your account but won't be associated with any library.
              <br/><br/>
              To confirm deletion of "{getLibraryName(libraryToDelete)}", please type <strong>DELETE</strong> below:
            </AlertDialogDescription>
            
            <div className="mt-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-2"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLibrary}
              disabled={isDeleteButtonDisabled}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingLibrary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete Library"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LibraryManager;
