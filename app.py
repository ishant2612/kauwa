# from flask import Flask, request, jsonify
# from flask_cors import CORS  # To handle CORS if your front-end and back-end are on different servers
# from IntegratingAll import KnowledgeGraphManager  # Import the KnowledgeGraphManager class
# from config import API_KEY, CSE_ID, URI, USERNAME, PASSWORD

# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Try to initialize KnowledgeGraphManager with Neo4j connection details
# try:
#     kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
#     neo4j_connected = True
# except Exception as e:
#     print(f"Neo4j connection failed: {e}")
#     kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
#     neo4j_connected = False

# @app.route('/verify', methods=['POST'])
# def verify_query():
#     # Get query from the incoming JSON request
#     data = request.json
#     query = data.get('query')

#     if not query:
#         return jsonify({"error": "Query not provided"}), 400  # If no query is provided

#     try:
#         # Use the KnowledgeGraphManager to verify the query
#         result = kg_manager.verify_query(query)

#         # Return the result to the front-end as JSON
#         return jsonify({"result": result, "neo4j_connected": neo4j_connected})
#     except Exception as e:
#         # Handle any errors that may occur
#         return jsonify({"error": str(e)}), 500

# @app.route('/health', methods=['GET'])
# def health_check():
#     return jsonify({
#         "status": "ok",
#         "neo4j_connected": neo4j_connected
#     }), 200  # A simple health check route

# if __name__ == '__main__':
#     app.run(debug=True, port=5001)  # Run the Flask app on port 5001




from flask import Flask, request, jsonify
from flask_cors import CORS  # To handle CORS if your front-end and back-end are on different servers
from config import API_KEY, CSE_ID, URI, USERNAME, PASSWORD
from IntegratingAll import KnowledgeGraphManager
import os
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["https://kauwa-314j.vercel.app/dashboard", "http://localhost:3000"]}})
 # Enable CORS for all routes

# Variable to hold the KnowledgeGraphManager object only when needed
kg_manager = None
neo4j_connected = False

def initialize_kg_manager():
    global kg_manager, neo4j_connected
    try:
        kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
        neo4j_connected = True
    except Exception as e:
        print(f"Neo4j connection failed: {e}")
        kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
        neo4j_connected = False

@app.route('/verify', methods=['POST'])
def verify_query():
    global kg_manager
    
    # Initialize the KnowledgeGraphManager lazily
    if kg_manager is None:
        initialize_kg_manager()

    # Get query from the incoming JSON request
    data = request.json
    query = data.get('query')

    if not query:
        return jsonify({"error": "Query not provided"}), 400  # If no query is provided

    try:
        # Use the KnowledgeGraphManager to verify the query
        result = kg_manager.verify_query(query)

        # Return the result to the front-end as JSON
        return jsonify({"result": result, "neo4j_connected": neo4j_connected})
    except Exception as e:
        # Handle any errors that may occur
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "neo4j_connected": neo4j_connected
    }), 200  # A simple health check route

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use PORT from env or fallback to 5000
    app.run(debug=False, host='0.0.0.0', port=port)  # Run the Flask app on port 5001 (debug mode off in production)
