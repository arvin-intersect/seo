# Intersect AI SEO Internal Tool

## ⚙️ How It Works

The tool performs a **two-phase analysis** of a URL:

### Phase 1: Heuristic Analysis (`/api/ai-readiness`)
1. The user submits a URL.
2. The Next.js backend uses **Firecrawl** to scrape the page's HTML content and metadata.
3. A series of fast, rule-based checks are performed on the content, including:
   - Counting H1 tags
   - Calculating readability
   - Other SEO heuristics
4. Checks are also performed for:
   - `robots.txt`
   - `sitemap.xml`
   - `llms.txt`
5. A **weighted score** is calculated and sent back to the client for immediate display.

### Phase 2: AI-Powered Analysis (`/api/ai-analysis`)
This step is **optional** and triggered by the user after the initial analysis.

1. The URL, scraped HTML, and scores from Phase 1 are sent to the AI analysis endpoint.
2. A carefully crafted prompt is sent to the **Google Gemini API**, instructing it to perform a deeper, qualitative analysis based on the provided context.
3. The AI returns a **structured JSON object** containing insights.
4. The AI insights are parsed and displayed in the UI, enriching the initial heuristic analysis.

---

**Tech Stack:** Next.js, Firecrawl, Google Gemini API
