
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TextCustomizerProps {
  fontFamily: string;
  setFontFamily: (value: string) => void;
  fontSize: number;
  setFontSize: (value: number) => void;
  lineSpacing: number;
  setLineSpacing: (value: number) => void;
  letterSpacing: number;
  setLetterSpacing: (value: number) => void;
  textColor: string;
  setTextColor: (value: string) => void;
  backgroundColor: string;
  setBackgroundColor: (value: string) => void;
  resetToDefaults: () => void;
}

const TextCustomizer = ({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineSpacing,
  setLineSpacing,
  letterSpacing,
  setLetterSpacing,
  textColor,
  setTextColor,
  backgroundColor,
  setBackgroundColor,
  resetToDefaults
}: TextCustomizerProps) => {
  const fonts = [
    { value: 'OpenDyslexic, sans-serif', label: 'OpenDyslexic' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
  ];

  const colorThemes = [
    { text: '#000000', bg: '#ffffff', name: 'Classic' },
    { text: '#0a0a0a', bg: '#f8f5de', name: 'Parchment' },
    { text: '#1e1e1e', bg: '#f0f0f0', name: 'Light Gray' },
    { text: '#f8f8f2', bg: '#262626', name: 'Dark' },
    { text: '#d8dee9', bg: '#2e3440', name: 'Nord' },
    { text: '#d9dbdd', bg: '#0a3069', name: 'Deep Blue' },
    { text: '#e8e1c6', bg: '#2d2b27', name: 'Sepia Dark' },
  ];

  return (
    <div className="glass-panel rounded-xl p-6 animate-fade-in">
      <h2 className="text-xl font-medium mb-6">Customize Your Reading Experience</h2>

      <Tabs defaultValue="font">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="font">Font Settings</TabsTrigger>
          <TabsTrigger value="colors">Color Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="font" className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="font-family">Font Type</Label>
            <Select
              value={fontFamily}
              onValueChange={setFontFamily}
            >
              <SelectTrigger id="font-family" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem 
                    key={font.value} 
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
            </div>
            <Slider
              id="font-size"
              min={14}
              max={32}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="line-spacing">Line Spacing: {lineSpacing.toFixed(1)}</Label>
            </div>
            <Slider
              id="line-spacing"
              min={1.0}
              max={2.5}
              step={0.1}
              value={[lineSpacing]}
              onValueChange={(value) => setLineSpacing(value[0])}
              className="py-4"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label htmlFor="letter-spacing">Letter Spacing: {letterSpacing.toFixed(1)}px</Label>
            </div>
            <Slider
              id="letter-spacing"
              min={0}
              max={2}
              step={0.1}
              value={[letterSpacing]}
              onValueChange={(value) => setLetterSpacing(value[0])}
              className="py-4"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {colorThemes.map((theme) => (
              <button
                key={theme.name}
                className={`flex flex-col items-center p-3 border rounded-lg transition-all ${
                  textColor === theme.text && backgroundColor === theme.bg
                    ? 'ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => {
                  setTextColor(theme.text);
                  setBackgroundColor(theme.bg);
                }}
              >
                <div 
                  className="w-full h-12 rounded mb-2"
                  style={{backgroundColor: theme.bg, border: '1px solid rgba(0,0,0,0.1)'}}
                >
                  <div 
                    className="h-full flex items-center justify-center font-medium"
                    style={{color: theme.text}}
                  >
                    Aa
                  </div>
                </div>
                <span className="text-sm">{theme.name}</span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button
          onClick={resetToDefaults}
          variant="outline"
          className="rounded-full transition-all"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default TextCustomizer;
