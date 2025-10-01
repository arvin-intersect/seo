"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  FileText, 
  Code, 
  Shield, 
  Zap, 
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Bot,
  Sparkles,
  FileCode,
  Network,
  Info,
  Eye,
  LucideProps
} from "lucide-react";
import { useEffect, useState, ComponentType } from "react";
import ScoreChart from "./ScoreChart";
import RadarChart from "./RadarChart";
import MetricBars from "./MetricBars";

interface AnalysisCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: string;
  recommendation: string;
  actionItems?: string[];
}
interface AnalysisData {
  checks: AnalysisCheck[];
  overallScore: number;
  htmlContent?: string;
}

interface ControlPanelProps {
  isAnalyzing: boolean;
  showResults: boolean;
  url: string;
  analysisData?: AnalysisData | null;
  hasAiKey: boolean;
  onReset: () => void;
}

interface CheckItem {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<LucideProps>;
  status: 'pending' | 'checking' | 'pass' | 'fail' | 'warning';
  score?: number;
  details?: string;
  recommendation?: string;
  actionItems?: string[];
  tooltip?: string;
  isAI?: boolean;
  isLoading?: boolean;
}

interface InsightItem {
  id: string;
  label: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  recommendation: string;
  actionItems?: string[];
}

export default function ControlPanel({
  isAnalyzing,
  showResults,
  url,
  analysisData,
  hasAiKey,
  onReset,
}: ControlPanelProps) {
  const [aiInsights, setAiInsights] = useState<CheckItem[]>([]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [combinedChecks, setCombinedChecks] = useState<CheckItem[]>([]);
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: 'heading-structure', label: 'Heading Hierarchy', description: 'H1-H6 structure', icon: FileText, status: 'pending' },
    { id: 'readability', label: 'Readability', description: 'Content clarity', icon: Globe, status: 'pending' },
    { id: 'meta-tags', label: 'Metadata Quality', description: 'Title, desc, author', icon: FileCode, status: 'pending' },
    { id: 'semantic-html', label: 'Semantic HTML', description: 'Proper HTML5 tags', icon: Code, status: 'pending' },
    { id: 'accessibility', label: 'Accessibility', description: 'Alt text & ARIA', icon: Eye, status: 'pending' },
    { id: 'llms-txt', label: 'LLMs.txt', description: 'AI permissions', icon: Bot, status: 'pending' },
    { id: 'robots-txt', label: 'Robots.txt', description: 'Crawler rules', icon: Shield, status: 'pending' },
    { id: 'sitemap', label: 'Sitemap', description: 'Site structure', icon: Network, status: 'pending' },
  ]);

  const [overallScore, setOverallScore] = useState(0);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(-1);
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const [hoveredCheck, setHoveredCheck] = useState<string | null>(null);
  const [enhancedScore, setEnhancedScore] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'chart' | 'bars'>('grid');

  useEffect(() => {
    if (analysisData && analysisData.checks && showResults) {
      const mappedChecks = analysisData.checks.map((check: AnalysisCheck) => ({
        ...check,
        icon: checks.find(c => c.id === check.id)?.icon || FileText,
        description: check.details || checks.find(c => c.id === check.id)?.description || '',
      }));
      setChecks(mappedChecks);
      setCombinedChecks(mappedChecks);
      setOverallScore(analysisData.overallScore || 0);
      setCurrentCheckIndex(-1);
    } else if (isAnalyzing) {
      const resetChecks = checks.map(check => ({ ...check, status: 'pending' as const }));
      setChecks(resetChecks);
      setCombinedChecks(resetChecks);
      setCurrentCheckIndex(0);
      setOverallScore(0);
      
      const checkInterval = setInterval(() => {
        setCurrentCheckIndex(prev => {
          if (prev >= checks.length - 1) {
            clearInterval(checkInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 200);

      return () => clearInterval(checkInterval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyzing, showResults, analysisData]);

  useEffect(() => {
    if (currentCheckIndex >= 0 && currentCheckIndex < checks.length && isAnalyzing) {
      setChecks(prev => prev.map((check, index) => {
        if (index === currentCheckIndex) return { ...check, status: 'checking' };
        if (index < currentCheckIndex) return { ...check, status: 'checking' };
        return check;
      }));
      setCombinedChecks(prev => prev.map((check, index) => {
        if (index === currentCheckIndex) return { ...check, status: 'checking' };
        if (index < currentCheckIndex) return { ...check, status: 'checking' };
        return check;
      }));
    }
  }, [currentCheckIndex, checks.length, isAnalyzing]);

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'checking': return <Loader2 className="w-16 h-16 text-primary-100 animate-spin" />;
      case 'pass': return <CheckCircle2 className="w-16 h-16 text-accent-black" />;
      case 'fail': return <XCircle className="w-16 h-16 text-red-400" />;
      case 'warning': return <AlertCircle className="w-16 h-16 text-yellow-400" />;
      default: return <div className="w-16 h-16 rounded-full border border-black-alpha-8" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[1200px] mx-auto"
    >
      <motion.div 
        className="text-center mb-48 pt-24 md:pt-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-title-h2 text-accent-black mb-12">AI Readiness Analysis</h2>
        <p className="text-body-large text-black-alpha-64">Single-page snapshot of {url}</p>
        
        {showResults && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-24 mb-20 flex justify-center gap-4"
            >
              <button onClick={() => setViewMode('grid')} className={`px-16 py-8 rounded-8 text-label-medium font-medium transition-all ${viewMode === 'grid' ? 'bg-accent-black text-white shadow-md' : 'bg-black-alpha-4 text-black-alpha-64 hover:bg-black-alpha-8'}`}>Grid View</button>
              <button onClick={() => setViewMode('chart')} className={`px-16 py-8 rounded-8 text-label-medium font-medium transition-all ${viewMode === 'chart' ? 'bg-accent-black text-white shadow-md' : 'bg-black-alpha-4 text-black-alpha-64 hover:bg-black-alpha-8'}`}>Radar Chart</button>
              <button onClick={() => setViewMode('bars')} className={`px-16 py-8 rounded-8 text-label-medium font-medium transition-all ${viewMode === 'bars' ? 'bg-accent-black text-white shadow-md' : 'bg-black-alpha-4 text-black-alpha-64 hover:bg-black-alpha-8'}`}>Bar Chart</button>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5 }}
              className="flex justify-center"
            >
              <ScoreChart score={enhancedScore > 0 ? enhancedScore : overallScore} enhanced={enhancedScore > 0} size={180} />
            </motion.div>
          </>
        )}
      </motion.div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-40 px-40 relative">
          {combinedChecks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={check.isAI ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: index === currentCheckIndex ? 1.05 : 1 }}
              transition={{ delay: check.isAI ? 0 : index * 0.1, scale: { type: "spring", stiffness: 300 } }}
              className={`relative p-16 rounded-8 transition-all bg-background-lighter border ${check.isAI ? 'border-primary-100 border-opacity-40 bg-gradient-to-br from-background-lighter to-primary-4' : 'border-black-alpha-8'} ${index === currentCheckIndex ? 'border-primary-100 shadow-lg' : ''} ${check.status !== 'pending' && check.status !== 'checking' ? 'cursor-pointer hover:shadow-md' : ''} ${check.isLoading ? 'animate-pulse' : ''}`}
              onClick={() => { if (check.status !== 'pending' && check.status !== 'checking') setSelectedCheck(selectedCheck === check.id ? null : check.id); }}
              onMouseEnter={() => setHoveredCheck(check.id)}
              onMouseLeave={() => setHoveredCheck(null)}
            >
              <div className="relative">
                <div className="flex items-start justify-end mb-12">{getStatusIcon(check.status)}</div>
                <h3 className="text-label-large mb-4 text-accent-black font-medium flex items-center gap-6">
                  {check.label}
                  {check.tooltip && !aiInsights.some(ai => ai.id === check.id) && (
                    <div className="relative inline-block">
                      <Info className="w-14 h-14 text-black-alpha-32 hover:text-black-alpha-64 transition-colors" />
                      <AnimatePresence>
                        {hoveredCheck === check.id && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-200 p-8 bg-accent-black text-white text-body-x-small rounded-6 shadow-lg z-50 pointer-events-none">
                            {check.tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-accent-black" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </h3>
                <p className="text-body-small text-black-alpha-64">{check.description}</p>
                {check.status !== 'pending' && check.status !== 'checking' && (
                  <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                      <div className="h-2 bg-black-alpha-4 rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${check.status === 'pass' ? 'bg-accent-black' : ''} ${check.status === 'warning' ? 'bg-yellow-400' : ''} ${check.status === 'fail' ? 'bg-red-400' : ''}`} initial={{ width: 0 }} animate={{ width: `${check.score}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-label-x-small text-black-alpha-32 mt-4 text-center">Click for details</motion.div>
                  </>
                )}
              </div>
              <AnimatePresence>
                {selectedCheck === check.id && check.details && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-12 pt-12 border-t border-black-alpha-8">
                    <div className="space-y-6">
                      <div>
                        <div className="text-label-small text-black-alpha-48 mb-2">Status</div>
                        <div className="text-body-small text-accent-black">{check.details}</div>
                      </div>
                      <div>
                        <div className="text-label-small text-black-alpha-48 mb-2">Recommendation</div>
                        <div className="text-body-small text-black-alpha-64">{check.recommendation}</div>
                        {check.actionItems && check.actionItems.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {check.actionItems.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-6 text-body-small text-black-alpha-64">
                                <span className="text-primary-100 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === 'chart' && showResults && (
        <div>
          <motion.div className="flex justify-center gap-40 mb-40" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex flex-col items-center">
              <h3 className="text-label-large text-accent-black mb-16 font-medium">Basic Analysis</h3>
              <RadarChart data={checks.filter(check => check.status !== 'pending' && check.status !== 'checking').slice(0, 8).map(check => ({ label: check.label.length > 12 ? check.label.substring(0, 12) + '...' : check.label, score: check.score || 0 }))} size={350} />
              <div className="mt-16 text-center">
                <div className="text-title-h3 text-accent-black">{overallScore}%</div>
                <div className="text-label-small text-black-alpha-48">Overall Score</div>
              </div>
            </div>
            {aiInsights.length > 0 && (<motion.div className="flex items-center" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}><div className="text-label-large text-black-alpha-32 font-medium">VS</div></motion.div>)}
            {aiInsights.length > 0 && (
              <motion.div className="flex flex-col items-center" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-label-large text-primary-100 mb-16 font-medium">AI Enhanced Analysis</h3>
                <RadarChart data={aiInsights.filter(check => check.status !== 'pending' && check.status !== 'checking').slice(0, 8).map(check => ({ label: check.label.length > 12 ? check.label.substring(0, 12) + '...' : check.label, score: check.score || 0 }))} size={350} />
                <div className="mt-16 text-center">
                  <div className="text-title-h3 text-primary-100">{Math.round(aiInsights.reduce((sum, check) => sum + (check.score || 0), 0) / aiInsights.length)}%</div>
                  <div className="text-label-small text-primary-100 opacity-60">AI Score</div>
                </div>
              </motion.div>
            )}
          </motion.div>
          {aiInsights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mb-20">
              <div className="inline-flex items-center gap-8 px-16 py-8 bg-primary-4 rounded-8">
                <span className="text-label-medium text-accent-black">AI analysis found {aiInsights.filter(i => i.score && i.score < 50).length} additional areas for improvement</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {viewMode === 'bars' && showResults && (
        <motion.div className="px-40 mb-40" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <MetricBars metrics={combinedChecks.filter(check => check.status !== 'pending' && check.status !== 'checking').map((check: CheckItem) => ({ label: check.label, score: check.score || 0, status: check.status as 'pass' | 'warning' | 'fail', category: check.isAI ? 'ai' : ['robots-txt', 'sitemap', 'llms-txt'].includes(check.id) ? 'domain' : 'page', details: check.details, recommendation: check.recommendation, actionItems: check.actionItems }))} />
        </motion.div>
      )}

      {showResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex gap-12 justify-center">
          <button onClick={onReset} className="px-20 py-10 bg-background-lighter border border-black-alpha-8 hover:bg-black-alpha-4 rounded-8 text-label-medium transition-all">Analyze Another Site</button>
          {hasAiKey && (
            <button 
              onClick={async () => {
                setIsAnalyzingAI(true);
                const placeholderAIChecks: CheckItem[] = [{ id: 'ai-loading-0', label: 'Content Quality for AI', description: 'Analyzing...', icon: Sparkles, status: 'checking' as const, score: 0, isAI: true, isLoading: true }, { id: 'ai-loading-1', label: 'Info. Architecture', description: 'Analyzing...', icon: Bot, status: 'checking' as const, score: 0, isAI: true, isLoading: true }, { id: 'ai-loading-2', label: 'Knowledge Extraction', description: 'Analyzing...', icon: Database, status: 'checking' as const, score: 0, isAI: true, isLoading: true }, { id: 'ai-loading-3', label: 'AI Training Value', description: 'Analyzing...', icon: Network, status: 'checking' as const, score: 0, isAI: true, isLoading: true }];
                placeholderAIChecks.forEach((check, idx) => { setTimeout(() => { setCombinedChecks(prev => [...prev, check]); }, 100 * (idx + 1)); });
                
                try {
                  const response = await fetch('/api/ai-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, htmlContent: analysisData?.htmlContent || '', currentChecks: checks })
                  });
                  
                  const data = await response.json();
                  if (data.success && data.insights) {
                    const aiChecks: CheckItem[] = data.insights.map((insight: InsightItem, idx: number) => ({ ...insight, icon: [Sparkles, Bot, Database, Network, FileCode, Shield, Zap, Globe][idx % 8], description: insight.details?.substring(0, 60) + '...' || 'AI Analysis', isAI: true, }));
                    setAiInsights(aiChecks);
                    setCombinedChecks(prev => { const withoutLoading = prev.filter(c => !c.isLoading); return [...withoutLoading, ...aiChecks]; });
                    
                    if (data.insights.length > 0) {
                      const aiScores = data.insights.map((i: InsightItem) => i.score || 0);
                      const avgAiScore = aiScores.reduce((a: number, b: number) => a + b, 0) / aiScores.length;
                      const combinedScore = Math.round((overallScore * 0.6) + (avgAiScore * 0.4));
                      setEnhancedScore(combinedScore);
                    }
                  }
                } catch (error) {
                  console.error('AI analysis error:', error);
                  setCombinedChecks(prev => prev.filter(c => !c.isLoading));
                } finally {
                  setIsAnalyzingAI(false);
                }
              }}
              disabled={isAnalyzingAI}
              className="px-20 py-10 bg-accent-black hover:bg-black-alpha-80 text-white rounded-8 text-label-medium transition-all disabled:opacity-50"
            >
              {isAnalyzingAI ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}