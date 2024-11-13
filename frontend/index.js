const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to download an image
async function downloadImage(url, filepath) {
    const writer = fs.createWriteStream(filepath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Example usage
(async () => {
    const imageUrl = 'https://example.com/image.png'; // Replace with your API URL
    const outputDir = path.resolve(__dirname, 'images'); // Directory to save images
    const outputFilePath = path.join(outputDir, 'image.png'); // File path to save the image

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    try {
        await downloadImage(imageUrl, outputFilePath);
        console.log('Image downloaded successfully:', outputFilePath);
    } catch (error) {
        console.error('Error downloading image:', error);
    }
})();