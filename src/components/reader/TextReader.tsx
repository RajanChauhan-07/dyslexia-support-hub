import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  initialText?: string;
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
  initialText = '',
}: TextReaderProps) => {
  const [text, setText] = useState<string>(initialText);
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
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      
      if (isSpeaking) {
        stopSpeech();
      }
      
      setCurrentWordIndex(-1);
      setCurrentTextPosition(0);
      
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
    }
  }, [initialText]);

  useEffect(() => {
    if (text) {
      const lines = text.split(/\n/).map(line => line.trim());
      const parsedWords: string[] = [];
      
      lines.forEach((line, lineIndex) => {
        const wordsInLine = line.split(/\s+/).filter(word => word.length > 0);
        
        parsedWords.push(...wordsInLine);
        
        if (lineIndex < lines.length - 1 && line.length > 0) {
          parsedWords.push("\n");
        }
      });
      
      setWords(parsedWords);
      updateDisplayText(-1);
    } else {
      setWords([]);
      setDisplayText(null);
    }
  }, [text]);

  useEffect(() => {
    updateDisplayText(currentWordIndex);
  }, [currentWordIndex, words]);

  const updateDisplayText = (wordIndex: number) => {
    if (!words.length) {
      setDisplayText(null);
      return;
    }

    let currentContent: JSX.Element[] = [];
    let lineContent: JSX.Element[] = [];
    
    words.forEach((word, index) => {
      if (word === "\n") {
        currentContent.push(
          <div key={`line-${index}`} className="mb-2">
            {[...lineContent]}
          </div>
        );
        lineContent = [];
      } else {
        const isHighlighted = index === wordIndex;
        lineContent.push(
          <span
            key={index}
            className={`inline-block ${
              isHighlighted 
                ? 'bg-primary/70 text-primary-foreground px-1 py-0.5 rounded' 
                : 'px-0.5'
            }`}
            style={{
              transition: 'all 0.4s ease-out',
            }}
          >
            {word}{' '}
          </span>
        );
      }
    });
    
    if (lineContent.length > 0) {
      currentContent.push(
        <div key="final-line" className="mb-2">
          {lineContent}
        </div>
      );
    }

    setDisplayText(<>{currentContent}</>);
    
    if (wordIndex >= 0 && textContainerRef.current) {
      const highlightedElement = textContainerRef.current.querySelector(`span:nth-child(${wordIndex + 1})`);
      if (highlightedElement) {
        const containerRect = textContainerRef.current.getBoundingClientRect();
        const elementRect = highlightedElement.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setIsVoicesLoaded(true);
      }
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
        if (isSpeaking) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, []);

  useEffect(() => {
    setShowSpeechError(false);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCurrentWordIndex(-1);
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

  const findMatchingVoice = (voiceId: string): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) {
      return null;
    }

    const voicePreferences: Record<string, string[]> = {
      'male': ['daniel', 'david', 'male', 'man'],
      'female': ['emily', 'samantha', 'female', 'woman']
    };

    const preferences = voicePreferences[voiceId] || [];
    
    for (const pref of preferences) {
      const exactMatch = availableVoices.find(
        voice => voice.name.toLowerCase() === pref
      );
      if (exactMatch) return exactMatch;
    }
    
    for (const pref of preferences) {
      const partialMatch = availableVoices.find(
        voice => voice.name.toLowerCase().includes(pref)
      );
      if (partialMatch) return partialMatch;
    }

    const isFemalePref = voiceId === 'female';
    const genderFallback = availableVoices.find(
      v => isFemalePref ? v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male') 
                        : v.name.toLowerCase().includes('male')
    );
    
    return genderFallback || availableVoices[0];
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

    const textToSpeak = startFrom > 0 ? text.substring(startFrom) : text;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    
    const voice = findMatchingVoice(selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    let wordCount = 0;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setTimeout(() => {
          const textUpToPosition = text.substring(0, startFrom + event.charIndex);
          const wordsBefore = textUpToPosition.split(/\s+/).filter(w => w.length > 0).length;
          setCurrentWordIndex(wordsBefore);
        }, 50);
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setIsVoiceChanging(false);
      setCurrentTextPosition(0);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      setIsVoiceChanging(false);
      setShowSpeechError(true);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
      
      if (!showSpeechError) {
        toast({
          title: "Speech Error",
          description: "There was an error with the speech synthesis. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    setCurrentTextPosition(startFrom);
    
    return utterance;
  };

  const startSpeech = (fromPosition: number = 0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = createUtterance(fromPosition);
      if (!utterance) return;
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
      
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
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      const timeSinceStart = Date.now() - (window as any).speechStartTime;
      const charPerMs = 0.025;
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
      const charsPerSecond = 15 * speechRate;
      const skipChars = Math.floor(charsPerSecond * 10);
      const newPosition = Math.min(
        currentTextPosition + skipChars, 
        text.length - 1
      );
      
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
      const charsPerSecond = 15 * speechRate;
      const skipChars = Math.floor(charsPerSecond * 10);
      const newPosition = Math.max(currentTextPosition - skipChars, 0);
      
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
      startSpeech(currentTextPosition);
      (window as any).speechStartTime = Date.now();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  };

  const handleRateChange = (value: number[]) => {
    setSpeechRate(value[0]);
    
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      startSpeech(currentPos);
    }
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    setIsVoiceChanging(true);
    
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      setTimeout(() => {
        startSpeech(currentPos);
      }, 50);
    } else {
      setTimeout(() => {
        setIsVoiceChanging(false);
      }, 100);
    }
    
    toast({
      title: "Voice Changed",
      description: `Voice switched to ${voiceOptions.find(v => v.id === value)?.name || value}`,
    });
  };

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
            ref={textContainerRef}
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
            placeholder="Enter or paste text here to read with your preferred settings, or upload a document using the button above..."
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
