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
from verification.enhanced_search_system import VerificationAgent

from config import API_KEY, CSE_ID, GSE_API_KEY

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
        print("------------------------------------------------------------------++++++++++++++++++++++++++++")
        print(content)
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

import os

def groq_chat_completion(messages: list, api_key: str = None) -> str:
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

def process_query(system_message: str, combined_prompt: str, api_key: str = None) -> str:
    """
    Constructs the message list from the given system prompt and combined user prompt,
    then delegates to groq_chat_completion.
    """
    messages = [
        {
            "role": "system",
            "content": system_message
        },
        {
            "role": "user",
            "content": combined_prompt
        }
    ]
    
    return groq_chat_completion(messages, api_key=api_key)

def process_claim(image_path: str, url: str, api_key: str = None) -> str:
    """
    Extracts OCR text and HTML content, constructs a combined prompt,
    and uses the designated system prompt for fact-checking before delegating
    to process_query.
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
    
    system_message = """
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
    
    if not api_key:
        api_key = "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"
    return process_query(system_message, combined_prompt, api_key=api_key)

def text_process_claim(image_path: str, url: str, api_key: str = None) -> str:
    """
    Similar to process_claim, but uses a slightly different system prompt.
    The combined prompt remains the same.
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
    
    system_message = """
You are a vigilant fact-checking assistant specializing in news content analysis. Your task is to evaluate a claim extracted from an image and verify its justification using additional contextual evidence from a related web page.

Input Description:
- OCR Text: A raw, unformatted text string extracted via OCR from a news image. This text contains a claim.
- HTML Content: A raw HTML-parsed page corresponding to the news story.

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
    
    if not api_key:
        api_key = "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"
    return process_query(system_message, combined_prompt, api_key=api_key)




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
def final_boss(image_reasons, text_reasons, extracted_text, api_key: str = None):
    """
    Aggregates the image and text-based analyses, and prompts the assistant to perform a final,
    integrated fact-checking analysis.
    
    Parameters:
    - image_reasons: Detailed analysis reasons from image-based searches.
    - text_reasons: Detailed analysis reasons from text-based searches.
    - extracted_text: The OCR-extracted claim from the image.
    - api_key: API key for the Groq client (uses default if not provided).
    
    Returns:
    - The final analysis as processed by process_query.
    """
    combined_prompt = f"""
Claim Extracted from the Image:
{extracted_text}

Aggregated Evidence from Searches:
Image-Based Analysis Reasons:
{image_reasons}

Text-Based Analysis Reasons:
{text_reasons}

Using the above evidence, evaluate whether the claim is justified. Provide your analysis in valid JSON format with the following keys:
- "verdict": "justified", "not justified", or "unknown"
- "claim": the extracted claim from the OCR text
- "reason": a detailed explanation supporting your conclusion
    """.strip()
    
    system_message = """
You are an expert, multifaceted fact-checking assistant specializing in news analysis who is going to make the final decision on whether or not news is true on based of previous analysis performed before you. Your role is to integrate evidence from both image-based and text-based search results to determine the overall validity of a claim extracted from an image.
    
Input Details:
- The extracted claim from the image.
- Detailed analysis results from candidate searches based on both image and text.
    
Your task is to cross-reference and analyze the provided evidence objectively, and then deliver your final assessment in valid JSON format according to the output structure specified.
    """.strip()
    
    if not api_key:
        api_key = "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"
    
    return process_query(system_message, combined_prompt, api_key=api_key)

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
    
    # 1. Initialization
    image_reasons = []  # List to store detailed reasons from image-based analysis
    text_reasons = []   # List to store detailed reasons from text-based analysis
    
    # Extract OCR text from the original image.
    extracted_text = extract_text(image_path)
    result_data["Extracted OCR Text"] = extracted_text
    
    # Crop the image for further processing.
    cropped_paths = crop_image(image_path)
    result_data["Cropped image paths"] = cropped_paths
    
    # 2. Process image-based analysis
    if cropped_paths:
        first_cropped = cropped_paths[0]
        
        # Detect web URLs using the cropped image.
        detected_urls = detect_web(first_cropped)
        result_data["Detected URLs from cropped image"] = detected_urls
        
        # Compute similarity scores for each URL.
        # Each candidate is a tuple of (url, similarity_score)
        candidates = [
            (url, float(sim) if isinstance(sim, np.float32) else sim)
            for url, sim in [process_url_and_compare(first_cropped, url) for url in detected_urls]
        ]
        result_data["Similarity scores"] = candidates
        
        # Iterate over each candidate.
        api_key = "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"  # or use environment variable
        for candidate in candidates:
            url_candidate, sim_score = candidate
            if url_candidate and sim_score is not None and sim_score >= 0.70:
                raw_response = process_claim(image_path, url_candidate, api_key=api_key)
                
                # Extract JSON from the raw response
                try:
                    response_json = extract_json(raw_response)
                except Exception as e:
                    image_reasons.append({
                        "url": url_candidate,
                        "error": f"Error extracting JSON: {str(e)}"
                    })
                    continue
                
                verdict = response_json.get("verdict", "").lower()
                reason_detail = response_json.get("reason", "No detailed reason provided")
                
                image_reasons.append({
                    "url": url_candidate,
                    "verdict": verdict,
                    "reason": reason_detail
                })
                
                # Early termination if verdict is clearly justified
                if verdict in ["justified", "supported"]:
                    result_data["Final Verdict (Image)"] = "The claim is supported (justified) based on image analysis."
                    result_data["Image Analysis Detail"] = response_json
                    # Optionally, you might break out of the loop here if you only want one successful candidate.
                    break
    else:
        result_data["Error"] = "No cropped images available for image-based processing."
    
    # 3. Process text-based analysis (using Google search on the extracted OCR text)
    text_urls = []
    if extracted_text:
        agent = VerificationAgent(api_key=API_KEY, cse_id=CSE_ID, gse_api_key=GSE_API_KEY)
        text_urls = agent.google_search(extracted_text)
        result_data["Text-based URLs from Google Search"] = text_urls

        for url_candidate in text_urls:
            raw_response = text_process_claim(image_path, url_candidate, api_key=api_key)
            
            try:
                response_json = extract_json(raw_response)
            except Exception as e:
                text_reasons.append({
                    "url": url_candidate,
                    "error": f"Error extracting JSON: {str(e)}"
                })
                continue
            
            verdict = response_json.get("verdict", "").lower()
            reason_detail = response_json.get("reason", "No detailed reason provided")
            
            text_reasons.append({
                "url": url_candidate,
                "verdict": verdict,
                "reason": reason_detail
            })
            
            # Early termination if verdict is clearly justified.
            if verdict in ["justified", "supported"]:
                result_data["Final Verdict (Text)"] = "The claim is supported (justified) based on text search."
                result_data["Text Analysis Detail"] = response_json
                # Optionally break here if one justified result is enough.
                break

    # Store the collected reasons in the result_data.
    result_data["Image Reasons"] = image_reasons
    result_data["Text Reasons"] = text_reasons
    print("Image Reasons:", image_reasons)
    print("Text Reasons:", text_reasons)
    # 4. Call final_boss to perform the multifaceted analysis based on both reason lists.
    final_analysis = final_boss(image_reasons, text_reasons, extracted_text)
    result_data["Final Analysis"] = final_analysis
    print("Final Analysis:", final_analysis)
    return json.dumps(result_data, indent=4)
result_data = predict(r"test 3.jpg")
print(result_data)
