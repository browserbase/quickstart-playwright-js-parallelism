/// <reference types="node" />
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY as string,
});

interface Session {
  id: string;
  connectUrl: string;
}

async function createSession(): Promise<Session> {
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID as string,
  });
  return session;
}

export async function processBrowserbaseTasks<R>(
  tasks: ((url: string) => Promise<R>)[]
): Promise<R[]> {
  const tasksQueue = tasks.slice();
  const resultsQueue: R[] = [];
  const NUM_PARALLEL_SESSIONS = 5;
  const sessions: Session[] = [];

  // Create sessions upfront
  for (let i = 0; i < NUM_PARALLEL_SESSIONS; i++) {
    sessions.push(await createSession());
  }

  const processTasksWithSession = async (session: Session) => {
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const defaultContext = browser.contexts()[0];
    const page = defaultContext?.pages()[0];

    if (!page) {
      throw new Error('No page available in the browser context');
    }

    try {
      while (tasksQueue.length > 0) {
        const task = tasksQueue.shift();
        if (task) {
          try {
            const result = await task(page.url());
            resultsQueue.push(result);
          } catch (error: unknown) {
            console.error(`Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } finally {
      await browser.close();
      console.log(`Session complete! View replay at https://browserbase.com/sessions/${session.id}`);
    }
  };

  await Promise.all(sessions.map(processTasksWithSession));

  return resultsQueue;
}
