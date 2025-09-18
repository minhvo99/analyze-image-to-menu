import OpenAI from 'openai';
import { config } from 'dotenv';
import multer from 'multer';
import vision from '@google-cloud/vision';
import { parseMenuText } from '../utils/parseMenuText.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: 'src/googlevision/angular-ionic-menu-app-c3726fce2a78.json',
});

const upload = multer({ storage: multer.memoryStorage() });

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const analyzeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const buffer = req.file.buffer;
    const [ocrResult] = await visionClient.documentTextDetection({
      image: { content: buffer },
    });
    const text = ocrResult.fullTextAnnotation?.text || null;

    const [logoResult] = await visionClient.logoDetection({
      image: { content: buffer },
    });
    const logos = logoResult.logoAnnotations?.map((l) => l.description) || [];

    const [labelResult] = await visionClient.labelDetection({
      image: { content: buffer },
    });
    const labels =
      labelResult.labelAnnotations?.map((l) => l.description) || [];

    const originalName = req.file.originalname
      .split('.')
      .slice(0, -1)
      .join('.');
    const timeStamp = Date.now();
    const outPath = path.join(
      process.cwd(),
      `${originalName}-${timeStamp}.json`,
    );

    // fs.writeFileSync(outPath, JSON.stringify(ocrResult, null, 2), 'utf8');
    // Parse thành menu JSON
    const { restaurant, description, meals } = parseMenuText(text);

    res.json({ restaurant, description, meals, logos, labels });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
    next();
  }
};

const prompt = `
You are a restaurant menu analysis expert.
Read and analyze the menu data in image format  and return the standardized data with the following structure:

Result structure:

{
  "restaurant": string | null,
  "description": string | null,
  "meals": [
    {
      "name": string,            // Main dish name in English (if available)
      "another_name": string,    // Dish name in another language (Korean, Chinese, Japanese, etc.), multiple names can be combined with "/"
      "price": string | [        // If there is only 1 price, use string (remove the "$" symbol). If multiple prices/options exist, use an array of objects:
        {
          "value": string,       // Price (without "$" symbol)
          "note": string         // Note for that price (e.g., "Regular", "Garlic sauced")
        }
      ],
      "note": string | null      // Additional info such as preparation style or notes (e.g., "Rice not included", "Spicy", "Cold noodle"...)
    }
  ]
}


⚠️ Mandatory rules:

Do not omit any dish from the menu.

Keep all alternative names in foreign languages if available.

For duplicate dish names with different prices/options → keep only one object and put all prices into the array as specified.

If the JSON contains restaurant information → fill in the "restaurant" field.

If the JSON contains description/commitment of the restaurant → fill in the "description" field.

OCR Data (JSON input):
`;

export const visionORC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const base64Image = req.file.buffer.toString('base64');

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
    });

    const result = response.choices[0].message.content;
    res.json(JSON.parse(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
    next();
  }
};
