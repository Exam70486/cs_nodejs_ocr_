// services/VisionHubService.js
const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");
const cv = require('opencv.js');  // Pure JavaScript, no compilation needed!

class VisionHubService {
  //============================================================================
  // OCR FUNCTIONS
  //============================================================================

  /**
   * Performs OCR on an image file and returns the recognized text
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} - The recognized text from the image
   */
  static async recognizeText(imagePath) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imagePath, "eng");
      return text;
    } catch (error) {
      throw new Error(`OCR recognition failed: ${error.message}`);
    }
  }

  /**
   * Performs OCR and sends response to client
   * @param {string} imagePath - Path to the image file
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async doOcr(imagePath, res) {
    try {
      const text = await this.recognizeText(imagePath);
      const message = "Text from image: " + text;
      console.debug(message);
      res.status(200).json({ message: message });
    } catch (error) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  }

  /**
   * Saves a base64 image to disk
   * @param {string} base64Image - Base64 encoded image data
   * @returns {Promise<Object>} - Object containing filePath and fileExtension
   */
  static async saveBase64Image(base64Image) {
    return new Promise((resolve, reject) => {
      // Extract the file extension and data from the base64 string
      const matches = base64Image.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches) {
        reject(new Error("Invalid base64 image format"));
        return;
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
          reject(err);
        } else {
          console.log("Image saved successfully:", filePath);
          resolve({ filePath, fileExtension });
        }
      });
    });
  }

  //============================================================================
  // COMPUTER VISION (CV) FUNCTIONS
  //============================================================================

  static async detectShapes(imageBuffer) {
    // IMPORTANT: opencv.js needs to be initialized
    // This requires a more complex setup because opencv.js expects a browser environment
    // You may need to use jsdom or similar to provide a DOM
    
    const shapes = [];
    
    // opencv.js on Node.js is tricky because it expects:
    // 1. A DOM (document, HTMLImageElement)
    // 2. Canvas for image loading
    
    // Alternative approach: use sharp to decode the image
    const sharp = require('sharp');
    const { createCanvas, loadImage } = require('canvas');
    
    // Convert buffer to a format opencv.js can read
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Now use opencv.js
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150, 3, false);
    
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const approx = new cv.Mat();
      const epsilon = 0.04 * cv.arcLength(contour, true);
      cv.approxPolyDP(contour, approx, epsilon, true);
      
      let shape = '';
      if (approx.rows === 3) {
        shape = '[Triangle]';
      } else if (approx.rows === 4) {
        const rect = cv.boundingRect(approx);
        const aspectRatio = rect.width / rect.height;
        shape = (aspectRatio >= 0.95 && aspectRatio <= 1.05) ? '[Square]' : '[Rectangle]';
      } else if (approx.rows > 4) {
        shape = '[Circle]';
      }
      
      if (shape) shapes.push(shape);
    }
    
    // Clean up
    src.delete();
    gray.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    
    return shapes;
  }

  /**
   * Main CV function that processes base64 image and returns shape detection results
   * @param {string} base64Image - Base64 encoded image data
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async doCv(base64Image, res) {
    try {
      // Validate input
      if (!base64Image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Extract the base64 data
      const matches = base64Image.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches) {
        return res.status(400).json({ error: "Invalid base64 image format" });
      }
      
      const base64Data = matches[2];
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Detect shapes
      const shapes = await this.detectShapes(imageBuffer);
      
      // Prepare response
      const summary = this.summarizeShapes(shapes);
      
      res.status(200).json({
        success: true,
        shapes: shapes,
        count: shapes.length,
        summary: summary,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("CV Processing Error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  /**
   * Helper function to summarize detected shapes
   * @param {string[]} shapes - Array of detected shapes
   * @returns {Object} - Summary counts of each shape type
   */
  static summarizeShapes(shapes) {
    const summary = {
      triangles: 0,
      squares: 0,
      rectangles: 0,
      circles: 0
    };
    
    shapes.forEach(shape => {
      switch(shape) {
        case '[Triangle]':
          summary.triangles++;
          break;
        case '[Square]':
          summary.squares++;
          break;
        case '[Rectangle]':
          summary.rectangles++;
          break;
        case '[Circle]':
          summary.circles++;
          break;
      }
    });
    
    return summary;
  }
}

module.exports = VisionHubService;