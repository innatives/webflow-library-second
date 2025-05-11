
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LibraryNameField from './LibraryNameField';
import SharingToggle from './SharingToggle';
import SharingSection from './SharingSection';
import ConfirmRevokeDialog from './ConfirmRevokeDialog';
import DeleteLibraryDialog from './DeleteLibraryDialog';
import useLibrarySettings from './useLibrarySettings';
import { LibrarySettingsManagerProps } from './types';
import { Separator } from '@/components/ui/separator';

const LibrarySettingsManager: React.FC<LibrarySettingsManagerProps> = ({
  open,
  onClose,
  library,
  onLibraryUpdated,
  onLibraryDeleted
}) => {
  const {
    name,
    setName,
    isShared,
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
  } = useLibrarySettings(library, onLibraryUpdated, onClose, onLibraryDeleted);

  // Only allow deletion if the user is the owner (not a shared library)
  const isOwnLibrary = !library.shared_by;

  return <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={18} /> Library Settings
            </DialogTitle>
            <DialogDescription>
              Update library name and sharing settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <LibraryNameField name={name} setName={setName} />
            
            <SharingToggle isShared={isShared} onToggle={handleSharingToggle} />
            
            <SharingSection 
              email={email} 
              setEmail={setEmail} 
              canEdit={canEdit} 
              setCanEdit={setCanEdit} 
              canDelete={canDelete} 
              setCanDelete={setCanDelete} 
              onAddPermission={handleAddPermission} 
              permissions={permissions} 
              onRemovePermission={handleRemovePermission} 
              loadingPermissions={loadingPermissions} 
              isShared={isShared} 
              wasShared={library.is_shared} 
            />

            {isOwnLibrary && (
              <>
                <Separator className="my-4" />
                
                <div>
                  <h3 className="text-sm font-medium mb-2 text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Once you delete a library, there is no going back.
                  </p>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowDeleteConfirmDialog(true)}
                  >
                    <Trash2 size={16} />
                    Delete Library
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting || !name.trim()} className="bg-neutral-900 hover:bg-neutral-800">
              {saving ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmRevokeDialog 
        open={showConfirmDialog} 
        onOpenChange={setShowConfirmDialog} 
        onConfirm={confirmRevokeAccess} 
        onCancel={cancelRevokeAccess} 
      />

      <DeleteLibraryDialog 
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
        onConfirm={handleDeleteLibrary}
        onCancel={() => setShowDeleteConfirmDialog(false)}
        libraryName={library.name}
        deleteText={deleteLibraryText}
        onDeleteTextChange={setDeleteLibraryText}
        deleting={deleting}
        itemCount={libraryItemCount}
      />
    </>;
};

export default LibrarySettingsManager;
