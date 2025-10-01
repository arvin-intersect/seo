
⚙️ How It Works
The tool performs a two-phase analysis:

Phase 1: Heuristic Analysis (/api/ai-readiness)
The user submits a URL.
The Next.js backend uses Firecrawl to scrape the page's HTML content and metadata.
A series of fast, rule-based checks are performed on the content (e.g., counting H1 tags, calculating readability).
Checks are also made for robots.txt, sitemap.xml, and llms.txt.
A weighted score is calculated, and the results are sent back to the client for immediate display.
Phase 2: AI-Powered Analysis (/api/ai-analysis)
This is an optional step triggered by the user after the initial analysis.
The URL, scraped HTML, and the scores from Phase 1 are sent to the AI analysis endpoint.
A carefully crafted prompt is sent to the Google Gemini API, asking it to perform a deeper, qualitative analysis based on the provided context.
The prompt instructs the model to return a structured JSON object.
The AI's insights are then parsed and displayed in the UI, enriching the initial analysis.
