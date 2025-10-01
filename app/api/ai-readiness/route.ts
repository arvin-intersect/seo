import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

interface CheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: string;
  recommendation: string;
}

function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((acc, word) => {
    return acc + (word.match(/[aeiouAEIOU]+/g) || []).length || 1;
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  return Math.max(0, Math.min(100, score));
}

function extractTextContent(html: string): string {
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
  cleanHtml = cleanHtml.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return cleanHtml.replace(/\s+/g, ' ').trim();
}

async function analyzeHTML(html: string, metadata: Record<string, unknown>): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  const textContent = extractTextContent(html);
  
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const headings = html.match(/<h([1-6])[^>]*>/gi) || [];
  const headingLevels = headings.map(h => parseInt(h.match(/<h([1-6])/i)?.[1] || '0'));
  
  let headingScore = 100;
  const headingIssues: string[] = [];
  
  if (h1Count === 0) {
    headingScore -= 40;
    headingIssues.push('No H1 found');
  } else if (h1Count > 1) {
    headingScore -= 30;
    headingIssues.push(`Multiple H1s (${h1Count}) create topic ambiguity`);
  }
  
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i-1] > 1) {
      headingScore -= 15;
      headingIssues.push(`Skipped heading level (H${headingLevels[i-1]} → H${headingLevels[i]})`);
    }
  }
  
  headingScore = Math.max(0, headingScore);
  
  results.push({
    id: 'heading-structure',
    label: 'Heading Hierarchy',
    status: headingScore >= 80 ? 'pass' : headingScore >= 50 ? 'warning' : 'fail',
    score: headingScore,
    details: headingIssues.length > 0 ? headingIssues.join(', ') : `Perfect hierarchy with ${h1Count} H1 and logical structure`,
    recommendation: headingScore < 80 ? 'Use exactly one H1 and maintain logical heading hierarchy (H1→H2→H3)' : 'Excellent heading structure for AI comprehension'
  });
  
  const readabilityScore = calculateReadability(textContent);
  let readabilityStatus: 'pass' | 'warning' | 'fail' = 'pass';
  let readabilityDetails = '';
  let normalizedScore = 0;
  
  if (readabilityScore >= 70) {
    normalizedScore = 100;
    readabilityStatus = 'pass';
    readabilityDetails = `Very readable (Flesch: ${Math.round(readabilityScore)})`;
  } else if (readabilityScore >= 50) {
    normalizedScore = 80;
    readabilityStatus = 'pass';
    readabilityDetails = `Good readability (Flesch: ${Math.round(readabilityScore)})`;
  } else if (readabilityScore >= 30) {
    normalizedScore = 50;
    readabilityStatus = 'warning';
    readabilityDetails = `Difficult to read (Flesch: ${Math.round(readabilityScore)})`;
  } else {
    normalizedScore = 20;
    readabilityStatus = 'fail';
    readabilityDetails = `Very difficult (Flesch: ${Math.round(readabilityScore)})`;
  }
  
  results.push({
    id: 'readability',
    label: 'Content Readability',
    status: readabilityStatus,
    score: normalizedScore,
    details: readabilityDetails,
    recommendation: normalizedScore < 80 ? 'Simplify sentences and use clearer language for better AI comprehension' : 'Content is clearly written and AI-friendly'
  });
  
  const hasOgTitle = metadata?.ogTitle || metadata?.title || html.includes('og:title') || html.includes('<title');
  const hasOgDescription = metadata?.ogDescription || metadata?.description || html.includes('og:description') || html.includes('name="description"');
  
  const descMatch = html.match(/content="([^"]*)"/i);
  const descLength = descMatch?.[1]?.length || 0;
  const hasGoodDescLength = descLength >= 70 && descLength <= 160;
  
  const hasAuthor = html.includes('name="author"') || html.includes('property="article:author"');
  const hasPublishDate = html.includes('property="article:published_time"') || html.includes('property="article:modified_time"');
  
  let metaScore = 30;
  const metaDetails: string[] = [];
  
  if (hasOgTitle) {
    metaScore += 30;
    metaDetails.push('Title ✓');
  } else if (html.includes('<title')) {
    metaScore += 20;
    metaDetails.push('Basic title');
  }
  
  if (hasOgDescription) {
    metaScore += 25;
    if (hasGoodDescLength) {
      metaScore += 10;
      metaDetails.push('Description ✓');
    } else {
      metaDetails.push('Description');
    }
  }
  
  if (hasAuthor) {
    metaScore += 10;
    metaDetails.push('Author ✓');
  }
  if (hasPublishDate) {
    metaScore += 10;
    metaDetails.push('Date ✓');
  }
  
  metaScore = Math.min(100, metaScore);
  results.push({
    id: 'meta-tags',
    label: 'Metadata Quality',
    status: metaScore >= 70 ? 'pass' : metaScore >= 40 ? 'warning' : 'fail',
    score: metaScore,
    details: metaDetails.length > 0 ? metaDetails.join(', ') : 'Missing critical metadata',
    recommendation: metaScore < 70 ? 'Add title, description (70-160 chars), author, and publish date metadata' : 'Metadata provides excellent context for AI'
  });
  
  const semanticTags = ['<article', '<nav', '<main', '<section', '<header', '<footer', '<aside'];
  const semanticCount = semanticTags.filter(tag => html.includes(tag)).length;
  
  const hasAriaRoles = html.includes('role="') || html.includes('aria-');
  const isModernFramework = html.includes('__next') || html.includes('_app') || html.includes('react') || html.includes('vue') || html.includes('svelte');
  
  const semanticScore = Math.min(100, (semanticCount / 5) * 60 + (hasAriaRoles ? 20 : 0) + (isModernFramework ? 20 : 0));
  
  results.push({
    id: 'semantic-html',
    label: 'Semantic HTML',
    status: semanticScore >= 80 ? 'pass' : semanticScore >= 40 ? 'warning' : 'fail',
    score: semanticScore,
    details: `Found ${semanticCount} semantic HTML5 elements`,
    recommendation: semanticScore < 80 ? 'Use more semantic HTML5 elements (article, nav, main, section, etc.)' : 'Excellent use of semantic HTML'
  });
  
  const hasAltText = (html.match(/alt="/g) || []).length;
  const imgCount = (html.match(/<img/g) || []).length;
  const altTextRatio = imgCount > 0 ? (hasAltText / imgCount) * 100 : 100;
  const hasAriaLabels = html.includes('aria-label');
  const hasAriaDescribedBy = html.includes('aria-describedby');
  const hasRole = html.includes('role="');
  const hasLangAttribute = html.includes('lang="');
  
  const imageScore = imgCount === 0 ? 40 : (altTextRatio * 0.4);
  
  const accessibilityScore = Math.min(100, imageScore + (hasAriaLabels ? 20 : 0) + (hasAriaDescribedBy ? 10 : 0) + (hasRole ? 15 : 0) + (hasLangAttribute ? 15 : 0));
  
  results.push({
    id: 'accessibility',
    label: 'Accessibility',
    status: accessibilityScore >= 80 ? 'pass' : accessibilityScore >= 50 ? 'warning' : 'fail',
    score: Math.round(accessibilityScore),
    details: `${Math.round(altTextRatio)}% images have alt text, ARIA labels: ${hasAriaLabels ? 'Yes' : 'No'}`,
    recommendation: accessibilityScore < 80 ? 'Add alt text to all images and use ARIA labels for interactive elements' : 'Good accessibility implementation'
  });
  return results;
}

async function checkAdditionalFiles(domain: string): Promise<{ robots: CheckResult, sitemap: CheckResult, llms: CheckResult }> {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const cleanUrl = new URL(baseUrl).origin;
  
  const fetchWithTimeout = async (url: string, timeout = 3000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  let robotsCheck: CheckResult = { id: 'robots-txt', label: 'Robots.txt', status: 'fail', score: 0, details: 'No robots.txt file found', recommendation: 'Create a robots.txt file with AI crawler directives' };
  let sitemapCheck: CheckResult = { id: 'sitemap', label: 'Sitemap', status: 'fail', score: 0, details: 'No sitemap.xml found', recommendation: 'Generate and submit an XML sitemap' };
  let llmsCheck: CheckResult = { id: 'llms-txt', label: 'LLMs.txt', status: 'fail', score: 0, details: 'No llms.txt file found', recommendation: 'Add an llms.txt file to define AI usage permissions' };
  
  let robotsText = '';
  let sitemapUrls: string[] = [];
  
  const promises = [
    fetchWithTimeout(`${cleanUrl}/robots.txt`).then(async (response) => {
      if (response.ok) {
        robotsText = await response.text();
        const hasUserAgent = robotsText.toLowerCase().includes('user-agent');
        const sitemapMatches = robotsText.match(/Sitemap:\s*(.+)/gi);
        if (sitemapMatches) {
          sitemapUrls = sitemapMatches.map(match => match.replace(/Sitemap:\s*/i, '').trim());
        }
        const hasSitemap = sitemapUrls.length > 0;
        const score = (hasUserAgent ? 60 : 0) + (hasSitemap ? 40 : 0);
        robotsCheck = { id: 'robots-txt', label: 'Robots.txt', status: score >= 80 ? 'pass' : score >= 40 ? 'warning' : 'fail', score, details: `Robots.txt found${hasSitemap ? ` with ${sitemapUrls.length} sitemap reference(s)` : ''}`, recommendation: score < 80 ? 'Add sitemap reference to robots.txt' : 'Robots.txt properly configured' };
      }
    }).catch(() => {}),
    ...['llms.txt', 'LLMs.txt', 'llms-full.txt'].map(filename => fetchWithTimeout(`${cleanUrl}/${filename}`).then(async (response) => {
      if (response.ok) {
        const llmsText = await response.text();
        const isValidLlms = (llmsText.length > 10 && !llmsText.includes('<!DOCTYPE') && !llmsText.includes('<html') && !llmsText.includes('<HTML') && !llmsText.toLowerCase().includes('404 not found') && !llmsText.toLowerCase().includes('page not found') && !llmsText.toLowerCase().includes('cannot be found'));
        if (isValidLlms) {
          llmsCheck = { id: 'llms-txt', label: 'LLMs.txt', status: 'pass', score: 100, details: `${filename} file found with AI usage guidelines`, recommendation: 'Great! You have defined AI usage permissions' };
        }
      }
    }).catch(() => {}))
  ];
  
  await Promise.all(promises);
  
  const possibleSitemapUrls = [...sitemapUrls];
  const commonLocations = [`${cleanUrl}/sitemap.xml`, `${cleanUrl}/sitemap_index.xml`, `${cleanUrl}/sitemap-index.xml`, `${cleanUrl}/sitemaps/sitemap.xml`, `${cleanUrl}/sitemap/sitemap.xml`];
  for (const url of commonLocations) {
    if (!possibleSitemapUrls.includes(url)) {
      possibleSitemapUrls.push(url);
    }
  }
  
  for (const sitemapUrl of possibleSitemapUrls) {
    try {
      const response = await fetchWithTimeout(sitemapUrl);
      if (response.ok) {
        const content = await response.text();
        const isValidSitemap = (content.includes('<?xml') || content.includes('<urlset') || content.includes('<sitemapindex') || content.includes('<url>') || content.includes('<sitemap>')) && !content.includes('<!DOCTYPE html');
        if (isValidSitemap) {
          const fromRobots = sitemapUrls.includes(sitemapUrl);
          sitemapCheck = { id: 'sitemap', label: 'Sitemap', status: 'pass', score: 100, details: `Valid XML sitemap found${fromRobots ? ' (referenced in robots.txt)' : ` at ${sitemapUrl.replace(cleanUrl, '')}`}`, recommendation: 'Sitemap is properly configured' };
          break;
        }
      }
    } catch {
      // Continue checking other URLs
    }
  }
  
  return { robots: robotsCheck, sitemap: sitemapCheck, llms: llmsCheck };
}

function getDomainReputationBonus(domain: string): number {
  const topTierDomains = ['vercel.com', 'stripe.com', 'github.com', 'openai.com', 'anthropic.com', 'google.com', 'microsoft.com', 'apple.com', 'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com', 'react.dev', 'nextjs.org', 'tailwindcss.com'];
  const secondTierDomains = ['netlify.com', 'heroku.com', 'digitalocean.com', 'cloudflare.com', 'twilio.com', 'slack.com', 'notion.so', 'linear.app', 'figma.com'];
  const cleanDomain = domain.replace('www.', '');
  if (cleanDomain.includes('docs.') || cleanDomain.includes('developer.') || cleanDomain.includes('api.')) {
    return 20;
  }
  if (topTierDomains.some(d => cleanDomain === d || cleanDomain.endsWith(`.${d}`))) {
    return 18;
  }
  if (secondTierDomains.some(d => cleanDomain === d || cleanDomain.endsWith(`.${d}`))) {
    return 12;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    let { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    const scrapeStartTime = Date.now();
    
    let scrapeResult;
    try {
      scrapeResult = await firecrawl.scrape(url, {
        formats: ['html'],
      });
    } catch (scrapeError) {
      console.error('Scrape error:', scrapeError);
      return NextResponse.json({ error: 'Failed to scrape website. Please check the URL.' }, { status: 500 });
    }
    
    const html = scrapeResult?.html || scrapeResult?.data?.html || scrapeResult?.content || '';
    const metadata = scrapeResult?.metadata || scrapeResult?.data?.metadata || {};
    
    if (!html) {
      return NextResponse.json({ error: 'Failed to extract content from website' }, { status: 500 });
    }
    
    const htmlChecks = await analyzeHTML(html, metadata);
    const fileChecks = await checkAdditionalFiles(url);
    
    const allChecks = [fileChecks.llms, fileChecks.robots, fileChecks.sitemap, ...htmlChecks];
    
    const weights: { [key: string]: number } = { 'readability': 1.5, 'heading-structure': 1.4, 'meta-tags': 1.2, 'robots-txt': 0.9, 'sitemap': 0.8, 'llms-txt': 0.3, 'semantic-html': 1.0, 'accessibility': 0.9 };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const check of allChecks) {
      const weight = weights[check.id] || 1.0;
      weightedSum += check.score * weight;
      totalWeight += weight;
    }
    
    const domain = new URL(url).hostname.toLowerCase();
    const reputationBonus = getDomainReputationBonus(domain);
    
    let baseScore = Math.round(weightedSum / totalWeight);
    
    const contentSignals = allChecks.filter(c => ['readability', 'heading-structure', 'meta-tags'].includes(c.id) && c.score >= 60).length;
    
    if (contentSignals >= 3) {
      baseScore += 15;
    } else if (contentSignals >= 2) {
      baseScore += 10;
    }
    
    if (baseScore < 35 && allChecks.some(c => c.score >= 80)) {
      baseScore = 35;
    }
    
    const overallScore = Math.min(100, baseScore + reputationBonus);
    
    console.log(`[AI-READY] Total analysis time: ${Date.now() - scrapeStartTime}ms`);
    
    return NextResponse.json({
      success: true,
      url,
      overallScore,
      checks: allChecks,
      htmlContent: html.substring(0, 10000),
      metadata: {
        title: metadata.title,
        description: metadata.description,
        analyzedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('AI Readiness analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze website' }, { status: 500 });
  }
}