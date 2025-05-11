
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle } from 'lucide-react';

interface DeleteLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  libraryName: string;
  deleteText: string;
  onDeleteTextChange: (text: string) => void;
  deleting: boolean;
  itemCount: number;
}

const DeleteLibraryDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  libraryName,
  deleteText,
  onDeleteTextChange,
  deleting,
  itemCount
}: DeleteLibraryDialogProps) => {
  const isButtonDisabled = deleteText !== 'DELETE' || deleting;

  // Custom onOpenChange handler to prevent accidental closing
  const handleOpenChange = (isOpen: boolean) => {
    // Only allow programmatic closing (through the Cancel and Confirm buttons)
    if (isOpen === false) {
      // Don't auto-close when clicking outside
      return;
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle size={18} /> Delete Library
          </AlertDialogTitle>
          <AlertDialogDescription>
            {itemCount > 0 
              ? `This library contains ${itemCount} item${itemCount === 1 ? '' : 's'}. Deleting it will disassociate all items from this library.` 
              : "Are you sure you want to delete this library?"}
            <br/><br/>
            The items will remain in your account but won't be associated with any library.
            <br/><br/>
            To confirm deletion of "{libraryName}", please type <strong>DELETE</strong> below:
          </AlertDialogDescription>
          
          <div className="mt-4">
            <Input
              value={deleteText}
              onChange={(e) => onDeleteTextChange(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-2"
            />
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isButtonDisabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : "Delete Library"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLibraryDialog;
