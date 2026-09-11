/**
 * Hard-coded conversation flow config.
 * Each node = one bot message + a list of buttons.
 * Each button's `payload` is the id of the node to show next.
 * No database: the entire flow lives in this object, and state is
 * reconstructed from the postback payload Facebook sends back.
 */

export interface FlowButton {
  title: string;
  payload: string;
}

export interface FlowNode {
  text: string;
  buttons: FlowButton[];
}

export const START_NODE = "START";

export const flow: Record<string, FlowNode> = {
  [START_NODE]: {
    text: "Xin chào! Bạn cần hỗ trợ gì?",
    buttons: [
      { title: "Sản phẩm", payload: "PRODUCT" },
      { title: "Báo giá", payload: "PRICING" },
      { title: "Hỗ trợ", payload: "SUPPORT" },
    ],
  },

  PRODUCT: {
    text: "Bạn muốn xem sản phẩm nào?",
    buttons: [
      { title: "Sản phẩm A", payload: "PRODUCT_A" },
      { title: "Sản phẩm B", payload: "PRODUCT_B" },
    ],
  },

  PRODUCT_A: {
    text: "Bạn đã chọn Sản phẩm A.",
    buttons: [
      { title: "Xem chi tiết", payload: "PRODUCT_A_DETAIL" },
      { title: "Quay lại", payload: "PRODUCT" },
    ],
  },

  PRODUCT_A_DETAIL: {
    text: "Đây là thông tin chi tiết của Sản phẩm A.",
    buttons: [{ title: "Quay lại", payload: "PRODUCT_A" }],
  },

  PRODUCT_B: {
    text: "Bạn đã chọn Sản phẩm B.",
    buttons: [
      { title: "Xem chi tiết", payload: "PRODUCT_B_DETAIL" },
      { title: "Quay lại", payload: "PRODUCT" },
    ],
  },

  PRODUCT_B_DETAIL: {
    text: "Đây là thông tin chi tiết của Sản phẩm B.",
    buttons: [{ title: "Quay lại", payload: "PRODUCT_B" }],
  },

  PRICING: {
    text: "Vui lòng để lại thông tin, đội ngũ tư vấn sẽ gửi báo giá sớm nhất.",
    buttons: [{ title: "Quay lại", payload: START_NODE }],
  },

  SUPPORT: {
    text: "Bạn cần hỗ trợ vấn đề gì? Vui lòng mô tả ngắn gọn, chúng tôi sẽ phản hồi sớm.",
    buttons: [{ title: "Quay lại", payload: START_NODE }],
  },
};

export function getNode(payload: string | undefined | null): FlowNode {
  if (payload && flow[payload]) {
    return flow[payload];
  }
  return flow[START_NODE];
}
