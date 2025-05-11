
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { SharePermission, UserLibrary } from './types';

export const useLibrarySettings = (
  library: UserLibrary, 
  onLibraryUpdated: (library: UserLibrary) => void, 
  onClose: () => void,
  onLibraryDeleted?: (libraryId: string) => void
) => {
  const [name, setName] = useState(library.name);
  const [isShared, setIsShared] = useState(library.is_shared);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [permissions, setPermissions] = useState<SharePermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteLibraryText, setDeleteLibraryText] = useState('');
  const [libraryItemCount, setLibraryItemCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch existing permissions when the component mounts
  useEffect(() => {
    if (isShared && user && library?.id) {
      fetchPermissions();
    }
  }, [library?.id, user, isShared]);

  // Check how many items are in the library
  useEffect(() => {
    if (user && library?.id) {
      checkLibraryItems(library.id);
    }
  }, [library?.id, user]);

  const checkLibraryItems = async (libraryId: string) => {
    try {
      const { count, error } = await supabase
        .from('shared_clipboard_items')
        .select('*', { count: 'exact', head: true })
        .eq('library_id', libraryId);

      if (error) throw error;
      
      setLibraryItemCount(count || 0);
    } catch (error: any) {
      console.error("Error checking library items:", error);
    }
  };

  const fetchPermissions = async () => {
    if (!user || !library.id) return;

    try {
      setLoadingPermissions(true);
      
      const { data, error } = await supabase
        .from('shared_library_permissions')
        .select(`
          id,
          shared_with,
          can_edit,
          can_delete
        `)
        .eq('shared_by', user.id)
        .eq('library_id', library.id);
      
      if (error) throw error;
      
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching permissions",
        description: error.message || "Failed to load sharing permissions",
        variant: "destructive"
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSharingToggle = (newSharedState: boolean) => {
    // If turning off sharing, show confirmation dialog
    if (!newSharedState && library.is_shared) {
      setShowConfirmDialog(true);
    } else {
      // If turning on sharing, just update the state
      setIsShared(newSharedState);
    }
  };

  const confirmRevokeAccess = () => {
    setIsShared(false);
    setShowConfirmDialog(false);
  };

  const cancelRevokeAccess = () => {
    setShowConfirmDialog(false);
    // Reset the switch to its previous state
    setIsShared(library.is_shared);
  };

  const handleAddPermission = async () => {
    if (!email.trim() || !user || !library.id) return;
    
    try {
      // Use the database function to get the user ID from email
      const { data: userData, error: userError } = await supabase.rpc(
        'get_user_id_by_email',
        { email_input: email.toLowerCase().trim() }
      );
      
      if (userError || !userData) {
        toast({
          title: "User not found",
          description: "No user with that email address was found",
          variant: "destructive"
        });
        return;
      }
      
      const recipientId = userData;
      
      // Don't allow sharing with self
      if (recipientId === user.id) {
        toast({
          title: "Cannot share with yourself",
          description: "You already have full access to your own library",
          variant: "destructive"
        });
        return;
      }
      
      // Check if this specific library is already shared with this user
      const { data: existingPermission, error: checkError } = await supabase
        .from('shared_library_permissions')
        .select('id')
        .eq('shared_by', user.id)
        .eq('shared_with', recipientId)
        .eq('library_id', library.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingPermission) {
        toast({
          title: "Already shared",
          description: `You've already shared this library with this user`,
        });
        return;
      }
      
      // Create permission record for this specific library
      const { data, error } = await supabase
        .from('shared_library_permissions')
        .insert({
          shared_by: user.id,
          shared_with: recipientId,
          can_edit: canEdit,
          can_delete: canDelete,
          library_id: library.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Library shared",
        description: `"${library.name}" has been shared with ${email}`,
      });
      setEmail('');
      setCanEdit(false);
      setCanDelete(false);
      
      // Refresh permissions list
      fetchPermissions();
    } catch (error: any) {
      console.error("Sharing error:", error);
      toast({
        title: "Error sharing library",
        description: error.message || "An error occurred while sharing the library",
        variant: "destructive"
      });
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('shared_library_permissions')
        .delete()
        .eq('id', permissionId)
        .eq('shared_by', user.id);
      
      if (error) throw error;
      
      // Update local state
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      
      toast({
        title: "Sharing removed",
        description: "This user no longer has access to your library",
      });
    } catch (error: any) {
      toast({
        title: "Error removing sharing",
        description: error.message || "An error occurred removing sharing permission",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLibrary = async () => {
    if (!user || !library.id || deleteLibraryText !== 'DELETE') return;
    
    try {
      setDeleting(true);

      // First delete any shared library permissions for this library
      const { error: permissionsError } = await supabase
        .from('shared_library_permissions')
        .delete()
        .eq('library_id', library.id);
        
      if (permissionsError) throw permissionsError;

      // Then, update all clipboard items to set their library_id to null
      const { error: updateError } = await supabase
        .from('shared_clipboard_items')
        .update({ library_id: null })
        .eq('library_id', library.id);

      if (updateError) throw updateError;
      
      // Finally, delete the library
      const { error: deleteError } = await supabase
        .from('user_libraries')
        .delete()
        .eq('id', library.id)
        .eq('created_by', user.id);

      if (deleteError) throw deleteError;
      
      toast({
        title: "Library deleted",
        description: "Library has been deleted successfully."
      });
      
      // Notify parent component about deletion
      if (onLibraryDeleted) {
        onLibraryDeleted(library.id);
      }
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      toast({
        title: "Error deleting library",
        description: error.message || "An error occurred while deleting the library",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirmDialog(false);
      setDeleteLibraryText('');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !user) {
      toast({
        title: "Invalid library name",
        description: "Please provide a valid library name",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // First update library info
      const { data, error } = await supabase
        .from('user_libraries')
        .update({ 
          name: name.trim(),
          is_shared: isShared 
        })
        .eq('id', library.id)
        .select()
        .single();

      if (error) throw error;

      // If sharing has been turned off, delete all permissions
      if (!isShared && library.is_shared) {
        const { error: deleteError } = await supabase
          .from('shared_library_permissions')
          .delete()
          .eq('library_id', library.id)
          .eq('shared_by', user.id);
        
        if (deleteError) throw deleteError;
      }

      // Update the library in the parent component
      onLibraryUpdated(data as UserLibrary);

      toast({
        title: "Library updated",
        description: `Library settings have been updated successfully.`
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating library",
        description: error.message || "Failed to update library settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    isShared,
    setIsShared,
    saving,
    email,
    setEmail,
    canEdit,
    setCanEdit,
    canDelete,
    setCanDelete,
    showConfirmDialog,
    setShowConfirmDialog,
    permissions,
    loadingPermissions,
    handleSharingToggle,
    confirmRevokeAccess,
    cancelRevokeAccess,
    handleAddPermission,
    handleRemovePermission,
    handleSave,
    deleting, 
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    deleteLibraryText,
    setDeleteLibraryText,
    handleDeleteLibrary,
    libraryItemCount
  };
};

export default useLibrarySettings;
