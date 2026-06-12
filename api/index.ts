import { getApp } from "../server/app";

const appPromise = getApp();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  (app as any)(req, res);
}
