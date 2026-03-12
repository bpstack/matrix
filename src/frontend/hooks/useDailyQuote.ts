import { useState, useEffect } from 'react';

interface DailyQuote {
  quote: string;
  author: string;
}

const FALLBACK_QUOTES: DailyQuote[] = [
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { quote: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { quote: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { quote: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { quote: 'Experience is the name everyone gives to their mistakes.', author: 'Oscar Wilde' },
  { quote: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
  { quote: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { quote: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { quote: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
  { quote: 'Programming isn\'t about what you know; it\'s about what you can figure out.', author: 'Chris Pine' },
  { quote: 'The most disastrous thing that you can ever learn is your first programming language.', author: 'Alan Kay' },
  { quote: 'Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday\'s code.', author: 'Dan Salomon' },
  { quote: 'Debugging is twice as hard as writing the code in the first place.', author: 'Brian Kernighan' },
  { quote: 'You can\'t have great software without a great team.', author: 'Jim Rohns' },
  { quote: 'The computer was born to solve problems that did not exist before.', author: 'Bill Gates' },
  { quote: 'Technology is best when it brings people together.', author: 'Matt Mullenweg' },
  { quote: 'It\'s not a bug - it\'s an undocumented feature.', author: 'Anonymous' },
  { quote: 'Before software can be reusable it first has to be usable.', author: 'Ralph Johnson' },
  { quote: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { quote: 'Progress is impossible without change.', author: 'George Bernard Shaw' },
  { quote: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { quote: 'Success is not final, failure is not fatal.', author: 'Winston Churchill' },
  { quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { quote: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
  { quote: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
  { quote: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
];

function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getFallbackQuote(): DailyQuote {
  const dayOfYear = Math.floor(Date.now() / 86400000);
  return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
}

export function useDailyQuote() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuote = async (forceRefresh = false) => {
    // Skip cache on refresh
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem('dailyQuote');
        if (cached) {
          const parsed = JSON.parse(cached);
          setQuote({ quote: parsed.quote, author: parsed.author });
          setIsLoading(false);
          return;
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Always try to fetch fresh quote from backend first
    try {
      const response = await fetch(`/api/external/daily-quote?_=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
        setIsLoading(false);
        
        // Cache in localStorage
        try {
          localStorage.setItem('dailyQuote', JSON.stringify(data));
        } catch {
          // Ignore storage errors
        }
        return;
      }
    } catch {
      // Fall through to cache or fallback
    }
    
    // Use fallback
    const fallback = getFallbackQuote();
    setQuote(fallback);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuote(false);
  }, []);

  const refresh = () => {
    setIsLoading(true);
    localStorage.removeItem('dailyQuote');
    fetchQuote(true);
  };

  return { quote, isLoading, refresh };
}