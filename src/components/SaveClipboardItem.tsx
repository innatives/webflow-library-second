
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Save, Share, Loader2, Image, Camera, Upload } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import LibrarySelector from './LibrarySelector';

interface UserLibrary {
  id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
  shared_by?: string;
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters')
});

interface SaveClipboardItemProps {
  content: string;
  contentType: string;
  onSave?: () => void;
}

const SaveClipboardItem: React.FC<SaveClipboardItemProps> = ({ content, contentType, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [addScreenshot, setAddScreenshot] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [selectedLibrary, setSelectedLibrary] = useState<UserLibrary | null>(null);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ''
    },
  });

  // Check if the user has edit permission for the selected library
  useEffect(() => {
    if (user && selectedLibrary) {
      checkLibraryPermissions(selectedLibrary.id);
    }
  }, [selectedLibrary, user]);

  const checkLibraryPermissions = async (libraryId: string) => {
    if (!user) return;
    
    try {
      // Check if user owns this library
      const { data: ownLibrary, error: ownError } = await supabase
        .from('user_libraries')
        .select('id')
        .eq('id', libraryId)
        .eq('created_by', user.id)
        .single();

      if (!ownError && ownLibrary) {
        setHasEditPermission(true);
        return;
      }

      // If not the owner, check permissions
      const { data: permissions, error: permError } = await supabase
        .from('shared_library_permissions')
        .select('can_edit')
        .eq('library_id', libraryId)
        .eq('shared_with', user.id)
        .single();

      if (!permError && permissions) {
        setHasEditPermission(permissions.can_edit);
      } else {
        setHasEditPermission(false);
      }
    } catch (err) {
      console.error('Error checking library permissions:', err);
      setHasEditPermission(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImageUploading(true);
    
    // Read the selected file as a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageData(result);
      setImageUploading(false);
      
      toast({
        title: 'Image added',
        description: 'Your custom image has been attached to the item',
      });
    };
    
    reader.onerror = () => {
      setImageUploading(false);
      toast({
        title: 'Image upload failed',
        description: 'Unable to read the selected image',
        variant: 'destructive'
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleLibraryChange = (library: UserLibrary) => {
    setSelectedLibrary(library);
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!imageData) return null;
    
    try {
      // Convert base64 to blob
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      
      // Generate a unique filename
      const filename = `screenshot_${Date.now()}.jpg`;
      
      // For now, we're directly returning the base64 data
      // In a production app with Supabase Storage configured, we would upload to storage
      return imageData;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast({
        title: 'Image upload failed',
        description: 'Unable to upload the image',
        variant: 'destructive'
      });
      return null;
    }
  };

  const saveToSupabase = async (values: z.infer<typeof formSchema>) => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save items to your library.',
        variant: 'destructive'
      });
      
      // Redirect to auth page
      navigate('/auth');
      return;
    }
    
    // Check if a library is selected
    if (!selectedLibrary) {
      toast({
        title: 'No library selected',
        description: 'Please select a library to save this item to.',
        variant: 'destructive'
      });
      return;
    }

    // Check if the user has edit permission for this library
    if (selectedLibrary.shared_by && !hasEditPermission) {
      toast({
        title: 'Permission denied',
        description: 'You do not have edit permission for this shared library.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Upload screenshot if available
      let screenshotUrl = null;
      if (addScreenshot && imageData) {
        screenshotUrl = await uploadScreenshot();
      }
      
      const { data, error } = await supabase
        .from('shared_clipboard_items')
        .insert({
          title: values.title,
          content: content,
          content_type: contentType,
          created_by: user.id,
          screenshot_url: screenshotUrl,
          library_id: selectedLibrary.id
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Item saved',
        description: `Your clipboard item has been saved to "${selectedLibrary.name}".`,
      });
      
      form.reset();
      setImageData(null);
      setAddScreenshot(false);
      if (onSave) onSave();
    } catch (error: any) {
      let errorMessage = 'An error occurred while saving the item.';
      
      // Handle specific error messages
      if (error.message?.includes('row-level security policy')) {
        errorMessage = 'Authentication required. Please sign in to save items.';
        // Redirect to auth page for RLS errors
        setTimeout(() => navigate('/auth'), 1500);
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'You do not have permission to save items to this library.';
      }
      
      toast({
        title: 'Error saving item',
        description: errorMessage,
        variant: 'destructive'
      });
      console.error('Error saving to Supabase:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(saveToSupabase)} className="space-y-3 border-t pt-3 mt-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter a title for this clipboard item" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                This title will help you identify the item later
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Library</Label>
            <LibrarySelector
              selectedLibraryId={selectedLibrary?.id || null}
              onLibraryChange={handleLibraryChange}
              disabled={isSaving}
            />
            {selectedLibrary?.shared_by && (
              <p className="text-xs text-amber-500">
                {hasEditPermission 
                  ? "This is a shared library you have edit access to."
                  : "Warning: You don't have permission to add items to this shared library."}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Select which library to save this item to
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="add-screenshot"
            checked={addScreenshot}
            onCheckedChange={setAddScreenshot}
          />
          <Label htmlFor="add-screenshot">Add a custom image</Label>
        </div>
        
        {addScreenshot && (
          <div className="border rounded-md p-4">
            <div className="mb-3 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Attach an image to help identify this item</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleBrowseClick}
                disabled={imageUploading}
                className="gap-1"
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </>
                )}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="bg-muted/50 rounded-md p-2 border min-h-[100px] flex items-center justify-center">
              {imageData ? (
                <img 
                  src={imageData} 
                  alt="Selected image" 
                  className="max-h-32 w-auto object-contain rounded-sm shadow-sm" 
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Image className="h-8 w-8 mb-2" />
                  <span className="text-sm">Selected image will appear here</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={isSaving || !selectedLibrary || (selectedLibrary?.shared_by && !hasEditPermission)} 
          className="w-full gap-2"
          variant="outline"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Share className="h-4 w-4" />
              {!user ? 'Sign in to Save' : 
                selectedLibrary?.shared_by && !hasEditPermission ? 
                'No Edit Permission' : 'Save to Library'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SaveClipboardItem;
