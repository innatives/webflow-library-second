
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Image, File, Code, Trash2, Edit, Save, X, MoveRight } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MoveItemModal from './MoveItemModal';
import { Switch } from '@/components/ui/switch';

interface ClipboardItemProps {
  item: {
    id: string;
    title: string;
    content: string;
    content_type: string;
    created_at: string;
    screenshot_url?: string | null;
    library_id?: string | null;
  };
  onDelete?: (id: string) => void;
  onMoved?: () => void;
  canDelete?: boolean;
  canEdit?: boolean;
  showMoveOption?: boolean;
}

const SharedClipboardItem: React.FC<ClipboardItemProps> = ({ 
  item, 
  onDelete,
  onMoved,
  canDelete = true,
  canEdit = false,
  showMoveOption = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [saving, setSaving] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const { toast } = useToast();

  const hasImage = !!item.screenshot_url;
  const hasContent = !!item.content && item.content.trim().length > 0;
  const showToggle = hasImage && hasContent;

  const getIcon = () => {
    switch (item.content_type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'code':
        return <Code className="h-5 w-5" />;
      case 'file':
        return <File className="h-5 w-5" />;
      default:
        return <Clipboard className="h-5 w-5" />;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard"
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('shared_clipboard_items')
        .update({ 
          title: title.trim(),
          content: content 
        })
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Update the local item data
      item.title = title.trim();
      item.content = content;
      
      setIsEditing(false);
      toast({
        title: "Item updated",
        description: "Your changes have been saved"
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update item",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };

  const cancelEdit = () => {
    // Reset to original values
    setTitle(item.title);
    setContent(item.content);
    setIsEditing(false);
  };

  const handleMoveComplete = () => {
    if (onMoved) {
      onMoved();
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {showToggle && (
            <div className="flex items-center justify-end gap-2 p-2 bg-gray-50">
              <span className="text-xs text-muted-foreground">
                {showImage ? 'Image View' : 'Code View'}
              </span>
              <Switch
                checked={showImage}
                onCheckedChange={setShowImage}
              />
            </div>
          )}
          
          {hasImage && showImage && (
            <div className="aspect-[16/9] relative">
              <img 
                src={item.screenshot_url} 
                alt={item.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {getIcon()}
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-medium border rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <h3 className="font-medium">{item.title}</h3>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
              </span>
            </div>
            
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded p-2 text-sm min-h-[100px]"
              />
            ) : (
              <div className="text-sm max-h-32 overflow-y-auto">
                {(!hasImage || !showImage) && (
                  item.content_type === 'code' ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {item.content}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground line-clamp-3">{item.content}</p>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
          {isEditing ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelEdit}
                className="gap-1"
              >
                <X size={14} /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={saving}
                className="gap-1"
              >
                <Save size={14} /> Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
              >
                Copy
              </Button>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
              )}
              {showMoveOption && item.library_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMoveModalOpen(true)}
                >
                  <MoveRight size={14} className="mr-1" /> Move
                </Button>
              )}
            </div>
          )}
          
          {canDelete && !isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {moveModalOpen && (
        <MoveItemModal
          open={moveModalOpen}
          onClose={() => setMoveModalOpen(false)}
          itemId={item.id}
          currentLibraryId={item.library_id || null}
          onMoveComplete={handleMoveComplete}
        />
      )}
    </>
  );
};

export default SharedClipboardItem;
