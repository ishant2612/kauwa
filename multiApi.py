import requests
from neo4j import GraphDatabase
import spacy
from concurrent.futures import ThreadPoolExecutor

# ---- API KEYS AND CONFIG ---- #
GOOGLE_KG_API_KEY = "AIzaSyC8Ue6Lat1UowH1LJu6Gq8VQxNCbXUqH2I"
NEWS_API_KEY = "6b16b1fc8cd041fea977198a4ab624a3"
WIKIDATA_BASE_URL = "https://query.wikidata.org/sparql"

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "ABCD1234"

# Load NLP Model
nlp = spacy.load("en_core_web_sm")

# ---- API FETCHING FUNCTIONS ---- #

# Fetch data from Google Knowledge Graph API
def fetch_google_kg_data(query):
    url = f"https://kgsearch.googleapis.com/v1/entities:search?query={query}&key={GOOGLE_KG_API_KEY}&limit=25"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

# Fetch data from NewsAPI
def fetch_newsapi_data(query):
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}&pageSize=25"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

# Fetch data from Wikidata
def fetch_wikidata(query):
    sparql_query = f"""
    SELECT ?item ?itemLabel ?description WHERE {{
        ?item ?label "{query}"@en.
        ?item schema:description ?description.
        FILTER (lang(?description) = "en")
        SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}
    }}
    LIMIT 25
    """
    headers = {"Accept": "application/json"}
    response = requests.get(WIKIDATA_BASE_URL, params={"query": sparql_query, "format": "json"}, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

# ---- ENTITY AND RELATIONSHIP EXTRACTION ---- #

# Extract entities using SpaCy
def extract_entities(text):
    doc = nlp(text)
    return [(ent.text, ent.label_) for ent in doc.ents]

# Extract relationships using SpaCy
def extract_relationships(text):
    doc = nlp(text)
    relationships = []
    for token in doc:
        if token.dep_ in ("nsubj", "dobj"):
            relationships.append((token.head.text, token.text))
    return relationships

# ---- NEO4J FUNCTIONS ---- #

class Neo4jManager:
    def __init__(self, uri, username, password):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))

    def close(self):
        self.driver.close()

    def add_entity(self, name, description, label):
        with self.driver.session() as session:
            session.write_transaction(self._create_or_merge_entity, name, description, label)

    @staticmethod
    def _create_or_merge_entity(tx, name, description, label):
        query = """
        MERGE (e:Entity {name: $name})
        ON CREATE SET e.label = $label, e.description = $description
        """
        tx.run(query, name=name, description=description, label=label)

    def add_relationship(self, source, target, relationship):
        with self.driver.session() as session:
            session.write_transaction(self._create_or_merge_relationship, source, target, relationship)

    @staticmethod
    def _create_or_merge_relationship(tx, source, target, relationship):
        query = """
        MATCH (a:Entity {name: $source}), (b:Entity {name: $target})
        MERGE (a)-[:RELATION {type: $relationship}]->(b)
        """
        tx.run(query, source=source, target=target, relationship=relationship)

# ---- MAIN WORKFLOW ---- #

def process_and_populate_kg(query, neo4j_manager):
    entities = []
    relationships = []

    # Fetch data from APIs in parallel
    with ThreadPoolExecutor() as executor:
        results = executor.map(lambda func: func(query), [fetch_google_kg_data, fetch_newsapi_data, fetch_wikidata])

    # Process API responses
    for result in results:
        if result:
            # Process Google KG data
            if "itemListElement" in result:
                for element in result["itemListElement"]:
                    entity = element["result"]["name"]
                    description = element["result"].get("detailedDescription", {}).get("articleBody", "No description available.")
                    entities.append((entity, description, "GoogleKG"))
            # Process NewsAPI data
            elif "articles" in result:
                for article in result["articles"]:
                    title = article["title"]
                    content = article.get("content", "")
                    description = article.get("description", "No description available.")
                    entities.append((title, description, "NewsAPI"))
                    relationships.extend(extract_relationships(content))
            # Process Wikidata
            elif "results" in result:
                for item in result["results"]["bindings"]:
                    entity = item["itemLabel"]["value"]
                    description = item.get("description", {}).get("value", "No description available.")
                    entities.append((entity, description, "Wikidata"))

    # Populate Knowledge Graph
    for entity, description, label in entities:
        neo4j_manager.add_entity(entity, description, label)
    for source, target in relationships:
        neo4j_manager.add_relationship(source, target, "MENTIONS")

# ---- EXECUTION ---- #

if __name__ == "__main__":
    while True:
        
        query = input("Enter a query (or 'exit' to quit): ")
        if query.lower() == "exit":
            break

        # Initialize Neo4j Manager
        neo4j_manager = Neo4jManager(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)

        try:
            process_and_populate_kg(query, neo4j_manager)
            print(f"Knowledge graph updated for query: {query}")
        finally:
            neo4j_manager.close()