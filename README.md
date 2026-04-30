# 🚀 TaskFlow AI — Ứng dụng Quản lý Công việc Thông minh

> Ứng dụng quản lý công việc cá nhân tích hợp AI, xây dựng với React + TypeScript + Node.js + MongoDB + OpenAI

---

## 📁 Cấu trúc Thư mục

```
taskflow-ai/
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env                          # Environment variables
│   ├── src/
│   │   ├── server.js                 # Entry point
│   │   ├── config/
│   │   │   └── database.js          # MongoDB config
│   │   ├── controllers/              # Business logic
│   │   │   ├── adminController.js
│   │   │   ├── aiController.js      # AI features
│   │   │   ├── authController.js    # Auth logic
│   │   │   ├── Chatcontroller.js    # Chat/messages
│   │   │   ├── notificationController.js
│   │   │   ├── statsController.js
│   │   │   ├── taskController.js
│   │   │   └── teamController.js    # Team management
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification
│   │   ├── models/                   # Database schemas
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   ├── Chathistory.js
│   │   │   ├── Notification.js
│   │   │   └── Team.js              # Team schema
│   │   └── routes/                   # API endpoints
│   │       ├── admin.js
│   │       ├── ai.js
│   │       ├── auth.js
│   │       ├── chat.js
│   │       ├── notifications.js
│   │       ├── stats.js
│   │       ├── tasks.js
│   │       └── teams.js             # Team endpoints
│   ├── uploads/                      # File uploads (created by app)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Main component
│   │   ├── index.css
│   │   ├── components/               # Reusable components
│   │   │   ├── admin/
│   │   │   │   └── AdminPage.tsx
│   │   │   ├── ai/
│   │   │   │   └── AIPage.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── NotificationPanel.tsx
│   │   │   ├── settings/
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── CalendarPage.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── TaskModal.tsx
│   │   │   │   └── TasksPage.tsx
│   │   │   └── team/
│   │   │       ├── InviteMemberModal.tsx
│   │   │       ├── TeamCard.tsx
│   │   │       ├── TeamDetailPage.tsx
│   │   │       ├── TeamModal.tsx
│   │   │       └── TeamPage.tsx
│   │   ├── context/                  # React Context
│   │   │   ├── LanguageContext.tsx  # i18n
│   │   │   └── ThemeContext.tsx      # Dark/Light mode
│   │   ├── i18n/
│   │   │   └── translations.ts       # Multi-language
│   │   ├── services/
│   │   │   └── api.ts                # API calls (Axios)
│   │   ├── store/                    # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── taskStore.ts
│   │   │   └── teamStore.ts
│   │   └── types/
│   │       └── index.ts              # TypeScript types
│   └── public/                       # Static assets
│
├── package.json                      # Root package.json
├── setup.js                          # Setup script
└── README.md                         # This file
```

---

## ✨ Tính năng

### 👤 Quản lý Người dùng
- **Đăng ký / Đăng nhập** với JWT Authentication
- **Dark / Light mode** — chuyển đổi theme toàn app
- **Đa ngôn ngữ** (i18n) — Tiếng Việt / Tiếng Anh
- **Hồ sơ cá nhân** & Cài đặt

### 📋 Quản lý Task
- **Tạo, sửa, xóa task** với đầy đủ thông tin
- **Toggle hoàn thành** task bằng 1 click
- **Lọc & tìm kiếm** theo trạng thái, ưu tiên, từ khóa
- **Calendar view** — xem task theo lịch tháng
- **Phân loại** theo tags & trạng thái (Pending, In Progress, Completed, Cancelled)
- **Ưu tiên** (High, Medium, Low)
- **Subtasks** — quản lý công việc con

### 📊 Dashboard & Thống kê
- **Biểu đồ thống kê** — AreaChart, PieChart (Recharts)
- **Phân tích năng suất** — Điểm số & nhận xét
- **Thông báo deadline** — Nhắc nhở thông minh

### 🤖 AI Features
| Tính năng | Mô tả |
|-----------|-------|
| **AI Chat Assistant** | Chatbot hỏi đáp, tư vấn quản lý task |
| **Gợi ý ưu tiên** | AI phân tích và xếp hạng task theo độ khẩn |
| **Lên lịch thông minh** | AI tự động lên lịch làm việc tối ưu |
| **Phân tích năng suất** | Điểm số + nhận xét + gợi ý cải thiện |
| **Nhắc nhở cá nhân hóa** | AI tạo thông điệp nhắc nhở theo context |
| **Tạo task từ text** | Nhập văn bản → AI phân loại & điền form |
| **Voice input** | Nhận giọng nói tiếng Việt (Web Speech API) |

### 👥 Quản lý Team (trong phát triển)
- Tạo & quản lý team
- Mời thành viên
- Chia sẻ task trong team

### 🛡️ Admin Dashboard
- Xem danh sách tất cả người dùng
- Khóa / Mở khóa tài khoản
- Thống kê hệ thống
- Quản lý người dùng

---

## 🛠 Công nghệ Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + PostCSS |
| **State Management** | Zustand |
| **HTTP Client** | Axios |
| **Charts** | Recharts |
| **Backend** | Node.js + Express.js |
| **Authentication** | JWT + bcryptjs |
| **Database** | MongoDB + Mongoose |
| **AI Integration** | OpenAI GPT-3.5-turbo |
| **File Upload** | Multer |
| **Utilities** | Framer Motion, React DatePicker |

---

## ⚡ Cài đặt & Chạy

### Yêu cầu
- **Node.js** >= 18
- **npm** hoặc **yarn**
- **MongoDB** (local hoặc Atlas)
- **OpenAI API Key**

---

### 1. Clone Repository

```bash
git clone <repository-url>
cd taskflow-ai
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Tạo file .env
# Cần: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, PORT

# Tạo thư mục uploads
mkdir uploads

# Chạy backend (port 5000)
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Cấu hình API endpoint trong services/api.ts
# Chạy frontend (port 5173)
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

---

### 4. Tạo Admin Account (tùy chọn)

Sau khi đăng ký tài khoản, vào MongoDB và cập nhật:

```javascript
// MongoDB Shell
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## � API Endpoints

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

### Stats & Notifications
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stats` | Thống kê dashboard |
| GET | `/api/notifications` | Lấy thông báo |
| PATCH | `/api/notifications/mark-read` | Đọc tất cả |

### Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/users` | Danh sách users (admin) |
| PATCH | `/api/admin/users/:id/toggle` | Khóa/Mở user |
| GET | `/api/admin/stats` | Thống kê admin |

---

## 🔑 Biến môi trường

### Backend (.env)

| Biến | Ví dụ | Bắt buộc |
|------|-------|----------|
| `PORT` | `5000` | ❌ |
| `MONGODB_URI` | `mongodb://localhost:27017/taskflow_ai` | ✅ |
| `JWT_SECRET` | `your_secret_key_here` | ✅ |
| `JWT_EXPIRES_IN` | `7d` | ❌ |
| `OPENAI_API_KEY` | `sk-...` | ✅ (AI features) |
| `CLIENT_URL` | `http://localhost:5173` | ❌ |
| `NODE_ENV` | `development` | ❌ |

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📝 Ghi chú

- **AI features** yêu cầu `OPENAI_API_KEY` hợp lệ. Nếu không có, các tính năng AI sẽ trả về lỗi nhưng không ảnh hưởng các tính năng khác.
- **Voice input** yêu cầu trình duyệt hỗ trợ Web Speech API (Chrome, Edge, Firefox).
- File upload tối đa: 10MB cho task attachments, 5MB cho avatar.
- **MongoDB**: Dùng MongoDB Atlas (miễn phí): https://cloud.mongodb.com
- **Dark/Light mode**: Lưu vào `localStorage`, mặc định là dark mode.
- **Đa ngôn ngữ**: i18n context với tiếng Việt/Anh, có thể mở rộng.

---

## 🚀 Phát triển tiếp theo

- [ ] WebSocket cho real-time chat
- [ ] Notification push trên mobile
- [ ] Export task thành PDF/Excel
- [ ] Integration với Google Calendar
- [ ] Voice commands
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] More AI capabilities (GPT-4, Claude)

---

Made with ❤️ | TaskFlow AI © 2024