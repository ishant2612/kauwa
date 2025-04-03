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
from datetime import datetime, date, time, timedelta
# from verification.multilingual import Translator


from config import API_KEY, CSE_ID, GSE_API_KEY

# Set up credentials for Google Cloud Vision
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"imageModel\\vision-key.json"



# Load the YOLO model (ensure best.pt exists at the specified path)
model_path = r"best.pt"
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
    try:
        response = requests.get(url, timeout=5)  # Set timeout to avoid hanging
        response.raise_for_status()  # Raise error for HTTP issues
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch {url}: {e}")
        return []  # Return empty list if request fails

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
            response = requests.get(img_url, timeout=5)
            response.raise_for_status()  # Ensure request was successful
            img_data = response.content
            
            if not img_data:  # Check if data is empty
                print(f"Skipping empty image from {img_url}")
                continue

            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            similarity_score = compare_images(original_image, img)

            if np.isnan(similarity_score):  # Check for NaN values
                print(f"Skipping {img_url} due to NaN similarity score")
                continue

            if similarity_score > highest_score:
                highest_score = similarity_score
                best_match_page = url
        except requests.exceptions.RequestException as e:
            print(f"Error fetching {img_url}: {e}")
        except Exception as e:
            print(f"Error processing image from {img_url}: {e}")
    
    return (best_match_page, highest_score) if highest_score >= 0.7 else (None, 0)



def extract_clean_content(url: str) -> str:
    """Extract clean text content from a URL."""
    
    try:
        # Use Trafilatura for content extraction
        downloaded = trafilatura.fetch_url(url)
        content = trafilatura.extract(downloaded, include_tables=False)
        print("------------------------------------------------------------------++++++++++++++++++++++++++++")
        # print(content)
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
    now = datetime.now()
    # print("Now:", now)

    # Current date only
    today = date.today()
    # print("Today:", today)
    ocr_text = extract_text(image_path)
    html_content = extract_clean_content(url)
    
    combined_prompt = f"""
OCR Text:
{ocr_text}

Text to validate from:
{html_content}

Today's Date and time: {now}

Please output your fact-checking analysis in valid JSON format with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the claim extracted from the OCR text.
- "webpage": the URL of the webpage used for context.
- "context": if the verdict is "justified", provide a detailed explanation of why the claim is true; if not, provide the main contextual information from the webpage(s) related to the claim.
    """.strip()
    
    system_message = """
You are a vigilant fact-checking assistant specializing in news content analysis. Your task is to evaluate a claim extracted from an image and verify its justification using additional contextual evidence from a related web page.

Input Description:
- OCR Text: A raw, unformatted text string extracted via OCR from a news image. This text contains a claim.
- HTML Content: A raw HTML-parsed page corresponding to the news story where the image was used.
- News generated at date and time
Task Objectives:
- Extract the Claim: Identify the main claim in the OCR text.
- Analyze Context: Review the HTML content for supporting or contradictory evidence.
- Cross-Reference Facts: Assess if the claim is factually accurate.
- Strictly rely on information prrovided.
- Evaluate Justification: Determine if the claim is fully justified, partially justified, or not justified based on available evidence.
- Output Explanation: 
    - If the verdict is "justified", include in "context" a detailed explanation of why the claim is true.
    - If the verdict is "not justified" (or "unknown"), include in "context" the main contextual information from each relevant webpage that may relate to the claim, as derived from an image context analysis following a reverse image search.
    
Output Structure:
Output only valid JSON (with no extra text or commentary) with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the claim extracted from the OCR text.
- "webpage": the URL of the webpage used for context.
- "context": the explanation or contextual information as described above.
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
def final_boss(image_context, text_reasons, extracted_text, api_key: str = None):
    """
    Aggregates the image and text-based analyses, and prompts the assistant to perform a final,
    integrated fact-checking analysis.
    
    Parameters:
    - image_context: Detailed analysis context from sources which used the image.
    - text based analysis result: this is the text based result you can blindly trust it.
    - extracted_text: The OCR-extracted claim from the image.
    - api_key: API key for the Groq client (uses default if not provided).
    
    Returns:
    - The final analysis as processed by process_query.
    """
    now = datetime.now()
    # print("Now:", now)

    # Current date only
    today = date.today()
    # print("Today:", today)
    combined_prompt = f"""
Claim Extracted from the Image:
{extracted_text}

Aggregated Evidence from Searches:
Image-Based Analysis Result(you can trust the verdict, it was obtained by rigrously search and verification):
{image_context}

Text-Based Analysis Reasons:
{text_reasons}

Today's date and time: {now} 

Using the above evidence, evaluate whether the claim is justified from both the image and text perspectives.
If either the image-based analysis or the text-based analysis indicates that the claim is justified, output the final verdict as "justified" (OR condition). Otherwise, output "not justified" or "unknown" as appropriate.
In your explanation (under the key "reason"), please specify which part of the analysis (image-based or text-based) provided strong evidence for the claim, and indicate which part acted as a fallback.
Provide your analysis in valid JSON format with the following keys:
- "verdict": "justified", "not justified", or "unknown"
- "claim": the extracted claim from the OCR text
- "reason": a detailed explanation supporting your conclusion, including which analysis served as fallback if applicable.
    """.strip()
    
    system_message = """
You are an expert, multifaceted fact-checking assistant specializing in news analysis. 
Your task is to integrate evidence from both image-based and text-based analyses to determine the overall validity of a claim extracted from an image.

Input Details:
- Extracted claim from the image.
- Detailed analysis results from image-based searches (image context).
- Detailed analysis results from text-based searches.
- Today's date and time

Your task is to:
- Cross-reference and analyze the provided evidence objectively.
- Apply an OR logic: if either the image-based analysis or the text-based analysis indicates the claim is justified, then the final verdict should be "justified". Otherwise, decide between "not justified" or "unknown".
- In the "reason" field, provide a detailed explanation that includes which part (image-based or text-based) served as the primary evidence for justifying the claim and which part acted as a fallback.
  
Output Structure:
Output only valid JSON (with no extra text or commentary) with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the extracted claim from the image.
- "reason": the explanation including details about the evidence and fallback analysis.
    """.strip()
    
    if not api_key:
        api_key = "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"
    
    return process_query(system_message, combined_prompt, api_key=api_key)


def final_boss(image_context, text_reasons, extracted_text, api_key: str = None):
    """
    Aggregates the image and text-based analyses, and prompts the assistant to perform a final,
    integrated fact-checking analysis.
    
    Parameters:
    - image_context: Detailed analysis context from sources which used the image.
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
Image-Based Analysis Context:
{image_context}

Text-Based Analysis:
{text_reasons}

Using the above evidence, evaluate whether the claim is justified from both the image and text perspectives.
If either the image-based analysis or the text-based analysis indicates that the claim is justified, output the final verdict as "justified" (OR condition). Otherwise, output "not justified" or "unknown" as appropriate.
In your explanation (under the key "reason"), please specify which part of the analysis (image-based or text-based) provided strong evidence for the claim, and indicate which part acted as a fallback.
Provide your analysis in valid JSON format with the following keys:
- "verdict": "justified", "not justified", or "unknown"
- "claim": the extracted claim from the OCR text
- "reason": a detailed explanation supporting your conclusion, including which analysis served as fallback if applicable.
    """.strip()
    
    system_message = """
You are an expert, multifaceted fact-checking assistant specializing in news analysis. 
Your task is to integrate evidence from both image-based and text-based analyses to determine the overall validity of a claim extracted from an image.

Input Details:
- Extracted claim from the image.
- Detailed analysis results from image-based searches (image context).
- Detailed analysis result from text-based searches which contains reason to believe or not to.

Your task is to:
- Cross-reference and analyze the provided evidence objectively.
- Apply an OR logic: if either the image-based analysis or the text-based analysis indicates the claim is justified, then the final verdict should be "justified". Otherwise, decide between "not justified" or "unknown".
- In the "reason" field, provide a detailed explanation that includes which part (image-based or text-based) served as the primary evidence for justifying the claim and which part acted as a fallback.
  
Output Structure:
Output only valid JSON (with no extra text or commentary) with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the extracted claim from the image.
- "reason": the explanation including details about the evidence and fallback analysis.
    """.strip()
    
    if not api_key:
        api_key = "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"
    
    return process_query(system_message, combined_prompt, api_key=api_key)




def convert_numpy(obj):
    """Convert numpy data types to native Python types for JSON serialization."""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    return obj  # Return as-is if it's not a NumPy type

def extract_verification_result(data, as_list=False):
    verification = data.get("verification", {})
    
    result = {
        "Is Verified": verification.get("is_verified", "Unknown"),
        "Confidence": verification.get("confidence", "Unknown"),
        "Reasoning": verification.get("reasoning", "No reasoning provided."),
        "Relevant Quotes": verification.get("relevant_quotes", "No quotes provided."),
        "Label": verification.get("label", "No label provided."),
        "Context": verification.get("context", "No context provided."),
        "Source Link": verification.get("source_link", "No source link provided.")
    }
    
    if as_list:
        return list(result.values())  # Return as a list
    else:
        return "\n".join([f"{key}: {value}" for key, value in result.items()])  # Return as a formatted string


import json
import numpy as np

def predict(image_path):
    result_data = {}
    
    # 1. Initialization
    image_context = []  # List to store detailed reasons from image-based analysis
    text_reasons = []   # List to store detailed reasons from text-based analysis
    
    # Extract OCR text from the original image.
    extracted_text = extract_text(image_path)
    #extracted_text = "RCB defeats CSK after 17 years at Chepauk."
    result_data["Extracted OCR Text"] = extracted_text
    if extracted_text:
        agent = VerificationAgent(api_key=API_KEY, cse_id=CSE_ID, gse_api_key=GSE_API_KEY)
        text_result = agent.process_query(extracted_text)
        text_reasons=extract_verification_result(text_result, as_list=True)
        print(text_result)
        print(text_reasons)
    # Crop the image for further processing.
    cropped_paths = crop_image(image_path)
    result_data["Cropped image paths"] = cropped_paths
    
    # 2. Process image-based analysis
    if cropped_paths:
        first_cropped = cropped_paths[0]
        
        # Detect web URLs using the cropped image.
        detected_urls = detect_web(first_cropped)[:]
        # result_data["Detected URLs from cropped image"] = detected_urls
        # print(result_data)
        # Compute similarity scores for each URL.
        # Each candidate is a tuple of (url, similarity_score)
        # candidates = [
        #     url, float(sim) if isinstance(sim, np.float32) else sim)
        #     for url, sim in [process_url_and_compare(first_cropped, url) for url in detected_urls]
        # ]
        # result_data["Similarity scores"] = candidates
        
        # Iterate over each candidate.
        api_key = "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"  # or use environment variable
        for candidate in detected_urls:
            # url_candidate, sim_score = candidate
            # if url_candidate and sim_score is not None and sim_score >= 0.70:
            raw_response = process_claim(image_path, candidate, api_key=api_key)
                
                # Extract JSON from the raw response
            try:
                response_json = extract_json(raw_response)
            except Exception as e:
                image_context.append({
                    "url": candidate,
                    "error": f"Error extracting JSON: {str(e)}"
                })
                continue
                
            verdict = response_json.get("verdict", "").lower()
            context_detail = response_json.get("context", "No detailed reason provided")
                
            image_context.append({
                "url": candidate,
                "verdict": verdict,
                "context": context_detail
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
    # Current date and time


    
        
  
    result_data["Image context"] = image_context
    result_data["Text Reason"] = text_reasons
    print("Image context:", image_context)
    print("Text Reasons:", text_reasons)
    # 4. Call final_boss to perform the multifaceted analysis based on both reason lists.
    final_analysis = final_boss(image_context, text_reasons, extracted_text)
    final_analysis= extract_json(final_analysis)
    result_data["Final Analysis"] = final_analysis
    print("Final Analysis:", final_analysis)
    return json.dumps(result_data, indent=4)
#result_data = predict(r"rcb_rvcj.jpg")
# result_data=predict(r"test 3.jpg")
# print(detect_web(r"imageOutput\article_0.jpg"))
