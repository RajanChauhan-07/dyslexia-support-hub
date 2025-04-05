
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

interface TextReaderProps {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
  initialText?: string;
  pageSize?: number;
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

  // Split text into pages when full text changes
  useEffect(() => {
    if (fullText) {
      // Split the text into pages
      const pages: string[] = [];
      let remaining = fullText;
      
      while (remaining.length > 0) {
        // Try to find a good breaking point near pageSize
        let breakPoint = Math.min(pageSize, remaining.length);
        
        // If we're not at the end, try to break at a paragraph or sentence
        if (breakPoint < remaining.length) {
          // Look for paragraph breaks first (prefer breaking at paragraphs)
          const paragraphBreak = remaining.lastIndexOf('\n\n', breakPoint);
          if (paragraphBreak > pageSize * 0.7) { // At least 70% of desired page size
            breakPoint = paragraphBreak + 2; // Include the newlines
          } else {
            // Try to break at a sentence (period, question mark, exclamation)
            const sentenceBreak = Math.max(
              remaining.lastIndexOf('. ', breakPoint),
              remaining.lastIndexOf('? ', breakPoint),
              remaining.lastIndexOf('! ', breakPoint)
            );
            
            if (sentenceBreak > pageSize * 0.7) {
              breakPoint = sentenceBreak + 2; // Include the period and space
            } else {
              // Last resort: break at a space
              const spaceBreak = remaining.lastIndexOf(' ', breakPoint);
              if (spaceBreak > pageSize * 0.8) {
                breakPoint = spaceBreak + 1;
              }
              // If we couldn't find a good break, just use the pageSize
            }
          }
        }
        
        pages.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint);
      }
      
      setTextPages(pages);
      setTotalPages(pages.length);
      setCurrentPage(1); // Reset to first page when new text is loaded
      
      // Process the first page
      if (pages.length > 0) {
        processTextForPage(pages[0]);
      } else {
        setWords([]);
        setCurrentWordIndex(-1);
      }
      
      setEditMode(!pages.length); // Enter edit mode if no text
    } else {
      setTextPages([]);
      setTotalPages(1);
      setCurrentPage(1);
      setWords([]);
      setCurrentWordIndex(-1);
      setEditMode(true);
    }
  }, [fullText, pageSize]);

  // Update display text when page changes
  useEffect(() => {
    if (textPages.length > 0 && currentPage <= textPages.length) {
      processTextForPage(textPages[currentPage - 1]);
    }
  }, [currentPage, textPages]);

  // Process text for the current page
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

  // Track reading session
  useEffect(() => {
    if (isSpeaking && !isPaused && !readingStartTime) {
      setReadingStartTime(Date.now());
      setReadingStats(prev => ({
        ...prev,
        startTime: Date.now(),
      }));
    }

    // Update reading stats when reading stops
    if (!isSpeaking && readingStartTime) {
      const elapsedTime = Math.floor((Date.now() - readingStartTime) / 1000); // seconds
      const wordsRead = currentWordIndex >= 0 ? currentWordIndex + 1 : 0;
      
      setReadingStats(prev => ({
        ...prev,
        wordsRead: prev.wordsRead + wordsRead,
        readingTime: prev.readingTime + elapsedTime,
      }));
      
      setTotalWordsRead(prev => prev + wordsRead);
      setReadingStartTime(null);
      
      // Save reading stats to Supabase if user is logged in
      if (user && wordsRead > 0) {
        updateReadingStats(wordsRead, elapsedTime);
      }
    }
  }, [isSpeaking, isPaused, readingStartTime, currentWordIndex, user]);

  // Update Supabase with reading stats
  const updateReadingStats = async (wordsRead: number, readingTime: number) => {
    if (!user) return;
    
    try {
      // Calculate average speed (words per minute)
      const wpm = readingTime > 0 ? Math.round((wordsRead / readingTime) * 60) : 0;
      
      console.log(`Updating reading stats: ${wordsRead} words in ${readingTime} seconds (${wpm} wpm)`);
      
      // Record this reading activity
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
      
      // First try to get existing stats
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
        // Update existing stats
        const totalWords = existingStats.words_read + wordsRead;
        const totalTime = existingStats.total_reading_time + readingTime;
        const avgSpeed = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;
        
        // Check if this is a continuation of the current streak
        const lastReadDate = new Date(existingStats.last_read_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Consider it a streak if last read was today or yesterday
        const isToday = lastReadDate.toDateString() === today.toDateString();
        const isYesterday = lastReadDate.toDateString() === yesterday.toDateString();
        
        let currentStreak = existingStats.current_streak;
        let longestStreak = existingStats.longest_streak;
        
        if (!isToday) {
          if (isYesterday) {
            // Continue streak
            currentStreak += 1;
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }
          } else {
            // Reset streak
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
        // Create new stats record
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

  // Update when initialText changes
  useEffect(() => {
    if (initialText) {
      setFullText(initialText);
      
      if (isSpeaking) {
        stopSpeech();
      }
      
      setCurrentWordIndex(-1);
      setCurrentTextPosition(0);
      
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
      
      // Increment documents uploaded counter if user is logged in
      if (user && initialText.trim().length > 0) {
        incrementDocumentsUploaded();
      }
    }
  }, [initialText, user]);

  // Update display text when word index changes
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

  // Initialize speech synthesis
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
  }, [fullText]);

  // Handle text edit
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // When in edit mode, update the full text
    if (editMode) {
      setFullText(e.target.value);
    } else {
      // When not in edit mode (just viewing a page), update just the current page
      const newPages = [...textPages];
      newPages[currentPage - 1] = e.target.value;
      setTextPages(newPages);
      
      // Update the full text by joining all pages
      setFullText(newPages.join(''));
    }
    setCurrentWordIndex(-1);
  };

  // Reset text
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
    
    toast({
      title: "Text Reset",
      description: "The reader has been cleared.",
    });
  };

  // Navigate to next page
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

  // Navigate to previous page
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

  // Go to specific page
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

  // Get voice for TTS
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

  // Create speech utterance
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
      
      // Optionally auto-advance to next page
      /*
      if (currentPage < totalPages) {
        toast({
          title: "Page Complete",
          description: "Moving to next page...",
        });
        setTimeout(() => handleNextPage(), 1500);
      }
      */
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

  // Start text-to-speech
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

  // Stop speech
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

  // Pause speech
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

  // Resume speech
  const resumeSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  // Skip forward
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

  // Skip backward
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

  // Toggle play/pause
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

  // Modify the speech rate
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

  // Change voice
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

  // Format speed label
  const formatSpeedLabel = (speed: number) => {
    return `${speed}x`;
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    // If switching to edit mode, combine all pages
    if (!editMode) {
      // Already in view mode, switching to edit mode
      setEditMode(true);
      // Focus the textarea after switching to edit mode
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    } else {
      // In edit mode, switching to view mode
      setEditMode(false);
    }
  };

  // Update document upload count
  const incrementDocumentsUploaded = async () => {
    if (!user) return;
    
    try {
      // First check if the user has stats
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
        // Update existing record
        await supabase
          .from('reading_stats')
          .update({
            documents_uploaded: data.documents_uploaded + 1
          })
          .eq('user_id', user.id);
      } else {
        // Create new record
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

  // Generate pagination numbers
  const getPaginationItems = () => {
    const items: number[] = [];
    const maxVisible = 7; // Max number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if there aren't too many
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);
      
      // Calculate range around current page
      const leftSide = Math.max(2, currentPage - 2);
      const rightSide = Math.min(totalPages - 1, currentPage + 2);
      
      // Add ellipsis if needed on left side
      if (leftSide > 2) {
        items.push(-1); // Use -1 to represent ellipsis
      }
      
      // Add pages around current page
      for (let i = leftSide; i <= rightSide; i++) {
        items.push(i);
      }
      
      // Add ellipsis if needed on right side
      if (rightSide < totalPages - 1) {
        items.push(-2); // Use -2 to represent ellipsis (different key)
      }
      
      // Always show last page
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
        {(editMode || isSpeaking) ? (
          editMode ? (
            // Edit mode - show textarea
            <Textarea
              ref={textareaRef}
              value={fullText}
              onChange={handleTextChange}
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
          ) : (
            // Reading mode with word highlighting
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
          )
        ) : (
          // View mode - show current page text without editing or highlighting
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
      
      {/* Pagination Controls */}
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
      
      {/* Text-to-Speech Controls */}
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
