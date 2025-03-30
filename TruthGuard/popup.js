document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const verifyTextBtn = document.getElementById('verifyTextBtn');
    const verifyImageBtn = document.getElementById('verifyImageBtn');
    const resultContainer = document.getElementById('verificationResult');
    const confidenceLevelContainer = document.getElementById('confidenceLevel');
  
    // API Configuration
    const GSE_API_KEY = "your api";
    const CSE_ID = "your api";
    const NUM_RESULTS = 10;
  
    async function performTextVerification(text) {
        try {
            resultContainer.innerHTML = 'Analyzing...';
            confidenceLevelContainer.innerHTML = '';
  
            // Google Search API Request
            const searchResponse = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GSE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(text)}&num=${NUM_RESULTS}`);
            const searchData = await searchResponse.json();
  
            if (searchData.items && searchData.items.length > 0) {
                const resultLinks = searchData.items.map(item => `<li><a href="${item.link}" target="_blank">${item.title}</a></li>`).join('');
                resultContainer.innerHTML = `<ul>${resultLinks}</ul>`;
                confidenceLevelContainer.innerHTML = `Results found: ${searchData.items.length}`;
            } else {
                resultContainer.innerHTML = 'No credible sources found.';
                confidenceLevelContainer.innerHTML = '';
            }
        } catch (error) {
            resultContainer.innerHTML = `Error: ${error.message}`;
            confidenceLevelContainer.innerHTML = '';
        }
    }
  
    async function performImageVerification(imageUrl) {
      try {
          // Reset previous results
          resultContainer.innerHTML = 'Analyzing image...';
          confidenceLevelContainer.innerHTML = '';
  
          // Fetch image and extract text
          const formData = new FormData();
          formData.append('url', imageUrl);
  
          const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
              method: 'POST',
              headers: {
                  'apikey': 'ocr api'  // Replace with actual OCR API key
              },
              body: formData
          });
  
          const ocrData = await ocrResponse.json();
          
          // Check if ParsedResults exists and contains data
          if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
              const extractedText = ocrData.ParsedResults[0].ParsedText;
              if (extractedText) {
                  await performTextVerification(extractedText);
              } else {
                  resultContainer.innerHTML = 'No text could be extracted from the image.';
              }
          } else {
              resultContainer.innerHTML = 'OCR failed to extract text. Please check the image URL or try again.';
          }
      } catch (error) {
          resultContainer.innerHTML = `Image Verification Error: ${error.message}`;
          confidenceLevelContainer.innerHTML = '';
      }
  }
  
  
    // Event Listeners
    verifyTextBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            performTextVerification(text);
        } else {
            resultContainer.innerHTML = 'Please enter text to verify.';
        }
    });
  
    verifyImageBtn.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (imageUrl) {
            performImageVerification(imageUrl);
        } else {
            resultContainer.innerHTML = 'Please enter an image URL to verify.';
        }
    });
  });
  
