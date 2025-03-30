import cv2
import tensorflow as tf
from mtcnn import MTCNN
import numpy as np
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing import image

# Load the LSTM model
lstm_model = load_model("deepfakeModels/improved_deepfake_model_2.h5")

# Initialize EfficientNetB0 feature extractor
base_model = EfficientNetB0(weights="imagenet", include_top=False, pooling="avg")
feature_extractor = tf.keras.Model(inputs=base_model.input, outputs=base_model.output)

# Initialize MTCNN for face detection
detector = MTCNN()

class DeepfakeVideo:
    
    def extract_faces_from_video(self, video_path, output_size=(224, 224), max_frames=20):
        """
        Extracts faces from a video and processes them for model input.
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25  # Default to 25 if FPS is unavailable
        frame_interval = int(max(1, fps // 1))  # Ensure frame_interval is >= 1
        
        count, saved_count = 0, 0
        faces = []

        while True:
            ret, frame = cap.read()
            if not ret or saved_count >= max_frames:
                break

            if count % frame_interval == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)  # Convert to RGB
                detected_faces = detector.detect_faces(frame_rgb)

                if detected_faces:
                    # Select the largest detected face
                    face = max(detected_faces, key=lambda x: x['box'][2] * x['box'][3])
                    x, y, width, height = face['box']
                    x, y = max(0, x), max(0, y)
                    
                    cropped_face = frame_rgb[y:y+height, x:x+width]
                    
                    if cropped_face.size == 0:
                        continue  # Skip empty faces
                    
                    cropped_face = cv2.resize(cropped_face, output_size)
                    faces.append(cropped_face)
                    saved_count += 1

            count += 1

        cap.release()
        return faces

    def extract_features_from_faces(self, faces, max_frames=20):
        """
        Converts faces into EfficientNetB0 embeddings for LSTM input.
        """
        feature_list = []
        
        for face in faces:
            if face.shape[-1] == 1:  # Convert grayscale to RGB if needed
                face = cv2.cvtColor(face, cv2.COLOR_GRAY2RGB)

            img_array = image.img_to_array(face)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = efficientnet_preprocess_input(img_array)
            
            features = feature_extractor.predict(img_array)
            feature_list.append(features.flatten())

        # Ensure fixed sequence length for LSTM
        if len(feature_list) < max_frames:
            while len(feature_list) < max_frames:
                feature_list.append(np.zeros(1280))  # EfficientNetB0 output size
        else:
            feature_list = feature_list[:max_frames]  # Trim excess frames
        
        return np.array(feature_list)

    def predict_video(self, video_path):
        """
        Predict if a given video is real or deepfake using the new pipeline.
        Accepts only local video file paths.
        """
        print(f"Processing video: {video_path}")
        
        # Step 1: Extract faces from video
        faces = self.extract_faces_from_video(video_path)
        if len(faces) == 0:
            print("No faces detected in the video.")
            return {"error": "No faces detected in the video."}
        
        # Step 2: Extract features from faces
        features = self.extract_features_from_faces(faces)
        
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
