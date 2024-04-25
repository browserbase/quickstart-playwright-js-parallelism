import { Page, chromium } from "playwright-core";

export async function processBrowserbaseTasks<R>(
  tasks: ((page: Page) => Promise<R>)[]
): Promise<R[]> {
  const tasksQueue = tasks.slice();
  const resultsQueue: R[] = [];

  const createBrowserSession = async (browserWSEndpoint: string) => {
    const browser = await chromium.connectOverCDP(browserWSEndpoint);
    const page = await browser.newPage(); // Create a single page for this session

    while (true) {
      if (tasksQueue.length > 0) {
        const task = tasksQueue.shift();
        if (task) {
          const result = await task(page);
          resultsQueue.push(result);
        }
      } else {
        break;
      }
    }

    await page.close();
    await browser.close();
  };

  const browserWSEndpoint = `wss://api.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&enableProxy=true`;
  const sessions = Array.from({ length: 5 }, () =>
    createBrowserSession(browserWSEndpoint)
  );

  await Promise.all(sessions);

  return resultsQueue;
}
