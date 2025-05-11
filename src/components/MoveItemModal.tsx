
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoveRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
}

interface MoveItemModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  currentLibraryId: string | null;
  onMoveComplete: () => void;
}

const MoveItemModal: React.FC<MoveItemModalProps> = ({
  open,
  onClose,
  itemId,
  currentLibraryId,
  onMoveComplete
}) => {
  const [libraries, setLibraries] = useState<UserLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch libraries that the user has access to
  useEffect(() => {
    if (!user || !open) return;
    
    fetchLibraries();
  }, [user, open]);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      
      // Fetch user's own libraries
      const { data: ownLibraries, error: ownError } = await supabase
        .from('user_libraries')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: true });
      
      if (ownError) throw ownError;
      
      // Fetch libraries that have been shared with the user and they have edit permissions
      const { data: permissions, error: permError } = await supabase
        .from('shared_library_permissions')
        .select('library_id')
        .eq('shared_with', user?.id)
        .eq('can_edit', true);
      
      if (permError) throw permError;
      
      let allLibraries = ownLibraries || [];
      
      // If there are shared libraries with edit permissions, fetch their details
      if (permissions && permissions.length > 0) {
        const sharedLibraryIds = permissions.map(p => p.library_id);
        
        const { data: sharedLibraries, error: sharedError } = await supabase
          .from('user_libraries')
          .select('*')
          .in('id', sharedLibraryIds);
          
        if (sharedError) throw sharedError;
        
        if (sharedLibraries) {
          allLibraries = [...allLibraries, ...sharedLibraries];
        }
      }
      
      // Filter out the current library
      const filteredLibraries = allLibraries.filter(lib => lib.id !== currentLibraryId);
      setLibraries(filteredLibraries);
      
      // Set first library as default selection if any exist
      if (filteredLibraries.length > 0) {
        setSelectedLibraryId(filteredLibraries[0].id);
      } else {
        setSelectedLibraryId(null);
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

  const handleMove = async () => {
    if (!selectedLibraryId) {
      toast({
        title: "No target library selected",
        description: "Please select a library to move this item to.",
        variant: "destructive"
      });
      return;
    }

    try {
      setMoving(true);
      
      // Update the item's library_id
      const { error } = await supabase
        .from('shared_clipboard_items')
        .update({ library_id: selectedLibraryId })
        .eq('id', itemId);
        
      if (error) throw error;
      
      toast({
        title: "Item moved successfully",
        description: "The item has been moved to the selected library."
      });
      
      onMoveComplete();
      onClose();
    } catch (error: any) {
      console.error('Error moving item:', error);
      toast({
        title: "Failed to move item",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move to Another Library</DialogTitle>
          <DialogDescription>
            Select a target library to move this item to.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : libraries.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <p>No other libraries available.</p>
            <p className="text-sm mt-1">You need at least one other library you can edit.</p>
          </div>
        ) : (
          <div className="py-4">
            <Select
              value={selectedLibraryId || undefined}
              onValueChange={(value) => setSelectedLibraryId(value)}
              disabled={libraries.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a library" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map((library) => (
                  <SelectItem key={library.id} value={library.id}>
                    {library.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedLibraryId || moving || libraries.length === 0}
            className="gap-2"
          >
            {moving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Moving...</>
            ) : (
              <><MoveRight className="h-4 w-4" /> Move</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveItemModal;
