import { ref } from 'vue';
import '../../assets/css/modulo-mallas.css';

defineProps({
  isDark: Boolean
});

// Datos de ejemplo (Luego esto vendrá de tu API o del Excel)
const mallasData = ref([
  { nombre: 'Juan Perez', cc: '10203040', malla: 'Operaciones A', jornada: 'Diurna', horario: '06:00 - 14:00' },
  { nombre: 'Maria Lopez', cc: '52637485', malla: 'Logística B', jornada: 'Nocturna', horario: '22:00 - 06:00' },
  { nombre: 'Carlos Ruiz', cc: '10987654', malla: 'Operaciones A', jornada: 'Tarde', horario: '14:00 - 22:00' },
]);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log("Procesando archivo:", file.name);
    // Aquí irá tu lógica de XLSX
  }
};