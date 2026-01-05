import { ref, reactive, onMounted, computed } from "vue"; // <-- Importante: añadir computed
import { useRouter } from "vue-router";

export function useAttendance() {
  const router = useRouter();
  const employee = ref(null);
  const loading = ref(false);
  const showPassword = ref(false);
  const currentTime = ref("00:00:00 AM");
  const form = reactive({ usuario: "", password: "" });
  const message = reactive({ text: "", type: "" });

  const isDark = ref(localStorage.getItem("theme") !== "light");

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const updateClock = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const showToast = (msg, type) => {
    message.text = msg;
    message.type = type;
    setTimeout(() => (message.text = ""), 4000);
  };

  const handleLogin = async () => {
    if (!form.usuario || !form.password) {
      showToast("Completa los campos", "error");
      return;
    }
    loading.value = true;
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        employee.value = data;
        localStorage.setItem("user_session", JSON.stringify(data));
        showToast(`Bienvenido ${data.name}`, "success");
        router.push(data.role === "admin" ? "/admin" : "/marcacion");
      } else {
        showToast(data.message || "Credenciales inválidas", "error");
      }
    } catch (err) {
      showToast("Error de conexión", "error");
    } finally {
      loading.value = false;
    }
  };

  const handleAttendance = async () => {
    if (!employee.value || employee.value.day_completed) return; // Bloqueo de seguridad
    loading.value = true;
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employee.value.employee_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (data.type === "in") {
          employee.value.is_inside = true;
          employee.value.day_completed = false;
        } else {
          employee.value.is_inside = false;
          employee.value.day_completed = true;
        }
        localStorage.setItem("user_session", JSON.stringify(employee.value));
        showToast(data.message, "success");
      }
    } catch (err) {
      showToast("Fallo al registrar marcación", "error");
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    employee.value = null;
    localStorage.removeItem("user_session");
    form.usuario = "";
    form.password = "";
    router.push("/");
  };

  onMounted(() => {
    updateClock();
    setInterval(updateClock, 1000);
    const saved = localStorage.getItem("user_session");
    if (saved) {
      employee.value = JSON.parse(saved);
    }
  });

  return {
    employee,
    loading,
    showPassword,
    currentTime,
    form,
    message,
    isDark,
    handleLogin,
    handleAttendance,
    logout,
    toggleTheme,
  };
}