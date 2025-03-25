


from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.xception import preprocess_input  # For image processing
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
from tensorflow.keras.models import load_model
from imagework import predict
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image

from mtcnn import MTCNN
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
    print("inside kg_manager")
    try:
        kg_manager = KnowledgeGraphManager(uri=URI, username=USERNAME, password=PASSWORD)
        neo4j_connected = True
    except Exception as e:
        print(f"Neo4j connection failed: {e}")
        kg_manager = KnowledgeGraphManager()  # Initialize without Neo4j
        neo4j_connected = False

# ------------------------------
# Deepfake Video Detection Setup (New Code)
# ------------------------------
# Load trained LSTM model for deepfake detection
lstm_model = load_model("deepfakeModels\\improved_deepfake_model_2.h5")

# Initialize EfficientNetB0 feature extractor
base_model = EfficientNetB0(weights="imagenet", include_top=False, pooling="avg")
feature_extractor = tf.keras.Model(inputs=base_model.input, outputs=base_model.output)

# Initialize MTCNN for face detection
detector = MTCNN()

def extract_faces_from_video(video_path, output_size=(224, 224), max_frames=20):
    """
    Extracts faces from a video and processes them for model input.
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps // 1) if fps and fps > 0 else 1  # Process 1 frame per second
    
    count, saved_count = 0, 0
    faces = []

    while True:
        ret, frame = cap.read()
        if not ret or saved_count >= max_frames:
            break

        if count % frame_interval == 0:
            detected_faces = detector.detect_faces(frame)
            if detected_faces:
                # Select the largest detected face (assuming it's the primary face)
                face = max(detected_faces, key=lambda x: x['box'][2] * x['box'][3])
                x, y, width, height = face['box']
                x, y = max(0, x), max(0, y)
                cropped_face = frame[y:y+height, x:x+width]
                
                # Resize the face image
                cropped_face = cv2.resize(cropped_face, output_size)
                faces.append(cropped_face)
                saved_count += 1

        count += 1

    cap.release()
    return faces

def extract_features_from_faces(faces, max_frames=20):
    """
    Converts faces into EfficientNetB0 embeddings for LSTM input.
    """
    feature_list = []
    
    for face in faces:
        img_array = image.img_to_array(face)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = efficientnet_preprocess_input(img_array)
        
        features = feature_extractor.predict(img_array)
        feature_list.append(features.flatten())

    # Pad with zeros if fewer than max_frames
    while len(feature_list) < max_frames:
        feature_list.append(np.zeros(1280))  # EfficientNetB0 output size

    return np.array(feature_list)

def predict_video(video_path):
    """
    Predict if a given video is real or deepfake using the new pipeline.
    Accepts only local video file paths.
    """
    print(f"Processing video: {video_path}")
    
    # Step 1: Extract faces from video
    faces = extract_faces_from_video(video_path)
    if len(faces) == 0:
        print("No faces detected in the video.")
        return {"error": "No faces detected in the video."}
    
    # Step 2: Extract features from faces
    features = extract_features_from_faces(faces)
    
    # Step 3: Reshape for LSTM (batch_size=1, timesteps=max_frames, features=1280)
    features = np.expand_dims(features, axis=0)
    
    # Step 4: Predict using the trained LSTM model
    prediction = lstm_model.predict(features)
    print("Prediction results:", prediction)

    # Step 5: Interpret the result
    predicted_label = "FAKE" if prediction[0][0] < 0.4 else "REAL"
    confidence = prediction[0][0] if predicted_label == "FAKE" else 1 - prediction[0][0]
    
    print(f"Prediction: {predicted_label} (Confidence: {confidence:.2f})")
    return {"label": predicted_label, "confidence": float(confidence)}

def predict_image(image_path):
    return predict(image_path)
    
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
        print("Result of deepfake", result)
        return jsonify({"deepfake_result": result})
    
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
        
        try:
            result = kg_manager.verify_query(query)
            print("Result of text verification", result)
            return jsonify({"result": result, "neo4j_connected": neo4j_connected})
        except Exception as e:
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
