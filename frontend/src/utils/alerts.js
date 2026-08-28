import Swal from "sweetalert2";

export const toast = (type, title, text = "") => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: type,
    title,
    text,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const showAlert = (type, title, text = "") => {
  Swal.fire({
    icon: type,
    title,
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#2563eb",
  });
};

export const confirmDialog = async (title, text = "") => {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "نعم، متأكد",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const promptInput = async (title, inputLabel, initialValue = "") => {
  const result = await Swal.fire({
    title,
    input: "number",
    inputLabel,
    inputValue: initialValue,
    inputAttributes: { min: 0, max: 100, step: "0.1" },
    showCancelButton: true,
    confirmButtonText: "حفظ",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#2563eb",
    reverseButtons: true,
    inputValidator: (value) => {
      const num = Number(value);
      if (value === "" || Number.isNaN(num)) return "الرجاء إدخال رقم صحيح";
      if (num < 0 || num > 100) return "النسبة يجب أن تكون بين 0 و 100";
      return null;
    },
  });
  return result.isConfirmed ? result.value : null;
};