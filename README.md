# conversation-flow-facebook

MVP Facebook Messenger conversation flow bot cho một trung tâm Anh ngữ, giúp phụ huynh tra cứu nhanh thời gian học / địa điểm / thông tin giáo viên qua nút bấm. Node.js + Express + TypeScript, không dùng database, không có frontend, không có authentication. Toàn bộ flow (câu hỏi + nút bấm) được hard-code trong `src/flow.ts`.

## Cách hoạt động

- User mở cuộc trò chuyện lần đầu → Facebook hiện màn hình chào + nút **Bắt đầu** (cấu hình qua `src/setup-profile.ts`, xem mục 5 bên dưới).
- User bấm **Bắt đầu** hoặc bất kỳ nút nào → Facebook gửi một `postback` với `payload` là id của node tiếp theo về `POST /webhook`.
- Backend tra `payload` trong `src/flow.ts`, gửi message + nút của node đó lại cho user.
- Không lưu state gì cả: node tiếp theo luôn được suy ra 100% từ `payload` nhận được, kể cả nút "Quay lại" (payload trỏ thẳng về node cha).
- **Nếu user gõ tin nhắn tự do (không bấm nút)**: bot **không phản hồi gì nữa** — coi như flow tự động đã kết thúc, để bộ phận CSKH vào xử lý thủ công (xem `src/index.ts`, hàm `handleMessagingEvent`).

Flow hiện tại:

```
START (Bắt đầu) ─┬─ Thời gian học ─┬─ Lớp Thiếu nhi (6-11 tuổi) ─ Quay lại → SCHEDULE
                 │  (SCHEDULE)     └─ Lớp Thiếu niên (12-17 tuổi) ─ Quay lại → SCHEDULE
                 │                 └─ Quay lại → START
                 │
                 ├─ Địa điểm học ─┬─ Cơ sở Quận 1 ─ Quay lại → LOCATION
                 │  (LOCATION)    └─ Cơ sở Quận 7 ─ Quay lại → LOCATION
                 │                └─ Quay lại → START
                 │
                 └─ Thông tin giáo viên ─┬─ Giáo viên nước ngoài ─ Quay lại → TEACHER
                    (TEACHER)            └─ Giáo viên Việt Nam ─ Quay lại → TEACHER
                                          └─ Quay lại → START
```

⚠️ Nội dung mẫu (lịch học, địa chỉ cơ sở, thông tin giáo viên) trong `src/flow.ts` cần được thay bằng thông tin thật của trung tâm.

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

## 5. Bật màn hình chào cho user mới (Get Started + Greeting Text)

Mặc định, user mới bấm vào "Nhắn tin" sẽ không thấy gì cho tới khi họ tự gõ gì đó. Để tự động hiện đoạn giới thiệu + nút **Bắt đầu** như Facebook thường làm, cần gọi Messenger Profile API một lần (không cần deploy lại mỗi khi đổi flow, chỉ cần chạy lại script này nếu muốn đổi greeting text):

```bash
# ở máy local, với PAGE_ACCESS_TOKEN trong .env đã là token còn hạn
npm run setup:profile
```

Script (`src/setup-profile.ts`) sẽ gọi `POST /me/messenger_profile` để cấu hình:
- **Greeting text**: đoạn chào hiện trước khi user bấm Bắt đầu.
- **Get Started button**: khi bấm, Facebook gửi `postback` với `payload = "GET_STARTED"` về webhook. Webhook không có node tên `GET_STARTED` trong `flow.ts` nên tự fallback về node `START` (xem `getNode()` trong `src/flow.ts`) — tức là user sẽ thấy đúng màn hình "Xin chào! Bạn cần hỗ trợ gì?" kèm 3 nút.

Chỉ cần chạy lệnh này **1 lần** (hoặc mỗi khi muốn đổi câu greeting) — không phải chạy lại mỗi lần deploy.

## 6. Test flow end-to-end

1. Mở Messenger, mở cuộc trò chuyện với Facebook Page của bạn như một user mới (chủ Page test được ngay ở chế độ Development; muốn người khác test cần thêm họ vào **Roles > Testers** hoặc submit App Review). Nếu đã nhắn tin trước đó, xoá cuộc trò chuyện cũ để thấy lại màn hình chào.
2. Thấy màn hình chào + nút **Bắt đầu** → bấm vào → bot trả lời:
   > Xin chào Quý phụ huynh! Trung tâm Anh ngữ ABC xin chào. Anh/chị muốn tìm hiểu thông tin gì ạ?
   > `[Thời gian học]` `[Địa điểm học]` `[Thông tin giáo viên]`
3. Bấm **Thời gian học** → bot hỏi chọn nhóm lớp (Thiếu nhi / Thiếu niên) + nút Quay lại.
4. Bấm **Lớp Thiếu nhi (6-11 tuổi)** → bot trả về lịch học chi tiết + nút **Quay lại**.
5. Gõ thử một tin nhắn tự do bất kỳ (vd "cho em hỏi thêm") → bot **không trả lời gì** — đây là hành vi đúng, để CSKH tiếp nhận thủ công.

## Debug

- Xem log real-time trên Render: tab **Logs** của service.
- Lỗi gửi tin nhắn (token sai/hết hạn, Page chưa subscribe...) sẽ được log dạng `[messenger] Send API error: ...` kèm response từ Graph API.
- Facebook cũng có **Webhooks > Recent Deliveries** trong App Dashboard để xem payload đã gửi và response code backend trả về — hữu ích khi verify hoặc event không tới nơi.

## Mở rộng flow

Thêm node mới trong `src/flow.ts`: thêm một key mới vào object `flow`, set `text` + tối đa 3 `buttons` (giới hạn của Facebook button template), mỗi button trỏ `payload` tới id của node khác (có thể trỏ tới node đã tồn tại để tạo nhánh "Quay lại"). Không cần sửa gì ở `index.ts` hay `messenger.ts`.
