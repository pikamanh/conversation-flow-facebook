import axios from "axios";
import { FlowNode } from "./flow";

const GRAPH_API_VERSION = "v20.0";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

if (!PAGE_ACCESS_TOKEN) {
  console.warn(
    "[messenger] PAGE_ACCESS_TOKEN is not set. Outgoing messages will fail."
  );
}

interface QuickApiButton {
  type: "postback";
  title: string;
  payload: string;
}

function toApiButtons(node: FlowNode): QuickApiButton[] {
  // Facebook's button template supports at most 3 buttons per message.
  return node.buttons.slice(0, 3).map((b) => ({
    type: "postback",
    title: b.title,
    payload: b.payload,
  }));
}

/**
 * Sends a flow node to the given Messenger user as a button template
 * (text + up to 3 postback buttons). If the node has no buttons, falls
 * back to a plain text message.
 */
export async function sendFlowNode(
  recipientId: string,
  node: FlowNode
): Promise<void> {
  const buttons = toApiButtons(node);

  const message =
    buttons.length > 0
      ? {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: node.text,
              buttons,
            },
          },
        }
      : { text: node.text };

  await callSendApi(recipientId, message);
}

async function callSendApi(recipientId: string, message: unknown) {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_type: "RESPONSE",
        recipient: { id: recipientId },
        message,
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
      }
    );
  } catch (err: any) {
    const details = err?.response?.data ?? err?.message ?? err;
    console.error("[messenger] Send API error:", JSON.stringify(details));
    throw err;
  }
}
