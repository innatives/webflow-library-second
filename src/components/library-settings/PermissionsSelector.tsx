
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PermissionsSelectorProps {
  canEdit: boolean;
  canDelete: boolean;
  setCanEdit: (value: boolean) => void;
  setCanDelete: (value: boolean) => void;
}

const PermissionsSelector = ({ 
  canEdit, 
  canDelete, 
  setCanEdit, 
  setCanDelete 
}: PermissionsSelectorProps) => {
  return (
    <div className="w-full space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="permission-edit" className="text-sm">Can edit</Label>
        <Switch 
          id="permission-edit" 
          checked={canEdit} 
          onCheckedChange={setCanEdit}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="permission-delete" className="text-sm">Can delete</Label>
        <Switch 
          id="permission-delete" 
          checked={canDelete}
          onCheckedChange={setCanDelete}
        />
      </div>
    </div>
  );
};

export default PermissionsSelector;
