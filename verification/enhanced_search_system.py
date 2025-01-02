from dataclasses import dataclass
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from googleapiclient.discovery import build
import concurrent.futures
import groq
import requests
from bs4 import BeautifulSoup
import trafilatura

@dataclass
class VerificationResult:
    is_verified: bool
    confidence: float
    reasoning: str
    relevant_quotes: Optional[str] = None

class VerificationAgent:
    def __init__(
        self,
        api_key: str,
        cse_id: str,
        gse_api_key: str,
        model: str = "llama-3.1-8b-instant"  # Best balance of performance and speed
    ):
        self.client = groq.Groq(api_key=api_key)
        self.model = model
        self.cse_id = cse_id
        self.gse_api_key = gse_api_key
    
    def verify(self, claim: str, source_text: str) -> VerificationResult:
        """
        Verify if a claim is supported by source text using Groq
        """
        prompt = f"""Analyze if this claim is fully supported by the source text.
        
Claim: {claim}

Source Text: {source_text[:512]}

Instructions:
0. Ignore the tenses in the source and claim texts and focus on the meaning 
1. Carefully analyze if the claim's meaning matches the source
2. Look for explicit evidence that supports or contradicts the claim
3. Consider any missing context or ambiguities
4. Determine if the source provides sufficient information
5. Determine if the fact listed in the claim is a historical event
6. Give true if the claim is partially or fully supported by the source text, otherwise give false

Provide output in this format:
VERIFIED: [true/false]  (based on the reasoning)
CONFIDENCE: [0 to 100]
QUOTES: [relevant quotes from source](all in single line dont use new line)
REASONING: [your step-by-step analysis](all in single line dont use new line)
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise fact verification system."},
                    {"role": "user", "content": prompt}
                ],
                temperature=1,
                max_tokens=1024
            )
            result = response.choices[0].message.content
            return self._parse_response(result)
            
        except Exception as e:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning=f"Error during verification: {str(e)}",
                relevant_quotes=None
            )
    
    def _parse_response(self, response: str) -> VerificationResult:
        """
        Parse the structured response into a VerificationResult
        """
        try:
            lines = response.split('\n')
            verified = False
            confidence = 0.0
            quotes = None
            reasoning = ""
            
            for line in lines:
                if line.startswith('VERIFIED:'):
                    verified = 'true' in line.lower()
                elif line.startswith('CONFIDENCE:'):
                    confidence = float(line.split(':')[1].strip().split()[0])
                elif line.startswith('QUOTES:'):
                    quotes = line.split(':')[1].strip()
                elif line.startswith('REASONING:'):
                    reasoning = line.split(':')[1].strip()
            
            return VerificationResult(
                is_verified=verified,
                confidence=confidence,
                reasoning=reasoning,
                relevant_quotes=quotes
            )
        except:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning="Failed to parse verification response",
                relevant_quotes=None
            )

    def batch_verify(self, claim: str, sources: list[str], batch_size: int = 5) -> list[VerificationResult]:
        """
        Verify a claim against multiple sources in batches
        """
        results = []
        batch_results = [self.verify(claim, source) for source in sources]
        results.extend(batch_results)
        return results

    def google_search(self, query: str, num_results: int = 5):
        """Perform Google Custom Search."""
        service = build("customsearch", "v1", developerKey=self.gse_api_key)
        results = service.cse().list(q=query, cx=self.cse_id, num=num_results).execute()
        return results.get('items', [])

    def extract_clean_content(self, url: str) -> str:
        """Extract clean text content from a URL."""
        try:
            # Use Trafilatura for content extraction
            downloaded = trafilatura.fetch_url(url)
            content = trafilatura.extract(downloaded, include_tables=False)
            
            if not content:
                # Fallback to BeautifulSoup
                response = requests.get(url, timeout=10)
                soup = BeautifulSoup(response.text, 'html.parser')
                for element in soup(['script', 'style', 'nav', 'header', 'footer']):
                    element.decompose()
                main_content = soup.find('article') or soup.find('main') or soup.find('body')
                content = ' '.join(main_content.stripped_strings) if main_content else ''
            
            return content.strip()
        except Exception as e:
            print(f"Error extracting content from {url}: {e}")
            return ""

    def process_query(self, query: str, num_results: int = 5) -> dict:
        """Perform query processing: search, extract, and verify."""
        # Perform Google search
        search_results = self.google_search(query, num_results)
        if not search_results:
            return {'error': 'No results found'}
        
        # Extract content in parallel
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {
                executor.submit(self.extract_clean_content, item['link']): item
                for item in search_results
            }
            
            sources = []
            for future in concurrent.futures.as_completed(future_to_url):
                result = future_to_url[future]
                try:
                    content = future.result()
                    if content:
                        sources.append(content)
                except Exception as e:
                    print(f"Error processing {result['link']}: {e}")
        
        # Verify the claim
        verification_result = self.batch_verify(query, sources)
        print(verification_result)
        last_conf = 0
        mcr = None
        for i in verification_result:
            if(i.is_verified and i.confidence>last_conf):
                mcr = i
                last_conf = i.confidence
        
        return {
            'verification': {
                'verdict': 'TRUE' if mcr and mcr.is_verified else 'FALSE',
                'confidence': last_conf
            }
        }




# SAMPLE USE CASE

# # Initialize agent
# agent = VerificationAgent(api_key="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")

# # Single verification
# result = agent.verify(
#     claim="Modi is the president of USA",
#     source_text="""
# Prime Minister speaks with the President of the U.S.A.
#  August 26, 2024

# spacerPrime Minister Shri Narendra Modi received a telephone call today from the President of the U.S.A., H.E. Mr. Joseph R. Biden.

# 2. Prime Minister conveyed his appreciation for President Biden’s deep commitment the India-US Comprehensive Global Strategic Partnership, which is based on shared values of democracy, rule of law and strong people-to-people ties.

# 3. The leaders reviewed the significant progress in bilateral relations and highlighted that India-US partnership is aimed at benefiting the people of both countries as well as the entire humanity.

# 4. The two leaders had a detailed exchange of views on a number of regional and global issues.

# 5. While discussing the situation in Ukraine, Prime Minister briefed President Biden on his recent visit to Ukraine. He reiterated India’s consistent position in favour of dialogue and diplomacy and expressed full support for early return of peace and stability.

# 6. The two leaders expressed their shared concern over the situation in Bangladesh. They emphasised restoration of law and order and ensuring safety and security of the minorities, particularly Hindus, in Bangladesh.

# 7. The two leaders reiterated their commitment to further strengthen the cooperation in multilateral fora, including the Quad.

# 8. They agreed to remain in touch.
# """
# )

# # Print results
# print(f"Verified: {result.is_verified}")
# print(f"Confidence: {result.confidence}%")
# print(f"Reasoning: {result.reasoning}")