
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClipboardParser from './ClipboardParser';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ClipboardParserModalProps {
  open: boolean;
  onClose: () => void;
}

const ClipboardParserModal: React.FC<ClipboardParserModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" closeButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Clipboard Parser</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X size={16} />
          </Button>
        </DialogHeader>
        <DialogDescription>
          Paste content or drop files to parse them
        </DialogDescription>
        <div className="mt-4">
          <ClipboardParser inModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClipboardParserModal;
