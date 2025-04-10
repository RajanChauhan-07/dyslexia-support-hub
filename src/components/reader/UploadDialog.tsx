import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface UploadDialogProps {
  onTextExtracted: (text: string) => void;
}

export default function UploadDialog({ onTextExtracted }: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  };

  const extractTextFromTXT = async (file: File): Promise<string> => {
    try {
      const text = await file.text();
      return text.trim();
    } catch (error) {
      console.error('TXT extraction error:', error);
      throw new Error('Failed to extract text from TXT');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setError(null);

    try {
      let extractedText = '';
      
      switch (file.type) {
        case 'application/pdf':
          extractedText = await extractTextFromPDF(file);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await extractTextFromDOCX(file);
          break;
        case 'text/plain':
          extractedText = await extractTextFromTXT(file);
          break;
        default:
          throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from this document.');
      }

      onTextExtracted(extractedText);
      setIsOpen(false);
      setSelectedFile(null);
      
      toast({
        title: "Success",
        description: "Document processed successfully!",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process document');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors rounded-full px-6"
        >
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Upload Your Document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6">
          <div
            onClick={handleUploadClick}
            className={`
              w-full max-w-[300px] h-[200px] 
              border-2 border-dashed rounded-lg 
              flex flex-col items-center justify-center gap-4 
              cursor-pointer transition-colors
              ${isLoading ? 'bg-gray-50' : 'hover:bg-gray-50'}
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground">Processing document...</p>
              </>
            ) : selectedFile ? (
              <>
                <FileText className="h-8 w-8 text-blue-600" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to choose a different file</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-blue-600" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
                <p className="text-xs text-muted-foreground">(max 20MB)</p>
              </>
            )}
          </div>
          
          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 