
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PermissionsSelector from './PermissionsSelector';

interface ShareEmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  canEdit: boolean;
  setCanEdit: (value: boolean) => void;
  canDelete: boolean;
  setCanDelete: (value: boolean) => void;
  onAddPermission: () => void;
}

const ShareEmailInput = ({
  email,
  setEmail,
  canEdit,
  setCanEdit,
  canDelete,
  setCanDelete,
  onAddPermission
}: ShareEmailInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="share-email" className="mb-1 block">Email address</Label>
        <Input 
          id="share-email" 
          type="email" 
          placeholder="user@example.com" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
      </div>

      <PermissionsSelector 
        canEdit={canEdit} 
        canDelete={canDelete} 
        setCanEdit={setCanEdit} 
        setCanDelete={setCanDelete} 
      />

      <div className="flex justify-end">
        <Button 
          onClick={onAddPermission} 
          disabled={!email.trim()} 
          size="sm" 
          className="bg-neutral-900 hover:bg-neutral-800"
        >
          Add User
        </Button>
      </div>
    </div>
  );
};

export default ShareEmailInput;
