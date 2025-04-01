from dataclasses import dataclass
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from googleapiclient.discovery import build
import concurrent.futures
import re

import requests
from bs4 import BeautifulSoup
import trafilatura
from groq import Groq
@dataclass
class VerificationResult:
    is_verified: bool
    confidence: float
    reasoning: str
    relevant_quotes: Optional[str] = None
    label: Optional[str] = None
    source_url: Optional[str] = None

import os
GSE_API_KEY = "AIzaSyCGXItNdfzorYgMqdC-WOndRi4LeLzyrvU"
CSE_ID = "c624198a099f14b83"
class VerificationAgent:
    def __init__(
        self,
        api_key: str,
        cse_id: str,
        gse_api_key: str,
        model: str = "deepseek-r1-distill-llama-70b"  # Using the Deepseek model
    ):
        self.api_key = api_key
        self.model = model
        self.cse_id = cse_id
        self.gse_api_key = gse_api_key

    def groq_chat_completion(self, messages: list, api_key: str = None) -> str:
        """
        Uses the Groq client to get a chat completion from the deepseek-r1-distill-llama-70b model.
        Streams the result and returns the complete response as a string.
        """
        if not api_key:
            api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("The GROQ_API_KEY must be provided either via the api_key parameter or environment variable.")
        
        # Instantiate the Groq client with the provided API key
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.6,
            top_p=0.95,
            stream=True,
        )
        
        response = ""
        for chunk in completion:
            response += (chunk.choices[0].delta.content or "")
        return response

    def verify(self, claim: str, source_text: str) -> VerificationResult:
        """
        Verify if a claim is supported by source text using Groq.
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
7. Give the label for the query like sports , politics ,tech etc
8. If the source says the claim or the claim in the video is deepfake then give false
9. If multiple sources are available, prioritize the latest and most credible information.

Provide output in this format:
VERIFIED: [true/false]  (based on the reasoning)
CONFIDENCE: [0 to 100]
QUOTES: [relevant quotes from source](all in single line don't use new line)
REASONING: [your step-by-step analysis](all in single line don't use new line)
LABEL: [label of the query]
"""
        messages = [
            {"role": "system", "content": "You are a precise fact verification system."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = self.groq_chat_completion(messages, api_key=self.api_key)
            # print("asdfasdfasdfasdfasdfasdf"   ,response_text)
            return self._parse_response(response_text)
            
        except Exception as e:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning=f"Error during verification: {str(e)}",
                relevant_quotes=None,
                label = None
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
            label = None
            for line in lines:
                if line.startswith('VERIFIED:'):
                    verified = 'true' in line.lower()
                elif line.startswith('CONFIDENCE:'):
                    confidence = float(line.split(':')[1].strip().split()[0])
                elif line.startswith('QUOTES:'):
                    quotes = line.split(':')[1].strip()
                elif line.startswith('REASONING:'):
                    reasoning = line.split(':')[1].strip()
                elif line.startswith('LABEL:'):
                    label = line.split(':')[1].strip()
            
            return VerificationResult(
                is_verified=verified,
                confidence=confidence,
                reasoning=reasoning,
                relevant_quotes=quotes
                ,label = label
            )
        except:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning="Failed to parse verification response",
                relevant_quotes=None
                ,label = None
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
    

    def extract_index(self,response: str) -> str:
        match = re.search(r"</think>\s*(\d+)", response)
        return match.group(1) if match else ""

    def get_best_false_mcr(self, verification_results: list[VerificationResult]) -> VerificationResult:
        prompt = """You are an AI designed to evaluate multiple failed verification attempts and select the most reliable failure explanation. You will be given five VerificationResult objects where all have is_verified=False. Your task is to choose the best one based on its reasoning, confidence, and relevant features, while avoiding results that contain error messages as source text.

        Here are the five VerificationResult objects:
        {verification_results}

        Selection Criteria:
        Reasoning Quality: Select the result with the clearest, most detailed, and well-explained reasoning.

        Avoid Error Messages: If the source text is an error message, discard that result and choose another with a better explanation.

        Confidence Score: Prefer results with higher confidence values, indicating stronger certainty in the failure explanation.

        Relevant Quotes: If applicable, prefer results that provide supporting quotes from sources.


        Output Format:
        Respond with your chosen VerificationResult index in the exact format below:
        Provide output in this format (the output should be a single integer(index of the choosen one), no text or additional characters)(Please don't halluciante):
        (A single integer between 0 and 4, ensuring a valid selection is always provided.)"""

        messages = [
            {"role": "system", "content": "You are a precise fact verification system."},
            {"role": "user", "content": prompt}
        ]
        #print("IDHR AYA------------------------------------------------------")
        #print(messages)
        try:
            response_text = self.groq_chat_completion(messages, api_key=self.api_key)
            #print("verification_results",verification_results)
            #print("response_text",response_text)
            index = self.extract_index(response_text)
            print("index",index)
            res = verification_results[int(index)]
            #res = self._parse_response(response_text)
            #print("res",res)
            return res
        except Exception as e:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning=f"Error during verification: {str(e)}",
                relevant_quotes=None,
                label=None
            )

    def process_query(self, query: str, num_results: int = 5) -> dict:
        """Perform query processing: search, extract, and verify."""
        # Perform Google search
        search_results = self.google_search(query, num_results)
        if not search_results:
            return {'error': 'No results found'}
        
        # Extract content in parallel
        sources = []
        url_mapping = {}  # Store URL corresponding to each source
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_item = {
                executor.submit(self.extract_clean_content, item['link']): item
                for item in search_results
            }
            
            for future in concurrent.futures.as_completed(future_to_item):
                item = future_to_item[future]
                try:
                    content = future.result()
                    if content:
                        sources.append(content)
                        url_mapping[content] = item['link']  # Store the URL
                except Exception as e:
                    print(f"Error processing {item['link']}: {e}")
        
        # Verify the claim
        verification_results = self.batch_verify(query, sources)
        
        # Attach corresponding URLs
        #print("URL MAPPINGS: ",url_mapping)
        for result, source in zip(verification_results, sources):
            result.source_url = url_mapping.get(source, "Unknown")
            #print("SOURCE URL: ",result)

        #print("VERIFICATION RESULTS: ",verification_results)

        last_conf = 0
        mcr = None

        # Select the best verification result
        for result in verification_results:
            if result.is_verified and result.confidence >= last_conf:
                mcr = result
                last_conf = result.confidence

        # If all results are false, use the best false one
        if not mcr:
            mcr = self.get_best_false_mcr(verification_results)

        print("MCR: ",mcr)
        print("\n VERIFICATION RESULTS: ",verification_results)
        print("\n")

        # Format results
        return {
            'verification': {
                'is_verified': 'TRUE' if mcr and mcr.is_verified else 'FALSE',
                'confidence': mcr.confidence,
                "reasoning": mcr.reasoning,
                "relevant_quotes": mcr.relevant_quotes,
                "label": mcr.label,
                "source_link": mcr.source_url if mcr else "Unknown"
            },
            'all_sources': [
                {"url": result.source_url, "confidence": result.confidence, "is_verified": result.is_verified}
                for result in verification_results
            ]
        }





# SAMPLE USE CASE

# # Initialize agent
# agent = VerificationAgent(api_key="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", cse_id=CSE_ID, gse_api_key=GSE_API_KEY)

# # # Single verification
# result = agent.verify(
    # claim="Modi is the president of USA",
    

# )

# result = agent.process_query("Roanldo is a cricket player")['verification']
# print(result)
# print("Verified:",{result['is_verfied']})
# print(f"Confidence: {result['confidence']}%")
# print(f"Reasoning: {result['reasoning']}")
# print(f"Relevant Quotes: {result['relevant_quotes']}")