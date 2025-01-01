document.getElementById("verify-btn").addEventListener("click", async () => {
    const queryInput = document.getElementById("query-input");
    const resultContainer = document.getElementById("result-container");
    const resultList = document.getElementById("result-list");
    const loader = document.getElementById("loader");

    if (!queryInput.value.trim()) {
      resultContainer.textContent = "Please enter a query.";
      return;
    }

    const query = queryInput.value;

    // Show loader
    loader.style.display = "block";

    try {
      const response = await fetch("http://localhost:5001/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      // Hide loader
      loader.style.display = "none";

      if (data.error) {
        resultContainer.textContent = `Error: ${data.error}`;
      } else {
        resultContainer.textContent = `Verification Result: ${data.result}`;

        // Add to previous results list
        const resultItem = document.createElement("li");
        resultItem.textContent = `${query} → ${data.result}`;
        resultList.prepend(resultItem); // Adds the new result at the top
      }
    } catch (error) {
      // Hide loader on error
      loader.style.display = "none";
      resultContainer.textContent = "Failed to communicate with the backend.";
      console.error(error);
    }
  });
