
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

interface ConfirmRevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmRevokeDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: ConfirmRevokeDialogProps) => {
  const handleCancel = (e: React.MouseEvent) => {
    // Prevent event propagation
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  const handleConfirm = (e: React.MouseEvent) => {
    // Prevent event propagation
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
  };

  // We'll create a custom onOpenChange handler to prevent accidental closing
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
          <AlertDialogTitle>Revoke sharing access?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove access for all users currently having access to this library. 
            This action can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Revoke Access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmRevokeDialog;
