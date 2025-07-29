# 🎓 ConsultNet - College Consultancy Platform 🚀

ConsultNet is a full-stack web application that simplifies the process of connecting students with colleges and universities. It provides a consultancy platform for students to browse, apply, and interact with verified institutions based on various criteria like location and fee structure.

---

## 📖 Overview

The platform represents a consultancy interface that collaborates with multiple colleges and universities. It hosts a **comprehensive list of institutions** allowing students to browse and select based on preferences such as **state** and **fee range**. Confidential information like fee details is only visible after approval.

---

## ✨ Key Features

### 🏫 College & University Directory
- Lists all affiliated colleges and universities.
- Students can filter by **state**, **course**, or **fee range**.

### 🧑‍🎓 Student Dashboard
- Search for colleges with filters.
- Dashboard shows submitted applications and their status.
- Future updates support adding colleges dynamically.

### 📝 Student Application
- Students fill out an application form per college.
- Form is submitted to the admin for approval.
- Upon approval, students can view fee structure and continue.

### 🔁 Resubmission Workflow
- Admins can request changes and allow resubmission of applications.

### 📤 Document Sharing for Verification
- Once submitted, the student can upload documents for verification by the selected institution.

### 💵 Commission Structure
- Consultancy earns a **10–15% commission** based on student-paid fees (not colleges).

### 👤 Profile Management
- Students can view/edit their profile data.

### 🔐 Secure Authentication
- JWT-based login and signup functionality.

### 🤖 AI-Powered College Search
- Integrated **Google Gemini API** for intelligent search suggestions.

---

## 🎨 Design and Aesthetics

- The interface aligns with the consultancy's branding — **yellow and black**.
- Design maintains a professional yet approachable aesthetic.
- Logo and visual elements are consistent across the app.

---

## 🛠️ Tech Stack

### 🔧 Backend
- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** PostgreSQL  
- **ORM:** Sequelize  
- **Authentication:** JWT (JSON Web Tokens)  

### 💻 Frontend
- **Languages:** HTML5, CSS3, JavaScript (ES6)  
- **Styling:** Tailwind CSS  
- **AI Integration:** Google Gemini API  

---

## 🚀 Getting Started

### ✅ Prerequisites

- Node.js and npm  
- PostgreSQL running locally  
- Git installed  
- (Optional) Live Server for VS Code

---

### 🔄 Clone the Repository

```bash
git clone https://github.com/Harshit765G4/College-Consultancy-Platform.git
cd College-Consultancy-Platform
```

---

### ⚙️ Backend Setup

```bash
cd consultancy-platform-backend
npm install
```

Create a `.env` file in `consultancy-platform-backend/`:

```env
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consultancy_db_dev
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

Start the backend:

```bash
npm run dev
```

---

### 💻 Frontend Setup

1. Navigate to the `FRONTEND` folder in VS Code.
2. In `js/common.js`, set your Gemini API key:

```js
const GEMINI_API_KEY = "PASTE_YOUR_ACTUAL_GEMINI_API_KEY_HERE";
```

3. Right-click `index.html` > **"Open with Live Server"**.

---

## 📸 Screenshots

> Interface snapshots showcasing functionality

### 🏠 Homepage  
![Homepage](https://i.imgur.com/screenshot1.png)

### 🔐 Login Page  
![Login](https://i.imgur.com/screenshot2.png)

### 🧾 Application Form  
![Form](https://i.imgur.com/screenshot3.png)

### 📊 Student Dashboard  
![Dashboard](https://i.imgur.com/screenshot4.png)

### 🔍 Application Preview Modal  
![Modal](https://i.imgur.com/screenshot5.png)

### ♻️ Resubmission Request View  
![Resubmission](https://i.imgur.com/screenshot6.png)

### 🗂️ Document Upload for Verification  
![Documents](https://i.imgur.com/screenshot7.png)

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Developed with ❤️ by **Harshit Garg**

- GitHub: [@Harshit765G4](https://github.com/Harshit765G4)  
- LinkedIn: *[Your LinkedIn URL]*  
- Portfolio: *[Your Portfolio Website]*

---

## ⭐ Support & Contributions

If you found this useful, please ⭐ the repo!  
Feel free to open issues or submit PRs.
