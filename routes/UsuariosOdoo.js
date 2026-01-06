const express = require("express");
const router = express.Router();

// Auxiliar: Convierte hora decimal de Odoo (9.5) a minutos (570)
const decimalToMinutes = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    return (hours * 60) + minutes;
};

module.exports = (models, odooConfig, common) => {

    // --- RUTA: LOGIN ---
    router.post("/login", (req, res) => {
        const { usuario, password } = req.body;
        const hoyInicio = new Date().toISOString().split("T")[0] + " 00:00:00";

        if (!usuario || !password || usuario !== password) {
            return res.status(401).json({ status: "error", message: "Credenciales inválidas" });
        }

        common.methodCall("authenticate", [odooConfig.db, odooConfig.username, odooConfig.password, {}], (err, uid) => {
            if (err || !uid) return res.status(503).json({ status: "error", message: "Error Odoo" });

            models.methodCall("execute_kw", [
                odooConfig.db, uid, odooConfig.password,
                "hr.employee", "search_read",
                [[["pin", "=", usuario]]],
                { fields: ["id", "name", "job_id"], limit: 1 },
            ], (err, employees) => {
                if (err || !employees.length) return res.status(404).json({ status: "error", message: "No existe" });

                const emp = employees[0];
                const cargo = (emp.job_id ? emp.job_id[1] : "SIN CARGO").toUpperCase();

                // Lógica de Roles
                const palabrasAdmin = ["GERENTE", "COORDINADOR", "JEFE", "DESARROLLADOR"];
                const esSubalterno = ["AUXILIAR", "PRACTICANTE", "ANALISTA", "APRENDIZ", "ASISTENTE", "INSPECTOR"].some(p => cargo.includes(p));
                const esTI = cargo === "TI" || cargo.includes(" TI ") || cargo.startsWith("TI ") || cargo.endsWith(" TI");
                const esAdmin = (palabrasAdmin.some(p => cargo.includes(p)) || esTI) && !esSubalterno;

                // Validación de asistencia abierta hoy
                models.methodCall("execute_kw", [
                    odooConfig.db, uid, odooConfig.password,
                    "hr.attendance", "search_count",
                    [[["employee_id", "=", emp.id], ["check_out", "=", false]]]
                ], (err, openCount) => {
                    models.methodCall("execute_kw", [
                        odooConfig.db, uid, odooConfig.password,
                        "hr.attendance", "search_count",
                        [[["employee_id", "=", emp.id], ["check_out", ">=", hoyInicio]]]
                    ], (err, completedCount) => {
                        res.json({
                            status: "success",
                            employee_id: emp.id,
                            name: emp.name,
                            job: emp.job_id ? emp.job_id[1] : "SIN CARGO",
                            role: esAdmin ? "admin" : "user",
                            is_inside: openCount > 0,
                            day_completed: completedCount > 0 && openCount === 0
                        });
                    });
                });
            });
        });
    });

    // --- RUTA: MARCACIÓN (ASISTENCIA) CON CRUCE DE MALLAS ---
    router.post("/attendance", (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        const nowStr = now.toISOString().replace("T", " ").split(".")[0];
        const dayOfWeekOdoo = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();

        common.methodCall("authenticate", [odooConfig.db, odooConfig.username, odooConfig.password, {}], (err, uid) => {
            if (err || !uid) return res.status(401).json({ error: "Fallo Auth" });

            // 1. Buscar si hay asistencia abierta (Check-out)
            models.methodCall("execute_kw", [
                odooConfig.db, uid, odooConfig.password,
                "hr.attendance", "search_read",
                [[["employee_id", "=", parseInt(employee_id)], ["check_out", "=", false]]],
                { fields: ["id"], limit: 1 }
            ], (err, lastAtt) => {
                const isCheckOut = lastAtt && lastAtt.length > 0;

                // 2. Buscar Contrato y Malla
                models.methodCall("execute_kw", [
                    odooConfig.db, uid, odooConfig.password,
                    "hr.contract", "search_read",
                    [[["employee_id", "=", parseInt(employee_id)], ["state", "=", "open"]]],
                    { fields: ["resource_calendar_id"], limit: 1 }
                ], (err, contracts) => {
                    const calId = contracts?.length ? contracts[0].resource_calendar_id[0] : null;

                    if (!calId) {
                        return finalizarRegistro(uid, employee_id, isCheckOut, isCheckOut ? lastAtt[0].id : null, "SIN MALLA", nowStr, res);
                    }

                    // 3. Buscar Horario en la Malla
                    models.methodCall("execute_kw", [
                        odooConfig.db, uid, odooConfig.password,
                        "resource.calendar.attendance", "search_read",
                        [[["calendar_id", "=", calId], ["dayofweek", "=", dayOfWeekOdoo.toString()]]],
                        { fields: ["hour_from", "hour_to"] }
                    ], (err, mallas) => {
                        let estado = "A TIEMPO";
                        if (mallas?.length) {
                            const h = mallas.sort((a,b) => a.hour_from - b.hour_from)[0];
                            if (!isCheckOut) {
                                if (currentMinutes > (decimalToMinutes(h.hour_from) + 5)) estado = "TARDE";
                            } else {
                                if (currentMinutes < decimalToMinutes(h.hour_to)) estado = "SALIDA ANTICIPADA";
                            }
                        }
                        finalizarRegistro(uid, employee_id, isCheckOut, isCheckOut ? lastAtt[0].id : null, estado, nowStr, res);
                    });
                });
            });
        });
    });

    function finalizarRegistro(uid, empId, isOut, attId, estado, nowStr, res) {
        if (isOut) {
            models.methodCall("execute_kw", [
                odooConfig.db, uid, odooConfig.password,
                "hr.attendance", "write",
                [[attId], { check_out: nowStr, "x_studio_salida": estado }]
            ], () => res.json({ status: "success", type: "out", message: estado }));
        } else {
            models.methodCall("execute_kw", [
                odooConfig.db, uid, odooConfig.password,
                "hr.attendance", "create",
                [{ employee_id: parseInt(empId), check_in: nowStr, "x_studio_comentario": estado }]
            ], () => res.json({ status: "success", type: "in", message: estado }));
        }
    }

    return router;
};