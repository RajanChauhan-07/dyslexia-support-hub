
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file with improved error handling
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
    
    let fullText = '';
    
    // Extract text from each page with better error handling
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        console.log(`Processing page ${i} of ${pdf.numPages}`);
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
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        fullText += `[Error extracting text from page ${i}]\n\n`;
      }
    }
    
    console.log('PDF extraction completed successfully');
    
    // If we got very little text from the whole document, throw an error
    if (fullText.trim().length < 20) {
      throw new Error('Could not extract meaningful text from this PDF. It may be scanned or contain only images.');
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
 * Processes an uploaded file and extracts text based on file type with enhanced error handling
 */
export const processDocument = async (file: File): Promise<string> => {
  const fileType = file.type;
  console.log('Processing document of type:', fileType);
  
  try {
    // Handle PDF files
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    } 
    // Handle Word documents
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileType === 'application/msword'
    ) {
      return await extractTextFromWord(file);
    } 
    // Handle text files
    else if (fileType === 'text/plain') {
      return await file.text();
    }
    
    throw new Error('Unsupported file type. Please upload a PDF, Word document, or text file.');
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};
