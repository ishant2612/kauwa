import axios from 'axios';
import { google } from 'googleapis';
import cheerio from 'cheerio';

class VerificationResult {
  constructor(isVerified, confidence, reasoning, relevantQuotes = null) {
    this.isVerified = isVerified;
    this.confidence = confidence;
    this.reasoning = reasoning;
    this.relevantQuotes = relevantQuotes;
  }
}

class VerificationAgent {
  constructor(apiKey, cseId, gseApiKey, model = "llama-3.1-8b-instant") {
    this.apiKey = apiKey;
    this.cseId = cseId;
    this.gseApiKey = gseApiKey;
    this.model = model;
  }

  async verify(claim, sourceText) {
    const prompt = `
Analyze if this claim is fully supported by the source text.

Claim: ${claim}

Source Text: ${sourceText.slice(0, 512)}

Instructions:
0. Ignore the tenses in the source and claim texts and focus on the meaning.
1. Carefully analyze if the claim's meaning matches the source.
2. Look for explicit evidence that supports or contradicts the claim.
3. Consider any missing context or ambiguities.
4. Determine if the source provides sufficient information.
5. Determine if the fact listed in the claim is a historical event.
6. Give true if the claim is partially or fully supported by the source text, otherwise give false.

Provide output in this format:
VERIFIED: [true/false] (based on the reasoning)
CONFIDENCE: [0 to 100]
QUOTES: [relevant quotes from source](all in single line do not use new lines)
REASONING: [your step-by-step analysis](all in single line do not use new lines).
    `;

    try {
      const response = await axios.post('https://api.groq.ai/v1/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a precise fact verification system.' },
          { role: 'user', content: prompt }
        ],
        temperature: 1,
        max_tokens: 1024
      });

      return this._parseResponse(response.data.choices[0].message.content);
    } catch (error) {
      return new VerificationResult(false, 0.0, `Error during verification: ${error.message}`);
    }
  }

  _parseResponse(response) {
    const result = new VerificationResult(false, 0.0, "Failed to parse verification response");
    const lines = response.split("\n");

    lines.forEach((line) => {
      if (line.startsWith("VERIFIED:")) {
        result.isVerified = line.toLowerCase().includes("true");
      } else if (line.startsWith("CONFIDENCE:")) {
        result.confidence = parseFloat(line.split(":")[1].trim());
      } else if (line.startsWith("QUOTES:")) {
        result.relevantQuotes = line.split(":")[1].trim();
      } else if (line.startsWith("REASONING:")) {
        result.reasoning = line.split(":")[1].trim();
      }
    });

    return result;
  }

  async googleSearch(query, numResults = 5) {
    try {
      const customsearch = google.customsearch("v1");
      const res = await customsearch.cse.list({
        q: query,
        cx: this.cseId,
        auth: this.gseApiKey,
        num: numResults
      });
      return res.data.items || [];
    } catch (error) {
      console.error("Google Search Error:", error.message);
      return [];
    }
  }

  async extractCleanContent(url) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
  
      // Log the status code and content type
      console.log(`Received ${response.status} from ${url}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
  
      // Check if the response content type is HTML
      if (!response.data || !response.headers['content-type'].includes('text/html')) {
        console.error(`Invalid content from ${url}: ${response.headers['content-type']}`);
        return "";
      }
  
      // Log the first 500 characters of the response body for inspection
      console.log(`Response received from ${url}:`, response.data.slice(0, 500));
  
      // Try to parse the HTML using cheerio
      const $ = cheerio.load(response.data);
  
      // Remove irrelevant content (scripts, styles, etc.)
      $("script, style, nav, header, footer").remove();
  
      // Extract the main content, considering different possible structures
      const mainContent =
        $("article").text() || $("main").text() || $("body").text() || "";
  
      // Check if we got any main content
      if (!mainContent.trim()) {
        console.error(`No meaningful content found on ${url}`);
      }
  
      return mainContent.trim();
    } catch (error) {
      // Log errors that occur during content extraction
      console.error(`Error extracting content from ${url}: ${error.message}`);
      return "";
    }
  }
  
  

  async processQuery(query, numResults = 5) {
    const searchResults = await this.googleSearch(query, numResults);
    if (!searchResults.length) {
      return { error: "No results found" };
    }

    const sources = await Promise.all(
      searchResults.map(async (item) => {
        const content = await this.extractCleanContent(item.link);
        return content || null;
      })
    );

    const results = await Promise.all(
      sources
        .filter(Boolean)
        .map((source) => this.verify(query, source))
    );

    const bestResult = results.reduce(
      (best, current) =>
        current.isVerified && current.confidence > (best?.confidence || 0)
          ? current
          : best,
      null
    );

    return {
      verification: {
        verdict: bestResult?.isVerified ? "TRUE" : "FALSE",
        confidence: bestResult?.confidence || 0
      }
    };
  }
}

export default VerificationAgent; // Export the VerificationAgent class as the default
