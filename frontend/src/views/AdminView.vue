<template>
  <div class="admin-layout transition-colors duration-500"
    :class="isDark ? 'theme-dark' : 'theme-light'">

    <aside class="sidebar" :class="[
      isDark ? 'theme-dark' : 'theme-light',
      isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
    ]">
      <div class="sidebar-header">
        <h2 v-if="isSidebarOpen" class="text-[#FF8F00] text-sm font-black uppercase italic truncate">Woden Admin</h2>
        <span v-else class="text-[#FF8F00] font-black text-xl">W</span>
      </div>

      <div v-if="isSidebarOpen" class="p-3 space-y-3 animate-fade-in">
        <div class="text-center py-2 rounded-xl bg-[#FF8F00]/10 border border-[#FF8F00]/20">
          <p class="text-lg font-mono font-black text-[#FF8F00]">{{ currentTime }}</p>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
            class="btn-attendance btn-in">Entrada</button>
          <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
            class="btn-attendance btn-out">Salida</button>
        </div>
      </div>

      <nav class="flex-1 px-2 space-y-1 mt-4">
        <button @click="currentModule = 'novedades'" 
          :class="['nav-link', currentModule === 'novedades' ? 'active' : '', !isSidebarOpen ? 'justify-center' : '']">
          <i class="fas fa-users"></i>
          <span v-if="isSidebarOpen">Novedades</span>
        </button>
        <button @click="currentModule = 'mallas'" 
          :class="['nav-link', currentModule === 'mallas' ? 'active' : '', !isSidebarOpen ? 'justify-center' : '']">
          <i class="fas fa-calendar-check"></i>
          <span v-if="isSidebarOpen">Cargue Mallas</span>
        </button>
      </nav>

      <div class="p-3 border-t space-y-2" :class="isDark ? 'border-slate-600' : 'border-slate-100'">
        <button @click="toggleTheme" class="theme-toggle-btn w-full flex items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          <span v-if="isSidebarOpen" class="ml-2">{{ isDark ? 'Claro' : 'Oscuro' }}</span>
        </button>
        <button @click="logout" class="w-full flex items-center justify-center p-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl font-black text-[9px] uppercase transition-all">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="isSidebarOpen" class="ml-2">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 h-full">
      <header class="header-main h-14 border-b flex items-center justify-between px-4 shrink-0">
        <button @click="isSidebarOpen = !isSidebarOpen" class="sidebar-toggle-btn">
          <i :class="isSidebarOpen ? 'fas fa-indent' : 'fas fa-outdent'"></i>
        </button>

        <div class="text-right">
          <p class="text-[8px] font-black uppercase text-[#FF8F00]">Admin</p>
          <p class="text-[10px] font-bold opacity-60 leading-none">{{ employee?.name }}</p>
        </div>
      </header>

      <div class="flex-1 p-4 md:p-6 overflow-y-auto">
        <div v-if="currentModule === 'novedades'" class="max-w-6xl mx-auto space-y-4 animate-fade-in">
          <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3">
            <h1 class="text-lg font-black uppercase tracking-tight">Reporte de Novedades</h1>

            <div class="search-container" :class="isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'">
              <input v-model="searchQuery" type="text" placeholder="Buscar..." class="search-input">
              <button @click="downloadExcelReport" class="btn-excel">
                <i class="fas fa-file-excel"></i>
              </button>
            </div>
          </div>

          <div class="table-container" :class="isDark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-white'">
            <table class="woden-table">
              <thead :class="isDark ? 'bg-slate-800/50 text-[#FF8F00]' : 'bg-slate-50 text-slate-500'">
                <tr>
                  <th class="px-4 py-3">Colaborador</th>
                  <th class="px-4 py-3 text-center">Ingreso</th>
                  <th class="px-4 py-3 text-center">Salida</th>
                  <th class="px-4 py-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody class="divide-y" :class="isDark ? 'divide-slate-600' : 'divide-slate-100'">
                <tr v-for="item in filteredReport" :key="item.id" class="hover:bg-slate-400/5 transition-colors">
                  <td class="px-4 py-2.5 font-bold uppercase">{{ item.empleado }}</td>
                  <td class="px-4 py-2.5 text-center opacity-70 font-mono">{{ item.check_in || '--:--' }}</td>
                  <td class="px-4 py-2.5 text-center opacity-70 font-mono">{{ item.check_out || '--:--' }}</td>
                  <td class="px-4 py-2.5 text-right status-badge"
                    :class="item.estado === 'TARDE' ? 'status-tarde' : 'status-ok'">
                    {{ item.estado }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="currentModule === 'mallas'" class="max-w-lg mx-auto py-10 animate-fade-in">
          <div class="p-8 border-2 border-dashed rounded-[2rem] text-center space-y-4"
            :class="isDark ? 'border-slate-500 bg-slate-700/50' : 'border-slate-200 bg-white shadow-sm'">
            <div class="w-16 h-16 bg-[#FF8F00]/20 rounded-full flex items-center justify-center mx-auto text-[#FF8F00]">
              <i class="fas fa-file-upload text-2xl"></i>
            </div>
            <h2 class="text-lg font-black uppercase italic leading-none">Cargar Mallas</h2>
            <input type="file" id="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileUpload">
            <label for="fileInput" class="inline-block px-8 py-2.5 bg-[#FF8F00] text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-transform hover:scale-105 cursor-pointer shadow-lg">
              Seleccionar Excel
            </label>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
<script setup>

import { adminOdoo } from '../composables/adminOdoo';
import '../assets/css/admin-style.css';
const {
  employee, loading, currentTime, filteredReport, searchQuery, currentModule, isSidebarOpen,
  fetchReport, handleAttendance, logout, isDark, toggleTheme, downloadExcelReport
} = adminOdoo();

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log("Archivo seleccionado:", file.name);
    // Aquí puedes llamar a una función para enviar el archivo al servidor
  }
};
</script>