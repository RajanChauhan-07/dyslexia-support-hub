
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
    <div className="min-h-screen pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Dyslexia-Friendly Reader</h1>
          <p className="text-lg text-muted-foreground">
            Customize your reading experience with fonts, sizes, and colors that work best for you.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
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
          
          <div className="md:w-3/4">
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
        
        <div className="mt-8 glass-panel p-5 rounded-xl max-w-4xl mx-auto">
          <h2 className="text-xl font-medium mb-3">How to Use This Tool</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>1. Paste or type any text you want to read in the text area.</li>
            <li>2. Adjust the font settings to make reading more comfortable.</li>
            <li>3. Try different color themes to reduce eye strain.</li>
            <li>4. Use the "Read Aloud" feature to have the text read to you.</li>
            <li>5. Save your preferred settings for next time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reader;
