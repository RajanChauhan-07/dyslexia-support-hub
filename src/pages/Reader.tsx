
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
    <div className="min-h-screen pt-28 pb-16">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-4">Dyslexia-Friendly Reader</h1>
            <p className="text-lg text-muted-foreground">
              Customize your reading experience with fonts, sizes, and colors that work best for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
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
            
            <div className="md:col-span-2">
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
          
          <div className="mt-12 glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-medium mb-4">How to Use This Tool</h2>
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
    </div>
  );
};

export default Reader;
