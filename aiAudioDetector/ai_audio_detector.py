import torch
import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification

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


# av = AudioDetector("ai audio model\wav2vec2_finetuned")
# print(av.predict_audio("LA_E_1009571.flac"))