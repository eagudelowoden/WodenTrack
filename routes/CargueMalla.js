const express = require('express');
const router = express.Router();

// Función auxiliar para convertir hora decimal de Odoo (9.5) a minutos (570)
const decimalToMinutes = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    return (hours * 60) + minutes;
};

// Exportamos una función que recibe las dependencias de Odoo
module.exports = (models, odooConfig, uid) => {

    router.post("/attendance", async (req, res) => {
        const { employee_id } = req.body;
        const now = new Date();
        // Odoo dayofweek: 0=Lunes, 6=Domingo. JS: 0=Domingo, 1=Lunes.
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();

        // 1. Obtener el Calendario desde el Contrato del Empleado
        models.methodCall("execute_kw", [
            odooConfig.db, uid, odooConfig.password,
            "hr.contract", "search_read",
            [[["employee_id", "=", employee_id], ["state", "=", "open"]]], 
            { fields: ["resource_calendar_id"], limit: 1 }
        ], (err, contracts) => {
            if (err || !contracts || !contracts.length) {
                return registrarAsistencia(employee_id, "SIN CONTRATO", res, models, odooConfig, uid);
            }

            const calendarId = contracts[0].resource_calendar_id[0];

            // 2. Obtener los horarios (attendance_ids) de ese Calendario
            models.methodCall("execute_kw", [
                odooConfig.db, uid, odooConfig.password,
                "resource.calendar.attendance", "search_read",
                [[["calendar_id", "=", calendarId], ["dayofweek", "=", dayOfWeek.toString()]]],
                { fields: ["hour_from", "hour_to"] }
            ], (err, attendances) => {
                
                let comentario = "A TIEMPO";
                
                if (attendances && attendances.length > 0) {
                    // Ordenamos por hour_from para tomar la primera entrada del día
                    const horarios = attendances.sort((a, b) => a.hour_from - b.hour_from);
                    const horaEntradaMalla = horarios[0].hour_from; 
                    const mallaMinutes = decimalToMinutes(horaEntradaMalla);
                    
                    // VALIDACIÓN: Más de 5 minutos de retraso
                    if (currentMinutes > (mallaMinutes + 5)) {
                        comentario = "TARDE";
                    }
                }

                registrarAsistencia(employee_id, comentario, res, models, odooConfig, uid);
            });
        });
    });

    // Función interna para el registro final
    function registrarAsistencia(employee_id, estado, res, models, odooConfig, uid) {
        const comentarioField = "x_studio_comentario";
        
        // Primero verificamos si hay una asistencia abierta para saber si es Check-in o Check-out
        models.methodCall("execute_kw", [
            odooConfig.db, uid, odooConfig.password,
            "hr.attendance", "search",
            [[["employee_id", "=", employee_id], ["check_out", "=", false]]]
        ], (err, openAttendances) => {
            
            if (openAttendances && openAttendances.length > 0) {
                // Es una SALIDA (Check-out)
                const attendanceId = openAttendances[0];
                models.methodCall("execute_kw", [
                    odooConfig.db, uid, odooConfig.password,
                    "hr.attendance", "write",
                    [[attendanceId], { 
                        "check_out": new Date().toISOString().replace('T', ' ').split('.')[0],
                        "x_studio_salida": estado // Registramos si salió a tiempo/tarde
                    }]
                ], (err, result) => {
                    res.json({ status: "success", type: "out", estado });
                });
            } else {
                // Es una ENTRADA (Check-in)
                models.methodCall("execute_kw", [
                    odooConfig.db, uid, odooConfig.password,
                    "hr.attendance", "create",
                    [{ 
                        "employee_id": employee_id,
                        "check_in": new Date().toISOString().replace('T', ' ').split('.')[0],
                        [comentarioField]: estado 
                    }]
                ], (err, result) => {
                    res.json({ status: "success", type: "in", estado });
                });
            }
        });
    }

    return router;
};