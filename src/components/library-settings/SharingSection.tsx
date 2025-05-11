
import React from 'react';
import { Share } from 'lucide-react';
import ShareEmailInput from './ShareEmailInput';
import SharePermissionsList from './SharePermissionsList';
import { SharePermission } from './types';

interface SharingSectionProps {
  email: string;
  setEmail: (email: string) => void;
  canEdit: boolean;
  setCanEdit: (value: boolean) => void;
  canDelete: boolean;
  setCanDelete: (value: boolean) => void;
  onAddPermission: () => void;
  permissions: SharePermission[];
  onRemovePermission: (permissionId: string) => void;
  loadingPermissions: boolean;
  isShared: boolean;
  wasShared: boolean;
}

const SharingSection = ({
  email,
  setEmail,
  canEdit,
  setCanEdit,
  canDelete,
  setCanDelete,
  onAddPermission,
  permissions,
  onRemovePermission,
  loadingPermissions,
  isShared,
  wasShared
}: SharingSectionProps) => {
  if (!isShared) {
    if (wasShared) {
      return (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          <p>Warning: Turning off sharing will revoke access for all users when you save.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Share size={16} /> 
        Share with users
      </h3>

      <ShareEmailInput
        email={email}
        setEmail={setEmail}
        canEdit={canEdit}
        setCanEdit={setCanEdit}
        canDelete={canDelete}
        setCanDelete={setCanDelete}
        onAddPermission={onAddPermission}
      />

      <SharePermissionsList
        permissions={permissions}
        onRemovePermission={onRemovePermission}
        loadingPermissions={loadingPermissions}
      />

      <div className="text-sm text-muted-foreground">
        <p>Note: Shared libraries can be accessed by users you explicitly share them with.</p>
      </div>
    </div>
  );
};

export default SharingSection;
