# 🎵 DailySong.io  

DailySong.io is a simple **Node.js + Express + MySQL** application that collects weekly song suggestions and lets users vote on them.  
Each user can add **only one song per day** and vote for other songs.  
At the end of the week, the most voted songs are highlighted, the week is closed, and a new one starts automatically.  

---

## 🚀 Features
-  Weekly song list  
-  Add **one song per day**  
-  Voting system (IP-based restriction to prevent duplicate votes on the same song)  
-  Highlight the top songs of the week  
-  Weekly archive (view previous weeks)  
-  Automatic weekly reset (via cron job)  
-  **Dark Mode** support  

---

## 🛠 Tech Stack
- **Backend:** Node.js (Express.js)  
- **Database:** MySQL  
- **Frontend:** EJS + Bootstrap (with Dark Mode support)  
- **Other:** Express-session, body-parser, node-cron  

---

## 📂 Installation
```bash
# Clone the repo
git clone https://github.com/username/dailysong-io.git
cd dailysong-io

# Install dependencies
npm install

# Create and configure your .env file
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdbname

# Start the server
node app.js
