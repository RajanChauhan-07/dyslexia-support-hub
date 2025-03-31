
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlayCircle, PauseCircle, RotateCcw, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextReaderProps {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
}

// Voice options
interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const voices: VoiceOption[] = [
  { id: 'default', name: 'Default', gender: 'female' },
  { id: 'male1', name: 'Daniel', gender: 'male' },
  { id: 'male2', name: 'James', gender: 'male' },
  { id: 'female1', name: 'Sarah', gender: 'female' },
  { id: 'female2', name: 'Emily', gender: 'female' },
];

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
  const [selectedVoice, setSelectedVoice] = useState<string>('default');
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
      
      // Set voice if available
      if (selectedVoice !== 'default') {
        const voices = window.speechSynthesis.getVoices();
        
        // Try to match voice by name (simplified approach)
        // In a real app, you might want to have more specific voice mappings
        const voiceData = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          if (selectedVoice === 'male1' && (voiceName.includes('daniel') || voiceName.includes('male'))) {
            return true;
          } else if (selectedVoice === 'male2' && (voiceName.includes('james') || voiceName.includes('male'))) {
            return true;
          } else if (selectedVoice === 'female1' && (voiceName.includes('sarah') || voiceName.includes('female'))) {
            return true;
          } else if (selectedVoice === 'female2' && (voiceName.includes('emily') || voiceName.includes('female'))) {
            return true;
          }
          return false;
        });
        
        if (voiceData) {
          utterance.voice = voiceData;
        }
      }
      
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

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    
    // If already speaking, restart with new voice
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
    <div className="w-full h-full animate-fade-in">
      <div 
        className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 mb-4 w-full"
        style={{ backgroundColor }}
      >
        <Textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Enter or paste text here to read with your preferred settings..."
          className="border-none focus-visible:ring-1 min-h-[450px] md:min-h-[550px] p-6 w-full resize-y"
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
      
      <div className="flex flex-wrap gap-3 justify-start items-center">
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
        
        <Select 
          value={selectedVoice}
          onValueChange={handleVoiceChange}
          disabled={!('speechSynthesis' in window)}
        >
          <SelectTrigger className="w-[160px] rounded-full">
            <Volume2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name} ({voice.gender})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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
