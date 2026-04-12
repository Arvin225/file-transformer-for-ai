const fs = require('fs');

function cleanup(inputPath, outputDir) {
  try {
    fs.rmSync(inputPath, { force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  } catch (e) {}
}

module.exports = { cleanup };
