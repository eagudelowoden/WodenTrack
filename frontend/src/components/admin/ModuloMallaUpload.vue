<template>
  <div class="mesh-container animate-fade-in space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-dashed"
         :class="isDark ? 'border-slate-600' : 'border-slate-200 shadow-sm bg-white'">
      
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-[#FF8F00]/20 rounded-xl flex items-center justify-center text-[#FF8F00]">
          <i class="fas fa-calendar-alt text-xl"></i>
        </div>
        <div>
          <h2 class="text-lg font-black uppercase italic leading-none">Gestión de Mallas</h2>
          <p class="text-[10px] opacity-60 font-bold uppercase tracking-widest">Cargue y visualización de horarios</p>
        </div>
      </div>

      <div class="flex gap-2">
        <input type="file" id="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload">
        <label for="fileInput" class="btn-upload">
          <i class="fas fa-file-upload mr-2"></i>
          Subir Nueva Malla
        </label>
      </div>
    </div>

    <div class="table-wrapper" :class="isDark ? 'dark-mode' : 'light-mode'">
      <table class="mesh-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>C.C.</th>
            <th>Nombre de Malla</th>
            <th class="text-center">Jornada</th>
            <th class="text-right">Horario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(persona, index) in mallasData" :key="index">
            <td class="font-black uppercase text-[#FF8F00]">{{ persona.nombre }}</td>
            <td class="font-mono opacity-80">{{ persona.cc }}</td>
            <td>
              <span class="malla-tag">{{ persona.malla }}</span>
            </td>
            <td class="text-center">
              <span class="jornada-badge" :class="persona.jornada.toLowerCase()">
                {{ persona.jornada }}
              </span>
            </td>
            <td class="text-right font-bold">{{ persona.horario }}</td>
          </tr>
          <tr v-if="mallasData.length === 0">
            <td colspan="5" class="text-center py-10 opacity-50 italic">
              No hay datos de mallas cargados actualmente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
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
</script>

<style scoped>

</style>