

# from flask import Flask, request, jsonify
# from flask_cors import CORS  # To handle CORS if your front-end and back-end are on different servers
# from config import API_KEY, CSE_ID, URI, USERNAME, PASSWORD
# from IntegratingAll import KnowledgeGraphManager
# import os
# app = Flask(__name__)

# CORS(app, resources={r"/*": {"origins": ["https://kauwa-314j.vercel.app/dashboard", "http://localhost:3000"]}})
#  # Enable CORS for all routes

# # Variable to hold the KnowledgeGraphManager object only when needed
# kg_manager = None
# neo4j_connected = False

# def initialize_kg_manager():
#     global kg_manager, neo4j_connected
#     try:
#         kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
#         neo4j_connected = True
#     except Exception as e:
#         print(f"Neo4j connection failed: {e}")
#         kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
#         neo4j_connected = False

# @app.route('/verify', methods=['POST'])
# def verify_query():
#     global kg_manager
    
#     # Initialize the KnowledgeGraphManager lazily
#     if kg_manager is None:
#         initialize_kg_manager()

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
#     port = int(os.environ.get('PORT', 5000))  # Use PORT from env or fallback to 5000
#     app.run(debug=False, host='0.0.0.0', port=port)  # Run the Flask app on port 5001 (debug mode off in production)

# ------------------------------
# Integrating Video Verification
# ------------------------------
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.xception import preprocess_input
from tensorflow.keras.models import load_model

from config import API_KEY, CSE_ID, URI, USERNAME, PASSWORD
from IntegratingAll import KnowledgeGraphManager

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "https://kauwa-314j.vercel.app/dashboard", 
    "http://localhost:3000"
]}})

# ------------------------------
# Variables for Text Verification
# ------------------------------
kg_manager = None
neo4j_connected = False

def initialize_kg_manager():
    """Lazy initialization of the KnowledgeGraphManager."""
    global kg_manager, neo4j_connected
    try:
        kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
        neo4j_connected = True
    except Exception as e:
        print(f"Neo4j connection failed: {e}")
        kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
        neo4j_connected = False

# ------------------------------
# Load Deepfake Detection Model
# ------------------------------
MODEL_PATH = "deepfakeModels\\final_deepfake_classifier.h5"
NUM_FRAMES = 10
TARGET_SIZE = (299, 299)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file '{MODEL_PATH}' not found.")

deepfake_model = load_model(MODEL_PATH)

def sample_frames(video_path, num_frames=NUM_FRAMES, target_size=TARGET_SIZE):
    """
    Samples NUM_FRAMES evenly spaced frames from the video,
    converts to RGB, resizes, and applies Xception preprocessing.
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames < 1:
        cap.release()
        raise ValueError(f"Video {video_path} has no frames.")

    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    frames = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.resize(frame, target_size)
        frames.append(frame)
    cap.release()

    # If the video has fewer frames than expected, pad with the last frame.
    if len(frames) < num_frames:
        while len(frames) < num_frames:
            frames.append(frames[-1])
    frames = np.array(frames, dtype=np.float32)
    frames = preprocess_input(frames)
    return frames

def predict_video(video_path):
    """
    Processes the video file with the deepfake model and returns:
      - label: "Real" if predicted probability is >= 0.8, else "Deepfake"
      - probability: The prediction probability
    """
    try:
        frames = sample_frames(video_path)
        video_input = np.expand_dims(frames, axis=0)  # Shape: (1, NUM_FRAMES, H, W, 3)
        pred_prob = deepfake_model.predict(video_input)[0][0]
        label = "Real" if pred_prob >= 0.85 else "Deepfake"
        return {"label": label, "probability": float(pred_prob)}
    except Exception as e:
        return {"error": str(e)}

# ------------------------------
# Unified API Endpoint: /process
# ------------------------------
@app.route('/process', methods=['POST'])
def process_input():
    """
    This endpoint handles both:
      - Text verification (expects JSON with a "query" key)
      - Deepfake detection (expects a file upload with key "video")
    """
    # If a video file is provided, process it with the deepfake model.
    if "video" in request.files:
        video = request.files["video"]
        if not video:
            return jsonify({"error": "No video file uploaded"}), 400
        
        video_path = f"temp_{video.filename}"
        video.save(video_path)
        result = predict_video(video_path)
        if os.path.exists(video_path):
            os.remove(video_path)
        return jsonify({"deepfake_result": result})
    
    # Otherwise, expect a JSON payload for text verification.
    data = request.get_json()
    if data and "query" in data:
        query = data["query"]
        if not query:
            return jsonify({"error": "Query not provided"}), 400
        
        # Initialize the KnowledgeGraphManager if not done already.
        if kg_manager is None:
            initialize_kg_manager()
        
        try:
            result = kg_manager.verify_query(query)
            return jsonify({"result": result, "neo4j_connected": neo4j_connected})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({
        "error": "Invalid input. Provide either a text query ('query') or a video file ('video')."
    }), 400

# ------------------------------
# Health Check Endpoint
# ------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "neo4j_connected": neo4j_connected
    }), 200

# ------------------------------
# Run the Flask Server
# ------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
