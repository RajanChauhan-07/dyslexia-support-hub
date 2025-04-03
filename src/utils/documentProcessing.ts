
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
// We need to set the worker source to a CDN URL that serves the PDF.js worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/build/pdf.worker.min.js';

/**
 * Extracts text from a PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF extraction');
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
    console.log('PDF loading task created');
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    console.log('PDF extraction completed');
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extracts text from a Word document
 */
export const extractTextFromWord = async (file: File): Promise<string> => {
  try {
    console.log('Starting Word document extraction');
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from the Word document
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    console.log('Word extraction completed');
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting Word text:', error);
    throw new Error('Failed to extract text from Word document');
  }
};

/**
 * Processes an uploaded file and extracts text based on file type
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
