import OpenAI from 'openai';
import { config } from 'dotenv';
import multer from 'multer';
import vision from '@google-cloud/vision';
import { parseMenuText } from '../utils/parseMenuText.js';
import path from 'path';
import { SYSTEM_PROMPT, USER_PROMPT } from '../constants/prompt.js';


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


export const openAIORC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const base64Image = req.file.buffer.toString('base64');

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
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

    return res.json(JSON.parse(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
    next();
  }
};
