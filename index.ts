import axios from 'axios';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { join } from 'path';
import { prompt } from './extraction_prompt';


const apikey = process.env.openaikey;


async function loadBase64ImageFromFile(
  filepath: string,
): Promise<string | undefined> {
  try {
    const fileData = await fs.readFile(filepath);
    const imageData = Buffer.from(fileData).toString('base64');
    return imageData;
  } catch (error) {
    console.error('Error loading image from file:', error);
  }
}

async function convertPptToPng(
  filePath: string,
  outputPath: string,
): Promise<string[]> {
  try {
    console.log('File path:', filePath);
    await fs.mkdir(outputPath, { recursive: true });
    const pptpng = (await import('ppt-png')).default;

    const converter = pptpng.create({
      files: [filePath],
      output: outputPath,
      options: {
        density: 150,
        quality: 100,
      },
    });

    await converter.convert();
    const files = await fs.readdir(outputPath);
    const pngFiles = files.filter((file) => file.endsWith('.png'));

    return pngFiles.map((file) => join(outputPath, file));
  } catch (error) {
    throw new Error(`Error converting PPTX file: ${error.message}`);
  }
}

async function understandImageContent(b64Image: string) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apikey}`
  };

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role:"system",
        content:prompt
      },
      {
        role:"user",
        content: [
          {
            type:"text",
            text:"Analyze this image"
          },
          {
            type:"image_url",
            image_url: {
              "url": "data:image/jpeg;base64,{base64_image}"
            }
          }
        ]
      }
    ]
  }
  await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers })
    .then(response => {
      const messageContent = response.data.choices[0].message.content;

      const extractedText = messageContent
          .filter((c: any) => c.type === 'text')   
          .map((content: any) => content.text)
          .join('\n');

      console.log(extractedText); 
      return extractedText;
  })
  .catch(error => {
      console.error("Error:", error); // Handle error
  });
}

const uuid = randomUUID();
const outputPath = `output/${uuid}/`;
const filePath = "./omega.pptx"


convertPptToPng(filePath, outputPath)
  .then((pngs) => {
    return Promise.all(
      pngs.map(async (png) => {
        const b64Image = await loadBase64ImageFromFile(png);
        if (b64Image) {
          return understandImageContent(b64Image);
        }
        return '';
      }),
    )
      .then((results) => {
        //parentPort.postMessage({ success: true, content: results });
        console.log({ success: true, content: results });
      })
      .catch((error) => {
        //parentPort.postMessage({ success: false, error: error.message });
        console.error({ success: false, error: error.message });
      });
  })
  .catch((error) => {
    //parentPort.postMessage({ success: false, error: error.message });
    console.error({ success: false, error: error.message });
  });