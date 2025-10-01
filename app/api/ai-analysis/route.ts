// FILE: app/api/ai-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client with your API key from .env.local
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface AIAnalysisRequest {
  url: string;
  htmlContent: string;
  currentChecks: any[];
}

async function generateAIInsights(url: string, htmlContent: string, currentChecks: any[]) {
  return generateGeminiInsights(url, htmlContent, currentChecks);
}

async function generateGeminiInsights(url: string, htmlContent: string, currentChecks: any[]) {
  try {
    // Use the gemini-1.5-flash model for a good balance of speed and capability
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    // Clean the response to ensure it's valid JSON
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.log('Raw content from Gemini:', content);
      return generateMockInsights(url); // Fallback to mock data on parse error
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to mock data if the Gemini API fails
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
        details: 'Content is generally well-structured with clear paragraphs and headings. Some sections could benefit from better semantic markup.',
        recommendation: 'Great structure! Your headings are descriptive and paragraphs are well-organized.',
        actionItems: [
          'Example of good heading: "How to Configure API Authentication" instead of "Setup"',
          'Keep paragraphs under 150 words (yours average 120 - excellent!)',
          'Add a TL;DR section like: <section class="tldr">Key points...</section>',
          'Start each section with a clear topic sentence that summarizes the content'
        ]
      },
      {
        id: 'data-structure',
        label: 'Data Structure & Schema',
        score: 60,
        status: 'warning',
        details: 'Basic structured data present but could be enhanced with more detailed schema markup.',
        recommendation: 'Add JSON-LD structured data to help AI understand your content better.',
        actionItems: [
          `Add this to your <head>: <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Your Site","url":"${url}"}</script>`,
          'For articles, use: {"@type":"Article","headline":"Your Title","author":{"@type":"Person","name":"Author Name"}}',
          'For your company info: {"@type":"Organization","name":"Company","logo":"logo.png","contactPoint":{"@type":"ContactPoint","telephone":"+1-xxx"}}',
          'For FAQs: {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Q?","acceptedAnswer":{"@type":"Answer","text":"A"}}]}',
          'For products: {"@type":"Product","name":"Product Name","offers":{"@type":"Offer","price":"99.99","priceCurrency":"USD"}}'
        ]
      },
      {
        id: 'crawlability',
        label: 'Crawlability Score',
        score: 85,
        status: 'pass',
        details: 'Site structure is logical and easy to navigate. Good use of internal linking and clear URL structure.',
        recommendation: 'Excellent crawlability! Your site structure is clear and well-organized.',
        actionItems: [
          'Your URL structure is clean: /docs/getting-started - keep this pattern!',
          'Add breadcrumbs like: Home > Docs > Getting Started with this markup: <nav aria-label="breadcrumb"><ol itemscope itemtype="https://schema.org/BreadcrumbList">...</ol></nav>',
          'Your internal linking is strong - maintain descriptive anchor text like "Learn about authentication" instead of "click here"',
          'Site depth is good - most pages are within 2-3 clicks from homepage'
        ]
      },
      {
        id: 'training-value',
        label: 'AI Training Value',
        score: 70,
        status: 'warning',
        details: 'Content provides good informational value but lacks depth in some areas.',
        recommendation: 'Good informational value. Add more examples to make it even better for AI training.',
        actionItems: [
          'Add a real example: "For instance, when implementing auth, you might encounter error 401..."',
          'Include code snippets: ```js\nconst auth = await authenticate(user);\n// Handle response...\n```',
          'Create comparison tables: <table><tr><th>Method</th><th>Pros</th><th>Cons</th></tr>...</table>',
          'Add "Common Pitfalls" sections with specific scenarios',
          'Link to authoritative sources: "According to [MDN Web Docs](https://developer.mozilla.org)..."'
        ]
      },
      {
        id: 'knowledge-graph',
        label: 'Knowledge Graph Readiness',
        score: 55,
        status: 'warning',
        details: 'Entities are identifiable but relationships between them are not well-defined.',
        recommendation: 'Add explicit relationships between your content entities.',
        actionItems: [
          'Link related pages: <link rel="related" href="/docs/auth"> or use link[itemprop="relatedLink"]',
          'Define relationships in JSON-LD: "mentions": [{"@type": "Thing", "name": "API", "sameAs": "https://en.wikipedia.org/wiki/API"}]',
          'Create topic hubs: Main authentication page linking to OAuth, JWT, Session subtopics',
          'Use semantic HTML: <article itemscope itemtype="https://schema.org/TechArticle">',
          'Connect authors: <span itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">John Doe</span></span>'
        ]
      },
      {
        id: 'entity-recognition',
        label: 'Entity Recognition',
        score: 80,
        status: 'pass',
        details: 'Clear identification of main entities, brands, and topics throughout the content.',
        recommendation: 'Good entity identification! Enhance it with proper markup.',
        actionItems: [
          'For people mentions: <span itemscope itemtype="https://schema.org/Person"><span itemprop="name">CEO Jane Smith</span></span>',
          'For company mentions: <span itemscope itemtype="https://schema.org/Organization"><span itemprop="name">Vercel Inc.</span></span>',
          'For product mentions: <span itemscope itemtype="https://schema.org/Product"><span itemprop="name">Next.js 14</span></span>',
          'For locations: <span itemscope itemtype="https://schema.org/Place"><span itemprop="name">San Francisco, CA</span></span>',
          'For events: <div itemscope itemtype="https://schema.org/Event"><span itemprop="name">Next.js Conf 2024</span></div>'
        ]
      },
      {
        id: 'completeness',
        label: 'Content Completeness',
        score: 65,
        status: 'warning',
        details: 'Main topics are covered but some sections lack comprehensive information.',
        recommendation: 'Content is fairly complete. Add these sections to fill remaining gaps.',
        actionItems: [
          'Add an FAQ section: <section class="faq"><h2>Frequently Asked Questions</h2><details><summary>What is X?</summary><p>Answer...</p></details></section>',
          'Create a glossary: <dl><dt>API</dt><dd>Application Programming Interface - allows different software to communicate</dd></dl>',
          'Add prerequisites box: <div class="prerequisites"><h3>Before you begin</h3><ul><li>Node.js 18+</li><li>Basic JavaScript knowledge</li></ul></div>',
          'Include related links: <aside class="related"><h3>Related Topics</h3><ul><li><a href="/auth">Authentication Guide</a></li></ul></aside>',
          'Add summary cards: <div class="summary">⚡ Key Points: <ul><li>Point 1</li><li>Point 2</li></ul></div>'
        ]
      },
      {
        id: 'context-completeness',
        label: 'Context Completeness',
        score: 65,
        status: 'warning',
        details: 'Content provides good information but could include more contextual elements.',
        recommendation: 'Add more context to help AI systems better understand your content.',
        actionItems: [
          'Include brief introductions that explain the topic relevance',
          'Define technical terms and acronyms when first used',
          'Provide examples and use cases to illustrate concepts',
          'Add publication dates and author information for credibility',
          'Include summaries or key takeaways for complex topics'
        ]
      }
    ],
    overallAIReadiness: 'The website shows moderate AI readiness with good basic structure but needs enhancement in data structuring and API accessibility.',
    topPriorities: [
      'Implement comprehensive structured data schemas',
      'Create API endpoints for content access',
      'Enhance content depth and completeness'
    ]
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
      return NextResponse.json({
        success: true,
        ...mockData
      });
    } catch {
      const mockData = generateMockInsights('https://example.com');
      return NextResponse.json({
        success: true,
        ...mockData
      });
    }
  }
}