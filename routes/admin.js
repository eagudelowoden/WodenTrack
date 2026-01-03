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
    return router;
};