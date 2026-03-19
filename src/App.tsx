/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeQuote, generateBackgroundImage } from './services/geminiService';
import { QuotePreview } from './components/QuotePreview';

export default function App() {
  const [quoteInput, setQuoteInput] = useState('');
  const [activeQuote, setActiveQuote] = useState('');
  const [italicWord, setItalicWord] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the API key is present in the environment variables
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    setHasApiKey(!!key && key !== 'undefined' && key !== 'null' && key.length > 10);
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
      setLoadingText('Generating aesthetic image (this can take up to 60 seconds)...');
      const bgImage = await generateBackgroundImage(analysis.imagePrompt || 'A beautiful minimalist aesthetic background');
      setImageUrl(bgImage);
    } catch (err: any) {
      console.error('Generation error:', err);
      let errorMessage = err.message || "Failed to generate the post. Please try again.";
      
      // Check if it's a JSON error from the API
      if (errorMessage.includes("API key not valid")) {
        errorMessage = "Your API key is invalid or missing. Please check your AI Studio settings (⚙️ gear icon -> Secrets) and ensure you have set a valid GEMINI_API_KEY.";
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
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${hasApiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {hasApiKey ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> API Key Configured</>
                ) : (
                  <><AlertCircle className="w-3.5 h-3.5" /> Missing API Key (Check Settings)</>
                )}
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
