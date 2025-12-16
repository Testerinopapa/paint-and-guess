import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface GuessInputProps {
  onSubmit: (word: string) => void;
  disabled?: boolean;
}

export function GuessInput({ onSubmit, disabled }: GuessInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your guess..."
        disabled={disabled}
        className="flex-1 text-base"
        autoFocus
      />
      <Button 
        type="submit" 
        disabled={disabled || !input.trim()}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

