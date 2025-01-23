import spacy
from typing import List

class LabelExtractor:
    def __init__(self):
        # Load a pre-trained language model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("SpaCy model not found. Please download using 'python -m spacy download en_core_web_sm'")
            raise

        # Define keywords for different labels (same as your previous implementation)
        self.label_keywords = {
            "politics": [
                "government", "election", "policy", "minister", "senate", "congress", 
                "president", "democracy", "republic", "campaign", "politician", "democrat", 
                "republican", "senator", "voter", "party", "legislation", "candidates", "vote", 
                "parliament", "foreign policy", "public opinion", "public service", "NGO", 
                "activist", "diplomacy", "UN", "peacekeeping", "embassy", "sanction", 
                "political parties", "referendum", "military", "policy reform", "lawmaker", 
                "constitutional", "judiciary", "Supreme Court", "presidential election", "political unrest", 
                "policy debate", "federal", "regional election", "grassroots", "political rally", 
                "voter turnout", "political parties", "democratic process", "government shutdown", 
                "impeachment", "government reform", "democratic values", "political debate", "authoritarian", 
                "statecraft", "policy issues", "international relations", "political party platforms"
            ],
            "tech": [
                "technology", "software", "AI", "computer", "hardware", "Samsung", "Apple", 
                "Google", "Microsoft", "Amazon", "Tesla", "NVIDIA", "Intel", "Facebook", 
                "Twitter", "cloud computing", "blockchain", "IoT", "5G", "augmented reality", 
                "virtual reality", "cybersecurity", "data science", "machine learning", 
                "artificial intelligence", "big data", "quantum computing", "automation", 
                "robotics", "cryptocurrency", "smartphone", "app development", "wearable tech", 
                "internet of things", "data privacy", "deep learning", "tech innovation", 
                "startup", "Silicon Valley", "tech giant", "e-commerce", "software engineering", 
                "biotech", "fintech", "self-driving cars", "machine vision", "data analytics", 
                "cloud storage", "edge computing", "artificial neural network", "deep neural networks", 
                "blockchain technology", "virtual assistants", "quantum mechanics", "API", "Big Tech", 
                "3D printing", "internet security", "open-source", "cloud-based systems", "mobile app", 
                "enterprise solutions", "robotic process automation", "digital transformation", 
                "data mining", "cloud infrastructure", "cyber attack", "augmented reality", 
                "fintech", "technology stack", "machine translation", "natural language processing", 
                "AI ethics", "edge devices", "wearable sensors", "data visualization"
            ],
            "sports": [
                "game", "match", "tournament", "player", "team", "football", "basketball", 
                "cricket", "baseball", "soccer", "athlete", "coach", "stadium", "championship", 
                "Olympics", "World Cup", "Super Bowl", "NBA", "FIFA", "rugby", "hockey", "golf", 
                "tennis", "Formula 1", "swimming", "boxing", "wrestling", "MMA", "combat sports", 
                "sportsmanship", "league", "fan", "sports event", "sporting goods", "esports", 
                "volleyball", "cycling", "motorsports", "sports industry", "track and field", 
                "basketball player", "soccer player", "football club", "coach", "athletics", 
                "sports training", "world record", "national team", "sports club", "Olympic Games",
                "athlete performance", "sports news", "trophy", "medal", "world champion", "sports facility", 
                "sports league", "coaching staff", "competition", "sports network", "draft", "tournament bracket", 
                "training camp", "injury", "fanbase", "fitness", "sports tech", "team lineup", "match statistics",
                "sports sponsorship", "training regime", "sports medicine", "amateur sports", "sports analytics",
                "Olympic athletes", "e-sports tournaments", "athlete endorsement", "marathon", "sports nutrition"
            ],
            "business": [
                "business", "company", "corporation", "startup", "entrepreneur", "finance", 
                "investment", "economics", "market", "industry", "venture", "growth", "shareholders", 
                "CEO", "management", "merger", "acquisition", "revenue", "sales", "business model"
            ],
        }

    def extract_labels(self, query: str) -> List[str]:
        """
        Extract labels from the query based on keyword matching and entity recognition.
        
        Args:
            query (str): Input query to extract labels from
        
        Returns:
            List[str]: List of extracted labels
        """
        query = query.lower()  # Lowercase for consistency
        labels = set()

        # Keyword-based matching
        for label, keywords in self.label_keywords.items():
            if any(keyword.lower() in query for keyword in keywords):
                labels.add(label)

        # SpaCy entity recognition for additional context
        doc = self.nlp(query)
        
        # Extract labels from named entities (specific categories for political or business-related entities)
        entity_labels = {
            "ORG": ["business", "tech"],
            "PERSON": ["politics", "sports", "art & culture"],
            "GPE": ["politics", "business"],
        }

        for ent in doc.ents:
            for entity_type, matching_labels in entity_labels.items():
                if ent.label_ == entity_type:
                    labels.update(matching_labels)

        # If multiple labels, prioritize specific ones or choose the most relevant label
        if len(labels) > 1:
            if "tech" in labels:
                return ["tech"]
            if "politics" in labels:
                return ["politics"]
            if "sports" in labels:
                return ["sports"]
            # Default to 'business' if no priority labels found
            return list(labels)[:1]  # Return just the first label if no clear priority

        # If no labels found, return 'general'
        return list(labels) if labels else ["general"]

