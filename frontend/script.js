document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('fact-check-form');
  const input = document.getElementById('fact-input');
  const result = document.getElementById('result');
  const resultText = document.getElementById('result-text');
  const previousOutputs = document.getElementById('previous-outputs');
  const loader = document.createElement('div'); // Create loader element

  // Style the loader
  loader.id = "loader";
  loader.style.display = "none";
  loader.style.border = "4px solid #f3f3f3";
  loader.style.borderTop = "4px solid #3498db";
  loader.style.borderRadius = "50%";
  loader.style.width = "30px";
  loader.style.height = "30px";
  loader.style.animation = "spin 1s linear infinite";
  loader.style.margin = "10px auto";

  document.querySelector('.card').appendChild(loader); // Add loader to the fact-checker card

  // Initialize chart
  const chartData = [
      { name: 'True', value: 400 },
      { name: 'Mostly True', value: 300 },
      { name: 'Half True', value: 200 },
      { name: 'Mostly False', value: 150 },
      { name: 'False', value: 100 },
  ];

  const ctx = document.getElementById('stats-chart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: chartData.map(item => item.name),
          datasets: [{
              label: 'Number of Claims',
              data: chartData.map(item => item.value),
              backgroundColor: '#3b82f6',
          }]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });

  // Populate latest news
  const latestNews = [
      { id: 1, title: "New study reveals impact of social media on fact-checking", date: "2023-06-01" },
      { id: 2, title: "Fact-checkers debunk viral claim about climate change", date: "2023-05-28" },
      { id: 3, title: "AI-powered fact-checking tools show promising results", date: "2023-05-25" },
  ];

  const latestNewsList = document.getElementById('latest-news');
  latestNews.forEach(news => {
      const li = document.createElement('li');
      li.innerHTML = `
          <h3>${news.title}</h3>
          <p>${news.date}</p>
      `;
      latestNewsList.appendChild(li);
  });

  // Handle form submission for fact-checking
  form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const factToCheck = input.value.trim();

      if (!factToCheck) {
          resultText.textContent = "Please enter a statement to fact-check.";
          result.classList.remove('hidden');
          return;
      }

      // Clear previous result and show loader
      resultText.textContent = "";
      result.classList.add('hidden');
      loader.style.display = "block";

      try {
          // Simulate backend API call
          const response = await fetch("http://localhost:5001/verify", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ query: factToCheck }),
          });

          const data = await response.json();

          // Hide loader and display result
          loader.style.display = "none";
          resultText.textContent = `Fact check result: ${data.result}`;
          result.classList.remove('hidden');

          // Add query and result to previous outputs
          const li = document.createElement('li');
          li.textContent = `${factToCheck} → ${data.result}`;
          previousOutputs.insertBefore(li, previousOutputs.firstChild);

          // Keep only the last 5 outputs
          if (previousOutputs.children.length > 5) {
              previousOutputs.removeChild(previousOutputs.lastChild);
          }

      } catch (error) {
          // Hide loader and display error
          loader.style.display = "none";
          resultText.textContent = "Failed to fetch the result. Please try again later.";
          result.classList.remove('hidden');
          console.error(error);
      }

      // Clear input
      input.value = '';
  });
});
