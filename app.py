from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import os
from imagework import predict
from deepfake.deepfake_api import DeepfakeVideo
from config import API_KEY, CSE_ID, URI, USERNAME, PASSWORD, GSE_API_KEY
from IntegratingAll import KnowledgeGraphManager
from aiAudioDetector.ai_audio_detector import AudioDetector
from werkzeug.utils import secure_filename
from verification.enhanced_search_system import VerificationAgent
import numpy as np
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
    print("inside kg_manager")
    try:
        kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
        neo4j_connected = True
    except Exception as e:
        print(f"Neo4j connection failed: {e}")
        kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
        neo4j_connected = False
 


def predict_image(image_path):
    return predict(image_path)
    
    
#------------------------------
Upload_folder = os.path.join(os.getcwd(), "uploads")
os.makedirs(Upload_folder, exist_ok=True)
# ------------------------------
# Unified API Endpoint: /process
# ------------------------------
@app.route('/process', methods=['POST'])
def process_input():
    """
    This endpoint handles both:
      - Text verification (expects JSON with a "query" key)
      - Deepfake detection (expects a file upload with key "video" or "image")
    """
    
    
    if "video" in request.files:
        video = request.files["video"]
        if not video:
            return jsonify({"error": "No video file uploaded"}), 400

        if not video or video.filename == "":
            return jsonify({"error": "No video file selected"}), 400

        # Save the uploaded video
        filename = secure_filename(video.filename)
        video_path = os.path.join(Upload_folder, filename)
        video.save(video_path)

        # Initialize models
        dv = DeepfakeVideo()
        audio = AudioDetector("ai audio model/wav2vec2_finetuned")
        agent = VerificationAgent(api_key=API_KEY, cse_id=CSE_ID, gse_api_key=GSE_API_KEY)
        # Initializing variable 
        audio_res = "No Audio to Extract"
        trans_res = "No Transcribe"
        # Extract audio
        result = dv.predict_video(video_path)
        
        # Try transcription; if it fails or returns empty, set trans_res accordingly
        if audio.video_has_audio(video_path):
            audio_path = audio.extract_audio(video_path)

            # Predict results
            audio_res = audio.predict_audio(audio_path)
            transcribed = audio.transcribe_audio(audio_path)
            if not transcribed or transcribed.strip() == "":
                trans_res = "No Transcribe"
            else:
                trans_res = agent.process_query(transcribed)
                
            if os.path.exists(audio_path):
                os.remove(audio_path)

            print("Transcriber result:", trans_res)
        else:
            
            trans_res = "No Transcribe"

        # Cleanup temp files
        if os.path.exists(video_path):
            os.remove(video_path)
        
        
        # Build response JSON
        response = {
            "deepfake_result": result,
            "audio_result": audio_res,
            "transcriber_result": trans_res
        }
        return jsonify(response)
    
    
    if "image" in request.files:
        image_file = request.files["image"]
        if not image_file:
            return jsonify({"error": "No image file uploaded"}), 400
        
        image_path = f"temp_{image_file.filename}"
        image_file.save(image_path)
        result = predict_image(image_path)
        if os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({"deepfake_result": result})
    
    # Otherwise, expect a JSON payload for text verification.
    data = request.get_json()
    print("Data received", data)
    if data and "query" in data:
        print("Inside text verification block")
        query = data["query"]
        if not query:
            return jsonify({"error": "Query not provided"}), 400
        
        # Initialize the KnowledgeGraphManager if not done already.
        if kg_manager is None:
            initialize_kg_manager()
        print("Query received", query)
        try:
            result = kg_manager.verify_query(query)
            print("Result of text verification", json.dumps(result, indent=4))
            return jsonify({"result": result, "neo4j_connected": neo4j_connected})
        except Exception as e:
            print("Shouldn't reach here")
            return jsonify({"error": str(e)}), 500

    return jsonify({
        "error": "Invalid input. Provide either a text query ('query') or a video/image file ('video'/'image')."
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
    app.run(debug=True, host='0.0.0.0', port=port)
