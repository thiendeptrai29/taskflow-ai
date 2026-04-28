# 🚀 TaskFlow AI — Ứng dụng Quản lý Công việc Thông minh

> Ứng dụng quản lý công việc cá nhân tích hợp AI, xây dựng với React + Node.js + MongoDB + OpenAI

---

## ✨ Tính năng

### 👤 Người dùng (US-01 → US-20)
- **Đăng ký / Đăng nhập** với JWT Authentication
- **Tạo, sửa, xóa task** với đầy đủ thông tin (tiêu đề, mô tả, deadline, ưu tiên, subtasks, tags)
- **Toggle hoàn thành** task bằng 1 click
- **Lọc & tìm kiếm** theo trạng thái, ưu tiên, từ khóa
- **Calendar view** — xem task theo lịch tháng
- **Thống kê Dashboard** — biểu đồ AreaChart, PieChart
- **Thông báo** deadline, nhắc nhở
- **Upload file đính kèm** vào task
- **Subtasks** — quản lý công việc con
- **Dark / Light mode** — chuyển đổi theme toàn app

### 🤖 AI Features (US-16 → US-20)
| Tính năng | Mô tả |
|-----------|-------|
| **AI Chat Assistant** | Chatbot hỏi đáp, tư vấn quản lý task |
| **Gợi ý ưu tiên** | AI phân tích và xếp hạng task theo độ khẩn |
| **Lịch thông minh** | AI tự động lên lịch làm việc tối ưu theo giờ |
| **Phân tích năng suất** | Điểm số + nhận xét + gợi ý cải thiện |
| **Nhắc nhở thông minh** | AI tạo thông điệp nhắc nhở cá nhân hóa |
| **Tạo task từ text** | Nhập văn bản tự nhiên → AI tự phân loại & điền form |
| **Voice input** | Nhận giọng nói tiếng Việt (Web Speech API) |

### 🛡️ Admin (US-21 → US-23)
- Xem danh sách tất cả người dùng
- Khóa / Mở khóa tài khoản
- Dashboard thống kê hệ thống

---

## 🛠 Công nghệ

| Layer | Stack |
|-------|-------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand |
| HTTP | Axios |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-3.5-turbo |
| Upload | Multer |

---

## ⚡ Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- MongoDB (local hoặc Atlas)
- OpenAI API Key

---

### 1. Clone & Cài đặt Backend

```bash
cd backend
npm install

# Tạo thư mục uploads
mkdir uploads

# Chạy backend
npm run dev
```

---

### 2. Cài đặt Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

---

### 3. Tạo tài khoản Admin (tùy chọn)

Sau khi đăng ký tài khoản, vào MongoDB và đổi role:

```javascript
// MongoDB Shell hoặc Compass
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## 📁 Cấu trúc thư mục

```
taskflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── taskController.js
│   │   │   ├── aiController.js
│   │   │   ├── statsController.js
│   │   │   ├── adminController.js
│   │   │   └── notificationController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   └── Notification.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── ai.js
│   │   │   ├── admin.js
│   │   │   ├── notifications.js
│   │   │   └── stats.js
│   │   └── server.js
│   ├── uploads/
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.tsx        # ✅ Cập nhật UI dark
    │   │   │   ├── RegisterPage.tsx     # ✅ Cập nhật UI dark
    │   │   │   └── ProfilePage.tsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.tsx
    │   │   ├── tasks/
    │   │   │   ├── TasksPage.tsx
    │   │   │   ├── TaskCard.tsx
    │   │   │   ├── TaskModal.tsx
    │   │   │   └── CalendarPage.tsx
    │   │   ├── ai/
    │   │   │   └── AIPage.tsx
    │   │   ├── admin/
    │   │   │   └── AdminPage.tsx
    │   │   ├── settings/
    │   │   │   └── SettingsPage.tsx     # ✅ Cập nhật dùng ThemeContext
    │   │   └── layout/
    │   │       ├── Layout.tsx
    │   │       └── NotificationPanel.tsx
    │   ├── context/
    │   │   └── ThemeContext.tsx         # 🆕 Global dark/light mode
    │   ├── services/
    │   │   └── api.ts
    │   ├── store/
    │   │   ├── authStore.ts
    │   │   └── taskStore.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx                      # ✅ Bọc ThemeProvider
    │   ├── main.tsx
    │   └── index.css                    # ✅ Thêm pastel light mode
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Lấy thông tin bản thân |
| PUT | `/api/auth/profile` | Cập nhật hồ sơ |
| PUT | `/api/auth/change-password` | Đổi mật khẩu |

### Tasks
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tasks` | Lấy danh sách (filter/search/sort) |
| POST | `/api/tasks` | Tạo task mới |
| GET | `/api/tasks/:id` | Xem chi tiết task |
| PUT | `/api/tasks/:id` | Cập nhật task |
| DELETE | `/api/tasks/:id` | Xóa task |
| PATCH | `/api/tasks/:id/toggle` | Toggle hoàn thành |
| GET | `/api/tasks/calendar` | Lấy task theo tháng |

### AI
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ai/chat` | Chat với AI |
| POST | `/api/ai/suggest-priority` | Gợi ý ưu tiên |
| POST | `/api/ai/auto-schedule` | Lên lịch tự động |
| GET | `/api/ai/productivity-analysis` | Phân tích năng suất |
| POST | `/api/ai/create-task` | Tạo task từ text |
| GET | `/api/ai/smart-reminders` | Nhắc nhở thông minh |

### Stats & Notifications & Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stats` | Thống kê dashboard |
| GET | `/api/notifications` | Lấy thông báo |
| PATCH | `/api/notifications/mark-read` | Đọc tất cả |
| GET | `/api/admin/users` | Danh sách users (admin) |
| PATCH | `/api/admin/users/:id/toggle` | Khóa/Mở user |
| GET | `/api/admin/stats` | Thống kê admin |

---

## 🔑 Biến môi trường

| Biến | Ví dụ | Bắt buộc |
|------|-------|----------|
| `PORT` | `5000` | ❌ |
| `MONGODB_URI` | `mongodb://localhost:27017/taskflow_ai` | ✅ |
| `JWT_SECRET` | `your_secret_key` | ✅ |
| `JWT_EXPIRES_IN` | `7d` | ❌ |
| `OPENAI_API_KEY` | `sk-...` | ✅ (AI features) |
| `CLIENT_URL` | `http://localhost:5173` | ❌ |

---

## 📝 Ghi chú

- **AI features** yêu cầu `OPENAI_API_KEY` hợp lệ. Nếu không có, các tính năng AI sẽ trả về lỗi nhưng không ảnh hưởng các tính năng khác.
- **Voice input** yêu cầu trình duyệt hỗ trợ Web Speech API (Chrome, Edge).
- File upload tối đa 10MB cho task attachments, 5MB cho avatar.
- MongoDB có thể dùng **MongoDB Atlas** miễn phí: https://cloud.mongodb.com
- **Dark/Light mode** lưu vào `localStorage`, mặc định là dark mode.

---

Made with ❤️ | TaskFlow AI © 2024