<template>
  <div class="max-w-6xl mx-auto space-y-4 animate-fade-in">
    <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3">
      <h1 class="text-lg font-black uppercase tracking-tight">Reporte de Novedades</h1>

      <div class="search-container" :class="isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'">
        <input 
          :value="search" 
          @input="$emit('update:search', $event.target.value)"
          type="text" 
          placeholder="Buscar..." 
          class="search-input"
        >
        <button @click="$emit('download')" class="btn-excel">
          <i class="fas fa-file-excel"></i>
        </button>
      </div>
    </div>

    <div class="table-container" :class="isDark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-white'">
      <table class="woden-table">
        <thead :class="isDark ? 'bg-slate-800/50 text-[#FF8F00]' : 'bg-slate-50 text-slate-500'">
          <tr>
            <th class="px-4 py-3 text-left">Colaborador</th>
            <th class="px-4 py-3 text-center">Ingreso</th>
            <th class="px-4 py-3 text-center">Salida</th>
            <th class="px-4 py-3 text-right">Estatus</th>
          </tr>
        </thead>
        <tbody class="divide-y" :class="isDark ? 'divide-slate-600' : 'divide-slate-100'">
          <tr v-for="item in reportData" :key="item.id" class="hover:bg-slate-400/5 transition-colors">
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
</template>

<script setup>
defineProps({
  reportData: Array,
  isDark: Boolean,
  search: String
});
defineEmits(['update:search', 'download']);
</script>