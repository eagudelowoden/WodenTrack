const express = require('express');
const router = express.Router();

module.exports = (odooConfig, common, models) => {
    router.get('/report', (req, res) => {
        const hoy = new Date().toISOString().split('T')[0];
        const inicioDia = hoy + " 00:00:00";
        const finDia = hoy + " 23:59:59";

        common.methodCall('authenticate', [odooConfig.db, odooConfig.username, odooConfig.password, {}], (err, uid) => {
            if (err || !uid) return res.status(401).json({ error: "Fallo Auth Admin" });

            models.methodCall('execute_kw', [
                odooConfig.db, uid, odooConfig.password,
                'hr.attendance', 'search_read',
                [[['check_in', '>=', inicioDia], ['check_in', '<=', finDia]]],
                { fields: ['employee_id', 'check_in', 'check_out'], order: 'check_in desc' }
            ], (err, attendances) => {
                if (err) return res.status(500).json({ error: "Error en Odoo Report" });

                const reporte = attendances.map(att => {
                    // 1. Convertir strings de Odoo a objetos Date (tratándolos como UTC)
                    const dateIn = new Date(att.check_in + " UTC");
                    const dateOut = att.check_out ? new Date(att.check_out + " UTC") : null;

                    // 2. Configurar formateador para Colombia (UTC-5)
                    const opciones = { 
                        timeZone: 'America/Bogota', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit', 
                        hour12: true 
                    };

                    // 3. Obtener la hora local formateada
                    const horaLocalIn = dateIn.toLocaleTimeString('en-US', opciones);
                    const horaLocalOut = dateOut ? dateOut.toLocaleTimeString('en-US', opciones) : 'En turno';

                    // 4. Lógica de retraso (08:05 AM Colombia = 13:05 UTC)
                    // Comparamos directamente con el objeto Date UTC para mayor precisión
                    const limite = new Date(att.check_in.split(' ')[0] + " 13:05:00 UTC");
                    const esTarde = dateIn > limite;

                    return {
                        id: att.id,
                        empleado: att.employee_id[1],
                        check_in: horaLocalIn, // Enviamos ya la hora de Colombia
                        check_out: horaLocalOut,
                        estado: esTarde ? 'TARDE' : 'A TIEMPO'
                    };
                });
                res.json(reporte);
            });
        });
    });
    // --- ENDPOINT ESPECÍFICO PARA EXCEL ---
router.get('/export-excel', (req, res) => {
    // Si no envían fechas, por defecto toma las de hoy
    const fechaInicio = req.query.desde || new Date().toISOString().split('T')[0] + " 00:00:00";
    const fechaFin = req.query.hasta || new Date().toISOString().split('T')[0] + " 23:59:59";

    common.methodCall('authenticate', [odooConfig.db, odooConfig.username, odooConfig.password, {}], (err, uid) => {
        if (err || !uid) return res.status(401).json({ error: "Fallo Auth" });

        models.methodCall('execute_kw', [
            odooConfig.db, uid, odooConfig.password,
            'hr.attendance', 'search_read',
            [[['check_in', '>=', fechaInicio], ['check_in', '<=', fechaFin]]],
            { 
                fields: ['employee_id', 'check_in', 'check_out'], 
                order: 'check_in desc' 
            }
        ], (err, attendances) => {
            if (err) return res.status(500).json({ error: "Error en Odoo" });

            const dataReporte = attendances.map(att => {
                const dateIn = new Date(att.check_in + " UTC");
                const dateOut = att.check_out ? new Date(att.check_out + " UTC") : null;

                const opciones = { 
                    timeZone: 'America/Bogota', 
                    hour: '2-digit', minute: '2-digit', hour12: true 
                };

                // Cálculo de duración
                let duracionDec = 0;
                let duracionTexto = "00:00";
                
                if (dateOut) {
                    const diffMs = dateOut - dateIn;
                    const totalMinutos = Math.floor(diffMs / 60000);
                    const hrs = Math.floor(totalMinutos / 60);
                    const mins = totalMinutos % 60;
                    duracionTexto = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                    duracionDec = parseFloat((diffMs / 3600000).toFixed(2)); // Horas en decimal para cálculos en Excel
                }

                return {
                    'ID': att.id,
                    'Empleado': att.employee_id[1],
                    'Fecha': dateIn.toLocaleDateString('es-CO'),
                    'Entrada': dateIn.toLocaleTimeString('en-US', opciones),
                    'Salida': dateOut ? dateOut.toLocaleTimeString('en-US', opciones) : 'En turno',
                    'Tiempo Total': duracionTexto,
                    'Horas Decimal': duracionDec,
                    'Estado': (dateIn > new Date(att.check_in.split(' ')[0] + " 13:05:00 UTC")) ? 'TARDE' : 'A TIEMPO'
                };
            });

            res.json(dataReporte);
        });
    });
});
    return router;
};