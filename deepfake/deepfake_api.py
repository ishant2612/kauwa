from flask import Flask, request, jsonify
import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.xception import preprocess_input
from tensorflow.keras.models import load_model

app = Flask(__name__)

# ------------------------------
# Load Model
# ------------------------------
MODEL_PATH = "deepfakeModels\\best_deepfake_classifier.h5"
NUM_FRAMES = 10
TARGET_SIZE = (299, 299)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file '{MODEL_PATH}' not found.")

model = load_model(MODEL_PATH)

# ------------------------------
# Utility Function: Sample Frames
# ------------------------------
def sample_frames(video_path, num_frames=NUM_FRAMES, target_size=TARGET_SIZE):
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
    
    if len(frames) < num_frames:
        while len(frames) < num_frames:
            frames.append(frames[-1])

    frames = np.array(frames, dtype=np.float32)
    frames = preprocess_input(frames)
    return frames

# ------------------------------
# Deepfake Prediction API Route
# ------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if "video" not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    video = request.files["video"]
    video_path = f"temp_{video.filename}"
    video.save(video_path)

    try:
        frames = sample_frames(video_path)
        video_input = np.expand_dims(frames, axis=0)
        pred_prob = model.predict(video_input)[0][0]
        label = "Real" if pred_prob >= 0.8 else "Deepfake"
        os.remove(video_path)  # Clean up
        return jsonify({"label": label, "probability": float(pred_prob)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
