🧾 Inventory Management System (MERN Stack)

A full-stack Inventory Management System built using MongoDB, Express.js, React, and Node.js (MERN). This application helps manage products, purchases, and sales — providing real-time stock updates and an organized dashboard for efficient inventory tracking.

🚀 Features

📦 Product Management – Add, edit, view, and delete products

🛒 Purchases Management – Record purchases to increase product stock

💰 Sales Management – Manage sales transactions and reduce stock automatically

📊 Reports & Analytics – Generate sales and purchase reports by date range

⚙️ Inventory Updates – Automatically updates product quantities after every purchase or sale

💾 Persistent Data – Data stored securely in MongoDB

🎨 Modern UI – Clean, responsive React frontend

🏗️ Tech Stack

Frontend: React.js (Hooks, Axios, React Router) SweetAlert2 for alerts Bootstrap / Tailwind CSS (optional styling)

Backend: Node.js Express.js

MongoDB with Mongoose ODM

JWT Authentication (optional)

dotenv for environment variables

📁 Project Structure inventory-management-system/ │ ├── frontend/ # React frontend │ ├── src/ │ ├── public/ │ └── package.json │ ├── backend/ # Node/Express backend │ ├── models/ │ ├── routes/ │ ├── server.js │ └── package.json │ └── README.md

⚙️ Setup Instructions

1️⃣ Clone the Repository git clone https://github.com/your-username/inventory-management-system.git cd inventory-management-system

2️⃣ Setup Backend cd backend npm install

Create a .env file inside the backend folder:

PORT=5000 MONGO_URI=your_mongodb_connection_string

Start the backend:
npm start

3️⃣ Setup Frontend

Open a new terminal: cd frontend 
npm install 
npm start

Frontend runs on: http://localhost:3000 
Backend runs on: http://localhost:5000

📦 API Endpoints Method Endpoint Description
GET /api/products Fetch all products 
POST /api/products Add new product 
PUT /api/products/:id Update product 
DELETE /api/products/:id Delete product 
GET /api/purchases Get all purchases 
POST /api/purchases Add new purchase 
GET /api/sales Get all sales 
POST /api/sales Record new sale

📈 Example Workflow

Add a product (e.g., “Blue Pen”, Quantity: 10). 
Record a purchase → Product stock increases. 
Record a sale → Product stock decreases automatically. 
View updated stock levels and generate reports.
