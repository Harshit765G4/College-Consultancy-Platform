# 🎓 ConsultNet - College Consultancy Platform 🚀

ConsultNet is a full-stack web application that streamlines the process of connecting students with colleges. It features AI-powered college search, a personalized student dashboard, application tracking, and a resubmission workflow — all built to simplify educational consultancy online.

---

## ✨ Features

- 🔐 **User Authentication** — Secure signup and login system using JWT.
- 🤖 **AI-Powered Search** — Search colleges by name, state, or course using the **Google Gemini API**.
- 🧑‍🎓 **Student Dashboard** — View and track applications: `Pending`, `Approved`, or `Rejected`.
- 📝 **College Applications** — Apply to colleges directly through the platform.
- 🔍 **Application Preview Modal** — Read-only popup to inspect submitted application details.
- ♻️ **Resubmission Workflow** — Request resubmission with an admin review process.
- 🧾 **Profile Management** — View/edit academic and personal data on a dedicated profile page.

---

## 🛠️ Tech Stack

### 🔧 Backend
- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** PostgreSQL  
- **ORM:** Sequelize  
- **Auth:** JSON Web Tokens (JWT)  

### 🎨 Frontend
- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)  
- **Styling:** Tailwind CSS  
- **AI Integration:** Google Gemini API  

---

## 🚀 Getting Started

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) and npm installed  
- [PostgreSQL](https://www.postgresql.org/) installed and running  
- [Git](https://git-scm.com/)  
- (Optional) [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS Code

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

#### Create a `.env` file in `consultancy-platform-backend/`:

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

Backend should now run at: [http://localhost:5000](http://localhost:5000)

---

### 💻 Frontend Setup

1. Open `College-Consultancy-Platform` in **VS Code**.
2. Navigate to the `FRONTEND` directory.
3. Open `js/common.js` and add your Gemini API key:

```js
// In FRONTEND/js/common.js
const GEMINI_API_KEY = "PASTE_YOUR_ACTUAL_GEMINI_API_KEY_HERE";
```

4. Right-click `index.html` and choose **"Open with Live Server"**.

Frontend runs at: [http://127.0.0.1:5500/FRONTEND/index.html](http://127.0.0.1:5500/FRONTEND/index.html)

---

## 📸 Screenshots

> Below are key interface previews. Replace with actual hosted URLs or embed them directly if hosted.

### 🏠 Homepage
![Homepage](https://i.imgur.com/screenshot1.png)

### 🔐 Login Screen
![Login](https://i.imgur.com/screenshot2.png)

### 📋 Application Form
![Application Form](https://i.imgur.com/screenshot3.png)

### 🧑‍🎓 Student Dashboard
![Dashboard](https://i.imgur.com/screenshot4.png)

### 🔍 Application Preview Modal
![Preview Modal](https://i.imgur.com/screenshot5.png)

### ♻️ Admin Resubmission View
![Resubmission](https://i.imgur.com/screenshot6.png)

### 🧾 Profile Management Page
![Profile](https://i.imgur.com/screenshot7.png)

> _You can host these on GitHub by uploading them in the repo's `assets` folder or embedding directly using relative paths once committed._

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Developed with ❤️ by **Harshit Garg**

- GitHub: [@Harshit765G4](https://github.com/Harshit765G4)
- LinkedIn: *[Your LinkedIn URL]*
- Portfolio: *[Your Portfolio URL]*

---

## ⭐ Support & Contributions

If you find this project useful, consider giving it a ⭐ star!  
Feel free to open issues or submit pull requests to improve functionality and design.
