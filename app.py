from flask import Flask, request, jsonify
from flask_cors import CORS  # To handle CORS if your front-end and back-end are on different servers
from IntegratingAll import KnowledgeGraphManager  # Import the KnowledgeGraphManager class
from config import API_KEY, CSE_ID

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize KnowledgeGraphManager with Neo4j connection details
kg_manager = KnowledgeGraphManager(uri="bolt://localhost:7687", username="neo4j", password="ABCD1234")

@app.route('/verify', methods=['POST'])
def verify_query():
    # Get query from the incoming JSON request
    data = request.json
    query = data.get('query')

    if not query:
        return jsonify({"error": "Query not provided"}), 400  # If no query is provided

    try:
        # Use the KnowledgeGraphManager to verify the query
        result = kg_manager.verify_query(query)

        # Return the result to the front-end as JSON
        return jsonify({"result": result})
    except Exception as e:
        # Handle any errors that may occur
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200  # A simple health check route

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Run the Flask app on port 5000
