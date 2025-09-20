import OpenAI from 'openai';
import { config } from 'dotenv';
import multer from 'multer';
import vision from '@google-cloud/vision';
import { parseMenuText } from '../utils/parseMenuText.js';
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

export const visionORC = async (req, res, next) => {
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
Read and analyze the menu data in image format and return standardized JSON data following the structure below.

Important: 
- Always provide translations for all required languages (kr, en, zh, ko, ja).
- If a dish already has a name/description in a given language, keep it as is.
- If a dish does not have that language available, translate from the best available source language (prefer EN > KR > others).

Result structure:
[
  {
    "nameSet": {
      "kr": { 
        "name": string,             // Korean dish name, translate if missing
        "description": string|null  // Optional description in Korean, translate if missing
      },
      "en": { 
        "name": string,             // English dish name, translate if missing
        "description": string|null  // Optional description in English, translate if missing
      },
      "zh": { 
        "name": string,             // Chinese dish name, translate if missing
        "description": string|null  // Optional description in Chinese, translate if missing
      },
      "ko": { 
        "name": string,             // Korean (same as kr) 
        "description": string|null 
      },
      "ja": { 
        "name": string,             // Japanese dish name, translate if missing
        "description": string|null  // Optional description in Japanese, translate if missing
      }
    },
    "categoryID": string|null,           
    "price_pickup": number|null,         
    "price_delivery": number|null,       
    "price_dinein": number|null,         
    "requirePrice": boolean,             
    "img": {
      "path": string|null,               
      "url": string|null                 
    },
    "imgthumb": {
      "path": string|null,               
      "url": string|null                 
    },
    "options": [
      {
        "nameSet": {
          "kr": { "name": string, "description": string|null },
          "en": { "name": string, "description": string|null },
          "zh": { "name": string, "description": string|null },
          "ko": { "name": string, "description": string|null },
          "ja": { "name": string, "description": string|null }
        },
        "items": [
          {
            "nameSet": {
              "kr": { "name": string, "description": string|null },   
              "en": { "name": string, "description": string|null }    
            },
            "additionalCost_pickup": number|null,   
            "additionalCost_dinein": number|null,   
            "additionalCost_delivery": number|null, 
            "default": boolean
          }
        ]
      }
    ],
    "isActive": boolean
  }
]

⚠️ Mandatory rules:

1. Do not omit any dish from the menu.
2. Always include translations for kr, en, zh, ko, ja:
   - If the language version already exists, keep it.
   - If missing, translate from an available language.
   - "ko" must always duplicate "kr".
3. For duplicate dish names with different prices/options → keep only one object and merge all prices/options.
4. If restaurant information exists → fill "restaurant" field.
5. If restaurant description/commitment exists → fill "description" field.
6. The output must be valid JSON only (no comments, no markdown).

OCR Data:
`;


export const openAIORC = async (req, res, next) => {
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
