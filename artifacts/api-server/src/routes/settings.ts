import { Router, type IRouter, type Request, type Response } from "express";
import { Setting } from "../lib/models";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  const doc = await Setting.findOne({ key });
  return doc?.value ?? null;
}

async function upsertSetting(key: string, value: string): Promise<void> {
  await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
}

export { getSetting, upsertSetting };

const DEFAULT_BTC_ADDRESS = "bc1qx2vuy9ndykk7h5u57pun9xd8pknq6jfp4km82t";
const DEFAULT_ETH_ADDRESS = "0xCBF1857DD3A4C30A6972c2d35e9EED19728cea57";

router.get("/settings", async (_req: Request, res: Response): Promise<void> => {
  const sharePrice = await getSetting("share_price");
  const systemMode = await getSetting("system_mode");
  const minInvestment = await getSetting("min_investment");
  const ipoTargetDate = await getSetting("ipo_target_date");
  const btcAddress = await getSetting("btc_address");
  const ethAddress = await getSetting("eth_address");

  res.json({
    sharePrice: Number(sharePrice ?? "150.00"),
    systemMode: systemMode ?? "pre_ipo",
    minInvestment: Number(minInvestment ?? "2000"),
    ipoTargetDate: ipoTargetDate ?? null,
    btcAddress: btcAddress ?? DEFAULT_BTC_ADDRESS,
    ethAddress: ethAddress ?? DEFAULT_ETH_ADDRESS,
  });
});

export { DEFAULT_BTC_ADDRESS, DEFAULT_ETH_ADDRESS };

export default router;
