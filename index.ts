import { Page } from "playwright-core";
import * as fs from "fs";
import { processBrowserbaseTasks } from "./utils";

const loadUrlsFromFile = (filePath: string) => {
  const file = fs.readFileSync(filePath);
  return file.toString().split(`\n`);
};

(async () => {
  const tasks = loadUrlsFromFile("wikipedia_urls.txt").map(
    (url) => async (page: Page) => {
      console.log(`Processing ${url}...`);
      await page.goto(url);
      const content = await page.content();
      return [url, content];
    }
  );

  const result = await processBrowserbaseTasks(tasks);
  result.map(([url, content]) => {
    console.log(url, content.substring(0, 200) + "...");
  });
})().catch((error) => {
  console.error(error.message);
});
