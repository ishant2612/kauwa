chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "verifyText") {
      console.log("Received text for verification:", request.text);
      // Perform text verification logic here
      sendResponse({ result: "Text verified successfully!" });
  } else if (request.action === "verifyImage") {
      console.log("Received image URL for verification:", request.imageUrl);
      // Perform image verification logic here
      sendResponse({ result: "Image verified successfully!" });
  }
});
