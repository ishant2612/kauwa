from verification.search_system import VerificationSearchSystem
from config import API_KEY, CSE_ID

def run_verification_system():
    system = VerificationSearchSystem(
        api_key=API_KEY,
        cse_id=CSE_ID
    )
    while True:
        query = input("Enter your query (or 'exit' to quit): ")
        if query.lower() == "exit":
            break
        results = system.process_query(query)
        
        print("\nSearch Results with Verification:")
        print(f"Verdict: {results['verification']['verdict']}")
        print(f"Confidence: {results['verification']['confidence']:.2f}")
        
        for idx, source in enumerate(results['verification']['top_sources'], 1):
            print(f"\nSource {idx}:")
            print(f"Title: {source['source']['title']}")
            print(f"Score: {source['semantic_similarity']:.2f}")
            print(f"URL: {source['source']['url']}")

if __name__ == "__main__":
    run_verification_system()