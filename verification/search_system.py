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
# # torch.set_num_threads(1)
# # === Configuration ===
# API_KEY = "AIzaSyAKbqZeRUVx_MLYx8fHODXvtETKUBJbdFY"  # Replace with your Google API Key
# # CSE_ID = "71022aef7763d4a02"            # Replace with your Custom Search Engine ID
# CSE_ID = "2773c54566429473a"            # Ishant's Custom Search Engine
# NUM_RESULTS = 10                  # Number of search results to fetch


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
        # Add stopwords to skip common words
        stopwords = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
        
        words = text.split()
        expanded_text = []
        
        # Use sliding window for better context
        window_size = 5
        
        for i, word in enumerate(words):
            if word.lower() in stopwords:
                expanded_text.append(word)
                continue
                
            # Create context window
            start = max(0, i - window_size//2)
            end = min(len(words), i + window_size//2)
            context = ' '.join(words[start:i] + ['[MASK]'] + words[i+1:end])
            
            try:
                predictions = self.synonym_generator(context)
                synonyms = [pred['token_str'] for pred in predictions[:3] 
                           if pred['token_str'].lower() != word.lower()]  # Avoid duplicates
                expanded_text.append(word)
                expanded_text.extend(synonyms)
            except Exception as e:
                print(f"Error generating synonyms for '{word}': {e}")
                expanded_text.append(word)
        
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