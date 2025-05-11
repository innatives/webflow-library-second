
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SharingToggleProps {
  isShared: boolean;
  onToggle: (newSharedState: boolean) => void;
}

const SharingToggle = ({ isShared, onToggle }: SharingToggleProps) => {
  return (
    <div className="flex items-center space-x-2 pt-2">
      <Switch 
        id="share-library"
        checked={isShared}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="share-library">Shared library</Label>
    </div>
  );
};

export default SharingToggle;
