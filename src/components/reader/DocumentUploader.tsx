
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { processDocument } from '@/utils/documentProcessing';

interface DocumentUploaderProps {
  onTextExtracted: (text: string) => void;
}

const DocumentUploader = ({ onTextExtracted }: DocumentUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    
    try {
      // Check file type with improved logging
      if (!file.type.includes('pdf') && 
          !file.type.includes('word') && 
          !file.type.includes('document') &&
          !file.type.includes('text/plain')) {
        throw new Error('Please upload a PDF, Word document, or text file.');
      }
      
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 10MB.');
      }
      
      // Process document with enhanced error handling
      let extractedText;
      try {
        extractedText = await processDocument(file);
      } catch (processingError) {
        console.error('Document processing error:', processingError);
        throw new Error(`Could not process this ${file.type.includes('pdf') ? 'PDF' : 'document'}. Please try another file.`);
      }
      
      if (!extractedText || extractedText.trim() === '') {
        throw new Error('No text could be extracted from this document.');
      }
      
      // Pass extracted text to parent component
      onTextExtracted(extractedText);
      
      // Close dialog and show success toast
      setIsDialogOpen(false);
      toast({
        title: "Document Processed",
        description: `Successfully extracted text from "${file.name}"`,
      });
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        variant="outline" 
        className="rounded-full px-6 transition-all gap-2"
      >
        <Upload className="h-4 w-4" /> Upload Document
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a PDF, Word document, or text file to extract its content for reading.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div 
              onClick={handleDropZoneClick}
              className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Drag and drop your document here or click to browse.
                <br />
                Supports PDF, Word, and text files (max 10MB).
              </p>
              
              <Button 
                variant="default" 
                className="w-full"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDropZoneClick();
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentUploader;
