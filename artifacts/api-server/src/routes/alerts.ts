import { Router, type IRouter, type Request, type Response } from "express";
import { mongoose } from "../lib/mongodb";
import { User, PriceAlert } from "../lib/models";
import { requireEnabledUser } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/alerts", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const alerts = await PriceAlert.find({ userId: user._id, triggered: false });

  res.json(alerts.map((a) => ({
    id: a._id.toString(),
    targetPrice: a.targetPrice,
    direction: a.direction,
    createdAt: a.createdAt,
  })));
});

router.post("/alerts", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const { targetPrice, direction } = req.body as { targetPrice: number; direction: boolean };

  if (!targetPrice || targetPrice <= 0) { res.status(400).json({ error: "Invalid target price" }); return; }

  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const alert = await PriceAlert.create({ userId: user._id, targetPrice, direction: Boolean(direction) });

  res.json({ id: alert._id.toString(), targetPrice: alert.targetPrice, direction: alert.direction, createdAt: alert.createdAt });
});

router.delete("/alerts/:id", requireEnabledUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId: string }).userId;
  const alertId = String(req.params.id);

  if (!mongoose.Types.ObjectId.isValid(alertId)) {
    res.status(400).json({ error: "Invalid alert ID" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await PriceAlert.deleteOne({ _id: alertId, userId: user._id });
  res.json({ ok: true });
});

export default router;
