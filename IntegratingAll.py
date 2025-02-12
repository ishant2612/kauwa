from neo4j import GraphDatabase, exceptions
from verification.search_system import VerificationSearchSystem
from verification.enhanced_search_system import VerificationAgent
from label_extractor import LabelExtractor
from config import API_KEY, CSE_ID, GSE_API_KEY, URI, USERNAME, PASSWORD
import hashlib
import json
import numpy as np
import re


from concurrent.futures import ThreadPoolExecutor
import time

class KnowledgeGraphManager:
    def __init__(self, uri=None, username=None, password=None):
        self.driver = None
        self.verification_system = VerificationAgent(
            api_key=API_KEY,
            cse_id=CSE_ID,
            gse_api_key=GSE_API_KEY
        )
        self.label_extractor = LabelExtractor()

        if uri and username and password:
            try:
                self.driver = GraphDatabase.driver(uri, auth=(username, password))
                self._initialize_database()
            except exceptions.ServiceUnavailable as e:
                print(f"Unable to connect to Neo4j: {e}")
                self.driver = None

    def _initialize_database(self):
        if not self.driver:
            return
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (q:Query) REQUIRE q.query_id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (l:Label) REQUIRE l.name IS UNIQUE")

    def close(self):
        if self.driver:
            self.driver.close()

    def _generate_query_id(self, query):
        return hashlib.md5(query.encode()).hexdigest()

    def _convert_numpy_types(self, obj):
        if isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        return obj

    def add_query_to_graph(self, query, verification_result):
        if not self.driver:
            return
        query_id = self._generate_query_id(query)
        processed_result = self._convert_numpy_types(verification_result)

        # Extract labels from the query
        labels = self.label_extractor.extract_labels(query)

        if labels:
            # Only use the first label
            label = labels[0]
        else:
            # Default label if no labels found
            label = "Unknown"

        with self.driver.session() as session:
            try:
                # Create the label node if it doesn't exist
                session.execute_write(self._create_label_node, label)
                # Add the query node and create a BELONGS_TO relationship
                session.execute_write(self._create_query_node, query_id, query, processed_result, label)
            except Exception as e:
                print(f"Error adding to graph: {e}")

    @staticmethod
    def _create_label_node(tx, label):
        query = """
        MERGE (l:Label {name: $label})
        """
        tx.run(query, label=label)

    @staticmethod
    def _create_query_node(tx, query_id, query_text, verification_result, label):
        query = """
        MERGE (q:Query {query_id: $query_id})
        SET q.text = $query_text,
            q.is_true = $is_true,
            q.confidence = $confidence,
            q.verification_data = $verification_data,
            q.timestamp = timestamp()
        
        MERGE (l:Label {name: $label})
        MERGE (q)-[:BELONGS_TO]->(l)
        """
        tx.run(
            query,
            query_id=query_id,
            query_text=query_text,
            is_true=verification_result['verification']['verdict'] == 'TRUE',
            confidence=float(verification_result['verification']['confidence']),
            verification_data=json.dumps(verification_result),
            label=label
        )

    def get_query_truth_value(self, query):
        if not self.driver:
            return None
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

    def verify_query(self, query):
        if self.driver:
            # First check if the query exists in the knowledge graph
            existing_truth = self.get_query_truth_value(query)
            if existing_truth is not None:
                # Returning default confidence and reason for existing data in graph
                return existing_truth, 1.0, "Retrieved from knowledge graph", []

        # If not in the graph, verify using VerificationAgent
        verification_result = self.verification_system.process_query(query)
        boolean_result = verification_result['verification']['verdict'] == 'TRUE'
        confidence = float(verification_result['verification']['confidence'])
        reason = verification_result.get('verification').get('reason', "Reason not available")

        # Get labels from the verification result
        labels = self.label_extractor.extract_labels(query)

        # Add to knowledge graph if connected and result is true
        if self.driver and boolean_result:
            self.add_query_to_graph(query, verification_result)

        return boolean_result, confidence, reason, labels

    def process_query_in_parallel(self, queries):
        with ThreadPoolExecutor(max_workers=5) as executor:
            # Submitting tasks for parallel execution
            future_results = {executor.submit(self.verify_query, query): query for query in queries}
            
            # Collecting the results once done
            for future in future_results:
                query = future_results[future]
                try:
                    result, confidence, reason, labels = future.result()
                    print(f"\nQuery: {query}")
                    print(f"Verification Result: {result}")
                    print(f"Confidence: {confidence}")
                    print(f"Reason: {reason}")
                    print(f"Labels: {labels}")
                except Exception as e:
                    print(f"Error processing query '{query}': {e}")


def main():
    # Neo4j connection details
    uri = URI
    username = USERNAME
    password = PASSWORD
    kg_manager = KnowledgeGraphManager(uri, username, password)

    try:
        queries = []
        while True:
            query = input("Enter your query (or 'exit' to quit): ")
            if query.lower() == "exit":
                break
            queries.append(query)
        
        # Process multiple queries in parallel
        kg_manager.process_query_in_parallel(queries)

    finally:
        kg_manager.close()

if __name__ == "__main__":
    main()
