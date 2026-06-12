import { getApp } from "../server/app";
import type { Request, Response } from "express";

const appPromise = getApp();

export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  app.handle(req, res, () => {});
}
