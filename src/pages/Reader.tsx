import { useState, useEffect } from 'react';
import TextReader from '@/components/reader/TextReader';
import TextCustomizer from '@/components/reader/TextCustomizer';
import UploadDialog from '@/components/reader/UploadDialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Reader = () => {
  // Default settings
  const [fontFamily, setFontFamily] = useState<string>('OpenDyslexic, sans-serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [letterSpacing, setLetterSpacing] = useState<number>(0.5);
  const [textColor, setTextColor] = useState<string>('#0a0a0a');
  const [backgroundColor, setBackgroundColor] = useState<string>('#f8f5de');
  const [text, setText] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(2000);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Adjust page size based on device and font
    const baseSize = isMobile ? 1200 : 2000;
    const fontAdjustment = Math.max(0.6, Math.min(1.4, fontSize / 18));
    setPageSize(Math.round(baseSize / fontAdjustment));
  }, [isMobile, fontSize]);

  const resetToDefaults = () => {
    setFontFamily('OpenDyslexic, sans-serif');
    setFontSize(18);
    setLineSpacing(1.5);
    setLetterSpacing(0.5);
    setTextColor('#0a0a0a');
    setBackgroundColor('#f8f5de');
    
    toast({
      title: "Settings Reset",
      description: "All reading preferences have been reset to defaults.",
    });
  };

  const handleTextExtracted = (extractedText: string) => {
    setIsProcessing(true);
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      try {
        setText(extractedText);
        
        toast({
          title: "Text Ready for Reading",
          description: "Your document has been processed and is now ready to read.",
        });
      } catch (error) {
        console.error("Error processing text:", error);
        toast({
          title: "Processing Error",
          description: "There was a problem preparing your text. Please try a different document.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen w-full pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Dyslexia-Friendly Reader</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Customize your reading experience with fonts, sizes, and colors that work best for you.
          </p>
          <div className="flex justify-center mb-2">
            <UploadDialog onTextExtracted={handleTextExtracted} />
          </div>
          {isProcessing && (
            <p className="text-sm text-muted-foreground animate-pulse mt-2">
              Processing your document... This may take a moment for larger files.
            </p>
          )}
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] lg:grid-cols-[250px_1fr] xl:grid-cols-[300px_1fr] gap-6">
          <aside className="w-full order-last md:order-none">
            <TextCustomizer
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              fontSize={fontSize}
              setFontSize={setFontSize}
              lineSpacing={lineSpacing}
              setLineSpacing={setLineSpacing}
              letterSpacing={letterSpacing}
              setLetterSpacing={setLetterSpacing}
              textColor={textColor}
              setTextColor={setTextColor}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              resetToDefaults={resetToDefaults}
            />
          </aside>
          
          <main className="w-full min-h-[500px] order-first md:order-none">
            <TextReader
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              letterSpacing={letterSpacing}
              textColor={textColor}
              backgroundColor={backgroundColor}
              initialText={text}
              pageSize={pageSize}
              onTextChange={setText}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Reader;
