/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeQuote } from './services/geminiService';
import { fetchUnsplashImages } from './services/unsplashService';
import { QuotePreview } from './components/QuotePreview';

export default function App() {
  const [quoteInput, setQuoteInput] = useState('');
  const [activeQuote, setActiveQuote] = useState('');
  const [italicWord, setItalicWord] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [hasUnsplashKey, setHasUnsplashKey] = useState<boolean | null>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the API key is present in the environment variables
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    setHasApiKey(!!key && key !== 'undefined' && key !== 'null' && key.length > 10);

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    setHasUnsplashKey(!!unsplashKey && unsplashKey !== 'undefined' && unsplashKey !== 'null' && unsplashKey.length > 10);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteInput.trim()) return;

    setIsGenerating(true);
    setError(null);
    setActiveQuote(quoteInput);
    setItalicWord('');
    setImageUrl(null);

    try {
      // 1. Analyze Quote
      setLoadingText('Analyzing quote vibe...');
      const analysis = await analyzeQuote(quoteInput);
      setItalicWord(analysis.italicWord || '');

      // 2. Generate Image
      setLoadingText('Fetching aesthetic backgrounds from Unsplash...');
      const bgImages = await fetchUnsplashImages(analysis.imagePrompt || 'minimalist aesthetic background', 3);
      setImageOptions(bgImages);
      setImageUrl(bgImages[0]); // Set the first one as default
    } catch (err: any) {
      console.error('Generation error:', err);
      let errorMessage = err.message || "Failed to generate the post. Please try again.";
      
      // Check if it's a JSON error from the API
      if (errorMessage.includes("API key not valid")) {
        errorMessage = "Your Gemini API key is invalid or missing. Please check your AI Studio settings (⚙️ gear icon -> Secrets) and ensure you have set a valid GEMINI_API_KEY.";
      } else if (errorMessage.includes("UNSPLASH_ACCESS_KEY is missing")) {
        errorMessage = "Your Unsplash Access Key is missing. Please add UNSPLASH_ACCESS_KEY to your AI Studio Secrets (⚙️ gear icon -> Secrets).";
      } else if (errorMessage.startsWith("{")) {
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      // Temporarily remove max-width for high-res export if needed, 
      // but html-to-image can scale it.
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 3, // High resolution
        cacheBust: true,
      });

      // Generate a unique filename from the quote (up to 3 words + unique ID)
      let filename = 'bll-quote';
      if (activeQuote) {
        const words = activeQuote
          .replace(/[^\w\s]/g, '') // remove punctuation
          .split(/\s+/) // split by whitespace
          .filter(w => w.length > 0)
          .slice(0, 3) // take first 3 words
          .join('-');
        
        const uniqueId = Math.random().toString(36).substring(2, 7);
        filename = words ? `${words}-${uniqueId}`.toLowerCase() : `bll-quote-${uniqueId}`;
      }

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-[#D32515]/20">
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Column: Input & Controls */}
        <div className="flex flex-col justify-center space-y-12 lg:sticky lg:top-24">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-zinc-900">
                Editorial Quote Generator
              </h1>
            </div>
            
            {hasApiKey !== null && (
              <div className="flex flex-wrap gap-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${hasApiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {hasApiKey ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Gemini API Configured</>
                  ) : (
                    <><AlertCircle className="w-3.5 h-3.5" /> Missing Gemini API Key</>
                  )}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${hasUnsplashKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {hasUnsplashKey ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Unsplash API Configured</>
                  ) : (
                    <><AlertCircle className="w-3.5 h-3.5" /> Missing Unsplash API Key</>
                  )}
                </div>
              </div>
            )}

            <p className="text-zinc-500 text-lg max-w-md leading-relaxed">
              Transform your words into visually stunning, minimalist Instagram posts. We analyze the sentiment and craft the perfect aesthetic.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="quote" className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                Your Quote
              </label>
              <textarea
                id="quote"
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                placeholder="Enter a quote to visualize..."
                className="w-full bg-transparent border-b border-zinc-200 pb-4 text-xl md:text-2xl font-serif focus:outline-none focus:border-[#D32515] transition-colors resize-none placeholder:text-zinc-300"
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !quoteInput.trim()}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-full overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{loadingText || 'Crafting aesthetic...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Post</span>
                </>
              )}
            </button>
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </form>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col items-center space-y-8">
          <div className="w-full max-w-[540px] bg-white p-4 rounded-3xl shadow-2xl shadow-zinc-200/50">
            <QuotePreview
              ref={previewRef}
              quote={activeQuote}
              italicWord={italicWord}
              imageUrl={imageUrl}
              className="rounded-2xl"
            />
          </div>

          {imageOptions.length > 0 && (
            <div className="w-full max-w-[540px] space-y-3">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest text-center">
                Choose a background
              </p>
              <div className="grid grid-cols-3 gap-4">
                {imageOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageUrl(opt)}
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
                      imageUrl === opt 
                        ? 'border-zinc-900 shadow-md scale-105 z-10' 
                        : 'border-transparent hover:border-zinc-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={opt} 
                      alt={`Option ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={!imageUrl || isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-full hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Download High-Res</span>
          </button>
        </div>

      </main>
    </div>
  );
}
