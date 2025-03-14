document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");
    const printersList = document.getElementById("printersList");

    // Upload File
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!fileInput.files.length) {
            alert("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            uploadStatus.textContent = "Uploading...";
            uploadStatus.classList.remove("success", "error");
            uploadStatus.style.opacity = 1;

            const res = await fetch("/upload", { method: "POST", body: formData });
            const data = await res.json();

            uploadStatus.textContent = data.message || "Upload failed.";
            uploadStatus.classList.add(data.message ? "success" : "error");

            setTimeout(() => {
                uploadStatus.style.opacity = 0;
            }, 3000);
        } catch (error) {
            uploadStatus.textContent = "Upload failed.";
            uploadStatus.classList.add("error");
        }
    });

    // Fetch Available Printers
    async function loadPrinters() {
        const res = await fetch("/printers");
        const data = await res.json();
        printersList.innerHTML = "";

        if (data.printers.length === 0) {
            printersList.innerHTML = "<li>No printers found.</li>";
        } else {
            data.printers.forEach((printer) => {
                const li = document.createElement("li");
                li.textContent = printer;
                printersList.appendChild(li);
            });
        }
    }

    loadPrinters();
});
