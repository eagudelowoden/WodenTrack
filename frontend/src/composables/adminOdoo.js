import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAttendance } from './useAttendance';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx'; // Asegúrate de tenerlo instalado: npm install xlsx

export function adminOdoo() {

    const router = useRouter();
    const att = useAttendance();
    const showTable = ref(false); // <--- Nueva variable (puedes poner true si quieres que inicie visible)
    
    const report = ref([]);
    const searchQuery = ref('');
    const isExporting = ref(false); // Estado para el botón de Excel
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    let intervalId = null;

    // Reporte para la tabla (Dashboard rápido)
    const fetchReport = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/report`);
            if (!res.ok) throw new Error("Error en el servidor");
            const data = await res.json();
            report.value = data; 
        } catch (err) {
            console.error("Error cargando reporte", err);
        }
    };

    // FUNCIÓN PARA DESCARGAR EXCEL (Endpoint aparte)
    const downloadExcelReport = async () => {
        isExporting.value = true;
        try {
            // Llamamos al endpoint especializado que calcula horas y decimales
            const res = await fetch(`${API_BASE_URL}/admin/export-excel`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Generar el libro de Excel
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias_Woden");

            // Nombre del archivo con fecha actual
            const fileName = `Reporte_General_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Descargar
            XLSX.writeFile(workbook, fileName);
            att.showToast("Excel generado correctamente", "success");
        } catch (err) {
            console.error("Error en Excel", err);
            att.showToast("No se pudo generar el reporte", "error");
        } finally {
            isExporting.value = false;
        }
    };

    const filteredReport = computed(() => {
        if (!searchQuery.value) return report.value;
        return report.value.filter(item => 
            item.empleado.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });

    const checkSecurity = () => {
        const session = localStorage.getItem('user_session');
        if (!session) {
            router.push('/');
            return false;
        }
        return true;
    };

    onMounted(() => {
        if (checkSecurity()) {
            fetchReport();
            intervalId = setInterval(fetchReport, 60000);
        }
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return {
        ...att, // Esto ya incluye employee, loading, currentTime, message, etc.
        report, 
        filteredReport,
        searchQuery,
        isExporting,
        fetchReport,
        downloadExcelReport, // <--- Nueva función para el botón
        showTable
    };
}