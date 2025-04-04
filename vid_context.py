import google.generativeai as genai

# Configure the API key
genai.configure(api_key="AIzaSyA3DyDSN3TucUfxmOfRPJAOT_WGRD_daZs")  # Replace with your actual API key

def call_gemini_model(url,claim):
    """
    Calls the Gemini 2.0 Flash model for analysis with a system prompt.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')  # Specify Gemini 2.0 Flash

        system_prompt = """
You are a vigilant fact-checking assistant specializing in news content analysis. Your task is to evaluate a claim and verify its justification using additional contextual evidence from a related video used which was used to justify claim.

Input Description:
- Claim: A raw, unformatted text string extracted from a social media post. This text contains a claim.
- Youtube Url: Obbtained using reverse image search in earlier stages of claim verification.

Task Objectives:
- Extract the Claim: Identify the main claim , the input claim might be in giberish format as it was extracted from raw ocr, remove the giberish text and correct if any spelling mistakes made and maintain uniformity in the claim.
- Analyze Context: Review the Youtube Video content for supporting or contradictory evidence.
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
- "webpage": the URL of the Youtube video used for context.
- "context": the explanation or contextual information as described above.
        """

        prompt = f"""
Claim raw Text:
{claim}

Youtube Video link to validate from:
{url}

Please output your fact-checking analysis in valid JSON format with the following keys:
- "verdict": a string that is either "justified", "not justified", or "unknown".
- "claim": the claim extracted from the raw text.
- "webpage": the URL of the Youtube link used for context.
- "context": if the verdict is "justified", provide a detailed explanation of why the claim is true; if not, provide the main contextual information from the webpage(s) related to the claim.
    
        """.strip()


        # Use the `contents` parameter to include both system and user prompts
        response = model.generate_content([system_prompt, prompt])

        print("Gemini 2.0 Flash Response:")
        
        return response.text

    except Exception as e:
        print(f"Error calling Gemini 2.0 Flash: {e}")
        return None

def check_youtube_url(url,claim):
    """
    Check if the provided URL is a YouTube link.
    If it is, call the Gemini model for processing.
    """
    if "youtube.com" in url or "youtu.be" in url:
        print(f"Processing YouTube URL: {url}")
        return call_gemini_model(url,claim)
    else:
        return "Not a YouTube URL."

