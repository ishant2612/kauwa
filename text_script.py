import google.generativeai as genai
import docx
import json
import re

from config import API_KEY, CSE_ID, GSE_API_KEY
from verification.enhanced_search_system import VerificationAgent
# Configure the API key
genai.configure(api_key="AIzaSyA3DyDSN3TucUfxmOfRPJAOT_WGRD_daZs")  # Replace with your actual API key


# Constants for chunking
CHUNK_SIZE = 800   # Process 800 words at a time
OVERLAP = 50       # Overlap 50 words for continuity

def extract_claims_with_gemini(text):
    """
    Calls Gemini API to extract claims, ensuring JSON format.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        system_prompt = """
        You are an AI assistant specializing in extracting factual claims from text. Your task is to:
        - Identify **factual claims** while **avoiding breaking news headlines**.
        - If a **speech or transcript is detected**, treat it **as a single claim** instead of breaking it up.
        - **Exclude** opinions, speculations, or direct speech.
        - Format your output as a **JSON object** with a key `"claims"` that contains a **list of extracted claims**.
        - Ensure the response **strictly follows JSON syntax** (double quotes `" "`, no trailing commas).
        - If no claims are found, return `{ "claims": [] }`.
        """

        prompt = f"Extract claims from the following text: {text}"

        response = model.generate_content([system_prompt, prompt])

        if response and response.text:
            print(response.text.strip())
            return response.text.strip()
        else:
            return '{ "claims": [] }'

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return '{ "claims": [] }'

def read_text_from_file(file_path):
    """
    Reads text content from a .txt or .docx file.
    """
    try:
        if file_path.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        elif file_path.lower().endswith('.docx'):
            doc = docx.Document(file_path)
            return '\n'.join(paragraph.text for paragraph in doc.paragraphs)
        else:
            print("Unsupported file type. Please provide a .txt or .docx file.")
            return None
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None
    except docx.opc.exceptions.PackageNotFoundError:
        print(f"Error opening Word document: {file_path}. Is it a valid .docx file?")
        return None
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return None

def split_text_into_chunks(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    """
    Splits the text into overlapping chunks of `chunk_size` words with `overlap` words repeating.
    """
    words = text.split()
    chunks = []
    
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap  # Move forward while keeping an overlap
    
    return chunks

def extract_claims(response_text):
    """
    Extracts claims from the JSON response using regex and JSON parsing.
    """
    try:
        # Extract JSON content using regex (handles malformed outputs)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        if json_match:
            json_text = json_match.group()
            parsed_json = json.loads(json_text)  # Convert string to Python dictionary
            
            if isinstance(parsed_json, dict) and "claims" in parsed_json:
                return parsed_json["claims"]  # Return the list of claims
            else:
                print("Unexpected response format. Returning raw response.")
                return [response_text]  # Return as a single-item list if not properly formatted

    except json.JSONDecodeError:
        print("Error parsing JSON. Returning raw response.")
        return [response_text]  # Return as-is if parsing fails
def extract_claims_from_string(json_string):
    """
    Extracts a list of claims from a JSON-formatted string.

    Args:
        json_string (str): A JSON string with a top-level 'claims' key.

    Returns:
        list: A list of claim strings, or an empty list if parsing fails.
    """
    try:
        data = json.loads(json_string)
        return data.get("claims", [])
    except json.JSONDecodeError as e:
        print("Error decoding JSON:", e)

        return []
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
# Main Execution
def execute(file_path):
    """
    Reads text from a file, processes it in chunks, and extracts claims in structured JSON format.
    """
    text_content = read_text_from_file(file_path)
    
    if text_content:
        text_chunks = split_text_into_chunks(text_content)
        all_claims = []

        for i, chunk in enumerate(text_chunks):
            print(f"\nProcessing chunk {i + 1}/{len(text_chunks)}...")
            claims_output = extract_claims_with_gemini(chunk)
            
            if claims_output and claims_output != '{ "claims": [] }':
                extracted_claims = extract_claims(claims_output)  # Convert Gemini output to list
                all_claims.extend(extracted_claims)  # Append correctly formatted claims
        
        # Output as a structured JSON format
        final_json = json.dumps({"claims": all_claims}, indent=4)
        print("\nFinal Extracted Claims (JSON Format):")
        print(final_json)  # Ensures output is structured
        
        return final_json  # This allows you to use it in further processing

# Example Usage
claims_json = execute(r"D:\PROJECTS\100days\vidwork\news_report.txt")
match = re.search(r'\{.*\}', claims_json, re.DOTALL)
if match:
    json_text = match.group()
    claims = extract_claims_from_string(json_text)
    print("Final list ---------------->",claims)
else:
    print("No valid JSON found.")

# print("\nExtracted Claims JSON Ready for Use:", claims_json)
for i in range(3):
    print("for claim: ",claims[i])
    agent = VerificationAgent(api_key=API_KEY, cse_id=CSE_ID, gse_api_key=GSE_API_KEY)
    text_result = agent.process_query(claims[i])
    text_reasons = extract_verification_result(text_result, as_list=True)
    print(text_result)
    print(text_reasons)
