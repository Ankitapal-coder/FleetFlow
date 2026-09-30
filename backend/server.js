const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// PostgreSQL Connection
// ===============================

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD || "YOUR_PASSWORD",
  port: Number(process.env.DB_PORT) || 5432,
});

// Test database connection
pool.connect()
  .then((client) => {
    console.log("✅ PostgreSQL Connected");
    client.release();
  })
  .catch((err) => {
    console.log("❌ PostgreSQL Connection Error:", err.message);
  });


// ===============================
// Create Tables Automatically
// ===============================

async function createTables() {
  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        driver_name VARCHAR(100),
        latitude DOUBLE PRECISION DEFAULT 26.8467,
        longitude DOUBLE PRECISION DEFAULT 80.9462,
        status VARCHAR(30) DEFAULT 'Available',
        speed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        customer_name VARCHAR(100),
        destination VARCHAR(200),
        status VARCHAR(30) DEFAULT 'Pending',
        vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tables ready");

  } catch (error) {
    console.log("❌ Table Error:", error.message);
  }
}

createTables();


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "🚚 Fleet Tracking API is running",
    status: "success"
  });
});


// ===============================
// VEHICLES
// ===============================

// Get all vehicles
app.get("/api/vehicles", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM vehicles
      ORDER BY id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to fetch vehicles",
      error: error.message
    });

  }

});


// Add vehicle
app.post("/api/vehicles", async (req, res) => {

  try {

    const {
      vehicle_number,
      driver_name,
      latitude,
      longitude,
      status,
      speed
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO vehicles
      (
        vehicle_number,
        driver_name,
        latitude,
        longitude,
        status,
        speed
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        vehicle_number,
        driver_name,
        latitude || 26.8467,
        longitude || 80.9462,
        status || "Available",
        speed || 0
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Failed to add vehicle",
      error: error.message
    });

  }

});

// Edit vehicle
app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_number, driver_name, status, speed } = req.body;

    const result = await pool.query(
      `
      UPDATE vehicles
      SET vehicle_number = $1,
          driver_name = $2,
          status = $3,
          speed = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [vehicle_number, driver_name, status, speed || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update vehicle",
      error: error.message
    });
  }
});


// Update vehicle location
app.put("/api/vehicles/:id/location", async (req, res) => {

  try {

    const { id } = req.params;

    const {
      latitude,
      longitude,
      speed,
      status
    } = req.body;

    const result = await pool.query(
      `
      UPDATE vehicles
      SET
        latitude = $1,
        longitude = $2,
        speed = $3,
        status = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [
        latitude,
        longitude,
        speed || 0,
        status || "On Route",
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      message: "Failed to update location",
      error: error.message
    });

  }

});


// Delete vehicle
app.delete("/api/vehicles/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM vehicles WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json({
      message: "Vehicle deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to delete vehicle",
      error: error.message
    });

  }

});


// ===============================
// SHIPMENTS
// ===============================

// Get all shipments
app.get("/api/shipments", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        shipments.*,
        vehicles.vehicle_number,
        vehicles.driver_name
      FROM shipments
      LEFT JOIN vehicles
      ON shipments.vehicle_id = vehicles.id
      ORDER BY shipments.id DESC
    `);

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch shipments",
      error: error.message
    });

  }

});


// Add shipment
app.post("/api/shipments", async (req, res) => {

  try {

    const {
      tracking_number,
      customer_name,
      destination,
      status,
      vehicle_id
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO shipments
      (
        tracking_number,
        customer_name,
        destination,
        status,
        vehicle_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        tracking_number,
        customer_name,
        destination,
        status || "Pending",
        vehicle_id || null
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      message: "Failed to add shipment",
      error: error.message
    });

  }

});


// Update shipment status
app.put("/api/shipments/:id/status", async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE shipments
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      message: "Failed to update shipment",
      error: error.message
    });

  }

});


// Delete shipment
app.delete("/api/shipments/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM shipments WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }

    res.json({
      message: "Shipment deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to delete shipment",
      error: error.message
    });

  }

});


// ===============================
// DASHBOARD ANALYTICS
// ===============================

app.get("/api/analytics", async (req, res) => {

  try {

    const vehicles = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Available') AS available,
        COUNT(*) FILTER (WHERE status = 'On Route') AS on_route,
        COUNT(*) FILTER (WHERE status = 'Maintenance') AS maintenance
      FROM vehicles
    `);

    const shipments = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'In Transit') AS in_transit,
        COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered
      FROM shipments
    `);

    res.json({
      vehicles: vehicles.rows[0],
      shipments: shipments.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      message: "Analytics error",
      error: error.message
    });

  }

});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚚 Server running on http://localhost:${PORT}`);
});