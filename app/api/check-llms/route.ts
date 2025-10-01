import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

interface CheckResult {
  filename: string;
  fetchStatus?: number;
  fetchOk?: boolean;
  contentLength?: number;
  isHTML?: boolean;
  has404?: boolean;
  hasLLMContent?: boolean;
  first100Chars?: string;
  error?: string;
}

interface Results {
  url: string;
  checks: CheckResult[];
  firecrawlResult?: {
    success: boolean;
    hasContent?: boolean;
    contentLength?: number;
    first100Chars?: string;
    error?: string;
  };
}


export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    const baseUrl = new URL(processedUrl).origin;
    
    const variations = ['llms.txt', 'LLMs.txt', 'llms-full.txt'];
    const results: Results = {
      url: baseUrl,
      checks: []
    };
    
    for (const filename of variations) {
      const testUrl = `${baseUrl}/${filename}`;
      
      try {
        const response = await fetch(testUrl);
        const text = await response.text();
        
        results.checks.push({
          filename,
          fetchStatus: response.status,
          fetchOk: response.ok,
          contentLength: text.length,
          isHTML: text.includes('<!DOCTYPE') || text.includes('<html'),
          has404: text.includes('404') || text.includes('Not Found'),
          hasLLMContent: (
            text.toLowerCase().includes('llm') || 
            text.toLowerCase().includes('ai') ||
            text.toLowerCase().includes('documentation') ||
            text.toLowerCase().includes('api') ||
            text.includes('#') ||
            text.includes('http')
          ),
          first100Chars: text.substring(0, 100)
        });
      } catch (e: unknown) {
        results.checks.push({
          filename,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
    
    try {
      const scrapeResult = await firecrawl.scrape(`${baseUrl}/llms.txt`, {
        formats: ['markdown'],
      });
      
      results.firecrawlResult = {
        success: true,
        hasContent: !!scrapeResult?.markdown,
        contentLength: scrapeResult?.markdown?.length || 0,
        first100Chars: scrapeResult?.markdown?.substring(0, 100)
      };
    } catch (e: unknown) {
      results.firecrawlResult = {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
    
    return NextResponse.json(results);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Check LLMs error:', error);
    return NextResponse.json(
      { error: 'Failed to check LLMs.txt: ' + errorMessage },
      { status: 500 }
    );
  }
}