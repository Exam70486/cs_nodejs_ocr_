class FractalEngine {
  // Inside your Node.js FractalEngine class
  generateJulia(zoomInOut, scale) {
    const width = 800;
    const height = 600;
    const maxIterations = 500;
    const points = [];

    // Define the default coordinate bounds (the "world" view)
    const defaultMin = -1.5;
    const defaultMax = 1.5;

    // Use an absolute scale factor: scale 1 = default, scale > 1 = zoomed in
    // Ensure scale is at least 1 to prevent errors
    const currentScale = Math.max(scale, 1.0);

    // Calculate new bounds based on absolute scale
    // By dividing the range by scale, we zoom into the center (0,0)
    const range = (defaultMax - defaultMin) / currentScale;
    const minX = -range / 2;
    const maxX = range / 2;
    const minY = -range / 2;
    const maxY = range / 2;

    const cRe = -0.4;
    const cIm = 0.6;

    for (let screenX = 0; screenX < width; screenX++) {
      for (let screenY = 0; screenY < height; screenY++) {
        // Map screen pixels to complex plane using the new calculated bounds
        let zRe = minX + (screenX * range) / width;
        let zIm = minY + (screenY * range) / height;

        let iter = 0;
        while (zRe * zRe + zIm * zIm <= 4.0 && iter < maxIterations) {
          const nextRe = zRe * zRe - zIm * zIm + cRe;
          const nextIm = 2.0 * zRe * zIm + cIm;
          zRe = nextRe;
          zIm = nextIm;
          iter++;
        }

        const intensity =
          iter === maxIterations ? 0 : Math.floor((iter * 255) / maxIterations);
        points.push({ x: screenX, y: screenY, intensity });
      }
    }
    return points;
  }

  generateLeaf() {
    const points = [];
    const width = 800;
    const height = 600;

    const pixelGrid = Array.from({ length: width }, () =>
      new Array(height).fill(0)
    );

    let x = 0.0;
    let y = 0.0;
    const totalPoints = 150000;

    for (let i = 0; i < totalPoints; i++) {
      let nextX, nextY;
      const r = Math.random() * 100;

      if (r < 1) {
        nextX = 0.0;
        nextY = 0.16 * y;
      } else if (r < 86) {
        nextX = 0.85 * x + 0.04 * y;
        nextY = -0.04 * x + 0.85 * y + 1.6;
      } else if (r < 93) {
        nextX = 0.2 * x - 0.26 * y;
        nextY = 0.23 * x + 0.22 * y + 1.6;
      } else {
        nextX = -0.15 * x + 0.28 * y;
        nextY = 0.26 * x + 0.24 * y + 0.44;
      }

      x = nextX;
      y = nextY;

      const screenX = Math.round(((x + 2.182) * (width - 1)) / (2.655 + 2.182));
      const screenY = Math.round(((9.96 - y) * (height - 1)) / 9.96);

      if (screenX >= 0 && screenX < width && screenY >= 0 && screenY < height) {
        pixelGrid[screenX][screenY] = 200;
      }
    }

    let foundCount = 0;
    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        if (pixelGrid[px][py] > 0) {
          points.push({ x: px, y: py, intensity: pixelGrid[px][py] });
          foundCount++;
        }
      }
    }

    console.log(`Leaf generation complete. Points found: ${foundCount}`);
    return points;
  }
}

module.exports = new FractalEngine();
