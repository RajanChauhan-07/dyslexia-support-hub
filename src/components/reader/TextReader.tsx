
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';

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
      utterance.rate = 0.9; // Slightly slower than default
      
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
      
      <div className="flex flex-wrap gap-3 justify-center">
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
