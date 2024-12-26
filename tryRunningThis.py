from googleapiclient.discovery import build
import requests
from bs4 import BeautifulSoup
import trafilatura
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
import faiss
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from transformers import pipeline
# torch.set_num_threads(1)
# === Configuration ===
API_KEY = "AIzaSyAKbqZeRUVx_MLYx8fHODXvtETKUBJbdFY"  # Replace with your Google API Key
# CSE_ID = "71022aef7763d4a02"            # Replace with your Custom Search Engine ID
CSE_ID = "2773c54566429473a"            # Ishant's Custom Search Engine
NUM_RESULTS = 10                  # Number of search results to fetch


class VerificationSearchSystem:
    def __init__(self, 
                 api_key: str, 
                 cse_id: str,
                 embedding_model='sentence-transformers/all-mpnet-base-v2'):
        # Google Search setup
        self.api_key = api_key
        self.cse_id = cse_id
        
        # Embedding model setup
        self.tokenizer = AutoTokenizer.from_pretrained(embedding_model)
        self.model = AutoModel.from_pretrained(embedding_model)
        
        # Synonym generation setup
        self.synonym_generator = pipeline('fill-mask', model='bert-base-uncased')
    
    def google_search(self, query: str, num_results: int = 5):
        """Perform Google Custom Search."""
        service = build("customsearch", "v1", developerKey=self.api_key)
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
    
    def _efficient_embedding(self, texts):
        """Generate embeddings for a list of texts."""
        inputs = self.tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors='pt')
        with torch.no_grad():
            outputs = self.model(**inputs)
            embeddings = self._mean_pooling(outputs, inputs['attention_mask'])
        return embeddings.numpy()
    
    def _mean_pooling(self, model_output, attention_mask):
        """Mean pooling to create sentence-level embeddings."""
        token_embeddings = model_output.last_hidden_state
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    
    def _generate_synonyms(self, text: str) -> str:
        """Generate synonyms for key terms in the text."""
        words = text.split()
        expanded_text = []
        for word in words:
            # Generate synonyms for the word
            masked_text = text.replace(word, '[MASK]')
            predictions = self.synonym_generator(masked_text)
            synonyms = [pred['token_str'] for pred in predictions[:3]]  # Take top 3 synonyms
            expanded_text.append(word)
            expanded_text.extend(synonyms)
        return ' '.join(expanded_text)
    
    def verify_content(self, text: str, sources: list) -> dict:
        """Verify the given text against sources."""
        if not sources:
            return {
                'verdict': 'UNCERTAIN',
                'confidence': 0.0,
                'explanation': 'No sources available'
            }
        
        # Generate synonyms for the text
        expanded_text = self._generate_synonyms(text)
        
        # Create embeddings
        source_embeddings = self._efficient_embedding([s['content'] for s in sources])
        text_embedding = self._efficient_embedding([expanded_text])[0]
        
        # Normalize embeddings to unit vectors
        source_embeddings = source_embeddings / np.linalg.norm(source_embeddings, axis=1, keepdims=True)
        text_embedding = text_embedding / np.linalg.norm(text_embedding)
        
        # Calculate similarities using cosine similarity
        faiss_index = faiss.IndexFlatIP(source_embeddings.shape[1])
        faiss_index.add(source_embeddings)
        distances, indices = faiss_index.search(text_embedding.reshape(1, -1), len(sources))
        
        # Convert distances to cosine similarity scores
        cosine_similarities = distances[0]
        
        # Collect scores
        scores = []
        for idx, similarity in zip(indices[0], cosine_similarities):
            scores.append({
                'source': sources[idx],
                'semantic_similarity': similarity
            })
        
        scores.sort(key=lambda x: x['semantic_similarity'], reverse=True)
        confidence = scores[0]['semantic_similarity'] if scores else 0
        
        return {
            'verdict': 'TRUE' if confidence > 0.5 else 'FALSE',
            'confidence': confidence,
            'top_sources': scores[:3]
        }
    
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
                        sources.append({
                            'url': result['link'],
                            'title': result['title'],
                            'content': content,
                            'snippet': result.get('snippet', '')
                        })
                except Exception as e:
                    print(f"Error processing {result['link']}: {e}")
        
        # Verify the claim
        verification_result = self.verify_content(query, sources)
        
        return {
            'search_results': sources,
            'verification': verification_result
        }

def main():
    system = VerificationSearchSystem(
        api_key=API_KEY,
        cse_id=CSE_ID
    )
    while True:
        query = input("Enter your query (or 'exit' to quit): ")
        if query.lower() == "exit":
            break
        results = system.process_query(query)
        
        print("\nSearch Results with Verification:")
        print(f"Verdict: {results['verification']['verdict']}")
        print(f"Confidence: {results['verification']['confidence']:.2f}")
        
        for idx, source in enumerate(results['verification']['top_sources'], 1):
            print(f"\nSource {idx}:")
            print(f"Title: {source['source']['title']}")
            print(f"Score: {source['semantic_similarity']:.2f}")
            print(f"URL: {source['source']['url']}")

if __name__ == "__main__":
    main()

# # Load spaCy's pre-trained NER model
# nlp = spacy.load("en_core_web_sm")

# # === Google Custom Search ===
# def google_search(query, api_key, cse_id, num_results=5):
#     """Perform a Google Custom Search."""
#     service = build("customsearch", "v1", developerKey=api_key)
#     results = service.cse().list(q=query, cx=cse_id, num=num_results).execute()
#     return results.get('items', [])

# # === Web Scraping with Requests and BeautifulSoup ===
# def fetch_content_from_url(url):
#     """Scrape content from a URL using requests and BeautifulSoup."""
#     try:
#         # Send a GET request to the URL
#         response = requests.get(url)
#         response.raise_for_status()  # Raise an exception for 4xx/5xx errors

#         # Parse the content using BeautifulSoup
#         soup = BeautifulSoup(response.text, 'html.parser')

#         # Extract the text from the body of the page
#         content = soup.get_text()
#         return content
#     except requests.exceptions.RequestException as e:
#         print(f"Error fetching content from {url}: {e}")
#         return ""

# # === Entity Extraction ===
# def extract_entities(text):
#     """Extract entities using spaCy."""
#     doc = nlp(text)
#     entities = [ent.text for ent in doc.ents]
#     return entities

# # === Main Script ===
# if __name__ == "__main__":
#     # Example input text for entity extraction
#     text = """Pat Cummins marries Virat Kholi."""

#     # Extract entities from the text
#     entities = extract_entities(text)
#     print(f"Extracted Entities: {entities}")

#     # Combine extracted entities into a query
#     entity_query = " ".join(entities)

#     # Perform Google search based on extracted entities
#     print(f"Performing Google Search for: '{entity_query}'")
#     search_results = google_search(entity_query, API_KEY, CSE_ID, num_results=NUM_RESULTS)

#     # Check if no results were found
#     if not search_results:
#         print("No results found")
#     else:
#         print("\nSearch Results:")
#         for idx, item in enumerate(search_results):
#             print(f"{idx + 1}. {item['title']}")
#             print(f"URL: {item['link']}")
#             print(f"Snippet: {item.get('snippet', 'No snippet available')}")
#             print("-" * 80)

#             # Scrape content from the result URL
#             content = fetch_content_from_url(item['link'])
#             print(f"Scraped Content (first 500 characters):\n{content[:500]}")  # Display first 500 characters
#             print("=" * 80)