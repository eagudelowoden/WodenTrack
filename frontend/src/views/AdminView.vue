<template>
  <div class="flex h-screen overflow-hidden font-sans transition-colors duration-500"
    :class="isDark ? 'bg-[#1e293b] text-slate-200' : 'bg-slate-50 text-slate-800'">

    <aside :class="[
      'z-50 border-r flex flex-col shadow-2xl transition-all duration-300 ease-in-out',
      isDark ? 'bg-[#334155] border-slate-600' : 'bg-white border-slate-200',
      isSidebarOpen ? 'w-60' : 'w-16'
    ]">

      <div class="p-4 border-b flex items-center justify-center h-16"
        :class="isDark ? 'border-slate-600' : 'border-slate-100'">
        <h2 v-if="isSidebarOpen" class="text-[#FF8F00] text-sm font-black uppercase italic truncate">Woden Admin</h2>
        <span v-else class="text-[#FF8F00] font-black text-xl">W</span>
      </div>

      <div v-if="isSidebarOpen" class="p-3 space-y-3 animate-fade-in">
        <div class="text-center py-2 rounded-xl bg-[#FF8F00]/10 border border-[#FF8F00]/20">
          <p class="text-lg font-mono font-black text-[#FF8F00]">{{ currentTime }}</p>
        </div>
        <div class="grid grid-cols-2 gap-1.5" v-if="isSidebarOpen">

          <button @click="handleAttendance" :disabled="loading || employee?.is_inside || employee?.day_completed"
            :class="[
              'py-1.5 rounded-md font-black text-[9px] uppercase transition-all shadow-md',
              (loading || employee?.is_inside || employee?.day_completed)
                ? 'bg-slate-500 opacity-20 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            ]">
            Entrada
          </button>

          <button @click="handleAttendance" :disabled="loading || !employee?.is_inside || employee?.day_completed"
            :class="[
              'py-1.5 rounded-md font-black text-[9px] uppercase transition-all shadow-md',
              (loading || !employee?.is_inside || employee?.day_completed)
                ? 'bg-slate-500 opacity-20 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
            ]">
            Salida
          </button>
        </div>
      </div>

      <nav class="flex-1 px-2 space-y-1 mt-4">
        <button @click="currentModule = 'novedades'" :title="!isSidebarOpen ? 'Novedades' : ''" :class="[currentModule === 'novedades' ? 'bg-[#FF8F00] text-white' : 'text-slate-400 hover:bg-slate-500/10',
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all',
        !isSidebarOpen ? 'justify-center' : '']">
          <i class="fas fa-users text-sm"></i>
          <span v-if="isSidebarOpen">Novedades</span>
        </button>

        <button @click="currentModule = 'mallas'" :title="!isSidebarOpen ? 'Cargue Mallas' : ''" :class="[currentModule === 'mallas' ? 'bg-[#FF8F00] text-white' : 'text-slate-400 hover:bg-slate-500/10',
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all',
        !isSidebarOpen ? 'justify-center' : '']">
          <i class="fas fa-calendar-check text-sm"></i>
          <span v-if="isSidebarOpen">Cargue Mallas</span>
        </button>
      </nav>

      <div class="p-3 border-t space-y-2" :class="isDark ? 'border-slate-600' : 'border-slate-100'">
        <button @click="toggleTheme"
          class="w-full flex items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase transition-all"
          :class="isDark ? 'border-slate-600 bg-slate-700 text-yellow-400' : 'border-slate-200 bg-white text-slate-600'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          <span v-if="isSidebarOpen" class="ml-2">{{ isDark ? 'Claro' : 'Oscuro' }}</span>
        </button>

        <button @click="logout"
          class="w-full flex items-center justify-center p-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl font-black text-[9px] uppercase transition-all">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="isSidebarOpen" class="ml-2">Salir</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 relative h-full">

      <header class="h-14 border-b flex items-center justify-between px-4 shrink-0"
        :class="isDark ? 'bg-[#334155] border-slate-600' : 'bg-white border-slate-200'">

        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = !isSidebarOpen"
            class="text-[#FF8F00] p-1.5 bg-[#FF8F00]/10 hover:bg-[#FF8F00]/20 rounded-lg transition-all">
            <i :class="isSidebarOpen ? 'fas fa-indent' : 'fas fa-outdent'" class="text-lg"></i>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-[8px] font-black uppercase tracking-widest text-[#FF8F00]">Admin</p>
            <p class="text-[10px] font-bold opacity-60 leading-none">{{ employee?.name }}</p>
          </div>
        </div>
      </header>

      <div class="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">

        <div v-if="currentModule === 'novedades'" class="max-w-6xl mx-auto space-y-4 animate-fade-in">
          <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3">
            <h1 class="text-lg font-black uppercase tracking-tight">Reporte de Novedades</h1>

            <div class="flex items-center gap-1.5 p-1 rounded-lg border w-full sm:w-auto"
              :class="isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'">
              <input v-model="searchQuery" type="text" placeholder="Buscar..."
                class="bg-transparent border-none text-[10px] px-2 focus:ring-0 flex-1 sm:w-40 outline-none">
              <button @click="downloadExcelReport"
                class="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-all text-xs">
                <i class="fas fa-file-excel"></i>
              </button>
            </div>
          </div>

          <div class="rounded-xl border overflow-hidden shadow-xl"
            :class="isDark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-white'">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-[10px]">
                <thead :class="isDark ? 'bg-slate-800/50 text-[#FF8F00]' : 'bg-slate-50 text-slate-500'">
                  <tr>
                    <th class="px-4 py-3 uppercase font-black">Colaborador</th>
                    <th class="px-4 py-3 text-center uppercase font-black">Ingreso</th>
                    <th class="px-4 py-3 text-center uppercase font-black">Salida</th>
                    <th class="px-4 py-3 text-right uppercase font-black">Estatus</th>
                  </tr>
                </thead>
                <tbody class="divide-y" :class="isDark ? 'divide-slate-600' : 'divide-slate-100'">
                  <tr v-for="item in filteredReport" :key="item.id" class="hover:bg-slate-400/5 transition-colors">
                    <td class="px-4 py-2.5 font-bold uppercase">{{ item.empleado }}</td>
                    <td class="px-4 py-2.5 text-center opacity-70 font-mono">{{ item.check_in || '--:--' }}</td>
                    <td class="px-4 py-2.5 text-center opacity-70 font-mono">{{ item.check_out || '--:--' }}</td>
                    <td class="px-4 py-2.5 text-right uppercase italic font-black"
                      :class="item.estado === 'TARDE' ? 'text-rose-500' : 'text-emerald-500'">
                      {{ item.estado }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
            <label for="fileInput"
              class="inline-block px-8 py-2.5 bg-[#FF8F00] text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-orange-900/20">
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