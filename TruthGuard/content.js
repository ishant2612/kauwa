chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copyText") {
      const selectedText = window.getSelection().toString().trim();
      sendResponse({ text: selectedText });
  }

  if (request.action === "copyImageUrl") {
      const selectedImage = document.querySelector('img:hover');
      if (selectedImage) {
          sendResponse({ imageUrl: selectedImage.src });
      } else {
          sendResponse({ error: "No image selected" });
      }
  }

  return true;
});