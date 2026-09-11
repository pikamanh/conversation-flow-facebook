# conversation-flow-facebook

MVP Facebook Messenger conversation flow bot. Node.js + Express + TypeScript, không dùng database, không có frontend, không có authentication. Toàn bộ flow (câu hỏi + nút bấm) được hard-code trong `src/flow.ts`.

## Cách hoạt động

- User nhắn tin bất kỳ vào Page → bot gửi node `START` (text + 3 nút).
- User bấm nút → Facebook gửi một `postback` với `payload` là id của node tiếp theo về `POST /webhook`.
- Backend tra `payload` trong `src/flow.ts`, gửi message + nút của node đó lại cho user.
- Không lưu state gì cả: node tiếp theo luôn được suy ra 100% từ `payload` nhận được, kể cả nút "Quay lại" (payload trỏ thẳng về node cha).

Flow test có sẵn (đúng yêu cầu):

```
START ─┬─ Sản phẩm ─┬─ Sản phẩm A ─┬─ Xem chi tiết → PRODUCT_A_DETAIL
       │            │              └─ Quay lại → PRODUCT
       │            └─ Sản phẩm B ─┬─ Xem chi tiết → PRODUCT_B_DETAIL
       │                           └─ Quay lại → PRODUCT
       ├─ Báo giá → PRICING → Quay lại → START
       └─ Hỗ trợ → SUPPORT → Quay lại → START
```

## Cấu trúc project

```
src/
  flow.ts       # toàn bộ flow: node id -> { text, buttons[] }
  messenger.ts  # gọi Facebook Graph API (Send API)
  index.ts      # Express app: /health, /webhook (GET verify + POST events)
```

## 1. Chạy local

```bash
npm install
cp .env.example .env
# điền PAGE_ACCESS_TOKEN và VERIFY_TOKEN vào .env
npm run dev
```

- `GET http://localhost:3000/health` → `{"status":"ok"}`
- Muốn Facebook gọi được webhook local, dùng `ngrok http 3000` (hoặc tương tự) để có URL public tạm thời khi test trước khi deploy.

## 2. Tạo Facebook App + Page + Token

1. Vào https://developers.facebook.com/apps → **Create App** → chọn loại **Business** (hoặc "Other" → "Business").
2. Trong App, thêm sản phẩm **Messenger** (Add Product → Messenger → Set Up).
3. Ở mục **Messenger > Settings > Access Tokens**: chọn (hoặc tạo) Facebook Page bạn muốn dùng, bấm **Generate Token**. Copy token này → đây là `PAGE_ACCESS_TOKEN`.
   - Nếu app đang ở chế độ Development, bạn (chủ Page) test được ngay không cần App Review.
4. Tự nghĩ một chuỗi bất kỳ, ví dụ `my-verify-token-123` → đây là `VERIFY_TOKEN` (chỉ cần khớp giữa `.env` trên Render và ô nhập trên Facebook, không cần lấy từ đâu cả).

## 3. Deploy backend lên Render

1. Push code này lên một GitHub repo.
2. Vào https://dashboard.render.com → **New > Web Service** → connect tới repo.
3. Render sẽ đọc sẵn `render.yaml` trong repo (Blueprint), hoặc bạn tự cấu hình:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Vào tab **Environment** của service, thêm 2 biến:
   - `PAGE_ACCESS_TOKEN` = token lấy ở bước 2.3
   - `VERIFY_TOKEN` = chuỗi bạn tự chọn ở bước 2.4
5. Deploy xong, Render cho bạn một URL dạng `https://conversation-flow-facebook.onrender.com`.
6. Kiểm tra: `GET https://<your-app>.onrender.com/health` phải trả `{"status":"ok"}`.

> Lưu ý: gói Free của Render sẽ "ngủ" sau một thời gian không có traffic, request đầu tiên sau khi ngủ có thể mất vài giây (cold start) — bot vẫn hoạt động bình thường sau đó.

## 4. Kết nối Webhook với Facebook Page

1. Vào **Messenger > Settings** trong Facebook App.
2. Mục **Webhooks**, bấm **Add Callback URL** (hoặc **Edit** nếu đã có):
   - **Callback URL**: `https://<your-app>.onrender.com/webhook`
   - **Verify Token**: đúng giá trị `VERIFY_TOKEN` bạn đã set trên Render.
   - Bấm **Verify and Save**. Facebook sẽ gọi `GET /webhook` với `hub.challenge`; backend echo lại giá trị này nếu token khớp (xem `src/index.ts`).
3. Sau khi verify thành công, ở mục **Webhook Fields**, tick chọn (Subscribe to):
   - `messages`
   - `messaging_postbacks`
4. Ở mục **Messenger > Settings > Access Tokens**, đảm bảo Page của bạn đang **Subscribed** vào app (nút "Subscribe" cạnh tên Page nếu chưa subscribe).

## 5. Test flow end-to-end

1. Mở Messenger, nhắn tin cho Facebook Page của bạn (chủ Page test được ngay ở chế độ Development; muốn người khác test cần thêm họ vào **Roles > Testers** hoặc submit App Review).
2. Gõ bất kỳ tin nhắn nào (vd "hi") → bot trả lời:
   > Xin chào! Bạn cần hỗ trợ gì?
   > `[Sản phẩm]` `[Báo giá]` `[Hỗ trợ]`
3. Bấm **Sản phẩm** → bot hỏi chọn Sản phẩm A / B.
4. Bấm **Sản phẩm A** → bot xác nhận, có nút **Xem chi tiết** / **Quay lại**.
5. Bấm **Xem chi tiết** → bot trả về thông tin chi tiết + nút **Quay lại**.

## Debug

- Xem log real-time trên Render: tab **Logs** của service.
- Lỗi gửi tin nhắn (token sai/hết hạn, Page chưa subscribe...) sẽ được log dạng `[messenger] Send API error: ...` kèm response từ Graph API.
- Facebook cũng có **Webhooks > Recent Deliveries** trong App Dashboard để xem payload đã gửi và response code backend trả về — hữu ích khi verify hoặc event không tới nơi.

## Mở rộng flow

Thêm node mới trong `src/flow.ts`: thêm một key mới vào object `flow`, set `text` + tối đa 3 `buttons` (giới hạn của Facebook button template), mỗi button trỏ `payload` tới id của node khác (có thể trỏ tới node đã tồn tại để tạo nhánh "Quay lại"). Không cần sửa gì ở `index.ts` hay `messenger.ts`.
