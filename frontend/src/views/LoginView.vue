<template>
  <div class="min-h-screen flex items-center justify-center transition-all duration-700 p-4 font-sans"
    :class="isDark ? 'bg-[#020617] theme-dark' : 'bg-[#F8FAFC] theme-light'">
    
    <div class="woden-card relative" :class="isDark ? 'card-dark' : 'card-light'">
      
      <div class="absolute -top-4 -right-2 w-11 h-11 bg-gradient-to-tr from-[#ff8f00] to-[#ff4e00] rounded-2xl flex items-center justify-center shadow-xl rotate-12">
        <svg class="w-5 h-5 text-white -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-8">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[8px] font-black uppercase tracking-[0.2em]" :class="isDark ? 'text-emerald-400' : 'text-emerald-600'">
            Conexión Segura
          </span>
        </div>

        <div class="text-center mb-10">
          <h1 class="text-2xl font-black italic tracking-tighter leading-none mb-3">
            <span class="text-[#ff8f00]">WODEN</span><span :class="isDark ? 'text-white' : 'text-slate-800'">TRACK</span>
          </h1>
          <p class="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">Identifícate</p>
          <div class="h-0.5 w-8 bg-[#ff8f00] mx-auto mt-2 rounded-full"></div>
        </div>

        <div class="space-y-4">
          <div class="input-wrapper">
            <input v-model="form.usuario" type="text" placeholder="ID DE ACCESO" class="woden-input-base" @keyup.enter="handleLogin">
            <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>

          <div class="input-wrapper">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="PIN DE SEGURIDAD" class="woden-input-base" @keyup.enter="handleLogin">
            <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2" :class="isDark ? 'text-slate-400' : 'text-slate-600'">
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <button @click="handleLogin" :disabled="loading" class="woden-btn-primary mb-6 active:scale-95">
          <span v-if="!loading" class="text-[11px]">AUTENTICAR ACCESO</span>
          <div v-else class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        </button>

        <div class="flex flex-col items-center gap-2">
          <button @click="toggleTheme" class="text-[10px] font-black uppercase tracking-widest transition-colors" :class="isDark ? 'text-slate-500 hover:text-white' : 'text-slate-700 hover:text-orange-600'">
            Modo {{ isDark ? 'Claro' : 'Oscuro' }}
          </button>
          <p class="text-[7px] font-bold uppercase tracking-[0.4em] opacity-20">Version 1.0</p>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="message.text" :class="message.type === 'error' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-emerald-500 bg-emerald-500/10 text-emerald-500'" class="fixed top-10 z-[100] px-6 py-2.5 rounded-xl border backdrop-blur-md font-bold text-[10px] flex items-center gap-3 shadow-2xl">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {{ message.text }}
      </div>
    </transition>

  </div>
</template>
<script setup>
import '../assets/css/woden-style.css';
import { useAttendance } from '../composables/UserLogica/useAttendance.js';
const { form, loading, showPassword, handleLogin, message, isDark, toggleTheme } = useAttendance();
</script>