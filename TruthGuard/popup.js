document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const verifyTextBtn = document.getElementById('verifyTextBtn');
    const verifyImageBtn = document.getElementById('verifyImageBtn');
    const resultContainer = document.getElementById('verificationResult');
    const confidenceLevelContainer = document.getElementById('confidenceLevel');
    const textTab = document.getElementById('textTab');
    const imageTab = document.getElementById('imageTab');
    const textContent = document.getElementById('textContent');
    const imageContent = document.getElementById('imageContent');
  
    // Tab functionality
    textTab.addEventListener('click', () => {
      textTab.classList.add('active');
      imageTab.classList.remove('active');
      textContent.classList.add('active');
      imageContent.classList.remove('active');
    });
  
    imageTab.addEventListener('click', () => {
      imageTab.classList.add('active');
      textTab.classList.remove('active');
      imageContent.classList.add('active');
      textContent.classList.remove('active');
    });
  
    // API Configuration
    const GSE_API_KEY = "AIzaSyC8Ue6Lat1UowH1LJu6Gq8VQxNCbXUqH2I";
    const CSE_ID = "a1241cce56f6f4abb";
    const NUM_RESULTS = 10;
  
    async function performTextVerification(text) {
        try {
            // Show loading animation
            resultContainer.innerHTML = `
              <div class="flex items-center justify-center py-4">
                <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="ml-3 text-gray-600">Analyzing content...</span>
              </div>`;
            confidenceLevelContainer.innerHTML = '';
  
            // Google Search API Request
            const searchResponse = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GSE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(text)}&num=${NUM_RESULTS}`);
            const searchData = await searchResponse.json();
  
            if (searchData.items && searchData.items.length > 0) {
                // Calculate a simple "trustworthiness score" based on number of results
                const score = Math.min(searchData.items.length / NUM_RESULTS * 100, 100);
                let confidenceClass, confidenceText;
                
                if (score >= 70) {
                    confidenceClass = 'bg-green-100 text-green-800';
                    confidenceText = 'High Confidence';
                } else if (score >= 40) {
                    confidenceClass = 'bg-yellow-100 text-yellow-800';
                    confidenceText = 'Medium Confidence';
                } else {
                    confidenceClass = 'bg-red-100 text-red-800';
                    confidenceText = 'Low Confidence';
                }
                
                // Format the results with better styling
                const resultLinks = searchData.items.map(item => {
                    const domain = new URL(item.link).hostname;
                    return `
                      <div class="result-item bg-gray-50 rounded">
                        <a href="${item.link}" target="_blank" class="block hover:underline">
                          <h4 class="font-medium text-blue-700">${item.title}</h4>
                          <p class="text-xs text-gray-500">${domain}</p>
                          <p class="text-xs text-gray-600 truncate">${item.snippet || ''}</p>
                        </a>
                      </div>`;
                }).join('');
                
                resultContainer.innerHTML = `
                  <div class="mb-3 pb-3 border-b border-gray-100">
                    <p class="text-gray-700">Found <span class="font-semibold">${searchData.items.length}</span> sources related to this content:</p>
                  </div>
                  <div class="max-h-64 overflow-y-auto pr-2">${resultLinks}</div>`;
                
                confidenceLevelContainer.innerHTML = `
                  <div class="flex justify-between items-center">
                    <span class="confidence-badge ${confidenceClass}">${confidenceText}</span>
                    <span class="text-sm text-gray-500">Based on ${searchData.items.length} relevant sources</span>
                  </div>`;
            } else {
                resultContainer.innerHTML = `
                  <div class="flex items-center p-4 bg-yellow-50 rounded-lg">
                    <svg class="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>No credible sources found. This content may be unreliable or new.</span>
                  </div>`;
                confidenceLevelContainer.innerHTML = `
                  <div class="confidence-badge bg-red-100 text-red-800">
                    Unable to Verify
                  </div>`;
            }
        } catch (error) {
            resultContainer.innerHTML = `
              <div class="flex items-center p-4 bg-red-50 rounded-lg">
                <svg class="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error: ${error.message}</span>
              </div>`;
            confidenceLevelContainer.innerHTML = '';
        }
    }
  
    async function performImageVerification(imageUrl) {
        try {
            // Reset previous results
            resultContainer.innerHTML = `
              <div class="flex items-center justify-center py-4">
                <svg class="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="ml-3 text-gray-600">Analyzing image...</span>
              </div>
              
              <div class="mt-3 flex justify-center">
                <img src="${imageUrl}" alt="Analyzing" class="h-24 object-contain opacity-50 rounded border border-gray-200" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22232%22%20height%3D%22131%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20232%20131%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17e704e3109%20text%20%7B%20fill%3A%23989898%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A12pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17e704e3109%22%3E%3Crect%20width%3D%22232%22%20height%3D%22131%22%20fill%3D%22%23f0f0f0%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2285.8046875%22%20y%3D%2270.2%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';">
              </div>`;
            confidenceLevelContainer.innerHTML = '';
  
            // Fetch image and extract text
            const formData = new FormData();
            formData.append('url', imageUrl);
  
            const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                headers: {
                    'apikey': 'K87227845288957'  // Replace with actual OCR API key
                },
                body: formData
            });
  
            const ocrData = await ocrResponse.json();
            
            // Check if ParsedResults exists and contains data
            if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
                const extractedText = ocrData.ParsedResults[0].ParsedText;
                if (extractedText) {
                    resultContainer.innerHTML = `
                      <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 class="font-medium text-blue-700 mb-1">Text extracted from image:</h4>
                        <p class="text-sm text-gray-700 italic">"${extractedText}"</p>
                      </div>
                      <div class="border-t border-gray-100 pt-3">
                        <h4 class="font-medium text-blue-700 mb-2">Searching for sources...</h4>
                      </div>`;
                    
                    await performTextVerification(extractedText);
                } else {
                    resultContainer.innerHTML = `
                      <div class="flex items-center p-4 bg-yellow-50 rounded-lg">
                        <svg class="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>No text could be extracted from the image.</span>
                      </div>
                      
                      <div class="mt-3 flex justify-center">
                        <img src="${imageUrl}" alt="Analyzed Image" class="h-32 object-contain rounded border border-gray-200" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22232%22%20height%3D%22131%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20232%20131%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17e704e3109%20text%20%7B%20fill%3A%23989898%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A12pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17e704e3109%22%3E%3Crect%20width%3D%22232%22%20height%3D%22131%22%20fill%3D%22%23f0f0f0%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2285.8046875%22%20y%3D%2270.2%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';">
                      </div>`;
                }
            } else {
                resultContainer.innerHTML = `
                  <div class="flex items-center p-4 bg-red-50 rounded-lg">
                    <svg class="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>OCR failed to extract text. Please check the image URL or try again.</span>
                  </div>`;
            }
        } catch (error) {
            resultContainer.innerHTML = `
              <div class="flex items-center p-4 bg-red-50 rounded-lg">
                <svg class="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Image Verification Error: ${error.message}</span>
              </div>`;
            confidenceLevelContainer.innerHTML = '';
        }
    }
  
    // Event Listeners
    verifyTextBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            performTextVerification(text);
        } else {
            resultContainer.innerHTML = `
              <div class="flex items-center p-4 bg-blue-50 rounded-lg">
                <svg class="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Please enter text to verify.</span>
              </div>`;
        }
    });
  
    verifyImageBtn.addEventListener('click', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (imageUrl) {
            performImageVerification(imageUrl);
        } else {
            resultContainer.innerHTML = `
              <div class="flex items-center p-4 bg-blue-50 rounded-lg">
                <svg class="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Please enter an image URL to verify.</span>
              </div>`;
        }
    });
  });