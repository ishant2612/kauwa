from neo4j import GraphDatabase, exceptions
from verification.search_system import VerificationSearchSystem
from verification.enhanced_search_system import VerificationAgent
from config import API_KEY, CSE_ID, GSE_API_KEY , URI, USERNAME, PASSWORD
import hashlib
import json
import numpy as np

class KnowledgeGraphManager:
    def __init__(self, uri=None, username=None, password=None):
        self.driver = None
        self.verification_system = VerificationAgent(
            api_key=API_KEY,
            cse_id=CSE_ID,
            gse_api_key=GSE_API_KEY
        )
        if uri and username and password:
            try:
                self.driver = GraphDatabase.driver(uri, auth=(username, password))
                # Create constraints
                self._initialize_database()
            except exceptions.ServiceUnavailable as e:
                print(f"Unable to connect to Neo4j: {e}")
                self.driver = None

    def _initialize_database(self):
        if not self.driver:
            return
        with self.driver.session() as session:
            # Create constraint for Query nodes
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (q:Query) REQUIRE q.query_id IS UNIQUE")

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
        
        with self.driver.session() as session:
            try:
                session.execute_write(
                    self._create_query_node, 
                    query_id, 
                    query, 
                    processed_result
                )
            except Exception as e:
                print(f"Error adding to graph: {e}")

    @staticmethod
    def _create_query_node(tx, query_id, query_text, verification_result):
        query = """
        MERGE (q:Query {query_id: $query_id})
        SET q.text = $query_text,
            q.is_true = $is_true,
            q.confidence = $confidence,
            q.verification_data = $verification_data,
            q.timestamp = timestamp()
        """
        tx.run(
            query,
            query_id=query_id,
            query_text=query_text,
            is_true=verification_result['verification']['verdict'] == 'TRUE',
            confidence=float(verification_result['verification']['confidence']),
            verification_data=json.dumps(verification_result)
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
        """Verify query using VerificationSearchSystem and store in knowledge graph if possible"""
        if self.driver:
            # First check if query exists in knowledge graph
            existing_truth = self.get_query_truth_value(query)
            if existing_truth is not None:
                return existing_truth

        # If not in graph, verify using VerificationSearchSystem
        verification_result = self.verification_system.process_query(query)
        
        # Add to knowledge graph if connected
        if self.driver and verification_result["verification"]["verdict"] == "TRUE":
            self.add_query_to_graph(query, verification_result)
        
        return verification_result['verification']['verdict'] == 'TRUE'

def main():
    # Neo4j connection details
    uri = URI
    username = USERNAME
    password = PASSWORD
    kg_manager = KnowledgeGraphManager(uri, username, password)
    
    try:
        while True:
            query = input("Enter your query (or 'exit' to quit): ")
            if query.lower() == "exit":
                break
            
            result = kg_manager.verify_query(query)
            print(f"\nVerification Result: {result}")
            
    finally:
        kg_manager.close()

if __name__ == "__main__":
    main()
