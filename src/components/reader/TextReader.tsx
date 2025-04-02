
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  PlayCircle, 
  PauseCircle, 
  RotateCcw, 
  Volume2, 
  SkipForward, 
  SkipBack,
  AlertCircle
} from 'lucide-react';
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TextReaderProps {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
}

// Voice options - simplified to just two options
interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const voiceOptions: VoiceOption[] = [
  { id: 'female', name: 'Emily', gender: 'female' },
  { id: 'male', name: 'Daniel', gender: 'male' },
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('female');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoicesLoaded, setIsVoicesLoaded] = useState<boolean>(false);
  const [isVoiceChanging, setIsVoiceChanging] = useState<boolean>(false);
  const [showSpeechError, setShowSpeechError] = useState<boolean>(false);
  const [currentTextPosition, setCurrentTextPosition] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [displayText, setDisplayText] = useState<React.ReactNode>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Parse text into words whenever text changes
  useEffect(() => {
    if (text) {
      const parsedWords = text.split(/\s+/).filter(word => word.length > 0);
      setWords(parsedWords);
      updateDisplayText(-1); // Reset highlighting
    } else {
      setWords([]);
      setDisplayText(null);
    }
  }, [text]);

  // Update display text with highlighting whenever current word changes
  useEffect(() => {
    updateDisplayText(currentWordIndex);
  }, [currentWordIndex, words]);

  // Function to update display text with highlighted current word
  const updateDisplayText = (wordIndex: number) => {
    if (!words.length) {
      setDisplayText(null);
      return;
    }

    const highlightedText = words.map((word, index) => {
      const isHighlighted = index === wordIndex;
      return (
        <span
          key={index}
          className={`inline-block ${
            isHighlighted 
              ? 'bg-primary text-primary-foreground px-1 py-0.5 rounded transition-all duration-300 animate-pulse' 
              : ''
          }`}
          style={{
            transition: 'all 0.3s ease-in-out',
          }}
        >
          {word}{' '}
        </span>
      );
    });

    setDisplayText(<>{highlightedText}</>);
  };

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

  // Reset speech error indicator when text changes
  useEffect(() => {
    setShowSpeechError(false);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCurrentWordIndex(-1); // Reset word index when text changes
  };

  const handleReset = () => {
    setText('');
    if (isSpeaking) {
      stopSpeech();
    }
    setCurrentTextPosition(0);
    setCurrentWordIndex(-1);
    toast({
      title: "Text Reset",
      description: "The reader has been cleared.",
    });
  };

  // Find the best matching voice from available system voices
  const findMatchingVoice = (voiceId: string): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) {
      return null; // Use default voice
    }

    // Define preferred voice names for our voice IDs
    const voicePreferences: Record<string, string[]> = {
      'male': ['daniel', 'david', 'male', 'man'],
      'female': ['emily', 'samantha', 'female', 'woman']
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
    const isFemalePref = voiceId === 'female';
    const genderFallback = availableVoices.find(
      v => isFemalePref ? v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male') 
                        : v.name.toLowerCase().includes('male')
    );
    
    return genderFallback || availableVoices[0]; // Last resort: return first available voice
  };

  const createUtterance = (startFrom: number = 0) => {
    setShowSpeechError(false);
    
    if (!text.trim()) {
      toast({
        title: "Nothing to read",
        description: "Please enter some text first.",
        variant: "destructive"
      });
      return null;
    }

    // Determine text to speak based on position
    const textToSpeak = startFrom > 0 ? text.substring(startFrom) : text;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    
    // Set selected voice if available
    const voice = findMatchingVoice(selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Setup word boundary detection
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Calculate the word index based on character position
        const textUpToPosition = text.substring(0, startFrom + event.charIndex);
        const wordCount = textUpToPosition.split(/\s+/).filter(word => word.length > 0).length;
        setCurrentWordIndex(wordCount);
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setIsVoiceChanging(false);
      setCurrentTextPosition(0);
      setCurrentWordIndex(-1); // Reset highlighting when done speaking
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      setIsVoiceChanging(false);
      setShowSpeechError(true);
      setCurrentWordIndex(-1); // Reset highlighting on error
      utteranceRef.current = null;
      
      // Don't show toast if we already have visual error indicator
      if (!showSpeechError) {
        toast({
          title: "Speech Error",
          description: "There was an error with the speech synthesis. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Set starting position for playback tracking
    setCurrentTextPosition(startFrom);
    
    return utterance;
  };

  const startSpeech = (fromPosition: number = 0) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      
      const utterance = createUtterance(fromPosition);
      if (!utterance) return;
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
      
      // Reset word index when starting from beginning
      if (fromPosition === 0) {
        setCurrentWordIndex(-1);
      }
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
      setIsPaused(false);
      setIsVoiceChanging(false);
      setCurrentWordIndex(-1); // Reset highlighting when stopping speech
      utteranceRef.current = null;
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      // Estimate current position in text
      // This is an approximation - precise tracking would require more complex implementation
      const timeSinceStart = Date.now() - (window as any).speechStartTime;
      const charPerMs = 0.025; // Rough estimate of speech rate chars per ms
      const charsSpoken = Math.min(
        Math.floor(timeSinceStart * charPerMs * speechRate),
        text.length - currentTextPosition
      );
      const estimatedPosition = currentTextPosition + charsSpoken;
      
      setCurrentTextPosition(estimatedPosition);
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const skipForward = () => {
    if (isSpeaking) {
      // Calculate new position (approximately 10 seconds forward)
      const charsPerSecond = 15 * speechRate; // Rough estimate: ~15 chars per second
      const skipChars = Math.floor(charsPerSecond * 10);
      const newPosition = Math.min(
        currentTextPosition + skipChars, 
        text.length - 1
      );
      
      // Restart from new position
      stopSpeech();
      startSpeech(newPosition);
      
      toast({
        title: "Skipped Forward",
        description: "Jumped ahead by 10 seconds",
      });
    }
  };

  const skipBackward = () => {
    if (isSpeaking) {
      // Calculate new position (approximately 10 seconds backward)
      const charsPerSecond = 15 * speechRate; // Rough estimate: ~15 chars per second
      const skipChars = Math.floor(charsPerSecond * 10);
      const newPosition = Math.max(currentTextPosition - skipChars, 0);
      
      // Restart from new position
      stopSpeech();
      startSpeech(newPosition);
      
      toast({
        title: "Skipped Backward",
        description: "Jumped back by 10 seconds",
      });
    }
  };

  const togglePlayPause = () => {
    if (!isSpeaking) {
      // Start speech from beginning or saved position
      startSpeech(currentTextPosition);
      (window as any).speechStartTime = Date.now();
    } else if (isPaused) {
      // Resume if paused
      resumeSpeech();
    } else {
      // Pause if speaking
      pauseSpeech();
    }
  };

  const handleRateChange = (value: number[]) => {
    setSpeechRate(value[0]);
    
    // If already speaking, restart with new rate
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      startSpeech(currentPos);
    }
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    setIsVoiceChanging(true);
    
    // If already speaking, restart with new voice
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      // Small delay to ensure speech is fully stopped
      setTimeout(() => {
        startSpeech(currentPos);
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
      {showSpeechError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Speech Error</AlertTitle>
          <AlertDescription>
            There was an error with the speech synthesis. Please try again or try a different voice.
          </AlertDescription>
        </Alert>
      )}
      
      <div 
        className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 mb-4 w-full"
        style={{ backgroundColor }}
      >
        {isSpeaking ? (
          <div 
            className="border-none focus-visible:ring-1 min-h-[450px] md:min-h-[550px] p-6 w-full resize-y overflow-auto text-left"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              letterSpacing: `${letterSpacing}px`,
              color: textColor,
              backgroundColor,
            }}
          >
            {displayText}
          </div>
        ) : (
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
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 justify-start items-center">
        <Button
          onClick={togglePlayPause}
          className="rounded-full px-6 transition-all gap-2"
          variant={isSpeaking ? (isPaused ? "outline" : "destructive") : "default"}
          disabled={isVoiceChanging}
        >
          {!isSpeaking ? (
            <>
              <PlayCircle className="h-5 w-5" /> Read Aloud
            </>
          ) : isPaused ? (
            <>
              <PlayCircle className="h-5 w-5" /> Resume
            </>
          ) : (
            <>
              <PauseCircle className="h-5 w-5" /> Pause
            </>
          )}
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={skipBackward}
            variant="outline"
            size="icon"
            className="rounded-full"
            disabled={!isSpeaking || isVoiceChanging}
            title="Skip back 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={skipForward}
            variant="outline"
            size="icon"
            className="rounded-full"
            disabled={!isSpeaking || isVoiceChanging}
            title="Skip forward 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
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
