// services/VisionHubService.js
const Tesseract = require("tesseract.js");
const fs        = require("fs");
const path      = require("path");


class VisionHubService {
  //============================================================================
  // COMMON UTILITIES
  //============================================================================

  /**
   * Saves a base64 image to disk
   * @param {string} base64Image - Base64 encoded image data
   * @returns {Promise<Object>} - Object containing filePath and fileExtension
   */
  static async saveBase64Image(base64Image) {
    return new Promise((resolve, reject) => {
      // Extract the file extension and data from the base64 string
      const matches = base64Image.match(
        /^data:image\/([A-Za-z-+/]+);base64,(.+)$/
      );

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

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the buffer to a file
      fs.writeFile(filePath, imageBuffer, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Image saved successfully:", filePath);
          resolve({ filePath, fileExtension, imageBuffer });
        }
      });
    });
  }

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
   * @param {string} base64Image - Base64 encoded image data
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async doOcr(base64Image, res) {
    try {
      // Save the image to disk first
      const { filePath } = await this.saveBase64Image(base64Image);

      // Perform OCR on the saved image
      const text    = await this.recognizeText(filePath);
      const message = "Text from image: " + text;
      console.debug(message);

      res.status(200).json({ message: message });
    } catch (error) {
      console.error("OCR Error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  }

  //============================================================================
  // COMPUTER VISION (CV) FUNCTIONS - Using opencv.js
  //============================================================================

 
  /**
   * Performs CV shape detection and sends response to client
   * @param {string} base64Image - Base64 encoded image data
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  static async doCv(base64Image, res) {
    try {

      // Save the image to disk first
      const { filePath } = await this.saveBase64Image(base64Image);

      // BEGIN COMPUTER VISION LOGIN


      // END COMPUTER VISION LOGIG

      // RETURN RESULT 
      const shapes  = ["Triangle", "Circle", "Square", "Rectangle"];
      const message = "Detected Shapes : " + shapes;
      console.debug(message);

      res.status(200).json({ message: message });

    } catch (error) {
      console.error("CV Processing Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

//
module.exports = VisionHubService;
