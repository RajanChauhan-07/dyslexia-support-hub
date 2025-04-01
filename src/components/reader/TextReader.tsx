
import { useState, useEffect } from 'react';
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

const voiceOptions: VoiceOption[] = [
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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoicesLoaded, setIsVoicesLoaded] = useState<boolean>(false);
  const [isVoiceChanging, setIsVoiceChanging] = useState<boolean>(false);
  const { toast } = useToast();

  // Load and initialize voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setIsVoicesLoaded(true);
      }
    };

    // Try to load voices immediately
    if ('speechSynthesis' in window) {
      loadVoices();
      
      // Also set up event listener for when voices change/load
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }

    return () => {
      // Cleanup
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
        if (isSpeaking) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, []);

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

  // Find the best matching voice from available system voices
  const findMatchingVoice = (voiceId: string): SpeechSynthesisVoice | null => {
    if (!availableVoices.length || voiceId === 'default') {
      return null; // Use default voice
    }

    // Define preferred voice names for our voice IDs
    const voicePreferences: Record<string, string[]> = {
      'male1': ['daniel', 'david', 'male', 'man'],
      'male2': ['james', 'john', 'male', 'man'],
      'female1': ['sarah', 'samantha', 'female', 'woman'],
      'female2': ['emily', 'karen', 'female', 'woman']
    };

    // Try to find voice by preference
    const preferences = voicePreferences[voiceId] || [];
    
    // First, try to match by exact name
    for (const pref of preferences) {
      const exactMatch = availableVoices.find(
        voice => voice.name.toLowerCase() === pref
      );
      if (exactMatch) return exactMatch;
    }
    
    // Then try to find by partial match
    for (const pref of preferences) {
      const partialMatch = availableVoices.find(
        voice => voice.name.toLowerCase().includes(pref)
      );
      if (partialMatch) return partialMatch;
    }

    // If all else fails, try to match by gender
    const isFemalePref = voiceId.includes('female');
    const genderFallback = availableVoices.find(
      v => isFemalePref ? v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male') 
                        : v.name.toLowerCase().includes('male')
    );
    
    return genderFallback || availableVoices[0]; // Last resort: return first available voice
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
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      
      // Set selected voice if available
      const voice = findMatchingVoice(selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsVoiceChanging(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsVoiceChanging(false);
        toast({
          title: "Speech Error",
          description: "There was an error with the speech synthesis.",
          variant: "destructive"
        });
      };
      
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
      setIsVoiceChanging(false);
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
    setIsVoiceChanging(true);
    
    // If already speaking, restart with new voice
    if (isSpeaking) {
      stopSpeech();
      // Small delay to ensure speech is fully stopped
      setTimeout(() => {
        startSpeech();
      }, 50);
    } else {
      // Even if not speaking, we'll reset the changing state after a moment
      setTimeout(() => {
        setIsVoiceChanging(false);
      }, 100);
    }
    
    toast({
      title: "Voice Changed",
      description: `Voice switched to ${voiceOptions.find(v => v.id === value)?.name || value}`,
    });
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
          disabled={isVoiceChanging}
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
              disabled={!('speechSynthesis' in window) || isVoiceChanging}
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
          disabled={!('speechSynthesis' in window) || !isVoicesLoaded || isVoiceChanging}
        >
          <SelectTrigger className="w-[160px] rounded-full">
            <Volume2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Voice">
              {isVoiceChanging ? "Changing..." : voiceOptions.find(v => v.id === selectedVoice)?.name || "Default"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {voiceOptions.map((voice) => (
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
          disabled={!text || isVoiceChanging}
        >
          <RotateCcw className="h-4 w-4" /> Clear Text
        </Button>
      </div>
    </div>
  );
};

export default TextReader;
