import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface DocumentUploaderProps {
  onTextExtracted: (text: string) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onTextExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Re-process the current file when user logs in
  useEffect(() => {
    if (user && currentFile) {
      handleFileProcessing(currentFile);
    }
  }, [user]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
      }).promise;

      let fullText = '';
      let wordCount = 0;
      const maxWords = !user ? 100 : Infinity;

      // Process pages until we hit the word limit or process all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (wordCount >= maxWords && !user) break;

        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        
        for (const item of content.items) {
          const words = (item as any).str.split(/\s+/).filter(Boolean);
          
          if (!user && wordCount + words.length > maxWords) {
            // Add only enough words to reach the limit
            const remainingWords = maxWords - wordCount;
            fullText += words.slice(0, remainingWords).join(' ') + ' ';
            wordCount = maxWords;
            break;
          }
          
          fullText += (item as any).str + ' ';
          wordCount += words.length;
        }
        
        fullText += '\n\n';
        
        if (wordCount >= maxWords && !user) {
          fullText += '... Sign in to access the full text ...';
          break;
        }
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileProcessing = async (file: File) => {
    try {
      setIsLoading(true);
      const text = await extractTextFromPDF(file);
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from this PDF');
      }

      onTextExtracted(text);
      
      toast({
        title: user ? "Success" : "Preview Mode",
        description: user 
          ? "Full PDF text extracted successfully!" 
          : "Preview mode: First 100 words shown. Sign in to access the full document.",
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Error Processing PDF",
        description: error instanceof Error ? error.message : 'Failed to process PDF',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }

    // Store the current file for potential reprocessing after login
    setCurrentFile(file);
    await handleFileProcessing(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing PDF...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {user ? 'Upload PDF' : 'Upload PDF (Preview)'}
          </>
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {isLoading && (
        <p className="text-sm text-muted-foreground">
          Extracting text from PDF...
        </p>
      )}
      {!user && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Preview limited to first 100 words. Sign in for full access.
        </p>
      )}
    </div>
  );
};

export default DocumentUploader;
