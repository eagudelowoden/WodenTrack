import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAttendance } from './useAttendance';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';

export function adminOdoo() {
    const router = useRouter();
    const att = useAttendance(); 
    
    const currentModule = ref('novedades'); 
    const isSidebarOpen = ref(true); // Control global del sidebar
    const report = ref([]);
    const searchQuery = ref('');
    const isExporting = ref(false);
    
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    let intervalId = null;

    const fetchReport = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/report`);
            const data = await res.json();
            report.value = data; 
        } catch (err) {
            console.error("Error reporte:", err);
        }
    };

    const downloadExcelReport = async () => {
        isExporting.value = true;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/export-excel`);
            const data = await res.json();
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
            XLSX.writeFile(workbook, `Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
            att.showToast("Excel generado", "success");
        } catch (err) {
            att.showToast("Error Excel", "error");
        } finally {
            isExporting.value = false;
        }
    };

    onMounted(() => {
        fetchReport();
        intervalId = setInterval(fetchReport, 60000);
    });

    onUnmounted(() => { if (intervalId) clearInterval(intervalId); });

    return {
        ...att,
        currentModule,
        isSidebarOpen,
        report, 
        filteredReport: computed(() => {
            if (!searchQuery.value) return report.value;
            return report.value.filter(item => item.empleado.toLowerCase().includes(searchQuery.value.toLowerCase()));
        }),
        searchQuery,
        isExporting,
        fetchReport,
        downloadExcelReport,
        isSidebarOpen, // <--- Esto permite que el botón de ocultar funcione
    };
}