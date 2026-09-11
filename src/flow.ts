/**
 * Hard-coded conversation flow config.
 * Each node = one bot message + a list of buttons.
 * Each button's `payload` is the id of the node to show next.
 * No database: the entire flow lives in this object, and state is
 * reconstructed from the postback payload Facebook sends back.
 *
 * ⚠️ Nội dung dưới đây (địa chỉ, lịch học, thông tin giáo viên...) là dữ
 * liệu mẫu — cập nhật lại đúng thông tin thật của trung tâm trước khi dùng
 * thật.
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
    text: "Xin chào Quý phụ huynh! Trung tâm Anh ngữ ABC xin chào. Anh/chị muốn tìm hiểu thông tin gì ạ?",
    buttons: [
      { title: "Thời gian học", payload: "SCHEDULE" },
      { title: "Địa điểm học", payload: "LOCATION" },
      { title: "Thông tin giáo viên", payload: "TEACHER" },
    ],
  },

  // ----- Thời gian học -----
  SCHEDULE: {
    text: "Trung tâm có các khung giờ học sau, Quý phụ huynh muốn xem lịch nhóm nào?",
    buttons: [
      { title: "Lớp Thiếu nhi (6-11 tuổi)", payload: "SCHEDULE_KIDS" },
      { title: "Lớp Thiếu niên (12-17 tuổi)", payload: "SCHEDULE_TEEN" },
      { title: "Quay lại", payload: START_NODE },
    ],
  },

  SCHEDULE_KIDS: {
    text:
      "Lớp Thiếu nhi (6-11 tuổi):\n" +
      "- Thứ 2-4-6: 17h30 - 19h00\n" +
      "- Thứ 3-5-7: 17h30 - 19h00\n" +
      "- Cuối tuần: 9h00 - 10h30",
    buttons: [{ title: "Quay lại", payload: "SCHEDULE" }],
  },

  SCHEDULE_TEEN: {
    text:
      "Lớp Thiếu niên (12-17 tuổi):\n" +
      "- Thứ 2-4-6: 19h15 - 20h45\n" +
      "- Thứ 3-5-7: 19h15 - 20h45\n" +
      "- Cuối tuần: 14h00 - 15h30",
    buttons: [{ title: "Quay lại", payload: "SCHEDULE" }],
  },

  // ----- Địa điểm học -----
  LOCATION: {
    text: "Trung tâm hiện có các cơ sở sau, Quý phụ huynh muốn xem địa chỉ cơ sở nào?",
    buttons: [
      { title: "Cơ sở Quận 1", payload: "LOCATION_Q1" },
      { title: "Cơ sở Quận 7", payload: "LOCATION_Q7" },
      { title: "Quay lại", payload: START_NODE },
    ],
  },

  LOCATION_Q1: {
    text:
      "Cơ sở Quận 1: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM.\n" +
      "Giờ mở cửa: 8h00 - 20h00 (Thứ 2 - Chủ nhật).",
    buttons: [{ title: "Quay lại", payload: "LOCATION" }],
  },

  LOCATION_Q7: {
    text:
      "Cơ sở Quận 7: 456 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP.HCM.\n" +
      "Giờ mở cửa: 8h00 - 20h00 (Thứ 2 - Chủ nhật).",
    buttons: [{ title: "Quay lại", payload: "LOCATION" }],
  },

  // ----- Thông tin giáo viên -----
  TEACHER: {
    text: "Đội ngũ giáo viên của trung tâm gồm những nhóm sau, Quý phụ huynh muốn tìm hiểu nhóm nào?",
    buttons: [
      { title: "Giáo viên nước ngoài", payload: "TEACHER_FOREIGN" },
      { title: "Giáo viên Việt Nam", payload: "TEACHER_VN" },
      { title: "Quay lại", payload: START_NODE },
    ],
  },

  TEACHER_FOREIGN: {
    text:
      "Giáo viên nước ngoài: 100% đến từ các nước bản ngữ (Anh, Mỹ, Úc...), " +
      "có chứng chỉ giảng dạy quốc tế (TESOL/CELTA/TEFL) và tối thiểu 2 năm " +
      "kinh nghiệm giảng dạy trẻ em.",
    buttons: [{ title: "Quay lại", payload: "TEACHER" }],
  },

  TEACHER_VN: {
    text:
      "Giáo viên Việt Nam: tốt nghiệp chuyên ngành Sư phạm Anh/Ngôn ngữ Anh, " +
      "chứng chỉ IELTS 7.5+ hoặc TOEIC 900+, đồng hành cùng giáo viên nước " +
      "ngoài trong mỗi lớp học.",
    buttons: [{ title: "Quay lại", payload: "TEACHER" }],
  },
};

export function getNode(payload: string | undefined | null): FlowNode {
  if (payload && flow[payload]) {
    return flow[payload];
  }
  return flow[START_NODE];
}
