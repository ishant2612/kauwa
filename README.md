![WhatsApp Image 2025-01-03 at 12 21 27 AM](https://github.com/user-attachments/assets/e1320a1e-9dc8-44f7-b07a-9985cee5c2df)

# Kauwa: Fact-Checking System

## Overview

This system verifies the validity of claims passed from the frontend by analyzing related articles and matching them against the claim on various parameters. The results are displayed on the frontend, and verified claims are stored in a Neo4j knowledge graph for future reference.

Additionally, the system now includes:

- **Deepfake Detector**: Identifies manipulated or synthetic videos.
- **Image Context Analyzer**: Analyzes the context of images to detect inconsistencies or misleading content.

**Note:** The Image Context Analyzer requires a secret key to function, and this key is not sharable.

---

## Working

1. **Claim Input**: The claim text is received from the frontend.
2. **Query Handling**: The claim is sent to a Flask backend server.
3. **Article Retrieval**:
   - The backend searches for top articles related to the claim.
   - These articles are retrieved and processed via web scraping using Beautiful Soup.
4. **Claim Verification**:
   - The claim and the content of the source articles are matched based on parameters such as semantic similarity and other metrics.
5. **Result Generation**:
   - The verification results are sent back to the frontend for display.
6. **Knowledge Graph Update**:
   - If the claim is found to be true, it is stored in a Neo4j-based knowledge graph for future fact-checking references.

---

## Technologies Used

- **Frontend**: Interface to input claims and display results.
- **Backend**: Flask for server-side logic.
- **Web Scraping**: Beautiful Soup for extracting article content.
- **Claim Matching**: Semantic similarity and other parameter checks.
- **Deepfake Detection**: AI-based model for detecting synthetic/manipulated videos.
- **Image Context Analysis**: AI-based tool for analyzing image authenticity.
- **Database**: Neo4j (cloud-based) for maintaining a knowledge graph.

---

## Setup and Installation

### Pre-requisites

- Neo4j (optional, if knowledge graph is not needed, skip Step 5 below).

### Steps to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/ishant2612/kauwa.git
   ```
2. Navigate to the project directory:
   ```bash
   cd kauwa
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
5. Configure and start the Neo4j database (optional):
   - Download Neo4j from [[https://neo4j.com/download/](https://neo4j.com/download/)](https://neo4j.com/download/) and install it.
   - Add your `URI`, `USERNAME`, and `PASSWORD` from the Neo4j database to `config.py`.
6. Run the `index.html` file on a live server.

---

## Contributors

- Gagan Sharma
- Varun Gupta
- Ronit Ranjan Tripathy
- Ishant Verma

---

## License

This project is licensed under the [MIT License](LICENSE).

```

```
