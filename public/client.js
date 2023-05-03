const form = document.querySelector("form");
const progressDiv = document.getElementById("progress");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  progressDiv.innerHTML = "Processing...";

  const formData = new FormData(form);
  const url = formData.get("url");

  fetch("/download", {
    method: "POST",
    body: JSON.stringify({ url }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video.mp4";
      a.click();

      progressDiv.innerHTML = "";
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
      progressDiv.innerHTML = "Error: " + error.message;
    });
});
