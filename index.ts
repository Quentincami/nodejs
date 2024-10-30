import { randomUUID } from "crypto";
import dotenv from "dotenv";
import * as fs from "fs/promises";
import { join } from "path";
import { prompt } from "./extraction_prompt";

dotenv.config();

import OpenAI from "openai";

console.log(process.env["OPENAI_API_KEY"]);

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

async function loadBase64ImageFromFile(filepath: string): Promise<string | undefined> {
  try {
    const fileData = await fs.readFile(filepath);
    const imageData = Buffer.from(fileData).toString("base64");
    return imageData;
  } catch (error) {
    console.error("Error loading image from file:", error);
  }
}

async function convertPptToPng(filePath: string, outputPath: string): Promise<string[]> {
  try {
    console.log("File path:", filePath);
    await fs.mkdir(outputPath, { recursive: true });
    const pptpng = (await import("ppt-png")).default;

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
    const pngFiles = files.filter((file) => file.endsWith(".png"));

    return pngFiles.map((file) => join(outputPath, file));
  } catch (error) {
    throw new Error(`Error converting PPTX file: ${error.message}`);
  }
}

async function understandImageContent(b64Image: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${b64Image}`,
            },
          },
        ],
      },
    ],
  });

  const messageContent = response.choices[0];
  return messageContent.message.content;
}

const uuid = randomUUID();
const outputPath = `output/${uuid}/`;
const filePath = "./omega.pptx";

convertPptToPng(filePath, outputPath)
  .then((pngs) => {
    return Promise.all(
      pngs.map(async (png) => {
        const b64Image = await loadBase64ImageFromFile(png);
        if (b64Image) {
          return understandImageContent(b64Image);
        }
        return "";
      })
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

