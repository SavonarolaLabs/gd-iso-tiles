#!/bin/zsh

# Set the directory where your assets are stored
ASSETS_DIR="assets"
OUTPUT_JS="tileImports.js"

# Initialize the output file
echo "// Auto-generated tile imports" > $OUTPUT_JS
echo "const tileImages = {" >> $OUTPUT_JS

# Find all image files recursively in the assets directory
find $ASSETS_DIR -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read filepath; do
    # Convert the file path to a JavaScript-compatible import path
    import_path=$(echo $filepath | sed 's/ /\\ /g')

    # Extract file name without extension to use as a key
    file_name=$(basename "$filepath")
    file_key=$(echo $file_name | sed 's/\.[^.]*$//')

    # Write to the JS file
    echo "  \"$file_key\": \"$import_path\"," >> $OUTPUT_JS
done

# End of the JS object
echo "};" >> $OUTPUT_JS

# Add export statement
echo "" >> $OUTPUT_JS
echo "export default tileImages;" >> $OUTPUT_JS

echo "Tile import list generated in $OUTPUT_JS"
