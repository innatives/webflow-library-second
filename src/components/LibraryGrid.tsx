import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Library, Settings } from 'lucide-react';
import SharedClipboardItem from './SharedClipboardItem';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';

interface LibraryGridProps {
  libraryId: string | null;
}

interface SharedItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
  created_by: string | null;
  screenshot_url?: string | null;
  library_id: string | null;
}

interface LibraryDetails {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
  created_by: string;
  isOwner: boolean;
}

const LibraryGrid: React.FC<LibraryGridProps> = ({ libraryId }) => {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [libraryDetails, setLibraryDetails] = useState<LibraryDetails | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (libraryId && user) {
      fetchLibraryItems(libraryId);
      fetchLibraryDetails(libraryId);
      checkLibraryPermissions(libraryId);
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [libraryId, user]);

  const fetchLibraryDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('user_libraries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setLibraryDetails({
          ...data,
          isOwner: data.created_by === user?.id
        });
      }
    } catch (err) {
      console.error('Error fetching library details:', err);
    }
  };

  const checkLibraryPermissions = async (id: string) => {
    try {
      if (!user) return;

      // Check if the user owns this library
      const { data: ownLibrary, error: ownError } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (!ownError && ownLibrary) {
        setHasEditPermission(true);
        setHasDeletePermission(true);
        return;
      }

      // If not the owner, check permissions
      const { data: permissions, error: permError } = await supabase
        .from('shared_library_permissions')
        .select('can_edit, can_delete')
        .eq('library_id', id)
        .eq('shared_with', user.id)
        .single();

      if (!permError && permissions) {
        setHasEditPermission(permissions.can_edit);
        setHasDeletePermission(permissions.can_delete);
      } else {
        setHasEditPermission(false);
        setHasDeletePermission(false);
      }
    } catch (err) {
      console.error('Error checking library permissions:', err);
      setHasEditPermission(false);
      setHasDeletePermission(false);
    }
  };

  const fetchLibraryItems = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('shared_clipboard_items')
        .select('*')
        .eq('library_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching library items:', err);
      setError(err.message);
      toast({
        title: "Error loading library content",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!hasDeletePermission && !(items.find(item => item.id === id)?.created_by === user?.id)) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete this item",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_clipboard_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setItems(items.filter(item => item.id !== id));
      
      toast({
        title: "Item deleted",
        description: "The item has been successfully removed"
      });
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleItemMoved = () => {
    // Refresh the library items if an item was moved
    if (libraryId) {
      fetchLibraryItems(libraryId);
    }
  };

  const renderManageLibraryButton = () => {
    // Only show the button if the user is the owner or has edit/delete permissions
    if (libraryDetails?.isOwner || hasEditPermission || hasDeletePermission) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => window.dispatchEvent(new CustomEvent('open-library-settings', { 
            detail: { libraryId: libraryId } 
          }))}
        >
          <Settings size={16} />
          Manage Library
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!libraryId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Library className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Select a library to view its contents</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {renderManageLibraryButton() && (
          <div className="mb-4 flex justify-end">
            {renderManageLibraryButton()}
          </div>
        )}
        <div className="text-center py-12 border rounded-lg bg-card">
          <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No items in this library</p>
          <p className="text-sm text-muted-foreground mt-2">
            Use the + button to add items from clipboard
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {renderManageLibraryButton() && (
        <div className="mb-4 flex justify-end">
          {renderManageLibraryButton()}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <SharedClipboardItem 
            key={item.id} 
            item={item} 
            onDelete={handleDelete}
            onMoved={handleItemMoved}
            canDelete={hasDeletePermission || (item.created_by === user?.id)}
            canEdit={hasEditPermission || (item.created_by === user?.id)}
            showMoveOption={true}
          />
        ))}
      </div>
    </>
  );
};

export default LibraryGrid;
