# FleetFlow - Real-Time Logistics & Fleet Tracking Platform

FleetFlow is a real-time logistics and fleet tracking platform designed to monitor vehicles, shipments, delivery status, and fleet performance from a single dashboard.

## 🚀 Features

- Real-time vehicle tracking
- Vehicle management
- Add, edit and delete vehicles
- Shipment management
- Shipment status updates
- Live map using Leaflet and OpenStreetMap
- Vehicle search and filtering
- Shipment search and filtering
- Fleet performance analytics
- Delivery performance tracking
- Alert Center
- CSV export for shipments
- Auto-refresh every 5 seconds
- PostgreSQL database

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Leaflet
- React Leaflet
- CSS

### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL

## 📁 Project Structure

```text
FleetFlow/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   └── config/
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    └── vite.config.js

    ▶️ Run Locally

Backend
cd backend
npm install
node server.js
Backend runs on:
http://localhost:5000

Frontend
Open another terminal:
cd frontend
npm install
npm run dev
Frontend runs on the Vite development server.

🔌 API Endpoints
Vehicles
GET    /api/vehicles
POST   /api/vehicles
PUT    /api/vehicles/:id
PUT    /api/vehicles/:id/location
DELETE /api/vehicles/:id

Shipments
GET    /api/shipments
POST   /api/shipments
PUT    /api/shipments/:id/status
DELETE /api/shipments/:id
Analytics
GET /api/analytics

🗺️ Map
FleetFlow uses Leaflet with OpenStreetMap to display vehicle locations on an interactive map.

📊 Dashboard
The dashboard provides:
Total vehicles
Total shipments
Delivered shipments
In-transit shipments
Fleet utilization
Delivery performance
Maintenance alerts

👩‍💻 Developer
Ankita Pal
BCA Student

