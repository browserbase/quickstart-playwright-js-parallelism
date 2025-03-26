/// <reference types="node" />
import * as fs from "fs";
import { processBrowserbaseTasks } from "./utils";

const loadUrlsFromFile = (filePath: string): string[] => {
  try {
    const file = fs.readFileSync(filePath);
    return file.toString().split('\n').filter((url: string) => url.trim());
  } catch (error: unknown) {
    console.error(`Error loading URLs from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

interface PageContent {
  url: string;
  content: string;
}

async function processUrl(url: string): Promise<PageContent> {
  try {
    const response = await fetch(url);
    const content = await response.text();
    return { url, content };
  } catch (error: unknown) {
    console.error(`Error processing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { url, content: '' };
  }
}

(async () => {
  if (!process.env.BROWSERBASE_API_KEY) {
    throw new Error('BROWSERBASE_API_KEY environment variable is not set');
  }

  if (!process.env.BROWSERBASE_PROJECT_ID) {
    throw new Error('BROWSERBASE_PROJECT_ID environment variable is not set');
  }

  const urls = loadUrlsFromFile("wikipedia_urls.txt");
  if (urls.length === 0) {
    console.error('No URLs found in file');
    process.exit(1);
  }

  const tasks = urls.map((url: string) => () => processUrl(url));
  
  try {
    const results = await processBrowserbaseTasks<PageContent>(tasks);
    results.forEach(({ url, content }) => {
      if (content) {
        console.log(`${url}: ${content.substring(0, 200)}...`);
      } else {
        console.log(`${url}: No content retrieved`);
      }
    });
  } catch (error: unknown) {
    console.error(`Error processing tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
})();
