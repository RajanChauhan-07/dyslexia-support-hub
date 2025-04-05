
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file with improved error handling and chunking for large documents
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF extraction');
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document with improved error handling
    console.log('Creating PDF loading task');
    
    // Add timeout to prevent hanging
    const loadingPromise = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF loading timed out after 60 seconds')), 60000)
    );
    
    // Use Promise.race to implement timeout
    const pdf = await Promise.race([loadingPromise, timeoutPromise]) as pdfjsLib.PDFDocumentProxy;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    // For very large PDFs, warn the user
    if (pdf.numPages > 100) {
      console.log(`Large PDF detected (${pdf.numPages} pages). Processing may take longer.`);
    }
    
    let fullText = '';
    const maxProcessPages = Math.min(pdf.numPages, 300); // Limit to 300 pages max
    
    // Extract text from each page with better error handling
    for (let i = 1; i <= maxProcessPages; i++) {
      try {
        console.log(`Processing page ${i} of ${maxProcessPages}`);
        const page = await pdf.getPage(i);
        
        // Try structured extraction first (works better for most PDFs)
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // If we got very little text, try alternate method
        if (pageText.trim().length < 10 && textContent.items.length < 5) {
          // Fallback to rendering and OCR-like approach for problematic PDFs
          console.log(`Page ${i} has very little text, trying alternate extraction`);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not create canvas context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // For now, just use the sparse text we have
          // In a full implementation, we would use an OCR library here
          fullText += pageText + '\n\n';
        } else {
          fullText += pageText + '\n\n';
        }
        
        // Release page resources
        page.cleanup();
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        fullText += `[Error extracting text from page ${i}]\n\n`;
      }
      
      // Every 10 pages, check if we've already got a reasonable amount of text
      if (i % 10 === 0 && fullText.length > 50000) {
        console.log(`Already extracted ${fullText.length} characters. Stopping early to prevent timeout.`);
        fullText += `\n\n[Note: Document was partially processed. Only the first ${i} of ${pdf.numPages} pages were extracted due to size limitations.]\n`;
        break;
      }
    }
    
    console.log('PDF extraction completed successfully');
    
    // If we got very little text from the whole document, throw an error
    if (fullText.trim().length < 20) {
      throw new Error('Could not extract meaningful text from this PDF. It may be scanned or contain only images.');
    }
    
    // If the PDF was larger than our max processed pages, add a note
    if (pdf.numPages > maxProcessPages) {
      fullText += `\n\n[Note: This document has been truncated. Only the first ${maxProcessPages} of ${pdf.numPages} pages were processed due to size limitations.]\n`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    // Provide a more helpful error message
    if (error instanceof Error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF. Please try another document or format.');
  }
};

/**
 * Extracts text from a Word document with improved error handling
 */
export const extractTextFromWord = async (file: File): Promise<string> => {
  try {
    console.log('Starting Word document extraction');
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from the Word document with timeout
    const extractionPromise = mammoth.extractRawText({ arrayBuffer });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Word extraction timed out after 30 seconds')), 30000)
    );
    
    // Use Promise.race to implement timeout
    const result = await Promise.race([extractionPromise, timeoutPromise]) as any;
    
    console.log('Word extraction completed');
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text could be extracted from this Word document.');
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting Word text:', error);
    if (error instanceof Error) {
      throw new Error(`Word document extraction failed: ${error.message}`);
    }
    throw new Error('Failed to extract text from Word document. Please try another document or format.');
  }
};

/**
 * Process large texts by chunking them into manageable segments
 */
export const processLargeText = (text: string, maxChunkSize = 100000): string => {
  if (text.length <= maxChunkSize) {
    return text;
  }
  
  console.log(`Text is very large (${text.length} characters). Truncating to prevent performance issues.`);
  
  // Try to find a good breaking point near maxChunkSize
  let breakPoint = maxChunkSize;
  
  // Look for paragraph breaks
  const paragraphBreak = text.lastIndexOf('\n\n', maxChunkSize);
  if (paragraphBreak > maxChunkSize * 0.8) {
    breakPoint = paragraphBreak;
  } else {
    // Look for sentence breaks
    const sentenceBreak = Math.max(
      text.lastIndexOf('. ', maxChunkSize),
      text.lastIndexOf('? ', maxChunkSize),
      text.lastIndexOf('! ', maxChunkSize)
    );
    
    if (sentenceBreak > maxChunkSize * 0.8) {
      breakPoint = sentenceBreak + 2; // Include the period and space
    }
  }
  
  const truncatedText = text.substring(0, breakPoint);
  return truncatedText + '\n\n[Note: This document has been truncated due to its large size. Consider breaking it into smaller documents for better performance.]';
};

/**
 * Processes an uploaded file and extracts text based on file type with enhanced error handling
 */
export const processDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  console.log('Processing document of type:', fileType);
  
  try {
    // Check file size
    const maxSizeMB = 15;
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
    }
    
    let extractedText = '';
    
    // Handle PDF files
    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(file);
    } 
    // Handle Word documents
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileType === 'application/msword'
    ) {
      extractedText = await extractTextFromWord(file);
    } 
    // Handle text files
    else if (fileType === 'text/plain') {
      extractedText = await file.text();
    } else {
      throw new Error('Unsupported file type. Please upload a PDF, Word document, or text file.');
    }
    
    // Process very large texts to prevent performance issues
    return processLargeText(extractedText);
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};
