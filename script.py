from googleapiclient.discovery import build
import requests
from bs4 import BeautifulSoup
import spacy

# === Configuration ===
API_KEY = "AIzaSyAKbqZeRUVx_MLYx8fHODXvtETKUBJbdFY"  # Replace with your Google API Key
CSE_ID = "71022aef7763d4a02"            # Replace with your Custom Search Engine ID
NUM_RESULTS = 5                  # Number of search results to fetch


# Load spaCy's pre-trained NER model
nlp = spacy.load("en_core_web_sm")

# === Google Custom Search ===
def google_search(query, api_key, cse_id, num_results=5):
    """Perform a Google Custom Search."""
    service = build("customsearch", "v1", developerKey=api_key)
    results = service.cse().list(q=query, cx=cse_id, num=num_results).execute()
    return results.get('items', [])

# === Web Scraping with Requests and BeautifulSoup ===
def fetch_content_from_url(url):
    """Scrape content from a URL using requests and BeautifulSoup."""
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for 4xx/5xx errors

        # Parse the content using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract the text from the body of the page
        content = soup.get_text()
        return content
    except requests.exceptions.RequestException as e:
        print(f"Error fetching content from {url}: {e}")
        return ""

# === Entity Extraction ===
def extract_entities(text):
    """Extract entities using spaCy."""
    doc = nlp(text)
    entities = [ent.text for ent in doc.ents]
    return entities

# === Main Script ===
if __name__ == "__main__":
    # Example input text for entity extraction
    text = """Pat Cummins marries Virat Kholi."""

    # Extract entities from the text
    entities = extract_entities(text)
    print(f"Extracted Entities: {entities}")

    # Combine extracted entities into a query
    entity_query = " ".join(entities)

    # Perform Google search based on extracted entities
    print(f"Performing Google Search for: '{entity_query}'")
    search_results = google_search(entity_query, API_KEY, CSE_ID, num_results=NUM_RESULTS)

    # Check if no results were found
    if not search_results:
        print("No results found")
    else:
        print("\nSearch Results:")
        for idx, item in enumerate(search_results):
            print(f"{idx + 1}. {item['title']}")
            print(f"URL: {item['link']}")
            print(f"Snippet: {item.get('snippet', 'No snippet available')}")
            print("-" * 80)

            # Scrape content from the result URL
            content = fetch_content_from_url(item['link'])
            print(f"Scraped Content (first 500 characters):\n{content[:500]}")  # Display first 500 characters
            print("=" * 80)