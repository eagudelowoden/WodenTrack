require("dotenv").config();
const express = require("express");
const xmlrpc = require("xmlrpc");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(bodyParser.json());

const odooConfig = {
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USER,
  password: process.env.ODOO_PASS,
};

const common = xmlrpc.createSecureClient(`${odooConfig.url}/xmlrpc/2/common`);
const models = xmlrpc.createSecureClient(`${odooConfig.url}/xmlrpc/2/object`);

// --- IMPORTAR RUTAS MODULARES ---
const adminRoutes = require("./routes/admin")(odooConfig, common, models);
const attendanceRoutes = require("./routes/UsuariosOdoo")(models, odooConfig, common);

// --- USAR RUTAS ---
app.use("/", adminRoutes);
app.use("/", attendanceRoutes); // Aquí viven ahora /login y /attendance

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Servidor WodenTrack en puerto ${PORT}`)
);