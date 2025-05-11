
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface LibraryNameFieldProps {
  name: string;
  setName: (name: string) => void;
}

const LibraryNameField = ({ name, setName }: LibraryNameFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="library-name">Library name</Label>
      <Input 
        id="library-name"
        placeholder="Library name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
    </div>
  );
};

export default LibraryNameField;
