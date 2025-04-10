import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { createWorker, createScheduler } from 'tesseract.js';

// Instead of loading external worker, use inline worker
const pdfjsWorker = `
  importScripts("https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js");
`;

// Create a blob from the worker code
const blob = new Blob([pdfjsWorker], { type: 'application/javascript' });

// Create a URL for the blob
const workerUrl = URL.createObjectURL(blob);

// Configure PDF.js to use our worker blob URL
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracts text from a PDF file with improved error handling, chunking, and OCR for scanned documents
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Starting PDF extraction');
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document with improved error handling
    console.log('Creating PDF loading task');
    
    // Create loading task with minimal configuration to avoid issues
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });
    
    // Add timeout to prevent hanging
    const loadingPromise = loadingTask.promise;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF loading timed out after 60 seconds')), 60000)
    );
    
    // Use Promise.race to implement timeout
    const pdf = await Promise.race([loadingPromise, timeoutPromise]) as PDFDocumentProxy;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    // For very large PDFs, warn the user
    if (pdf.numPages > 100) {
      console.log(`Large PDF detected (${pdf.numPages} pages). Processing may take longer.`);
    }
    
    let fullText = '';
    const maxProcessPages = Math.min(pdf.numPages, 300); // Limit to 300 pages max
    let ocrRequired = false;
    let ocrProcessedPages = 0;
    
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
        
        // If we got very little text, try OCR
        if (pageText.trim().length < 20 && textContent.items.length < 10) {
          console.log(`Page ${i} has very little text, trying OCR extraction`);
          ocrRequired = true;
          ocrProcessedPages++;
          
          // Limit OCR processing to a reasonable number of pages
          if (ocrProcessedPages <= 20) {
            try {
              // Render the page to a canvas for OCR processing
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
              
              // Use Tesseract.js for OCR
              const scheduler = createScheduler();
              const worker = await createWorker('eng');
              scheduler.addWorker(worker);
              
              console.log(`Running OCR on page ${i}`);
              const { data: { text: ocrText } } = await scheduler.addJob('recognize', canvas);
              await scheduler.terminate();
              
              if (ocrText && ocrText.trim().length > pageText.trim().length) {
                console.log(`OCR successful for page ${i}, extracted ${ocrText.length} characters`);
                fullText += ocrText + '\n\n';
              } else {
                // Use original text if OCR didn't improve results
                fullText += pageText + '\n\n';
              }
            } catch (ocrError) {
              console.error(`OCR failed for page ${i}:`, ocrError);
              fullText += pageText + '\n\n';
            }
          } else {
            // Skip OCR if we've already processed too many pages
            console.log(`Skipping OCR for page ${i} (limit reached)`);
            fullText += pageText + '\n\n';
          }
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
        console.log(`Already extracted ${fullText.length} characters. Processing will continue.`);
      }
    }
    
    console.log('PDF extraction completed successfully');
    
    // If OCR was used, add a note
    if (ocrRequired) {
      fullText += `\n\n[Note: Some pages in this document were processed using OCR because they appeared to be scanned or image-based. Text accuracy may vary.]\n`;
    }
    
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
  } finally {
    // Clean up any resources if needed
    try {
      URL.revokeObjectURL(workerUrl);
    } catch (e) {
      console.error('Error cleaning up resources:', e);
    }
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
  console.log('Processing document of type:', fileType, 'and size:', file.size);
  
  try {
    // Check file size
    const maxSizeMB = 20; // Increased to allow larger files
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
