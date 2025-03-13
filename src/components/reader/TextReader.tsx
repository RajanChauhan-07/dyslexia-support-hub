
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TextReaderProps {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
}

const TextReader = ({
  fontFamily,
  fontSize,
  lineSpacing,
  letterSpacing,
  textColor,
  backgroundColor,
}: TextReaderProps) => {
  const [text, setText] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleReset = () => {
    setText('');
    if (isSpeaking) {
      stopSpeech();
    }
    toast({
      title: "Text Reset",
      description: "The reader has been cleared.",
    });
  };

  const startSpeech = () => {
    if (!text.trim()) {
      toast({
        title: "Nothing to read",
        description: "Please enter some text first.",
        variant: "destructive"
      });
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate; // Apply the selected speech rate
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } else {
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser doesn't support text-to-speech functionality.",
        variant: "destructive"
      });
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      startSpeech();
    }
  };

  const handleRateChange = (value: number[]) => {
    setSpeechRate(value[0]);
    
    // If already speaking, restart with new rate
    if (isSpeaking) {
      stopSpeech();
      startSpeech();
    }
  };

  // Format speed display value
  const formatSpeedLabel = (speed: number) => {
    return `${speed}x`;
  };

  return (
    <div className="w-full animate-fade-in">
      <div 
        className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 mb-4"
        style={{ backgroundColor }}
      >
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Enter or paste text here to read with your preferred settings..."
          className="border-none focus-visible:ring-1 min-h-[300px] p-6 w-full resize-y"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: lineSpacing,
            letterSpacing: `${letterSpacing}px`,
            color: textColor,
            backgroundColor,
          }}
        />
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <Button
          onClick={toggleSpeech}
          className="rounded-full px-6 transition-all gap-2"
          variant={isSpeaking ? "destructive" : "default"}
        >
          {isSpeaking ? (
            <>
              <PauseCircle className="h-5 w-5" /> Stop Reading
            </>
          ) : (
            <>
              <PlayCircle className="h-5 w-5" /> Read Aloud
            </>
          )}
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-full transition-all"
              disabled={!('speechSynthesis' in window)}
            >
              {formatSpeedLabel(speechRate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-center">Reading Speed</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">0.25x</span>
                <Slider
                  value={[speechRate]}
                  min={0.25}
                  max={2}
                  step={0.25}
                  onValueChange={handleRateChange}
                  className="w-52"
                />
                <span className="text-sm">2x</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-full px-6 transition-all gap-2"
          disabled={!text}
        >
          <RotateCcw className="h-4 w-4" /> Clear Text
        </Button>
      </div>
    </div>
  );
};

export default TextReader;
