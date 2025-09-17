import vision from '@google-cloud/vision';
import OpenAI from 'openai';
import { config } from 'dotenv';
import multer from 'multer';
config();

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'src/googlevision/angular-ionic-menu-app-c3726fce2a78.json',
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const visionORC = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // OCR using Google Vision
    const buffer = req.file.buffer;
    const [result] = await client.textDetection({ image: { content: buffer } });

    const prompt = `
You are a restaurant menu analysis expert.
Read and analyze the menu data in JSON format (OCR result from Google Vision) and return the standardized data with the following structure:

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

${JSON.stringify(result, null, 2)}
`;

    //analyze and create menu object
    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-3.5-turbo',
    //   messages: [{ role: 'user', content: prompt }],
    //   temperature: 0,
    // });

    // const content = completion.choices[0].message.content;

    // let data;
    // try {
    //   data = JSON.parse(content);
    // } catch (err) {
    //   data = { raw_json: result, menu_text: content };
    // }

    res.json({ result: result.textAnnotations[0]?.description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
