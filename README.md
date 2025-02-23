![WhatsApp Image 2025-01-03 at 12 21 27 AM](https://github.com/user-attachments/assets/e1320a1e-9dc8-44f7-b07a-9985cee5c2df)
# Kauwa: Fact-Checking System

## Overview
This system verifies the validity of claims passed from the frontend by analyzing related articles and matching them against the claim on various parameters. The results are displayed on the frontend, and verified claims are stored in a Neo4j knowledge graph for future reference.

Additionally, the system now includes:
- **Deepfake Detector**: Identifies manipulated or synthetic videos.
- **Image Context Analyzer**: Analyzes the context of images to detect inconsistencies or misleading content.

---

## Working
1. **Claim Input**: The claim text, image, or video is received from the frontend.
2. **Query Handling**: The claim is sent to a Flask backend server.
3. **Article & Media Retrieval**:
    - The backend searches for top articles related to the claim.
    - Articles are retrieved and processed via web scraping using Beautiful Soup.
    - If an image or video is provided, it undergoes analysis using the respective detectors.
4. **Claim & Media Verification**:
    - The claim and the content of the source articles are matched based on parameters such as semantic similarity and other metrics.
    - Videos are analyzed for deepfake detection.
    - Images are examined for context inconsistencies.
5. **Result Generation**:
    - The verification results are sent back to the frontend for display.
6. **Knowledge Graph Update**:
    - If the claim is found to be true, it is stored in a Neo4j-based knowledge graph for future fact-checking references.

---

## Technologies Used
- **Frontend**: Next.js for UI and claim input/display.
- **Backend**: Flask for server-side logic.
- **Web Scraping**: Beautiful Soup for extracting article content.
- **Claim Matching**: Semantic similarity and other parameter checks.
- **Deepfake Detection**: AI-based model for detecting synthetic/manipulated videos.
- **Image Context Analysis**: AI-based tool for analyzing image authenticity.
- **Database**: Neo4j (cloud-based) for maintaining a knowledge graph.

---

## Setup and Installation
### Pre-requisites
- No setup is required for Neo4j, as it is now deployed on the cloud.

### Steps to Run
```sh
# Clone the repository
git clone https://github.com/ishant2612/kauwa.git

# Navigate to the project directory
cd kauwa

# Install backend dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py

# Navigate to the frontend directory
cd kauwa-front

# Install frontend dependencies
npm install

# Start the frontend application
npm run dev
```

---

## Contributors
- Gagan Sharma
- Varun Gupta
- Ronit Ranjan Tripathy
- Ishant Verma

---

## License
This project is licensed under the [MIT License](LICENSE).

