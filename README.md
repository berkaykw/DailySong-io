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
- **Frontend:** EJS + Bootstrap
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
```

<img width="1461" height="837" alt="Screenshot_2" src="https://github.com/user-attachments/assets/30989902-450b-48bd-b859-0cf53c639b22" />
<img width="1461" height="837" alt="<img width="1521" height="815" alt="444" src="https://github.com/user-attachments/assets/4b9e2094-93e2-4659-81fa-0e08038c7c95" />
<img width="1417" height="782" alt="333" src="https://github.com/user-attachments/assets/9caf05fd-e1e5-4878-ae26-c2b4fd503519" />
<img width="1457" height="823" alt="222" src="https://github.com/user-attachments/assets/2a6e385c-403c-4b2a-bfed-067eb92f5534" />
<img width="1681" height="823" alt="111" src="https://github.com/user-attachments/assets/15dd1303-39b3-4fa2-a717-3d7058ca0e31" /><img width="1512" height="817" alt="Screenshot_3" src="https://github.com/user-attachments/assets/75b76810-12c9-4264-919a-8edf36f86715" />


