import consumer from "./consumer";

declare global {
  var bookId: number;
}

consumer.subscriptions.create(
  { channel: "AiProgressChannel", id: window.bookId },
  {
    received(data: { page: number; total_pages: number }) {
      const { page, total_pages } = data;
      const progress = Math.round((page / total_pages) * 100);
      const progressBar = document.getElementById("progress-bar");
      const progressLabel = document.getElementById("progress-label");

      if (progressBar && progressLabel) {
        progressBar.style.width = `${progress}%`;
        progressLabel.innerText = `${progress}%`;
      }
    },
  }
);
