import uuid
import requests
from neo4j import GraphDatabase
import spacy
from concurrent.futures import ThreadPoolExecutor
import hashlib

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
    url = f"https://kgsearch.googleapis.com/v1/entities:search?query={query}&key={GOOGLE_KG_API_KEY}&limit=5"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

# Fetch data from NewsAPI
def fetch_newsapi_data(query):
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}&pageSize=5"
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
    LIMIT 5
    """
    headers = {"Accept": "application/json"}
    response = requests.get(WIKIDATA_BASE_URL, params={"query": sparql_query, "format": "json"}, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

# ---- NEO4J FUNCTIONS ---- #

class Neo4jManager:
    def __init__(self, uri, username, password):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))

    def close(self):
        self.driver.close()

    def add_query(self, query, is_true):
        """
        Add the query to the Knowledge Graph with its truth value.
        """
        query_id = self._generate_query_id(query)
        with self.driver.session() as session:
            session.execute_write(self._create_or_merge_query, query_id, query, is_true)

    @staticmethod
    def _generate_query_id(query):
        """
        Generate a unique identifier (hash) for the query based on its text.
        """
        return hashlib.sha256(query.encode('utf-8')).hexdigest()

    @staticmethod
    def _create_or_merge_query(tx, query_id, query, is_true):
        query_text = """
        MERGE (q:Query {query_id: $query_id})
        ON CREATE SET q.text = $query, q.is_true = $is_true
        """
        tx.run(query_text, query_id=query_id, query=query, is_true=is_true)

    def query_exists(self, query):
        query_id = self._generate_query_id(query)
        with self.driver.session() as session:
            result = session.execute_read(self._query_exists, query_id)
        return result

    @staticmethod
    def _query_exists(tx, query_id):
        query = "MATCH (q:Query {query_id: $query_id}) RETURN q"
        result = tx.run(query, query_id=query_id)
        return result.single() is not None

    def get_query_truth_value(self, query):
        query_id = self._generate_query_id(query)
        with self.driver.session() as session:
            result = session.execute_read(self._get_query_truth_value, query_id)
        return result

    @staticmethod
    def _get_query_truth_value(tx, query_id):
        query = "MATCH (q:Query {query_id: $query_id}) RETURN q.is_true AS is_true"
        result = tx.run(query, query_id=query_id)
        record = result.single()
        return record["is_true"] if record else None

# Function to verify the truthfulness of a query
def verify_query(query, data_sources):
    """
    Placeholder verification logic. Verifies the query based on data from APIs.
    Returns True if verified as true, otherwise False.
    """
    # Dummy logic: Check if the query matches any description in fetched data
    for data_source in data_sources:
        if query.lower() in data_source.lower():
            return True
    return False

def handle_query(query, neo4j_manager):
    # Step 1: Check if the query exists in the Knowledge Graph
    if neo4j_manager.query_exists(query):
        print(f"Query '{query}' found in Knowledge Graph.")
        is_true = neo4j_manager.get_query_truth_value(query)
        print(f"Truth value: {'True' if is_true else 'False'}")
    else:
        print(f"Query '{query}' not found in Knowledge Graph. Fetching data from APIs...")
        # Step 2: Fetch data from APIs in parallel
        with ThreadPoolExecutor() as executor:
            results = executor.map(lambda func: func(query), [fetch_google_kg_data, fetch_newsapi_data, fetch_wikidata])

        data_sources = []

        # Process API responses
        for result in results:
            if result:
                # Process Google KG data
                if "itemListElement" in result:
                    for element in result["itemListElement"]:
                        description = element["result"].get("detailedDescription", {}).get("articleBody", "No description available.")
                        data_sources.append(description)
                # Process NewsAPI data
                elif "articles" in result:
                    for article in result["articles"]:
                        description = article.get("description", "No description available.")
                        data_sources.append(description)
                # Process Wikidata
                elif "results" in result:
                    for item in result["results"]["bindings"]:
                        description = item.get("description", {}).get("value", "No description available.")
                        data_sources.append(description)

        # Step 3: Verify the query
        is_true = verify_query(query, data_sources)

        # Step 4: Output result and update Knowledge Graph
        if is_true:
            print(f"Query '{query}' is TRUE. Adding to Knowledge Graph.")
            neo4j_manager.add_query(query, True)
        else:
            print(f"Query '{query}' is FALSE.")

# ---- EXECUTION ---- #

if __name__ == "__main__":
    while True:
        query = input("Enter a query (or 'exit' to quit): ")
        if query.lower() == "exit":
            break

        # Initialize Neo4j Manager
        neo4j_manager = Neo4jManager(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)

        try:
            handle_query(query, neo4j_manager)
        finally:
            neo4j_manager.close()
