
import { useState, useRef, useEffect } from 'react';
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
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setProcessingProgress(10); // Initial progress indicator
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Set a longer timeout for larger files
    const timeoutDuration = file.size > 5 * 1024 * 1024 ? 60000 : 30000; // 60s for files > 5MB
    
    processingTimeoutRef.current = setTimeout(() => {
      if (isUploading) {
        setIsUploading(false);
        toast({
          title: "Processing Timeout",
          description: "Document processing took too long. Please try a smaller or different file.",
          variant: "destructive"
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }, timeoutDuration);
    
    try {
      if (!file.type.includes('pdf') && 
          !file.type.includes('word') && 
          !file.type.includes('document') &&
          !file.type.includes('text/plain')) {
        throw new Error('Please upload a PDF, Word document, or text file.');
      }
      
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      const maxSizeMB = 15; // Increased to 15MB
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      }
      
      if (file.type.includes('pdf')) {
        // Show more detailed message for large PDFs
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Processing Large PDF",
            description: "Large PDFs may take longer to process and might be partially extracted. Please be patient...",
          });
        } else {
          toast({
            title: "Processing PDF",
            description: "PDF extraction may take a moment...",
          });
        }
      }
      
      // Update progress periodically to show the user something is happening
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          // Increase progress gradually, max out at 90% (save 100% for completion)
          return Math.min(90, prev + 5);
        });
      }, 1000);
      
      let extractedText;
      try {
        extractedText = await processDocument(file);
        clearInterval(progressInterval);
        setProcessingProgress(100);
        console.log("Text extraction successful:", extractedText.length > 100 ? extractedText.substring(0, 100) + "..." : extractedText);
      } catch (processingError: any) {
        clearInterval(progressInterval);
        console.error('Document processing error:', processingError);
        
        if (file.type.includes('pdf')) {
          throw new Error(`PDF processing failed. This may be due to encryption, complex formatting, or scanned content. Try a different PDF or manually copy the text.`);
        } else {
          throw new Error(`Could not process this ${file.type.includes('pdf') ? 'PDF' : 'document'}: ${processingError.message || 'Unknown error'}`);
        }
      }
      
      if (!extractedText || extractedText.trim() === '') {
        if (file.type.includes('pdf')) {
          throw new Error('No text could be extracted from this PDF. It may contain only images or be scanned without OCR.');
        } else {
          throw new Error('No text could be extracted from this document.');
        }
      }
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      onTextExtracted(extractedText);
      
      setIsDialogOpen(false);
      
      // Show word count in success message
      const wordCount = extractedText.split(/\s+/).length;
      const pageEstimate = Math.ceil(wordCount / 250); // Rough estimate: ~250 words per page
      
      toast({
        title: "Document Processed",
        description: `Successfully extracted ${wordCount.toLocaleString()} words (approximately ${pageEstimate} pages) from "${file.name}"`,
      });
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process document",
        variant: "destructive"
      });
    } finally {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      setIsUploading(false);
      setProcessingProgress(0);
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

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

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
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                Note: Large documents (200+ pages) may be partially processed. For best results with novels, 
                try uploading 50-100 pages at a time.
              </span>
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
                Supports PDF, Word, and text files (max 15MB).
              </p>
              
              {isUploading && processingProgress > 0 ? (
                <div className="w-full">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    Processing document ({processingProgress}%)...
                  </p>
                </div>
              ) : (
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
              )}
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
