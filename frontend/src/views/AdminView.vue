<template>
  <div class="flex h-screen bg-[#020617] text-slate-300 overflow-hidden font-sans relative">
    
    <div 
      v-if="isSidebarOpen" 
      @click="isSidebarOpen = false" 
      class="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
    ></div>

    <aside 
      :class="[
        'fixed inset-y-0 left-0 z-50 bg-[#0F172A] border-r border-slate-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out lg:relative overflow-hidden',
        isSidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 -translate-x-full lg:translate-x-0 lg:border-none'
      ]"
    >
      <div class="w-60 flex flex-col h-full flex-shrink-0">
        <div class="p-4 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-center">
          <h2 class="text-[#FF8F00] text-lg font-black tracking-tighter uppercase italic">Woden Admin</h2>
          <button @click="isSidebarOpen = false" class="lg:hidden text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-3">
          <div class="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
            <p class="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Usuario</p>
            <p class="text-slate-100 font-bold text-xs truncate uppercase">{{ employee?.name }}</p>
            <div class="mt-1.5">
              <span v-if="employee?.day_completed" class="text-[7px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase font-bold">Terminado</span>
              <span v-else-if="employee?.is_inside" class="text-[7px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase font-bold">En Turno</span>
              <span v-else class="text-[7px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-bold">Disponible</span>
            </div>
          </div>
        </div>

        <div class="px-3 flex-1 flex flex-col gap-3">
          <div class="text-center py-2 bg-slate-900/30 rounded-lg border border-slate-800/50">
            <p class="text-xl font-mono font-bold text-white">{{ currentTime }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button @click="handleAttendance" 
              :disabled="loading || employee?.is_inside || employee?.day_completed"
              class="py-2.5 rounded-lg font-bold text-[8px] uppercase tracking-tighter bg-emerald-600/90 text-white shadow-md active:scale-95 transition-all disabled:opacity-20">
              Entrada
            </button>
            <button @click="handleAttendance" 
              :disabled="loading || !employee?.is_inside || employee?.day_completed"
              class="py-2.5 rounded-lg font-bold text-[8px] uppercase tracking-tighter bg-red-600/90 text-white shadow-md active:scale-95 transition-all disabled:opacity-20">
              Salida
            </button>
          </div>
        </div>

        <div class="p-3 border-t border-slate-800">
          <button @click="logout" class="w-full py-2 text-slate-500 hover:text-white font-bold text-[9px] uppercase flex items-center justify-center gap-2 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="bg-[#0F172A] border-b border-slate-800 p-2.5 flex items-center justify-between lg:justify-start gap-4">
        <div class="flex items-center gap-3">
          <button 
            @click="isSidebarOpen = !isSidebarOpen" 
            class="p-1.5 text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-[#FF8F00] rounded transition-all"
          >
            <svg v-if="!isSidebarOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <h2 v-if="!isSidebarOpen" class="text-[#FF8F00] text-sm font-black uppercase italic animate-fade-in">Woden Admin</h2>
        </div>
        
        <div class="lg:hidden text-[9px] font-bold text-slate-500 uppercase truncate max-w-[100px]">
          {{ employee?.name }}
        </div>
      </header>

      <div class="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-6">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-lg font-black text-white uppercase tracking-tight">Reporte de Novedades</h1>
            <p class="text-slate-500 text-[9px] uppercase font-bold">Hoy: Hora Colombia</p>
          </div>
          
          <div class="flex gap-2 w-full md:w-auto">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Buscar..." 
              class="bg-slate-900 border border-slate-800 text-white text-[10px] py-1.5 px-3 rounded focus:outline-none focus:border-[#FF8F00] transition-all w-full md:w-48"
            >
            <button @click="fetchReport" class="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FF8F00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-slate-900/50 border border-slate-800 rounded-xl overflow-x-auto shadow-2xl">
          <table class="w-full text-left text-[10px] min-w-[500px]">
            <thead class="bg-slate-800/40 text-[#FF8F00] font-bold uppercase tracking-tighter border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Colaborador</th>
                <th class="px-4 py-3 text-center">Ingreso</th>
                <th class="px-4 py-3 text-center">Salida</th>
                <th class="px-4 py-3 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/30">
              <tr v-for="item in filteredReport" :key="item.id" class="hover:bg-slate-800/20 transition-colors">
                <td class="px-4 py-2.5">
                  <span class="font-bold text-slate-200 uppercase">{{ item.empleado }}</span>
                </td>
                <td class="px-4 py-2.5 text-center font-mono text-slate-500 italic">{{ item.check_in }}</td>
                <td class="px-4 py-2.5 text-center font-mono text-slate-500 italic">{{ item.check_out }}</td>
                <td class="px-4 py-2.5 text-right">
                  <span :class="item.estado === 'TARDE' ? 'text-red-400 bg-red-400/5' : 'text-emerald-400 bg-emerald-400/5'" 
                        class="px-2 py-0.5 rounded text-[8px] font-black border border-current/10">
                    {{ item.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { adminOdoo } from '../composables/adminOdoo';

const isSidebarOpen = ref(window.innerWidth > 1024);

const {
  employee, loading, currentTime, filteredReport, searchQuery,
  fetchReport, handleAttendance, logout
} = adminOdoo();
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>