
import { useState, useEffect } from 'react';
import TextReader from '@/components/reader/TextReader';
import TextCustomizer from '@/components/reader/TextCustomizer';
import { useToast } from '@/components/ui/use-toast';

const Reader = () => {
  // Default settings
  const [fontFamily, setFontFamily] = useState<string>('OpenDyslexic, sans-serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [letterSpacing, setLetterSpacing] = useState<number>(0.5);
  const [textColor, setTextColor] = useState<string>('#0a0a0a');
  const [backgroundColor, setBackgroundColor] = useState<string>('#f8f5de');
  
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  return (
    <div className="min-h-screen w-full pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Dyslexia-Friendly Reader</h1>
          <p className="text-lg text-muted-foreground">
            Customize your reading experience with fonts, sizes, and colors that work best for you.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4 w-full">
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
          </div>
          
          <div className="md:w-3/4 w-full">
            <TextReader
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              letterSpacing={letterSpacing}
              textColor={textColor}
              backgroundColor={backgroundColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
