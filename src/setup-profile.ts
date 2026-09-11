/**
 * One-time setup script: configures the Messenger "Get Started" button and
 * greeting text via the Messenger Profile API, so a brand-new user sees a
 * welcome screen with a "Get Started" button before sending any message.
 * Clicking it fires a postback with payload GET_STARTED, which the webhook
 * (src/index.ts) maps back to the START flow node.
 *
 * Run once (or whenever you want to change the greeting) with:
 *   npm run setup:profile
 */
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const GRAPH_API_VERSION = "v20.0";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const GREETING_TEXT =
  "Chào mừng Quý phụ huynh đến với Trung tâm Anh ngữ ABC! " +
  "Bấm \"Bắt đầu\" để xem thời gian học, địa điểm và thông tin giáo viên.";

async function main() {
  if (!PAGE_ACCESS_TOKEN) {
    console.error("Missing PAGE_ACCESS_TOKEN in environment / .env file.");
    process.exit(1);
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messenger_profile`;

  const body = {
    greeting: [{ locale: "default", text: GREETING_TEXT }],
    get_started: { payload: "GET_STARTED" },
  };

  try {
    const res = await axios.post(url, body, {
      params: { access_token: PAGE_ACCESS_TOKEN },
    });
    console.log("Messenger profile updated:", res.data);
  } catch (err: any) {
    console.error(
      "Failed to update Messenger profile:",
      err?.response?.data ?? err?.message ?? err
    );
    process.exit(1);
  }
}

main();
