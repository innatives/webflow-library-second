
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SharePermission } from './types';

interface SharePermissionsListProps {
  permissions: SharePermission[];
  onRemovePermission: (permissionId: string) => void;
  loadingPermissions: boolean;
}

const SharePermissionsList = ({ 
  permissions, 
  onRemovePermission,
  loadingPermissions
}: SharePermissionsListProps) => {
  if (loadingPermissions) {
    return <div className="text-center py-2 text-sm text-muted-foreground">Loading permissions...</div>;
  }
  
  if (permissions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-sm font-medium">Shared with:</h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {permissions.map(perm => (
          <div key={perm.id} className="flex justify-between items-center py-2 px-3 border rounded-md">
            <div className="text-sm truncate font-mono">
              {perm.shared_with}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemovePermission(perm.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharePermissionsList;
