import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const quotes = [
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Fitness Buddy Philosophy"
  },
  {
    text: "It's not about being the best, it's about being better than you were yesterday.",
    author: "Unknown"
  },
  {
    text: "Strength does not come from the body. It comes from the will.",
    author: "Gandhi"
  },
  {
    text: "The difference between try and triumph is a little umph.",
    author: "Marvin Phillips"
  },
  {
    text: "The only way to define your limits is by going beyond them.",
    author: "Arthur C. Clarke"
  },
  {
    text: "Success isn't always about greatness. It's about consistency.",
    author: "Dwayne Johnson"
  }
];

export function MotivationalQuote() {
  const [quote, setQuote] = useState(quotes[0]);
  
  useEffect(() => {
    // Select a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);
  
  return (
    <Card>
      <div className="p-6 text-center bg-gradient-to-r from-primary-600 to-primary-400 text-white rounded-lg">
        <blockquote className="font-serif font-bold text-xl md:text-2xl mb-2">
          "{quote.text}"
        </blockquote>
        <p className="text-primary-100">- {quote.author}</p>
      </div>
    </Card>
  );
}
