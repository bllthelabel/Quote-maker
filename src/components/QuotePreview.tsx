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

        {/* Subtle Overlay to ensure readability */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Content Container */}
        <div className="absolute inset-0 p-8 flex flex-col z-10">
          
          {/* Quote - Centered */}
          <div className="flex-1 flex flex-col justify-center items-center w-full gap-4 md:gap-6 my-8 overflow-hidden text-center">
            <div className="max-w-[90%]">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#E2D06B] leading-[1.2] tracking-tight drop-shadow-md">
                {renderQuote()}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center text-[#E2D06B]">
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
