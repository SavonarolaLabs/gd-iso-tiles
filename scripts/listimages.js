const fs = require('fs');
const path = require('path');

// List of popular image extensions to include (case-insensitive)
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tga', '.webp', '.svg'];

// Function to scan directory and subdirectories for image files
function getImagesFromDir(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      // Recursively get images from subdirectories
      results = results.concat(getImagesFromDir(fullPath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        results.push(fullPath.replace(/\\/g, '/')); // Ensure path separators are consistent
      }
    }
  });

  return results;
}

// Main function to create output file
function createImageExportFile(dirPath, outputPath) {
  // Ensure .js extension
  if (!outputPath.endsWith('.js')) {
    outputPath += '.js';
  }

  const images = getImagesFromDir(dirPath);
  const fileNameWithoutExt = path.basename(outputPath, '.js');

  const exportContent = `export const ${fileNameWithoutExt} = [\n` + images.map((image) => `    "${image}"`).join(',\n') + '\n];\n';

  fs.writeFileSync(outputPath, exportContent, 'utf8');
  console.log(`File ${outputPath} has been created successfully!`);
}

// Usage example: Provide directory path and output file path
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node script.js <directory_path> <output_file_path>');
} else {
  const [dirPath, outputPath] = args;
  createImageExportFile(dirPath, outputPath);
}
