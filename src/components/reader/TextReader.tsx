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
  AlertCircle,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Book
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const voiceOptions: VoiceOption[] = [
  { id: 'female', name: 'Emily', gender: 'female' },
  { id: 'male', name: 'Daniel', gender: 'male' },
];

interface TextReaderProps {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
  initialText?: string;
  pageSize?: number;
  onTextChange?: (text: string) => void;
}

const TextReader = ({
  fontFamily,
  fontSize,
  lineSpacing,
  letterSpacing,
  textColor,
  backgroundColor,
  initialText = '',
  pageSize = 2000,
  onTextChange,
}: TextReaderProps) => {
  const [fullText, setFullText] = useState<string>(initialText);
  const [displayText, setDisplayText] = useState<React.ReactNode>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [textPages, setTextPages] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<boolean>(true);
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
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [totalWordsRead, setTotalWordsRead] = useState<number>(0);
  const [readingStats, setReadingStats] = useState({
    startTime: 0,
    wordsRead: 0,
    readingTime: 0,
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const [editorFocused, setEditorFocused] = useState<boolean>(false);
  const [initialSetupComplete, setInitialSetupComplete] = useState<boolean>(false);

  const updateDisplayText = (activeWordIndex: number) => {
    if (words.length === 0) {
      setDisplayText(null);
      return;
    }

    const highlightedText = (
      <div>
        {words.map((word, index) => {
          if (word === "\n") {
            return <br key={`br-${index}`} />;
          }
          
          const isActive = index === activeWordIndex;
          return (
            <span
              key={`word-${index}`}
              className={isActive ? "bg-primary-foreground px-0.5 rounded" : ""}
              style={{
                display: "inline-block",
                marginRight: word.endsWith('.') || word.endsWith(',') || 
                             word.endsWith('!') || word.endsWith('?') || 
                             word.endsWith(':') || word.endsWith(';') ? '6px' : '3px',
                marginBottom: '3px',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
    
    setDisplayText(highlightedText);
  };

  useEffect(() => {
    if (fullText) {
      const pages: string[] = [];
      let remaining = fullText;
      
      while (remaining.length > 0) {
        let breakPoint = Math.min(pageSize, remaining.length);
        
        if (breakPoint < remaining.length) {
          const paragraphBreak = remaining.lastIndexOf('\n\n', breakPoint);
          if (paragraphBreak > pageSize * 0.7) {
            breakPoint = paragraphBreak + 2;
          } else {
            const sentenceBreak = Math.max(
              remaining.lastIndexOf('. ', breakPoint),
              remaining.lastIndexOf('? ', breakPoint),
              remaining.lastIndexOf('! ', breakPoint)
            );
            
            if (sentenceBreak > pageSize * 0.7) {
              breakPoint = sentenceBreak + 2;
            } else {
              const spaceBreak = remaining.lastIndexOf(' ', breakPoint);
              if (spaceBreak > pageSize * 0.8) {
                breakPoint = spaceBreak + 1;
              }
            }
          }
        }
        
        pages.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint);
      }
      
      setTextPages(pages);
      setTotalPages(pages.length);
      
      if (currentPage > pages.length && pages.length > 0) {
        setCurrentPage(1);
      }
      
      if (pages.length > 0) {
        processTextForPage(pages[currentPage - 1]);
      } else {
        setWords([]);
        setCurrentWordIndex(-1);
      }
      
      if (pages.length === 0) {
        setEditMode(true);
      }
    } else {
      setTextPages([]);
      setTotalPages(1);
      setCurrentPage(1);
      setWords([]);
      setCurrentWordIndex(-1);
      setEditMode(true);
    }
  }, [fullText, pageSize]);

  useEffect(() => {
    if (textPages.length > 0 && currentPage <= textPages.length) {
      processTextForPage(textPages[currentPage - 1]);
    }
  }, [currentPage, textPages]);

  const processTextForPage = (pageText: string) => {
    const lines = pageText.split(/\n/).map(line => line.trim());
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
  };

  useEffect(() => {
    updateDisplayText(currentWordIndex);
  }, [currentWordIndex, words]);

  useEffect(() => {
    if (isSpeaking && !isPaused && !readingStartTime) {
      setReadingStartTime(Date.now());
      setReadingStats(prev => ({
        ...prev,
        startTime: Date.now(),
      }));
    }

    if (!isSpeaking && readingStartTime) {
      const elapsedTime = Math.floor((Date.now() - readingStartTime) / 1000);
      const wordsRead = currentWordIndex >= 0 ? currentWordIndex + 1 : 0;
      
      setReadingStats(prev => ({
        ...prev,
        wordsRead: prev.wordsRead + wordsRead,
        readingTime: prev.readingTime + elapsedTime,
      }));
      
      setTotalWordsRead(prev => prev + wordsRead);
      setReadingStartTime(null);
      
      if (user && wordsRead > 0) {
        updateReadingStats(wordsRead, elapsedTime);
      }
    }
  }, [isSpeaking, isPaused, readingStartTime, currentWordIndex, user]);

  const updateReadingStats = async (wordsRead: number, readingTime: number) => {
    if (!user) return;
    
    try {
      const wpm = readingTime > 0 ? Math.round((wordsRead / readingTime) * 60) : 0;
      
      console.log(`Updating reading stats: ${wordsRead} words in ${readingTime} seconds (${wpm} wpm)`);
      
      const { error: activityError } = await supabase
        .from('reading_activity')
        .insert({
          user_id: user.id,
          words_read: wordsRead,
          reading_time: readingTime,
          read_at: new Date().toISOString(),
        });
        
      if (activityError) {
        console.error('Error recording reading activity:', activityError);
        return;
      }
      
      const { data: existingStats, error: fetchError } = await supabase
        .from('reading_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching reading stats:', fetchError);
        return;
      }
      
      if (existingStats) {
        const totalWords = existingStats.words_read + wordsRead;
        const totalTime = existingStats.total_reading_time + readingTime;
        const avgSpeed = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
        
        const isToday = new Date(existingStats.last_read_at).toDateString() === new Date().toDateString();
        const isYesterday = new Date(existingStats.last_read_at).toDateString() === new Date().toDateString();
        
        let currentStreak = existingStats.current_streak;
        let longestStreak = existingStats.longest_streak;
        
        if (!isToday) {
          if (isYesterday) {
            currentStreak += 1;
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }
          } else {
            currentStreak = 1;
          }
        }
        
        const { error: updateError } = await supabase
          .from('reading_stats')
          .update({
            words_read: totalWords,
            total_reading_time: totalTime,
            average_speed: avgSpeed,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_read_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating reading stats:', updateError);
        } else {
          console.log('Reading stats updated successfully');
        }
      } else {
        const { error: insertError } = await supabase
          .from('reading_stats')
          .insert({
            user_id: user.id,
            words_read: wordsRead,
            average_speed: wpm,
            total_reading_time: readingTime,
            documents_uploaded: 1,
            documents_finished: wordsRead === words.length ? 1 : 0,
            current_streak: 1,
            longest_streak: 1,
            last_read_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Error inserting new reading stats:', insertError);
        } else {
          console.log('New reading stats created successfully');
        }
      }
    } catch (error) {
      console.error('Error updating reading stats:', error);
    }
  };

  useEffect(() => {
    if (!initialSetupComplete && initialText) {
      setFullText(initialText);
      setInitialSetupComplete(true);
    } else if (initialText !== fullText && initialText !== '') {
      if (fullText === '' || initialText.length > fullText.length * 1.5) {
        setFullText(initialText);
        
        if (isSpeaking) {
          stopSpeech();
        }
        
        setCurrentWordIndex(-1);
        setCurrentTextPosition(0);
        
        if (textContainerRef.current) {
          textContainerRef.current.scrollTop = 0;
        }
        
        if (user && initialText.trim().length > 0) {
          incrementDocumentsUploaded();
        }
      }
    }
  }, [initialText, user]);

  useEffect(() => {
    setShowSpeechError(false);
  }, [fullText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (editMode) {
      setFullText(newValue);
      if (onTextChange) {
        onTextChange(newValue);
      }
    } else {
      const newPages = [...textPages];
      newPages[currentPage - 1] = newValue;
      setTextPages(newPages);
      
      const updatedFullText = newPages.join('');
      setFullText(updatedFullText);
      
      if (onTextChange) {
        onTextChange(updatedFullText);
      }
    }
  };

  const handleReset = () => {
    setFullText('');
    if (isSpeaking) {
      stopSpeech();
    }
    setCurrentTextPosition(0);
    setCurrentWordIndex(-1);
    setCurrentPage(1);
    setTextPages([]);
    setEditMode(true);
    
    if (onTextChange) {
      onTextChange('');
    }
    
    toast({
      title: "Text Reset",
      description: "The reader has been cleared.",
    });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (isSpeaking) {
        stopSpeech();
      }
      setCurrentPage(currentPage + 1);
      setCurrentWordIndex(-1);
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (isSpeaking) {
        stopSpeech();
      }
      setCurrentPage(currentPage - 1);
      setCurrentWordIndex(-1);
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      if (isSpeaking) {
        stopSpeech();
      }
      setCurrentPage(page);
      setCurrentWordIndex(-1);
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
    }
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
    
    const currentPageText = textPages[currentPage - 1];
    if (!currentPageText || !currentPageText.trim()) {
      toast({
        title: "Nothing to read",
        description: "Please enter some text first.",
        variant: "destructive"
      });
      return null;
    }

    const textToSpeak = startFrom > 0 ? currentPageText.substring(startFrom) : currentPageText;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    
    const voice = findMatchingVoice(selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setTimeout(() => {
          const textUpToPosition = currentPageText.substring(0, startFrom + event.charIndex);
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
      
      if (currentPage < totalPages) {
        toast({
          title: "Page Complete",
          description: "Moving to next page...",
        });
        setTimeout(() => handleNextPage(), 1500);
      }
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
        textPages[currentPage - 1].length - currentTextPosition
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
        textPages[currentPage - 1].length - 1
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

  const incrementRate = () => {
    const newRate = Math.min(2, speechRate + 0.25);
    setSpeechRate(newRate);
    
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      setTimeout(() => {
        startSpeech(currentPos);
      }, 50);
    }
    
    toast({
      title: "Speed Increased",
      description: `Reading speed set to ${newRate}x`,
    });
  };
  
  const decrementRate = () => {
    const newRate = Math.max(0.25, speechRate - 0.25);
    setSpeechRate(newRate);
    
    if (isSpeaking) {
      const currentPos = currentTextPosition;
      stopSpeech();
      setTimeout(() => {
        startSpeech(currentPos);
      }, 50);
    }
    
    toast({
      title: "Speed Decreased",
      description: `Reading speed set to ${newRate}x`,
    });
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

  const toggleEditMode = () => {
    if (!editMode) {
      setEditMode(true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    } else {
      setEditMode(false);
    }
  };

  const incrementDocumentsUploaded = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reading_stats')
        .select('documents_uploaded')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching documents count:', error);
        return;
      }
      
      if (data) {
        await supabase
          .from('reading_stats')
          .update({
            documents_uploaded: data.documents_uploaded + 1
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reading_stats')
          .insert({
            user_id: user.id,
            words_read: 0,
            average_speed: 0,
            documents_uploaded: 1,
            documents_finished: 0,
            current_streak: 0,
            longest_streak: 0,
            total_reading_time: 0
          });
      }
    } catch (error) {
      console.error('Error incrementing documents uploaded:', error);
    }
  };

  const getPaginationItems = () => {
    const items: number[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      
      const leftSide = Math.max(2, currentPage - 2);
      const rightSide = Math.min(totalPages - 1, currentPage + 2);
      
      if (leftSide > 2) {
        items.push(-1);
      }
      
      for (let i = leftSide; i <= rightSide; i++) {
        items.push(i);
      }
      
      if (rightSide < totalPages - 1) {
        items.push(-2);
      }
      
      items.push(totalPages);
    }
    
    return items;
  };

  return (
    <div className="w-full h-full animate-fade-in flex flex-col">
      {showSpeechError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Speech Error</AlertTitle>
          <AlertDescription>
            There was an error with the speech synthesis. Please try again or try a different voice.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className="rounded-full gap-1"
          >
            {editMode ? "Save & View" : "Edit Text"}
          </Button>
          
          {totalPages > 1 && (
            <div className="text-sm px-2 py-1 bg-muted rounded-md">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="rounded-full px-3 gap-1"
            disabled={!fullText || isVoiceChanging}
          >
            <RotateCcw className="h-3 w-3" /> Clear
          </Button>
        </div>
      </div>
      
      <div 
        className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 mb-4 w-full flex-grow"
        style={{ backgroundColor }}
      >
        {editMode ? (
          <Textarea
            ref={textareaRef}
            value={fullText}
            onChange={handleTextChange}
            onFocus={() => setEditorFocused(true)}
            onBlur={() => setEditorFocused(false)}
            placeholder="Enter or paste text here to read with your preferred settings, or upload a document using the button above..."
            className="border-none focus-visible:ring-1 min-h-[450px] md:min-h-[500px] p-6 w-full resize-none h-full"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              letterSpacing: `${letterSpacing}px`,
              color: textColor,
              backgroundColor,
            }}
          />
        ) : isSpeaking ? (
          <div 
            ref={textContainerRef}
            className="border-none focus-visible:ring-1 min-h-[450px] md:min-h-[500px] p-6 w-full resize-none overflow-auto text-left h-full"
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
            value={textPages[currentPage - 1] || ''}
            onChange={handleTextChange}
            placeholder="Enter or paste text here to read with your preferred settings, or upload a document using the button above..."
            className="border-none focus-visible:ring-1 min-h-[450px] md:min-h-[500px] p-6 w-full resize-none h-full"
            readOnly
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
      
      {totalPages > 1 && !editMode && (
        <Pagination className="mt-1 mb-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={handlePrevPage}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {getPaginationItems().map((item, index) => (
              item < 0 ? (
                <PaginationItem key={`ellipsis-${item}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${item}`}>
                  <PaginationLink 
                    isActive={currentPage === item}
                    onClick={() => goToPage(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={handleNextPage}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <div className="flex flex-wrap gap-3 justify-start items-center">
        <Button
          onClick={togglePlayPause}
          className="rounded-full px-6 transition-all gap-2"
          variant={isSpeaking ? (isPaused ? "outline" : "destructive") : "default"}
          disabled={isVoiceChanging || !textPages.length}
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
        
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon"
            className="rounded-full"
            onClick={decrementRate}
            disabled={speechRate <= 0.25 || isVoiceChanging}
            title="Decrease speed"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="outline" 
            className="rounded-full w-16"
            disabled={!('speechSynthesis' in window) || isVoiceChanging}
          >
            {formatSpeedLabel(speechRate)}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="rounded-full"
            onClick={incrementRate}
            disabled={speechRate >= 2 || isVoiceChanging}
            title="Increase speed"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
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
        
        {totalPages > 1 && !editMode && (
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={handlePrevPage}
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 
              Previous
            </Button>
            
            <Button
              onClick={handleNextPage}
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" /> 
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextReader;
