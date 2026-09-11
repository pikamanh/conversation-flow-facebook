import express, { Request, Response } from "express";
import { getNode, START_NODE } from "./flow";
import { sendFlowNode } from "./messenger";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Facebook webhook verification (GET)
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[webhook] Verified successfully.");
    res.status(200).send(challenge);
  } else {
    console.warn("[webhook] Verification failed.");
    res.sendStatus(403);
  }
});

// Facebook webhook events (POST)
app.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== "page") {
    res.sendStatus(404);
    return;
  }

  // Respond 200 immediately; Facebook retries on non-2xx / timeout.
  res.status(200).send("EVENT_RECEIVED");

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      try {
        await handleMessagingEvent(event);
      } catch (err) {
        console.error("[webhook] Failed to handle event:", err);
      }
    }
  }
});

async function handleMessagingEvent(event: any): Promise<void> {
  const senderId: string | undefined = event?.sender?.id;
  if (!senderId) return;

  // Button click -> postback.payload holds the next node id.
  if (event.postback) {
    const payload: string = event.postback.payload;
    const node = getNode(payload);
    await sendFlowNode(senderId, node);
    return;
  }

  // Plain text message (ignore delivery/read/echo events) -> restart flow.
  if (event.message && !event.message.is_echo) {
    const node = getNode(START_NODE);
    await sendFlowNode(senderId, node);
    return;
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
