import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bookmark, Send } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuotePreviewProps {
  quote: string;
  italicWord?: string;
  imageUrl: string | null;
  className?: string;
}

export const QuotePreview = forwardRef<HTMLDivElement, QuotePreviewProps>(
  ({ quote, italicWord, imageUrl, className }, ref) => {
    
    // Helper to render the quote with the italic word highlighted
    const renderQuote = () => {
      if (!quote) return null;
      if (!italicWord) return <>{quote}</>;

      const parts = quote.split(new RegExp(`(${italicWord})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === italicWord.toLowerCase() ? (
          <em key={i} className="italic font-medium">{part}</em>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      );
    };

    // Dynamic font size based on quote length to ensure it fits the safe zone
    const getFontSizeClass = (text: string) => {
      const len = text.length;
      if (len < 40) return "text-4xl sm:text-5xl md:text-6xl";
      if (len < 85) return "text-3xl sm:text-4xl md:text-5xl";
      if (len < 140) return "text-2xl sm:text-3xl md:text-4xl";
      if (len < 200) return "text-xl sm:text-2xl md:text-3xl";
      return "text-lg sm:text-xl md:text-2xl";
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden flex flex-col bg-[#F5F2ED]",
          // 4:5 aspect ratio is 1080x1350. We can use aspect-[4/5]
          "aspect-[4/5] w-full max-w-[540px] mx-auto",
          className
        )}
      >
        {/* Background Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        )}

        {/* Stronger Overlay to ensure readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content Container - Increased vertical padding for IG safe zones */}
        <div className="absolute inset-0 px-8 py-20 flex flex-col z-10">
          
          {/* Quote - Centered */}
          <div className="flex-1 flex flex-col justify-center items-center w-full gap-4 md:gap-6 overflow-hidden text-center">
            <div className="max-w-[95%]">
              <p className={cn(
                "font-serif text-[#E2D06B] leading-[1.3] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]",
                getFontSizeClass(quote || "")
              )}>
                {renderQuote()}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center text-[#E2D06B] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <Bookmark className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Save</span>
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-80">
              BLL THE LABEL
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer">
              <Send className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Share</span>
            </div>
          </div>

        </div>

        {/* Empty State */}
        {!quote && !imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="font-serif text-zinc-400 text-lg">Your quote will appear here.</p>
          </div>
        )}
      </div>
    );
  }
);

QuotePreview.displayName = 'QuotePreview';
