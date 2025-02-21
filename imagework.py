import requests
from bs4 import BeautifulSoup
from PIL import Image
import io
import re
import numpy as np
import tensorflow as tf
from sklearn.metrics.pairwise import cosine_similarity
from urllib.parse import urljoin
import cv2
from tensorflow.keras.preprocessing import image as keras_image  # renamed to avoid conflict
from google.cloud import vision
import os
import openai
import json
from groq import Groq
import trafilatura

# Set up credentials for Google Cloud Vision
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"imageModel\\vision-key.json"

# Load the YOLO model (ensure best.pt exists at the specified path)
model_path = r"imageModel\\best.pt"
from ultralytics import YOLO
yolo_model = YOLO(model_path)

# Initialize Google OCR client
client = vision.ImageAnnotatorClient()

def extract_text(image_path):
    with io.open(image_path, "rb") as image_file:
        content = image_file.read()
    image_obj = vision.Image(content=content)
    response = client.text_detection(image=image_obj)
    texts = response.text_annotations
    return texts[0].description if texts else ""

def crop_image(image_path):
    """
    Loads the full-resolution image with OpenCV, runs YOLO detection,
    and crops the detected regions. Returns a list of cropped image paths.
    """
    full_img = cv2.imread(image_path)
    if full_img is None:
        raise ValueError(f"❌ Failed to read image: {image_path}")

    results = yolo_model.predict(image_path)
    output_folder = r"imageOutput"
    os.makedirs(output_folder, exist_ok=True)
    cropped_paths = []
    
    for i, box in enumerate(results[0].boxes.xyxy):
        x1, y1, x2, y2 = map(int, box)
        print(f"Box {i}: {x1}, {y1}, {x2}, {y2}")
        cropped_article = full_img[y1:y2, x1:x2]
        output_path = os.path.join(output_folder, f"article_{i}.jpg")
        cv2.imwrite(output_path, cropped_article)
        cropped_paths.append(output_path)
    
    print(f"✅ Extracted {len(cropped_paths)} articles: {cropped_paths}")
    return cropped_paths

def detect_web(image_path):
    """
    Uses Google Cloud Vision web detection to find pages with matching images.
    """
    client_local = vision.ImageAnnotatorClient()  # Using a local client instance
    with io.open(image_path, "rb") as image_file:
        content = image_file.read()
    image_obj = vision.Image(content=content)
    response = client_local.web_detection(image=image_obj)
    web_detection = response.web_detection
    urls = []
    if web_detection.pages_with_matching_images:
        for page in web_detection.pages_with_matching_images:
            urls.append(page.url)
    return urls

# Load MobileNetV2 model for feature extraction
Mobile_net_model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

def extract_features(image):
    """
    Extracts and returns a feature vector from an image (PIL Image).
    """
    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    features = Mobile_net_model.predict(img_array)
    return features.flatten()

def compare_images(image1, image2):
    features1 = extract_features(image1)
    features2 = extract_features(image2)
    score = cosine_similarity([features1], [features2])
    return score[0][0]

def extract_images_from_url(url):
    """
    Extracts all image URLs from a webpage, skipping data URLs.
    """
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    img_tags = soup.find_all('img')
    img_urls = []
    for img_tag in img_tags:
        src = img_tag.get('src')
        if src and not src.startswith("data:"):
            img_urls.append(urljoin(url, src))
    return img_urls


def process_url_and_compare(original_image_path, url):
    original_image = Image.open(original_image_path).convert("RGB")
    best_match_page = None
    highest_score = 0
    img_urls = extract_images_from_url(url)[:10]  # Limit to first 10 images per URL
    for img_url in img_urls:
        try:
            img_data = requests.get(img_url).content
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            similarity_score = compare_images(original_image, img)
            if similarity_score > highest_score:
                highest_score = similarity_score
                best_match_page = url
        except Exception as e:
            print(f"Error processing image from {img_url}: {e}")
    
    if highest_score >= 0.7:
        return best_match_page, highest_score
    else:
        return None, 0

def extract_clean_content(url: str) -> str:
    """Extract clean text content from a URL."""
    try:
        # Use Trafilatura for content extraction
        downloaded = trafilatura.fetch_url(url)
        content = trafilatura.extract(downloaded, include_tables=False)
        if not content:
            # Fallback to BeautifulSoup
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            for element in soup(['script', 'style', 'nav', 'header', 'footer']):
                element.decompose()
            main_content = soup.find('article') or soup.find('main') or soup.find('body')
            content = ' '.join(main_content.stripped_strings) if main_content else ''
        return content.strip()
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return ""

from groq import Groq
import os

def groq_chat_completion(prompt: str, api_key: str = None) -> str:
    """
    Uses the Groq client to get a chat completion from the deepseek-r1-distill-llama-70b model.
    Streams the result and returns the complete response as a string.
    """
    # Ensure an API key is provided (either passed in or from the environment)
    if not api_key:
        api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("The GROQ_API_KEY must be provided either via the api_key parameter or environment variable.")
    
    # Instantiate the Groq client with the provided API key
    client = Groq(api_key=api_key)
    
    messages = [
        {
            "role": "system",
            "content": """
You are a vigilant fact-checking assistant specializing in news content analysis. Your task is to evaluate a claim extracted from an image and verify its justification using additional contextual evidence from a related web page.

Input Description:
- OCR Text: A raw, unformatted text string extracted via OCR from a news image. This text contains a claim.
- HTML Content: A raw HTML-parsed page corresponding to the news story where the image was used.

Task Objectives:
- Extract the Claim: Identify the main claim in the OCR text.
- Analyze Context: Review the HTML content for supporting or contradictory evidence.
- Cross-Reference Facts: Assess if the claim is factually accurate.
- Evaluate Justification: Determine if the claim is fully justified, partially justified, or not justified based on available evidence.

Output Structure:
Output only valid JSON (with no extra text or commentary) with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the claim extracted from the OCR text.
- "webpage": the URL of the webpage used for context.
- "reason": a detailed explanation supporting the verdict.

            """.strip()
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    completion = client.chat.completions.create(
        model="deepseek-r1-distill-llama-70b",
        messages=messages,
        temperature=0.6,
       
        top_p=0.95,
        stream=True,
        
    )
    
    response = ""
    for chunk in completion:
        response += (chunk.choices[0].delta.content or "")
    return response

def process_claim(image_path: str, url: str, api_key: str = None) -> str:
    """
    Constructs a combined prompt using OCR text from the image and HTML content extracted from the URL,
    then processes it through the Groq chat completion for fact-checking.
    """
    ocr_text = extract_text(image_path)
    html_content = extract_clean_content(url)
    
    combined_prompt = f"""
OCR Text:
{ocr_text}

Text to validate from:
{html_content}

Please output your fact-checking analysis in valid JSON format with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the claim extracted from the OCR text.
- "webpage": the URL of the webpage used for context.
- "reason": a detailed explanation supporting the verdict.
    """.strip()
    
    # Set your API key if not already provided
    if not api_key:
        api_key = "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"
    return groq_chat_completion(combined_prompt, api_key=api_key)


def extract_json(text: str) -> dict:
    """
    Extracts the JSON object from a text output.
    This function finds the substring that starts with '{' and ends with '}' and
    attempts to parse it as JSON.
    """
    # Use regex to capture the JSON block (including newlines)
    pattern = re.compile(r'(\{.*\})', re.DOTALL)
    match = pattern.search(text)
    if match:
        json_str = match.group(1)
        try:
            return json.loads(json_str)
        except Exception as e:
            raise ValueError(f"Error parsing JSON: {e}")
    else:
        raise ValueError("No JSON object found in text")


# Main execution
# if __name__ == "__main__":
#     image_path = r"D:\PROJECTS\100days\image work\test 3.jpeg"
    
#     # Extract OCR text from the original image.
#     extracted_text = extract_text(image_path)
#     print("Extracted OCR Text:", extracted_text)
    
#     # Crop the image for further processing.
#     cropped_paths = crop_image(image_path)
#     print("Cropped image paths:", cropped_paths)
    
#     if cropped_paths:
#         first_cropped = cropped_paths[0]
        
#         # Detect web URLs using the cropped image.
#         urls = detect_web(first_cropped)
#         print("Detected URLs:", urls)
        
#         # Compute similarity scores for each URL.
#         candidates = [process_url_and_compare(first_cropped, url) for url in urls]
#         print("Similarity scores (URL, score):", candidates)
        
#         final_result = None
#         api_key = "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"  # or use environment variable
        
#         # Iterate over each candidate.
#         for candidate in candidates:
#             url_candidate, sim_score = candidate
#             # Process only candidates with valid URL and similarity >= 70%.
#             if url_candidate and sim_score is not None and sim_score >= 0.70:
#                 print(f"\nProcessing URL: {url_candidate} with similarity score: {sim_score:.4f}")
#                 raw_response = process_claim(image_path, url_candidate, api_key=api_key)
#                 print("Raw Fact-checking Response:")
#                 print(raw_response)
                
#                 # Extract JSON from the raw response
#                 try:
#                     response_json = extract_json(raw_response)
#                 except Exception as e:
#                     print("Error extracting JSON:", e)
#                     continue  # Skip this candidate if extraction fails
                
#                 verdict = response_json.get("verdict", "").lower()
#                 print("Parsed Verdict:", verdict)
                
#                 # Early termination if verdict is "justified" or "supported"
#                 if verdict in ["justified", "supported"]:
#                     final_result = response_json
#                     print("Early termination: Justified result found.")
#                     break
        
#         if final_result:
#             print("\nOverall Fact-Check Result: The claim is supported (justified).")
#             print("Claim:", final_result.get("claim"))
#             print("Webpage:", final_result.get("webpage"))
#             print("Reason:", final_result.get("reason"))
#         else:
#             print("\nOverall Fact-Check Result: The claim is not supported (not justified) by the available sources.")
#     else:
#         print("No cropped images available for further processing.")


def convert_numpy(obj):
    """Convert numpy data types to native Python types for JSON serialization."""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    return obj  # Return as-is if it's not a NumPy type



import json
import numpy as np

def predict(image_path):
    result_data = {}
    
    # Extract OCR text from the original image.
    extracted_text = extract_text(image_path)
    result_data["Extracted OCR Text"] = extracted_text
    
    # Crop the image for further processing.
    cropped_paths = crop_image(image_path)
    result_data["Cropped image paths"] = cropped_paths
    
    if cropped_paths:
        first_cropped = cropped_paths[0]
        
        # Detect web URLs using the cropped image.
        urls = detect_web(first_cropped)
        result_data["Detected URLs"] = urls
        
        # Compute similarity scores for each URL.
        candidates = [(url, float(sim) if isinstance(sim, np.float32) else sim) for url, sim in [process_url_and_compare(first_cropped, url) for url in urls]]
        result_data["Similarity scores"] = candidates
        
        final_result = None
        api_key = "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"  # or use environment variable
        
        # Iterate over each candidate.
        for candidate in candidates:
            url_candidate, sim_score = candidate
            # Process only candidates with valid URL and similarity >= 70%.
            if url_candidate and sim_score is not None and sim_score >= 0.70:
                raw_response = process_claim(image_path, url_candidate, api_key=api_key)
                
                # Extract JSON from the raw response
                try:
                    response_json = extract_json(raw_response)
                except Exception as e:
                    result_data["Error extracting JSON"] = str(e)
                    continue  # Skip this candidate if extraction fails
                
                verdict = response_json.get("verdict", "").lower()
                result_data["Parsed Verdict"] = verdict
                
                # Early termination if verdict is "justified" or "supported"
                if verdict in ["justified", "supported"]:
                    final_result = response_json
                    result_data["Final Verdict"] = "The claim is supported (justified)."
                    result_data["Claim"] = final_result.get("claim")
                    result_data["Webpage"] = final_result.get("webpage")
                    result_data["Reason"] = final_result.get("reason")
                    return json.dumps(result_data, indent=4)
        
        if not final_result:
            result_data["Final Verdict"] = "The claim is not supported (not justified) by the available sources."
            
    else:
        result_data["Error"] = "No cropped images available for further processing."
    
    return json.dumps(result_data, indent=4)
