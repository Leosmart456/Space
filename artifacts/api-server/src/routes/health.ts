import { Router, type IRouter } from "express";
import { getSmtpStatus } from "../lib/email";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const smtp = getSmtpStatus();
  res.json({
    status: "ok",
    smtp: {
      status: smtp.status,
      checkedAt: smtp.checkedAt,
    },
  });
});

export default router;
