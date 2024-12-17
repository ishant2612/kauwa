from datetime import datetime
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from sklearn.metrics.pairwise import cosine_similarity
import faiss

class OptimizedClaimVerifier:
    def __init__(self, 
                 embedding_model='sentence-transformers/all-mpnet-base-v2',
                 max_sources=50,
                 similarity_threshold=0.7):
        # High-performance embedding model
        self.tokenizer = AutoTokenizer.from_pretrained(embedding_model)
        self.model = AutoModel.from_pretrained(embedding_model)
        
        # Efficient indexing with FAISS
        self.faiss_index = None
        
        # Optimization parameters
        self.max_sources = max_sources
        self.similarity_threshold = similarity_threshold
        
        # Source credibility cache
        self.source_reputation_cache = {}
        
        # Bias mitigation components
        self.domain_diversity_tracker = {}
        self.source_type_weights = {
            'academic': 0.9,
            'peer_reviewed': 0.85,
            'government': 0.8,
            'reputable_media': 0.7,
            'independent_research': 0.75,
            'news': 0.6,
            'blog': 0.3
        }
    
    def _efficient_embedding(self, texts):
        """
        Optimized embedding generation with batch processing
        """
        # Batch tokenization
        inputs = self.tokenizer(
            texts, 
            padding=True, 
            truncation=True, 
            max_length=512, 
            return_tensors='pt'
        )
        
        # Efficient embedding generation
        with torch.no_grad():
            outputs = self.model(**inputs)
            embeddings = self._mean_pooling(outputs, inputs['attention_mask'])
        
        return embeddings.numpy()
    
    def _mean_pooling(self, model_output, attention_mask):
        """
        Mean pooling to create sentence-level embeddings
        """
        token_embeddings = model_output.last_hidden_state
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(
            token_embeddings.size()
        ).float()
        
        return torch.sum(
            token_embeddings * input_mask_expanded, 1
        ) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    
    def build_source_index(self, sources):
        """
        Create an efficient FAISS index for rapid similarity search
        """
        # Embed sources
        source_embeddings = self._efficient_embedding(
            [source['text'] for source in sources]
        )
        
        # Create FAISS index
        dimension = source_embeddings.shape[1]
        self.faiss_index = faiss.IndexFlatL2(dimension)
        
        # Add source embeddings to index
        self.faiss_index.add(source_embeddings)
        
        # Store original sources for reference
        self.sources = sources
    
    def verify_claim(self, claim, sources):
        """
        Comprehensive claim verification process
        """
        # Build efficient source index
        self.build_source_index(sources)
        
        # Generate claim embedding
        claim_embedding = self._efficient_embedding([claim])[0]
        
        # FAISS-based similarity search
        D, I = self.faiss_index.search(
            claim_embedding.reshape(1, -1), 
            k=self.max_sources
        )
        
        # Filter and score sources
        verified_sources = self._score_sources(
            claim, 
            [sources[idx] for idx in I[0]],
            D[0]
        )
        
        return self._generate_verification_report(verified_sources)
    
    def _score_sources(self, claim, matched_sources, distances):
        """
        Advanced source scoring with multiple dimensions
        """
        scored_sources = []
        
        for source, distance in zip(matched_sources, distances):
            # Semantic similarity
            semantic_score = 1 / (1 + distance)
            
            # Source type credibility
            type_credibility = self.source_type_weights.get(
                source.get('type', 'unknown'), 0.5
            )
            
            # Temporal relevance
            temporal_score = self._calculate_temporal_relevance(source)
            
            # Cross-reference strength
            cross_reference_score = len(source.get('cross_references', []))
            
            # Composite scoring
            composite_score = (
                semantic_score * 0.4 +
                type_credibility * 0.3 +
                temporal_score * 0.2 +
                min(cross_reference_score / 10, 1) * 0.1
            )
            
            scored_sources.append({
                'source': source,
                'score': composite_score,
                'semantic_similarity': semantic_score
            })
        
        # Sort sources by composite score
        return sorted(
            scored_sources, 
            key=lambda x: x['score'], 
            reverse=True
        )
    
    def _calculate_temporal_relevance(self, source):
        """
        Calculate source recency and relevance
        """
        from datetime import datetime, timedelta
        
        publication_date = source.get('date', datetime.now())
        days_since_publication = (datetime.now() - publication_date).days
        
        # Exponential decay of relevance
        return max(0, np.exp(-0.05 * days_since_publication))
    
    def _generate_verification_report(self, verified_sources):
        """
        Generate comprehensive verification report
        """
        if not verified_sources:
            return {
                'verdict': 'UNCERTAIN',
                'confidence': 0.0,
                'explanation': 'Insufficient credible sources found'
            }
        
        # Top sources analysis
        top_sources = verified_sources[:3]
        
        # Confidence calculation
        confidence = np.mean([source['score'] for source in top_sources])
        
        # Verdict determination
        if confidence > 0.7:
            verdict = 'TRUE'
        elif confidence > 0.4:
            verdict = 'PARTIALLY_TRUE'
        else:
            verdict = 'FALSE'
        
        return {
            'verdict': verdict,
            'confidence': confidence,
            'top_sources': [
                {
                    'text': source['source']['text'],
                    'score': source['score']
                } for source in top_sources
            ]
        }

# Usage Example
def main():
    claim_verifier = OptimizedClaimVerifier()
    
    sources = [
        {
            'text': 'Global temperatures have risen by 2.5°C since pre-industrial times',
            'type': 'academic',
            'date': datetime(2022, 1, 1),
            'cross_references': ['IPCC Report', 'NASA Climate Study']
        },
        # Add more sources...
    ]
    
    claim = "Climate change has increased global temperatures by 1.5°C"
    
    verification_result = claim_verifier.verify_claim(claim, sources)
    print(verification_result)

if __name__ == '__main__':
    main()
    
###################################################################################################################################


# import torch
# import numpy as np
# from transformers import AutoTokenizer, AutoModel
# from sklearn.metrics.pairwise import cosine_similarity
# import faiss

# class OptimizedClaimVerifier:
#     def _init_(self, 
#                  embedding_model='sentence-transformers/all-mpnet-base-v2',
#                  max_sources=50,
#                  similarity_threshold=0.7):
#         # High-performance embedding model
#         self.tokenizer = AutoTokenizer.from_pretrained(embedding_model)
#         self.model = AutoModel.from_pretrained(embedding_model)
        
#         # Efficient indexing with FAISS
#         self.faiss_index = None
        
#         # Optimization parameters
#         self.max_sources = max_sources
#         self.similarity_threshold = similarity_threshold
        
#         # Source credibility cache
#         self.source_reputation_cache = {}
        
#         # Bias mitigation components
#         self.domain_diversity_tracker = {}
#         self.source_type_weights = {
#             'academic': 0.9,
#             'peer_reviewed': 0.85,
#             'government': 0.8,
#             'reputable_media': 0.7,
#             'independent_research': 0.75,
#             'news': 0.6,
#             'blog': 0.3
#         }
    
#     def _efficient_embedding(self, texts):
#         """
#         Optimized embedding generation with batch processing
#         """
#         # Batch tokenization
#         inputs = self.tokenizer(
#             texts, 
#             padding=True, 
#             truncation=True, 
#             max_length=512, 
#             return_tensors='pt'
#         )
        
#         # Efficient embedding generation
#         with torch.no_grad():
#             outputs = self.model(**inputs)
#             embeddings = self._mean_pooling(outputs, inputs['attention_mask'])
        
#         return embeddings.numpy()
    
#     def _mean_pooling(self, model_output, attention_mask):
#         """
#         Mean pooling to create sentence-level embeddings
#         """
#         token_embeddings = model_output.last_hidden_state
#         input_mask_expanded = attention_mask.unsqueeze(-1).expand(
#             token_embeddings.size()
#         ).float()
        
#         return torch.sum(
#             token_embeddings * input_mask_expanded, 1
#         ) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    
#     def build_source_index(self, sources):
#         """
#         Create an efficient FAISS index for rapid similarity search
#         """
#         # Embed sources
#         source_embeddings = self._efficient_embedding(
#             [source['text'] for source in sources]
#         )
        
#         # Create FAISS index
#         dimension = source_embeddings.shape[1]
#         self.faiss_index = faiss.IndexFlatL2(dimension)
        
#         # Add source embeddings to index
#         self.faiss_index.add(source_embeddings)
        
#         # Store original sources for reference
#         self.sources = sources
    
#     def verify_claim(self, claim, sources):
#         """
#         Comprehensive claim verification process
#         """
#         # Build efficient source index
#         self.build_source_index(sources)
        
#         # Generate claim embedding
#         claim_embedding = self._efficient_embedding([claim])[0]
        
#         # FAISS-based similarity search
#         D, I = self.faiss_index.search(
#             claim_embedding.reshape(1, -1), 
#             k=self.max_sources
#         )
        
#         # Filter and score sources
#         verified_sources = self._score_sources(
#             claim, 
#             [sources[idx] for idx in I[0]],
#             D[0]
#         )
        
#         return self._generate_verification_report(verified_sources)
    
#     def _score_sources(self, claim, matched_sources, distances):
#         """
#         Advanced source scoring with multiple dimensions
#         """
#         scored_sources = []
        
#         for source, distance in zip(matched_sources, distances):
#             # Semantic similarity
#             semantic_score = 1 / (1 + distance)
            
#             # Source type credibility
#             type_credibility = self.source_type_weights.get(
#                 source.get('type', 'unknown'), 0.5
#             )
            
#             # Temporal relevance
#             temporal_score = self._calculate_temporal_relevance(source)
            
#             # Cross-reference strength
#             cross_reference_score = len(source.get('cross_references', []))
            
#             # Composite scoring
#             composite_score = (
#                 semantic_score * 0.4 +
#                 type_credibility * 0.3 +
#                 temporal_score * 0.2 +
#                 min(cross_reference_score / 10, 1) * 0.1
#             )
            
#             scored_sources.append({
#                 'source': source,
#                 'score': composite_score,
#                 'semantic_similarity': semantic_score
#             })
        
#         # Sort sources by composite score
#         return sorted(
#             scored_sources, 
#             key=lambda x: x['score'], 
#             reverse=True
#         )
    
#     def _calculate_temporal_relevance(self, source):
#         """
#         Calculate source recency and relevance
#         """
#         from datetime import datetime, timedelta
        
#         publication_date = source.get('date', datetime.now())
#         days_since_publication = (datetime.now() - publication_date).days
        
#         # Exponential decay of relevance
#         return max(0, np.exp(-0.05 * days_since_publication))
    
#     def _generate_verification_report(self, verified_sources):
#         """
#         Generate comprehensive verification report
#         """
#         if not verified_sources:
#             return {
#                 'verdict': 'UNCERTAIN',
#                 'confidence': 0.0,
#                 'explanation': 'Insufficient credible sources found'
#             }
        
#         # Top sources analysis
#         top_sources = verified_sources[:3]
        
#         # Confidence calculation
#         confidence = np.mean([source['score'] for source in top_sources])
        
#         # Verdict determination
#         if confidence > 0.7:
#             verdict = 'TRUE'
#         elif confidence > 0.4:
#             verdict = 'PARTIALLY_TRUE'
#         else:
#             verdict = 'FALSE'
        
#         return {
#             'verdict': verdict,
#             'confidence': confidence,
#             'top_sources': [
#                 {
#                     'text': source['source']['text'],
#                     'score': source['score']
#                 } for source in top_sources
#             ]
#         }

# # Usage Example
# def main():
#     claim_verifier = OptimizedClaimVerifier()
    
#     sources = [
#         {
#             'text': 'Global temperatures have risen by 1.1°C since pre-industrial times',
#             'type': 'academic',
#             'date': datetime(2022, 1, 1),
#             'cross_references': ['IPCC Report', 'NASA Climate Study']
#         },
#         # Add more sources...
#     ]
    
#     claim = "Climate change has increased global temperatures by 1.5°C"
    
#     verification_result = claim_verifier.verify_claim(claim, sources)
#     print(verification_result)

# if _name_ == '_main_':
#     main()