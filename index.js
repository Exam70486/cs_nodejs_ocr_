// index.js
const _express = require("express");
const app = _express();
const cors = require("cors");
const port = 3000;
const VisionHubService = require("./services/VisionHubService");
const fs = require("fs");
const path = require("path");

app.use(_express.json({ limit: "10mb" })); // Adjust size as needed
app.use(cors());

//============================================================================
// OCR ENDPOINTS
//============================================================================

app.post("/uploadOCR", async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Extract the file extension and data from the base64 string
    const matches = base64Image.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(400).json({ error: "Invalid image format" });
    }
    
    const fileExtension = matches[1];
    const base64Data = matches[2];
    
    // Create a buffer from the base64 data
    const imageBuffer = Buffer.from(base64Data, "base64");
    
    // Create a unique filename based on timestamp
    const filename = `image_${Date.now()}.${fileExtension}`;
    
    // Specify the file path where the image will be saved
    const filePath = path.join("img/signatures/", "dest", filename);
    
    // Write the buffer to a file
    fs.writeFile(filePath, imageBuffer, (err) => {
      if (err) {
        console.error("Error saving image:", err);
        return res.status(500).json({ error: "Error saving image" });
      }
      
      console.log("Image saved successfully:", filePath);
      
      // Perform OCR using VisionHubService.doOcr
      VisionHubService.doOcr(filePath, res);
    });
    
  } catch (error) {
    console.error("Upload OCR error:", error);
    res.status(500).json({ error: "Failed to process OCR upload" });
  }
});

//============================================================================
// COMPUTER VISION (CV) ENDPOINTS
//============================================================================

app.post("/uploadCV", async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }
    
    // Call VisionHubService.doCv for shape detection
    await VisionHubService.doCv(base64Image, res);
    
  } catch (error) {
    console.error("Upload CV error:", error);
    res.status(500).json({ error: "Failed to process CV upload" });
  }
});

//============================================================================
// HEALTH CHECK
//============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    service: "VisionHub",
    endpoints: [
      "POST /uploadOCR - OCR only (text extraction)",
      "POST /uploadCV - Computer Vision only (shape detection)"
    ]
  });
});

//============================================================================
// DRIVER CODE
//============================================================================

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /uploadOCR - OCR only (extract text from images)`);
  console.log(`  POST /uploadCV - Computer Vision only (detect shapes)`);
  console.log(`  GET  /health - Service health check`);
});