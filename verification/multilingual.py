import os
import re
from groq import Groq  # Assuming Groq is a valid API client library

class Translator:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("The GROQ_API_KEY must be provided either via the api_key parameter or environment variable.")
        self.model = "llama-3.3-70b-versatile"

    def groq_chat_completion(self, messages: list) -> str:
        """
        Uses the Groq client to get a chat completion from the model.
        Streams the result and returns the complete response as a string.
        """
        client = Groq(api_key=self.api_key)
        completion = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.6,
            top_p=0.95,
            stream=True,
        )
        
        response = ""
        for chunk in completion:
            response += (chunk.choices[0].delta.content or "")
        return response

    def translate(self, query: str) -> dict:
        """
        Translate the input query to English and detect the original language.
        """
        delimiter = "|||"
        prompt = f"""Translate the given text to English and detect its original language.
        
        Text: {query}
        
        Instructions:
        1. Detect the language of the input text.
        2. Translate it into English.
        3. Provide the output in this exact format:
        TRANSLATION: [translated text] {delimiter}  
        LANGUAGE: [original language] {delimiter}  
        """
        
        messages = [
            {"role": "system", "content": "You are an expert translator."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = self.groq_chat_completion(messages)
            return self._parse_response(response_text, delimiter)
        except Exception as e:
            return {
                "translation": None,
                "language": None,
                "error": f"Error during translation: {str(e)}"
            }

    def _parse_response(self, response: str, delimiter: str = "|||") -> dict:
        """
        Parses the structured response using regex to capture each field.
        """
        try:
            translation_match = re.search(r"TRANSLATION:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            language_match = re.search(r"LANGUAGE:\s*(.*?)\s*(\|\|\||$)", response, re.DOTALL)
            
            translation = translation_match.group(1).strip() if translation_match else None
            language = language_match.group(1).strip() if language_match else None
            
            return {"translation": translation, "language": language}
        except Exception as e:
            return {"translation": None, "language": None, "error": f"Failed to parse response: {str(e)}"}

# Example usage:
