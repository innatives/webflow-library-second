
export interface SharePermission {
  id: string;
  shared_with: string;
  can_edit: boolean;
  can_delete: boolean;
}

export interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
  shared_by?: string;
}

export interface LibrarySettingsManagerProps {
  open: boolean;
  onClose: () => void;
  library: UserLibrary;
  onLibraryUpdated: (library: UserLibrary) => void;
  onLibraryDeleted?: (libraryId: string) => void;
}
