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

import logging

# Configure logging
logging.basicConfig(
    format="\n\033[1;32m[LOG]\033[0m %(message)s",  # Green bold "[LOG]" for visibility
    level=logging.INFO
)
# from multilingual import Translator
@dataclass
class VerificationResult:
    is_verified: bool
    confidence: float
    reasoning: str
    relevant_quotes: Optional[str] = None
    label: Optional[str] = None
    source_url: Optional[str] = None
    context: Optional[str] =None
    
# for translationn api_key="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"
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
        delimiter = "|||"
    
        prompt = f"""Analyze if this claim is fully supported by the source text.
        
    Claim: {claim}

    Source Text: {source_text[:750]}

    Instructions:
    1. Carefully analyze if the claim's meaning matches the source
    2. Look for explicit evidence that supports or contradicts the claim
    3. Consider any missing context or ambiguities
    4. Determine if the source provides sufficient information
    5. Determine if the fact listed in the claim is a historical event
    6. Give true if the claim is partially or fully supported by the source text, otherwise give false
    7. Give the label for the query like sports, politics, tech, etc.
    8. If the source says the claim or the claim in the video is deepfake, then give false.

    Provide output in this exact format:
    VERIFIED: [true/false] {delimiter}  
    CONFIDENCE: [0 to 100] {delimiter}  
    QUOTES: [relevant quotes from source] {delimiter}  
    REASONING: [your step-by-step analysis] {delimiter}  
    LABEL: [label of the query] {delimiter}  
    CONTEXT: [ Context of the Source including relevant stuff for claim or subject in the claim] {delimiter}  
    """
        
        messages = [
            {"role": "system", "content": "You are a precise fact verification system."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = self.groq_chat_completion(messages, api_key=self.api_key)
            print(response_text)
            return self._parse_response(response_text, delimiter)
            
        except Exception as e:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning=f"Error during verification: {str(e)}",
                relevant_quotes=None,
                label=None,
                context=None
            )

    


    def _parse_response(self, response: str, delimiter: str = "|||") -> VerificationResult:
        """
        Parses the structured response using regex to capture each field.
        """
        try:
            # Regular expressions for each field
            verified_match = re.search(r"VERIFIED:\s*(true|false)", response, re.IGNORECASE)
            confidence_match = re.search(r"CONFIDENCE:\s*([\d\.]+)", response)
            quotes_match = re.search(r"QUOTES:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            reasoning_match = re.search(r"REASONING:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            label_match = re.search(r"LABEL:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            context_match = re.search(r"CONTEXT:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)

            verified = verified_match.group(1).strip().lower() == "true" if verified_match else False
            confidence = float(confidence_match.group(1).strip()) if confidence_match else 0.0
            quotes = quotes_match.group(1).strip() if quotes_match else None
            reasoning = reasoning_match.group(1).strip() if reasoning_match else ""
            label = label_match.group(1).strip() if label_match else None
            context = context_match.group(1).strip() if context_match else None
            print("result-------------->",verified,confidence,reasoning,context,label)

            return VerificationResult(
                is_verified=verified,
                confidence=confidence,
                reasoning=reasoning,
                relevant_quotes=quotes,
                label=label,
                context=context
            )
        
        except Exception as e:
            return VerificationResult(
                is_verified=False,
                confidence=0.0,
                reasoning=f"Failed to parse verification response: {str(e)}",
                relevant_quotes=None,
                label=None,
                context=None
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
            res = verification_results[0 if (int(index)>4 and int(index)<0) else int(index)]
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
        print("Inside process query check 1")
        # translator = Translator(api_key="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")
        # translated_query = translator.translate(query)
        # query = translated_query['translation']
        # language = translated_query['language']
        print("Inside process query check 2", query)

        # if language.lower() != "english":
        #     pass

        sources = []
        url_mapping = {}
        max_attempts = 3  # Allow a few retries to get valid content
        attempt = 0

        while len(sources) < num_results and attempt < max_attempts:
            print("inside while loop")
            search_results = self.google_search(query, num_results * 2)  # Fetch more results to compensate for failures
            print(f"Inside process query check 3 - Attempt {attempt + 1}")

            if not search_results:
                return {'error': 'No results found'}

            with ThreadPoolExecutor(max_workers=5) as executor:
                future_to_item = {
                    executor.submit(self.extract_clean_content, item['link']): item
                    for item in search_results
                }

                for future in concurrent.futures.as_completed(future_to_item):
                    item = future_to_item[future]
                    try:
                        content = future.result()
                        if content:  # Only add non-empty results
                            sources.append(content)
                            url_mapping[content] = item['link']
                        if len(sources) >= num_results:  # Stop once we have enough valid results
                            break
                    except Exception as e:
                        print(f"Error processing {item['link']}: {e}")

            attempt += 1

        if not sources:
            return {'error': 'No valid results found'}

        print("Inside process query check 4")
        verification_results = self.batch_verify(query, sources)
        print("Inside process query check 5")

        for result, source in zip(verification_results, sources):
            result.source_url = url_mapping.get(source, "Unknown")

        last_conf = 0
        mcr = None
        print("Inside process query check 5")

        for result in verification_results:
            if result.is_verified and result.confidence >= last_conf:
                mcr = result
                last_conf = result.confidence

        print("Inside process query check 6")

        if not mcr:
            mcr = self.get_best_false_mcr(verification_results)

        print("MCR: ", mcr)
        print("\n VERIFICATION RESULTS: ", verification_results)
        print("\n")

        return {
            'verification': {
                'is_verified': 'TRUE' if mcr and mcr.is_verified else 'FALSE',
                'confidence': mcr.confidence,
                "reasoning": mcr.reasoning,
                "relevant_quotes": mcr.relevant_quotes,
                "label": mcr.label,
                "context": mcr.context,
                "source_link": mcr.source_url if mcr else "Unknown"
            },
            'all_sources': [
                {"url": result.source_url, "confidence": result.confidence, "is_verified": result.is_verified}
                for result in verification_results
            ]
        }


    def translate_and_process_query(self, query: str, num_results: int = 5) -> dict:
        logging.info(f"Received query: {query}")

        translator = Translator(api_key="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")
        translated_query_apiRes = translator.translate(query)
        translated_query = translated_query_apiRes['translation']
        language = translated_query_apiRes['language']

        logging.info(f"Detected language: {language}")
        logging.info(f"Translated query: {translated_query}")

        translated_query_result = self.process_query(translated_query) if language.lower() != "english" else None
        og_lang_result = self.process_query(query)

        verified_tq = translated_query_result and translated_query_result['verification']['is_verified'] == "TRUE"
        verified_og = og_lang_result['verification']['is_verified'] == "TRUE"

        confidence_tq = translated_query_result['verification']['confidence'] if translated_query_result else 0
        confidence_og = og_lang_result['verification']['confidence']

        logging.info(f"Original query verified: {verified_og}, Confidence: {confidence_og}")
        logging.info(f"Translated query verified: {verified_tq}, Confidence: {confidence_tq}")

        if verified_tq and verified_og:
            result = translated_query_result if confidence_tq >= confidence_og else og_lang_result
        elif verified_tq or verified_og:
            result = translated_query_result if verified_tq else og_lang_result
        else:
            result = translated_query_result if confidence_tq >= confidence_og else og_lang_result

        logging.info(f"Returning result from: {'Translated Query' if result == translated_query_result else 'Original Query'}")
        return result





class Translator:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("The GROQ_API_KEY must be provided either via the api_key parameter or environment variable.")
        self.model = "llama-3.3-70b-versatile"

    def groq_chat_completion(self, messages: list) -> str:
        """
        Uses the Groq client to get a chat completion from the model.
        Streams the result and returns the complete response as a string.
        """
        client = Groq(api_key=self.api_key)
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

    def translate(self, query: str) -> dict:
        """
        Translate the input query to English and detect the original language.
        """
        delimiter = "|||"
        prompt = f"""Translate the given text to English and detect its original language.
        
        Text: {query}
        
        Instructions:
        1. Detect the language of the input text.
        2. Translate it into English.
        3. Provide the output in this exact format dont use any extra explantion of word just the output:
        4. If it is already in English, then return the same text and language as English.
        5. Clean the query removem any giberish, correct any spelling error if found only keep the uniformity of the main idea of the statement alive.
        6. Make the Translation a google searchable text to verify the original text input. 
        TRANSLATION: [translated text] {delimiter}  
        LANGUAGE: [original language] {delimiter}  
        """
        
        messages = [
            {"role": "system", "content": "You are an expert translator. Stick to the output instructions provided. Nothing extra!!"},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = self.groq_chat_completion(messages)
            print("Translation response:_________________________>", response_text)
            return self._parse_response(response_text, delimiter)
        except Exception as e:
            return {
                "translation": None,
                "language": None,
                "error": f"Error during translation: {str(e)}"
            }

    def _parse_response(self, response: str, delimiter: str = "|||") -> dict:
        """
        Parses the structured response using regex to capture each field.
        """
        try:
            translation_match = re.search(r"TRANSLATION:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            language_match = re.search(r"LANGUAGE:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            
            translation = translation_match.group(1).strip() if translation_match else None
            language = language_match.group(1).strip() if language_match else None
            
            return {"translation": translation, "language": language}
        except Exception as e:
            return {"translation": None, "language": None, "error": f"Failed to parse response: {str(e)}"}

# SAMPLE USE CASE

# # Initialize agent
# agent = VerificationAgent(api_key="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", cse_id=CSE_ID, gse_api_key=GSE_API_KEY)

# # Single verification
# result = agent.verify(
#     claim="Modi is the president of USA",
    

# )

# result = agent.process_query("மோடி இந்தியாவின் ஜனாதிபதி")
# print(result)
# print("Verified:",{result['is_verfied']})
# print(f"Confidence: {result['confidence']}%")
# print(f"Reasoning: {result['reasoning']}")
# print(f"Relevant Quotes: {result['relevant_quotes']}")
