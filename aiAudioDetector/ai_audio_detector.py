


import torch
import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification
import os
import whisper
from moviepy.video.io.VideoFileClip import VideoFileClip
import numpy as np

class AudioDetector:
    def __init__(self, model_path):
        """
        Initialize the model and processor.
        :param model_path: Path to the trained Wav2Vec2 model.
        """
        self.processor = Wav2Vec2Processor.from_pretrained(model_path)
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_path)
        self.model.eval()
    
    def predict_audio(self, file_path):
        """
        Predict whether an audio file is bonafide (real) or spoof (fake).
        :param file_path: Path to the audio file.
        :return: Boolean (True for bonafide, False for spoof)
        """
        # Load audio
        y, sr = librosa.load(file_path, sr=16000)
        
        # Preprocess audio
        input_values = self.processor(y, sampling_rate=sr, return_tensors="pt", padding=True, truncation=True, max_length=240000).input_values
        
        # Run model prediction
        with torch.no_grad():
            logits = self.model(input_values).logits
        
        # Get predicted label (0 = bonafide, 1 = spoof)
        return torch.argmax(logits, dim=1).item() == 0  # True for bonafide, False for spoof

    def extract_audio(self, video_file):
        # Ensure video file is saved properly
        if not os.path.exists(video_file):
            raise FileNotFoundError(f"Video file not found: {video_file}")

        # Define output audio path (same base name with .wav extension)
        audio_path = os.path.splitext(video_file)[0] + ".wav"

        # Use a context manager to ensure the clip is closed after processing
        with VideoFileClip(video_file) as video:
            if video.audio is None:
                return None  # No audio in video
            video.audio.write_audiofile(audio_path, codec="pcm_s16le", fps=16000)

        return audio_path if self.audio_checker(audio_path) else None

    def audio_checker(self, audio_path, threshold=0.01):
        """
        Check if the extracted audio contains sound data.
        :param audio_path: Path to the extracted audio file.
        :param threshold: Minimum energy threshold to consider audio as valid.
        :return: Boolean (True if audio contains sound, False otherwise)
        """
        if not os.path.exists(audio_path):
            return False  # Audio file does not exist

        y, _ = librosa.load(audio_path, sr=16000)
        energy = np.sum(y ** 2)  # Compute signal energy
        return energy > threshold  # Return True if energy is above the threshold

    def video_has_audio(self, video_file):
        """
        Check if a video file contains an audio track.
        :param video_file: Path to the video file.
        :return: Boolean (True if video has audio, False otherwise)
        """
        if not os.path.exists(video_file):
            raise FileNotFoundError(f"Video file not found: {video_file}")
        
        with VideoFileClip(video_file) as video:
            return video.audio is not None

    def load_audio_librosa(self, audio_path, sr=16000):
        """ Load audio file using librosa instead of FFmpeg """
        audio, _ = librosa.load(audio_path, sr=sr, mono=True)  # Ensure mono audio
        return np.array(audio, dtype=np.float32)

    def transcribe_audio(self, audio_path):
        """ Transcribe audio using Whisper without FFmpeg """
        if not audio_path or not self.audio_checker(audio_path):
            return "No audio detected or insufficient sound data"
        
        model = whisper.load_model("base")  # Load Whisper model
        audio = self.load_audio_librosa(audio_path)  # Use librosa to load audio
        result = model.transcribe(audio)
        return result["text"]

#dv = AudioDetector("ai audio model\wav2vec2_finetuned")