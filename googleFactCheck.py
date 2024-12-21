import requests

def check_fact(query, api_key):
    """
    Uses the Google Fact Check API to check the veracity of a user-provided query.

    :param query: The fact or claim to check.
    :param api_key: Your Google Fact Check API key.
    :return: Results from the Fact Check API.
    """
    base_url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    params = {
        "query": query,
        "key": api_key
    }
    
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
        data = response.json()
        
        if "claims" in data and data["claims"]:
            print(f"\nFact-check results for: '{query}'\n")
            for idx, claim in enumerate(data["claims"], start=1):
                text = claim.get("text", "N/A")
                claimant = claim.get("claimant", "N/A")
                claim_date = claim.get("claimDate", "N/A")
                rating = claim.get("claimReview", [{}])[0].get("textualRating", "N/A")
                publisher = claim.get("claimReview", [{}])[0].get("publisher", {}).get("name", "N/A")
                url = claim.get("claimReview", [{}])[0].get("url", "N/A")

                print(f"Result {idx}:")
                print(f"  Claimant: {claimant}")
                print(f"  Claim Date: {claim_date}")
                print(f"  Claim: {text}")
                print(f"  Rating: {rating}")
                print(f"  Publisher: {publisher}")
                print(f"  URL: {url}\n")
        else:
            print("No relevant fact-checking information found for your query.")

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    api_key = "AIzaSyC8Ue6Lat1UowH1LJu6Gq8VQxNCbXUqH2I"  # Replace with your Google Fact Check API key
    user_query = input("Enter a query to fact-check: ")
    check_fact(user_query, api_key)
