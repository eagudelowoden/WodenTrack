import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAttendance } from './useAttendance';
import { useRouter } from 'vue-router';

export function adminOdoo() {
    const router = useRouter();
    const att = useAttendance();
    
    const report = ref([]);
    const searchQuery = ref(''); // Variable para el buscador
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    let intervalId = null;

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

    // LÓGICA DEL BUSCADOR: Filtra el reporte original según lo que escribas
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
        employee: att.employee,
        loading: att.loading,
        currentTime: att.currentTime,
        message: att.message,
        handleAttendance: att.handleAttendance,
        logout: att.logout,
        // IMPORTANTE: Devolvemos estas dos para la tabla
        report, 
        filteredReport,
        searchQuery,
        fetchReport
    };
}