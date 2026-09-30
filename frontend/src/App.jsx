import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  // =========================
  // STATES
  // =========================

  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showShipmentForm, setShowShipmentForm] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: "",
    driver_name: "",
    status: "Available",
    speed: 0
  });

  const [shipmentForm, setShipmentForm] = useState({
    tracking_number: "",
    customer_name: "",
    destination: "",
    status: "Pending",
    vehicle_id: ""
  });

  // =========================
  // NAVIGATION
  // =========================

  const goToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    try {
      const [
        vehicleRes,
        shipmentRes,
        analyticsRes
      ] = await Promise.all([
        fetch(`${API}/vehicles`),
        fetch(`${API}/shipments`),
        fetch(`${API}/analytics`)
      ]);

      const vehicleData = await vehicleRes.json();
      const shipmentData = await shipmentRes.json();
      const analyticsData = await analyticsRes.json();

      setVehicles(
        Array.isArray(vehicleData) ? vehicleData : []
      );

      setShipments(
        Array.isArray(shipmentData) ? shipmentData : []
      );

      setAnalytics(analyticsData);

      setLastUpdated(new Date());

    } catch (error) {
      console.error("API Error:", error);
    }
  };

  // =========================
  // AUTO REFRESH
  // =========================

  useEffect(() => {
    loadData();

    const timer = setInterval(loadData, 5000);

    return () => clearInterval(timer);
  }, []);

  // =========================
  // ADD VEHICLE
  // =========================

  const addVehicle = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vehicleForm)
      });

      if (!response.ok) {
        throw new Error("Failed to add vehicle");
      }

      setVehicleForm({
        vehicle_number: "",
        driver_name: "",
        status: "Available",
        speed: 0
      });

      setShowVehicleForm(false);

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Vehicle add nahi hua");
    }
  };

  // =========================
  // EDIT VEHICLE
  // =========================

  const editVehicle = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API}/vehicles/${editingVehicle.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(editingVehicle)
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update vehicle");
      }

      setEditingVehicle(null);

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Vehicle update nahi hua");
    }
  };

  // =========================
  // DELETE VEHICLE
  // =========================

  const deleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/vehicles/${id}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete vehicle");
      }

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Vehicle delete nahi hua");
    }
  };

  // =========================
  // ADD SHIPMENT
  // =========================

  const addShipment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...shipmentForm,
          vehicle_id: shipmentForm.vehicle_id
            ? Number(shipmentForm.vehicle_id)
            : null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add shipment");
      }

      setShipmentForm({
        tracking_number: "",
        customer_name: "",
        destination: "",
        status: "Pending",
        vehicle_id: ""
      });

      setShowShipmentForm(false);

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Shipment add nahi hua");
    }
  };

  // =========================
  // DELETE SHIPMENT
  // =========================

  const deleteShipment = async (id) => {
    if (!window.confirm("Delete this shipment?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/shipments/${id}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete shipment");
      }

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Shipment delete nahi hua");
    }
  };

  // =========================
  // UPDATE SHIPMENT STATUS
  // =========================

  const updateShipmentStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/shipments/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadData();

    } catch (error) {
      console.error(error);
      alert("Status update nahi hua");
    }
  };

  // =========================
  // FILTER SHIPMENTS
  // =========================

  const filteredShipments = useMemo(() => {
    return shipments.filter((item) => {
      const text = search.toLowerCase();

      const searchMatch =
        item.tracking_number
          ?.toLowerCase()
          .includes(text) ||
        item.customer_name
          ?.toLowerCase()
          .includes(text) ||
        item.destination
          ?.toLowerCase()
          .includes(text) ||
        item.vehicle_number
          ?.toLowerCase()
          .includes(text);

      const statusMatch =
        statusFilter === "All" ||
        item.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [shipments, search, statusFilter]);

  // =========================
  // FILTER VEHICLES
  // =========================

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const text = vehicleSearch.toLowerCase();

      const searchMatch =
        vehicle.vehicle_number
          ?.toLowerCase()
          .includes(text) ||
        vehicle.driver_name
          ?.toLowerCase()
          .includes(text);

      const statusMatch =
        vehicleFilter === "All" ||
        vehicle.status === vehicleFilter;

      return searchMatch && statusMatch;
    });
  }, [vehicles, vehicleSearch, vehicleFilter]);

  // =========================
  // ALERTS
  // =========================

  const alerts = useMemo(() => {
    const result = [];

    vehicles.forEach((vehicle) => {
      if (vehicle.status === "Maintenance") {
        result.push({
          type: "warning",
          icon: "🔧",
          text: `${vehicle.vehicle_number} is under maintenance`
        });
      }
    });

    shipments.forEach((shipment) => {
      if (shipment.status === "Pending") {
        result.push({
          type: "pending",
          icon: "⏳",
          text: `${shipment.tracking_number} is pending`
        });
      }
    });

    return result;
  }, [vehicles, shipments]);

  // =========================
  // EXPORT CSV
  // =========================

  const exportCSV = () => {
    if (filteredShipments.length === 0) {
      alert("Export karne ke liye shipment data nahi hai");
      return;
    }

    const headers = [
      "Tracking ID",
      "Customer",
      "Destination",
      "Vehicle",
      "Status"
    ];

    const rows = filteredShipments.map((item) => [
      item.tracking_number,
      item.customer_name,
      item.destination,
      item.vehicle_number || "Unassigned",
      item.status
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fleetflow-shipments.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================
  // CALCULATIONS
  // =========================

  const totalVehicles = vehicles.length;

  const onRouteVehicles = vehicles.filter(
    (v) => v.status === "On Route"
  ).length;

  const availableVehicles = vehicles.filter(
    (v) => v.status === "Available"
  ).length;

  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "Maintenance"
  ).length;

  const totalShipments = shipments.length;

  const deliveredShipments = shipments.filter(
    (s) => s.status === "Delivered"
  ).length;

  const transitShipments = shipments.filter(
    (s) => s.status === "In Transit"
  ).length;

  const pendingShipments = shipments.filter(
    (s) => s.status === "Pending"
  ).length;

  const deliveryRate = totalShipments
    ? Math.round(
        (deliveredShipments / totalShipments) * 100
      )
    : 0;

  const fleetUtilization = totalVehicles
    ? Math.round(
        (onRouteVehicles / totalVehicles) * 100
      )
    : 0;

  // =========================
  // UI
  // =========================

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">
          🚚 <span>FleetFlow</span>
        </div>

        <nav>

          <div
            className="nav active"
            onClick={() => goToSection("dashboard")}
          >
            📊 Dashboard
          </div>

          <div
            className="nav"
            onClick={() => goToSection("vehicles")}
          >
            🚛 Vehicles
          </div>

          <div
            className="nav"
            onClick={() => goToSection("shipments")}
          >
            📦 Shipments
          </div>

          <div
            className="nav"
            onClick={() => goToSection("tracking")}
          >
            🗺️ Live Tracking
          </div>

          <div
            className="nav"
            onClick={() => goToSection("analytics")}
          >
            📈 Analytics
          </div>

          <div
            className="nav"
            onClick={() => goToSection("alerts")}
          >
            🔔 Alerts
          </div>

          <div
            className="nav"
            onClick={() =>
              alert(
                "FleetFlow Settings\n\nSystem: Online\nAuto Refresh: 5 seconds\nDatabase: PostgreSQL"
              )
            }
          >
            ⚙️ Settings
          </div>

        </nav>

        <div className="system">
          <span></span>
          System Online
        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main" id="dashboard">

        {/* ================= HEADER ================= */}

        <header className="header">

          <div>
            <h1>Fleet Dashboard</h1>

            <p>
              Real-time logistics & fleet monitoring
            </p>

            <small>
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString()}
            </small>
          </div>

          <div className="header-right">

            <div className="live">
              <span></span>
              LIVE
            </div>

            <div className="admin">
              👤 Admin
            </div>

          </div>

        </header>

        {/* ================= STATS ================= */}

        <section className="stats">

          <div className="stat-card">
            <div className="icon blue">
              🚛
            </div>

            <div>
              <p>Total Vehicles</p>

              <h2>{totalVehicles}</h2>

              <small>
                {availableVehicles} available
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="icon purple">
              📦
            </div>

            <div>
              <p>Total Shipments</p>

              <h2>{totalShipments}</h2>

              <small>
                {pendingShipments} pending
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="icon green">
              ✓
            </div>

            <div>
              <p>Delivered</p>

              <h2>{deliveredShipments}</h2>

              <small>
                {deliveryRate}% delivery rate
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="icon orange">
              ⏱
            </div>

            <div>
              <p>In Transit</p>

              <h2>{transitShipments}</h2>

              <small>
                Currently moving
              </small>
            </div>
          </div>

        </section>

        {/* ================= LIVE TRACKING ================= */}

        <section
          className="top-grid"
          id="tracking"
        >

          {/* MAP */}

          <div className="card">

            <div className="card-header">

              <div>
                <h2>
                  Live Vehicle Tracking
                </h2>

                <p>
                  Real-time fleet locations
                </p>
              </div>

              <div className="live-badge">
                ● Live
              </div>

            </div>

            <div className="real-map">

              <MapContainer
                center={[27.5, 79.5]}
                zoom={6}
                style={{
                  height: "320px",
                  width: "100%"
                }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {vehicles.map((vehicle) => (

                  <Marker
                    key={vehicle.id}
                    position={[
                      Number(vehicle.latitude),
                      Number(vehicle.longitude)
                    ]}
                  >

                    <Popup>

                      <strong>
                        🚛 {vehicle.vehicle_number}
                      </strong>

                      <br />

                      Driver:{" "}
                      {vehicle.driver_name}

                      <br />

                      Speed:{" "}
                      {vehicle.speed} km/h

                      <br />

                      Status:{" "}
                      {vehicle.status}

                      <br />

                      <button
                        className="popup-btn"
                        onClick={() =>
                          setSelectedVehicle(vehicle)
                        }
                      >
                        View Details
                      </button>

                    </Popup>

                  </Marker>

                ))}

              </MapContainer>

            </div>

            <div className="map-footer">

              <span>
                🟢 Active: {onRouteVehicles}
              </span>

              <span>
                🚚 Total: {totalVehicles}
              </span>

              <span>
                🔄 Auto refresh: 5 sec
              </span>

            </div>

          </div>

          {/* VEHICLES */}

          <div
            className="card"
            id="vehicles"
          >

            <div className="card-header">

              <div>
                <h2>
                  Fleet Vehicles
                </h2>

                <p>
                  Current vehicle status
                </p>
              </div>

              <button
                className="add-btn"
                onClick={() =>
                  setShowVehicleForm(
                    !showVehicleForm
                  )
                }
              >
                + Add Vehicle
              </button>

            </div>

            {/* VEHICLE SEARCH */}

            <div className="filters">

              <input
                type="text"
                placeholder="Search vehicle / driver..."
                value={vehicleSearch}
                onChange={(e) =>
                  setVehicleSearch(e.target.value)
                }
              />

              <select
                value={vehicleFilter}
                onChange={(e) =>
                  setVehicleFilter(e.target.value)
                }
              >
                <option>All</option>
                <option>Available</option>
                <option>On Route</option>
                <option>Maintenance</option>
              </select>

            </div>

            {/* ADD VEHICLE */}

            {showVehicleForm && (

              <form
                className="vehicle-form"
                onSubmit={addVehicle}
              >

                <input
                  type="text"
                  placeholder="Vehicle Number"
                  value={vehicleForm.vehicle_number}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vehicle_number:
                        e.target.value
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Driver Name"
                  value={vehicleForm.driver_name}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      driver_name:
                        e.target.value
                    })
                  }
                  required
                />

                <select
                  value={vehicleForm.status}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      status: e.target.value
                    })
                  }
                >
                  <option>Available</option>
                  <option>On Route</option>
                  <option>Maintenance</option>
                </select>

                <input
                  type="number"
                  placeholder="Speed"
                  value={vehicleForm.speed}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      speed: Number(e.target.value)
                    })
                  }
                />

                <button type="submit">
                  Save Vehicle
                </button>

              </form>

            )}

            {/* EDIT VEHICLE */}

            {editingVehicle && (

              <form
                className="vehicle-form"
                onSubmit={editVehicle}
              >

                <strong>
                  Edit Vehicle
                </strong>

                <input
                  value={editingVehicle.vehicle_number}
                  onChange={(e) =>
                    setEditingVehicle({
                      ...editingVehicle,
                      vehicle_number:
                        e.target.value
                    })
                  }
                  required
                />

                <input
                  value={editingVehicle.driver_name}
                  onChange={(e) =>
                    setEditingVehicle({
                      ...editingVehicle,
                      driver_name:
                        e.target.value
                    })
                  }
                  required
                />

                <select
                  value={editingVehicle.status}
                  onChange={(e) =>
                    setEditingVehicle({
                      ...editingVehicle,
                      status:
                        e.target.value
                    })
                  }
                >
                  <option>Available</option>
                  <option>On Route</option>
                  <option>Maintenance</option>
                </select>

                <input
                  type="number"
                  value={editingVehicle.speed}
                  onChange={(e) =>
                    setEditingVehicle({
                      ...editingVehicle,
                      speed:
                        Number(e.target.value)
                    })
                  }
                />

                <button type="submit">
                  Update Vehicle
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingVehicle(null)
                  }
                >
                  Cancel
                </button>

              </form>

            )}

            {/* VEHICLE LIST */}

            <div className="vehicle-list">

              {filteredVehicles.length === 0 ? (

                <p>
                  No vehicles found.
                </p>

              ) : (

                filteredVehicles.map(
                  (vehicle) => (

                    <div
                      className="vehicle-item"
                      key={vehicle.id}
                    >

                      <div className="vehicle-icon">
                        🚛
                      </div>

                      <div className="vehicle-info">

                        <strong>
                          {vehicle.vehicle_number}
                        </strong>

                        <span>
                          {vehicle.driver_name}
                        </span>

                      </div>

                      <div className="speed">

                        <strong>
                          {vehicle.speed}
                        </strong>

                        <small>
                          km/h
                        </small>

                      </div>

                      <span
                        className={
                          vehicle.status === "On Route"
                            ? "status active"
                            : "status idle"
                        }
                      >
                        {vehicle.status}
                      </span>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          setEditingVehicle(vehicle)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteVehicle(vehicle.id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </section>

        {/* ================= SHIPMENTS ================= */}

        <section
          className="card shipment-card"
          id="shipments"
        >

          <div className="card-header shipment-head">

            <div>

              <h2>
                Shipment Tracking
              </h2>

              <p>
                Monitor delivery progress
              </p>

            </div>

            <div>

              <button
                className="export-btn"
                onClick={exportCSV}
              >
                📥 Export CSV
              </button>

              <button
                className="add-btn"
                onClick={() =>
                  setShowShipmentForm(
                    !showShipmentForm
                  )
                }
              >
                + Add Shipment
              </button>

            </div>

          </div>

          {/* SHIPMENT FORM */}

          {showShipmentForm && (

            <form
              className="shipment-form"
              onSubmit={addShipment}
            >

              <input
                type="text"
                placeholder="Tracking ID"
                value={
                  shipmentForm.tracking_number
                }
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    tracking_number:
                      e.target.value
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Customer Name"
                value={
                  shipmentForm.customer_name
                }
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    customer_name:
                      e.target.value
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Destination"
                value={
                  shipmentForm.destination
                }
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    destination:
                      e.target.value
                  })
                }
                required
              />

              <select
                value={shipmentForm.vehicle_id}
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    vehicle_id:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Unassigned
                </option>

                {vehicles.map((vehicle) => (

                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.vehicle_number}
                  </option>

                ))}

              </select>

              <select
                value={shipmentForm.status}
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    status: e.target.value
                  })
                }
              >

                <option>Pending</option>
                <option>In Transit</option>
                <option>Delivered</option>

              </select>

              <button type="submit">
                Save Shipment
              </button>

            </form>

          )}

          {/* SEARCH */}

          <div className="filters">

            <input
              type="text"
              placeholder="Search shipment, customer, destination..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >

              <option>All</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>

            </select>

          </div>

          {/* TABLE */}

          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredShipments.length === 0 ? (

                  <tr>
                    <td colSpan="6">
                      No shipments found.
                    </td>
                  </tr>

                ) : (

                  filteredShipments.map(
                    (shipment) => (

                      <tr key={shipment.id}>

                        <td>
                          <strong>
                            {shipment.tracking_number}
                          </strong>
                        </td>

                        <td>
                          {shipment.customer_name}
                        </td>

                        <td>
                          📍 {shipment.destination}
                        </td>

                        <td>
                          {shipment.vehicle_number ||
                            "Unassigned"}
                        </td>

                        <td>

                          <span
                            className={`shipment-status ${
                              shipment.status
                                .toLowerCase()
                                .replaceAll(" ", "-")
                            }`}
                          >
                            {shipment.status}
                          </span>

                        </td>

                        <td>

                          {shipment.status !==
                            "Delivered" && (

                            <select
                              className="status-select"
                              value={shipment.status}
                              onChange={(e) =>
                                updateShipmentStatus(
                                  shipment.id,
                                  e.target.value
                                )
                              }
                            >
                              <option>
                                Pending
                              </option>

                              <option>
                                In Transit
                              </option>

                              <option>
                                Delivered
                              </option>

                            </select>

                          )}

                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteShipment(
                                shipment.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================= ANALYTICS ================= */}

        <section
          className="analytics-grid"
          id="analytics"
        >

          {/* DELIVERY PERFORMANCE */}

          <div className="card analytics-card">

            <h2>
              Delivery Performance
            </h2>

            <p>
              Current shipment performance
            </p>

            <div className="progress-row">
              <span>Delivered</span>

              <strong>
                {deliveryRate}%
              </strong>
            </div>

            <div className="progress">

              <div
                className="progress-green"
                style={{
                  width: `${deliveryRate}%`
                }}
              />

            </div>

            <div className="progress-row">
              <span>In Transit</span>

              <strong>
                {totalShipments
                  ? Math.round(
                      (transitShipments /
                        totalShipments) *
                        100
                    )
                  : 0}
                %
              </strong>
            </div>

            <div className="progress">

              <div
                className="progress-blue"
                style={{
                  width: `${
                    totalShipments
                      ? (transitShipments /
                          totalShipments) *
                        100
                      : 0
                  }%`
                }}
              />

            </div>

            <div className="progress-row">
              <span>Pending</span>

              <strong>
                {totalShipments
                  ? Math.round(
                      (pendingShipments /
                        totalShipments) *
                        100
                    )
                  : 0}
                %
              </strong>
            </div>

            <div className="progress">

              <div
                className="progress-orange"
                style={{
                  width: `${
                    totalShipments
                      ? (pendingShipments /
                          totalShipments) *
                        100
                      : 0
                  }%`
                }}
              />

            </div>

          </div>

          {/* FLEET PERFORMANCE */}

          <div className="card analytics-card">

            <h2>
              Fleet Performance
            </h2>

            <p>
              Current fleet overview
            </p>

            <div className="performance">

              <div>
                <span>🚛</span>

                <strong>
                  {totalVehicles}
                </strong>

                <small>
                  Vehicles
                </small>
              </div>

              <div>
                <span>🛣️</span>

                <strong>
                  {fleetUtilization}%
                </strong>

                <small>
                  Fleet Utilization
                </small>
              </div>

              <div>
                <span>🔧</span>

                <strong>
                  {maintenanceVehicles}
                </strong>

                <small>
                  Maintenance
                </small>
              </div>

            </div>

          </div>

        </section>

        {/* ================= ALERT CENTER ================= */}

        <section
          className="card"
          id="alerts"
          style={{
            marginTop: "20px"
          }}
        >

          <div className="card-header">

            <div>
              <h2>
                🔔 Alert Center
              </h2>

              <p>
                Fleet and shipment notifications
              </p>
            </div>

            <strong>
              {alerts.length} Alerts
            </strong>

          </div>

          {alerts.length === 0 ? (

            <div className="alert-success">
              🟢 All systems normal. No active alerts.
            </div>

          ) : (

            <div className="alerts-list">

              {alerts.map((alert, index) => (

                <div
                  className="alert-item"
                  key={index}
                >

                  <span>
                    {alert.icon}
                  </span>

                  <div>
                    <strong>
                      {alert.type === "warning"
                        ? "Vehicle Alert"
                        : "Shipment Alert"}
                    </strong>

                    <p>
                      {alert.text}
                    </p>
                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ================= FOOTER ================= */}

        <footer>
          FleetFlow Logistics Platform © 2026
          {" | "}
          PostgreSQL + Express + React + Leaflet
        </footer>

      </main>

      {/* ================= VEHICLE DETAILS MODAL ================= */}

      {selectedVehicle && (

        <div className="modal-overlay">

          <div className="details-modal">

            <h2>
              🚛 Vehicle Details
            </h2>

            <div className="detail-row">
              <span>Vehicle Number</span>
              <strong>
                {selectedVehicle.vehicle_number}
              </strong>
            </div>

            <div className="detail-row">
              <span>Driver</span>
              <strong>
                {selectedVehicle.driver_name}
              </strong>
            </div>

            <div className="detail-row">
              <span>Status</span>
              <strong>
                {selectedVehicle.status}
              </strong>
            </div>

            <div className="detail-row">
              <span>Speed</span>
              <strong>
                {selectedVehicle.speed} km/h
              </strong>
            </div>

            <div className="detail-row">
              <span>Latitude</span>
              <strong>
                {selectedVehicle.latitude}
              </strong>
            </div>

            <div className="detail-row">
              <span>Longitude</span>
              <strong>
                {selectedVehicle.longitude}
              </strong>
            </div>

            <button
              className="add-btn"
              onClick={() =>
                setSelectedVehicle(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;