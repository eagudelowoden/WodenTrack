require("dotenv").config();
const express = require("express");
const xmlrpc = require("xmlrpc");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(bodyParser.json());

const odooConfig = {
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USER,
  password: process.env.ODOO_PASS,
};

const common = xmlrpc.createSecureClient(`${odooConfig.url}/xmlrpc/2/common`);
const models = xmlrpc.createSecureClient(`${odooConfig.url}/xmlrpc/2/object`);

// --- RUTAS ADMIN ---
const adminRoutes = require("./routes/admin")(odooConfig, common, models);
app.use("/admin", adminRoutes);

// --- LOGIN CON VALIDACIÓN DE ESTADO ---
app.post("/login", (req, res) => {
  const { usuario, password } = req.body;
  const hoyInicio = new Date().toISOString().split("T")[0] + " 00:00:00";

  // 1. VALIDACIÓN: Campos vacíos
  if (!usuario || !password) {
    return res.status(400).json({
      status: "error",
      message: "Por favor, ingrese usuario y contraseña",
    });
  }

  // 2. VALIDACIÓN: Credenciales (Simetría PIN/Password)
  if (usuario !== password) {
    return res.status(401).json({
      status: "error",
      message: "La contraseña no coincide con el usuario",
    });
  }

  // 3. CONEXIÓN CON ODOO
  common.methodCall(
    "authenticate",
    [odooConfig.db, odooConfig.username, odooConfig.password, {}],
    (err, uid) => {
      if (err || !uid) {
        console.error("Odoo Connection Error:", err);
        return res.status(503).json({
          status: "error",
          message: "Odoo no responde. Verifique su conexión.",
        });
      }

      // 4. BUSCAR EMPLEADO
      models.methodCall(
        "execute_kw",
        [
          odooConfig.db,
          uid,
          odooConfig.password,
          "hr.employee",
          "search_read",
          [[["pin", "=", usuario]]],
          { fields: ["id", "name", "job_id"], limit: 1 },
        ],
        (err, employees) => {
          if (err || !employees || !employees.length) {
            return res.status(404).json({
              status: "error",
              message: "El usuario no existe en la base de datos",
            });
          }

          const emp = employees[0];
          const cargoRaw = emp.job_id ? emp.job_id[1] : "SIN CARGO";
          const cargo = cargoRaw.toUpperCase();

          // --- LÓGICA DE FILTRADO DINÁMICO ---

          // Palabras clave para Administradores
          const palabrasAdmin = [
            "GERENTE",
            "COORDINADOR",
            "JEFE",
            "DESARROLLADOR",
          ];

          // Filtro de exclusión: Estos cargos SIEMPRE serán 'user' aunque contengan palabras de admin
          const esSubalterno =
            cargo.includes("AUXILIAR") ||
            cargo.includes("PRACTICANTE") ||
            cargo.includes("ANALISTA") ||
            cargo.includes("APRENDIZ") ||
            cargo.includes("ASISTENTE") ||
            cargo.includes("INSPECTOR");

          // Validación especial para "TI" (evita que PRACTICANTE sea admin por las letras 'ti')
          const esTI =
            cargo === "TI" ||
            cargo.includes(" TI ") ||
            cargo.startsWith("TI ") ||
            cargo.endsWith(" TI");
          // ¿Tiene alguna palabra de mando?
          const tieneMandoGeneral = palabrasAdmin.some((palabra) =>
            cargo.includes(palabra)
          );

          // ROL FINAL: (Mando General O es TI) Y NO es subalterno
          const esAdmin = (tieneMandoGeneral || esTI) && !esSubalterno;
          const rolAsignado = esAdmin ? "admin" : "user";

          console.log(
            `[LOGIN] Usuario: ${emp.name} | Cargo: ${cargoRaw} | Rol: ${rolAsignado}`
          );

          // 5. VALIDACIÓN DE ESTADO (ASISTENCIA)
          models.methodCall(
            "execute_kw",
            [
              odooConfig.db,
              uid,
              odooConfig.password,
              "hr.attendance",
              "search_count",
              [
                [
                  ["employee_id", "=", emp.id],
                  ["check_out", "=", false],
                ],
              ],
            ],
            (err, openCount) => {
              models.methodCall(
                "execute_kw",
                [
                  odooConfig.db,
                  uid,
                  odooConfig.password,
                  "hr.attendance",
                  "search_count",
                  [
                    [
                      ["employee_id", "=", emp.id],
                      ["check_out", ">=", hoyInicio],
                    ],
                  ],
                ],
                (err, completedCount) => {
                  const isInside = openCount > 0;
                  const dayCompleted = completedCount > 0 && !isInside;

                  res.json({
                    status: "success",
                    employee_id: emp.id,
                    name: emp.name,
                    job: cargoRaw,
                    role: rolAsignado,
                    is_inside: isInside,
                    day_completed: dayCompleted,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
// --- MARCACIÓN EN TIEMPO REAL ---
app.post("/attendance", (req, res) => {
  const { employee_id } = req.body;
  // Odoo espera la fecha en UTC o formato ISO string limpio
  const nowStr = new Date().toISOString().replace("T", " ").split(".")[0];

  common.methodCall(
    "authenticate",
    [odooConfig.db, odooConfig.username, odooConfig.password, {}],
    (err, uid) => {
      if (err || !uid) return res.status(401).json({ error: "Fallo Auth" });

      models.methodCall(
        "execute_kw",
        [
          odooConfig.db,
          uid,
          odooConfig.password,
          "hr.attendance",
          "search_read",
          [
            [
              ["employee_id", "=", parseInt(employee_id)],
              ["check_out", "=", false],
            ],
          ],
          { fields: ["id"], limit: 1 },
        ],
        (err, lastAttendance) => {
          if (lastAttendance && lastAttendance.length > 0) {
            // REGISTRAR SALIDA
            models.methodCall(
              "execute_kw",
              [
                odooConfig.db,
                uid,
                odooConfig.password,
                "hr.attendance",
                "write",
                [[lastAttendance[0].id], { check_out: nowStr }],
              ],
              (err, result) => {
                res.json({
                  status: "success",
                  type: "out",
                  message: "Salida registrada con éxito",
                });
              }
            );
          } else {
            // REGISTRAR ENTRADA
            models.methodCall(
              "execute_kw",
              [
                odooConfig.db,
                uid,
                odooConfig.password,
                "hr.attendance",
                "create",
                [{ employee_id: parseInt(employee_id), check_in: nowStr }],
              ],
              (err, newId) => {
                res.json({
                  status: "success",
                  type: "in",
                  message: "Entrada registrada con éxito",
                });
              }
            );
          }
        }
      );
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Servidor WodenTrack en puerto ${PORT}`)
);
