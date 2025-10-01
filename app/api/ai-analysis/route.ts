// FILE: app/api/ai-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client with your API key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface CheckItem {
  id: string;
  label: string;
  score: number;
}

async function generateAIInsights(url: string, _htmlContent: string, currentChecks: CheckItem[]) {
  return generateGeminiInsights(url, _htmlContent, currentChecks);
}

async function generateGeminiInsights(url: string, _htmlContent: string, currentChecks: CheckItem[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Analyze this webpage for AI readiness. This could be ANY type of site - adapt your analysis accordingly.

URL: ${url}
Page-Level Scores: ${JSON.stringify(currentChecks.filter(c => ['readability', 'heading-structure', 'meta-tags'].includes(c.id)).map(c => c.label + ': ' + c.score))}

Analyze these universal AI readiness factors:
1. Content Quality for AI (content-quality) - Is the content clear, factual, and valuable for AI training?
2. Information Architecture (info-architecture) - How well organized and categorized is the information?
3. Semantic Structure (semantic-structure) - Does the HTML properly describe content meaning?
4. AI Discovery Value (ai-discovery) - Can AI systems easily understand what this page/site offers?
5. Knowledge Extraction (knowledge-extraction) - Can facts, entities, and relationships be extracted?
6. Context & Completeness (context-completeness) - Is there enough context for AI to understand topics?
7. Content Uniqueness (content-uniqueness) - Is this original content vs duplicated/thin content?
8. Machine Interpretability (machine-interpretability) - How easily can AI parse and understand this?

Adapt your analysis to the site type (e-commerce should focus on product data, news on article structure, etc).
Return ONLY a valid JSON object with an "insights" array containing {id, label, score(0-100), status(pass/warning/fail), details, recommendation, actionItems(array of 5 specific actions)} for each area. Do not wrap the JSON in markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let content = response.text();

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.log('Raw content from Gemini:', content);
      return generateMockInsights(url);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateMockInsights(url);
  }
}

function generateMockInsights(url: string = 'https://example.com') {
  return {
    insights: [
      {
        id: 'content-quality',
        label: 'Content Quality for AI',
        score: 75,
        status: 'warning',
        details: 'Content is generally well-structured.',
        recommendation: 'Great structure!',
        actionItems: ['Example action item.']
      },
      {
        id: 'data-structure',
        label: 'Data Structure & Schema',
        score: 60,
        status: 'warning',
        details: 'Basic structured data present.',
        recommendation: 'Add JSON-LD structured data.',
        actionItems: [`<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","url":"${url}"}</script>`]
      }
    ],
    overallAIReadiness: 'Moderate AI readiness.',
    topPriorities: ['Implement structured data.']
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url, htmlContent, currentChecks } = await request.json();
    
    if (!url || !htmlContent) {
      return NextResponse.json({ error: 'URL and HTML content are required' }, { status: 400 });
    }
    
    const insights = await generateAIInsights(url, htmlContent, currentChecks || []);
    
    return NextResponse.json({
      success: true,
      insights: insights.insights || [],
      overallAIReadiness: insights.overallAIReadiness || '',
      topPriorities: insights.topPriorities || []
    });
    
  } catch (error) {
    console.error('AI Analysis error:', error);
    try {
      const { url } = await request.clone().json();
      const mockData = generateMockInsights(url || 'https://example.com');
      return NextResponse.json({ success: true, ...mockData });
    } catch {
      const mockData = generateMockInsights('https://example.com');
      return NextResponse.json({ success: true, ...mockData });
    }
  }
}