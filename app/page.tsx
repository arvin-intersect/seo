// FILE: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import shared components
import { Connector } from "@/components/shared/layout/curvy-rect";
import { HeaderProvider } from "@/components/shared/header/HeaderContext";

// Import page-specific components
import HeroInputSubmitButton from "@/components/app/(home)/sections/hero-input/Button/Button";
import Globe from "@/components/app/(home)/sections/hero-input/_svg/Globe";
import ControlPanel from "@/components/app/(home)/sections/ai-readiness/ControlPanel";

// Import header components
import HeaderBrandKit from "@/components/shared/header/BrandKit/BrandKit";
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper";
import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper";

// Defines the shape of the analysis data to avoid using 'any'
interface AnalysisCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: string;
  recommendation: string;
}
interface AnalysisData {
  success: boolean;
  url: string;
  overallScore: number;
  checks: AnalysisCheck[]; // <-- This is the corrected type
  htmlContent: string;
  metadata: {
    title: string;
    description: string;
    analyzedAt: string;
  };
}

export default function StyleGuidePage() {
  const [url, setUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [hasAiKey, setHasAiKey] = useState(false);
  const [urlError, setUrlError] = useState<string>("");
  
  useEffect(() => {
    fetch('/api/check-config')
      .then(res => res.json())
      .then(data => {
        setHasAiKey(data.hasGoogleKey || data.hasGroqKey || data.hasOpenAIKey || false);
      })
      .catch(() => setHasAiKey(false));
  }, []);
  
  const handleAnalysis = async () => {
    if (!url) return;
    
    let processedUrl = url.trim();
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl;
    }
    
    try {
      new URL(processedUrl);
    } catch {
      setUrlError('Please enter a valid URL (e.g., example.com)');
      return;
    }
    
    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysisData(null);
    
    try {
      const response = await fetch('/api/ai-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: processedUrl }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data);
        setIsAnalyzing(false);
        setShowResults(true);
      } else {
        console.error('Analysis failed:', data.error);
        setIsAnalyzing(false);
        alert('Failed to analyze website. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      alert('An error occurred while analyzing the website.');
    }
  };

  return (
    <HeaderProvider>
      <div className="min-h-screen bg-background-base">
        <HeaderDropdownWrapper />
        
        <div className="sticky top-0 left-0 w-full z-[101] bg-background-base header">
          <div className="absolute top-0 cmw-container border-x border-border-faint h-full pointer-events-none" />
          <div className="h-1 bg-border-faint w-full left-0 -bottom-1 absolute" />
          <div className="cmw-container absolute h-full pointer-events-none top-0">
            <Connector className="absolute -left-[10.5px] -bottom-11" />
            <Connector className="absolute -right-[10.5px] -bottom-11" />
          </div>
          
          <HeaderWrapper>
            <div className="max-w-[900px] mx-auto w-full flex justify-start items-center">
              <div className="flex gap-24 items-center">
                <HeaderBrandKit />
              </div>
            </div>
          </HeaderWrapper>
        </div>

        <section className="overflow-x-clip" id="home-hero">
          <div className={`pt-28 lg:pt-48 pb-115 relative`} id="hero-content">
            <AnimatePresence mode="wait">
              {!isAnalyzing && !showResults ? (
                <motion.div
                  key="hero"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="relative container px-16"
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-center text-accent-black leading-tight">
                    AI-Ready Blog Analyzer
                  </h1>
                  
                  <p className="text-center text-body-large text-black-alpha-72 mt-6 max-w-xl mx-auto">
                    An internal tool for the Intersect team to check if a blog post is ready for AI search and analysis.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="control-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative container px-16"
                  style={{ marginTop: '-35px' }}
                >
                  <ControlPanel
                    isAnalyzing={isAnalyzing}
                    showResults={showResults}
                    url={url}
                    analysisData={analysisData}
                    hasAiKey={hasAiKey}
                    onReset={() => {
                      setIsAnalyzing(false);
                      setShowResults(false);
                      setAnalysisData(null);
                      setUrl("");
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {!isAnalyzing && !showResults && (
            <motion.div 
              className="container lg:contents !p-16 relative -mt-90"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 left-[calc(50%-50vw)] w-screen h-1 bg-border-faint lg:hidden" />
              <div className="absolute bottom-0 left-[calc(50%-50vw)] w-screen h-1 bg-border-faint lg:hidden" />
              
              <Connector className="-top-10 -left-[10.5px] lg:hidden" />
              <Connector className="-top-10 -right-[10.5px] lg:hidden" />
              <Connector className="-bottom-10 -left-[10.5px] lg:hidden" />
              <Connector className="-bottom-10 -right-[10.5px] lg:hidden" />
              
              <div className="max-w-552 mx-auto w-full relative z-[11] rounded-20 -mt-30">
                <div
                  className="overlay bg-background-lighter"
                  style={{
                    boxShadow: "0px 16px 32px -12px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px rgba(255, 255, 255, 0.05)",
                  }}
                />
                
                <div className="p-16 flex gap-12 items-center w-full relative">
                  <Globe />
                  <input
                    className={`flex-1 bg-transparent text-body-input text-accent-black placeholder:text-black-alpha-48 focus:outline-none focus:ring-0 focus:border-transparent ${urlError ? 'text-red-400' : ''}`}
                    placeholder="Enter a blog URL to analyze..."
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && url.length > 0) {
                        e.preventDefault();
                        handleAnalysis();
                      }
                    }}
                  />
                  
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      if (url.length > 0) {
                        handleAnalysis();
                      }
                    }}
                  >
                    <HeroInputSubmitButton dirty={url.length > 0} />
                  </div>
                </div>
                
                {urlError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-24 left-16 text-red-400 text-label-small"
                  >
                    {urlError}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </HeaderProvider>
  );
}