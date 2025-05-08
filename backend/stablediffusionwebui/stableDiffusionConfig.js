import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Configuration for Stable Diffusion API
const SD_API_URL = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
const IMAGES_DIR = path.join(process.cwd(), 'backend', 'public', 'generated-images');


//Generates an image using Stable Diffusion Web UI API from a prompt
export async function generateImageFromPrompt(prompt, options = {}) {
  try {
    // Ensure the images directory exists
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // Default parameters for image generation
    const defaultParams = {
      prompt: prompt,
      negative_prompt: options.negative_prompt || "",
      width: options.width || 512,
      height: options.height || 512,
      steps: options.steps || 41,
      cfg_scale: options.cfg_scale || 13,
      sampler_name: options.sampler_name || "Euler a",
      batch_size: 1,
      seed: options.seed || -1,
      restore_faces: options.restore_faces !== undefined ? options.restore_faces : false,
    };

    // Make the API request to Stable Diffusion Web UI
    const response = await axios.post(SD_API_URL, defaultParams, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      timeout: 120000 // 2 minutes timeout for image generation
    });

    // Extract image data
    const imageData = response.data.images[0];
    if (!imageData) {
      throw new Error('No image data returned from Stable Diffusion API');
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
    const imagePath = path.join(IMAGES_DIR, filename);

    // The image comes as a base64 string, convert and save
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(imagePath, buffer);

    // Return the public URL to the image
    const publicPath = `/generated-images/${filename}`;
    console.log(`Image generated and saved to: ${publicPath}`);
    return publicPath;

  } catch (error) {
    console.error('Error generating image:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API response error:', error.response.data);
    }
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
