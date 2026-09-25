/**
 * Helper to map Supabase and general authentication errors to friendly Arabic messages
 * @param {Error} error - The error object caught from the catch block
 * @returns {string} - The localized error message
 */
export const getAuthErrorMessage = (error) => {
  if (!error || !error.message) return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى';

  const msg = error.message;

  // General / Login Errors
  if (msg.includes('Invalid login credentials') || msg.includes('Email not found')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }
  if (msg.includes('Email not confirmed')) {
    return 'يرجى تأكيد البريد الإلكتروني أولاً قبل تسجيل الدخول';
  }
  if (msg.includes('Too many requests') || msg.includes('Email rate limit exceeded')) {
    return 'محاولات كثيرة جداً، يرجى الانتظار قليلاً والمحاولة لاحقاً';
  }

  // Registration Errors
  if (msg.includes('User already registered') || msg.includes('already been registered')) {
    return 'هذا البريد الإلكتروني مسجل بالفعل';
  }
  if (msg.includes('Invalid email')) {
    return 'البريد الإلكتروني غير صحيح';
  }
  if (msg.includes('Password should be at least')) {
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  // Phone / OTP Errors
  if (msg.includes('Invalid phone number')) {
    return 'رقم الهاتف غير صحيح';
  }
  if (msg.includes('Invalid OTP') || msg.includes('Invalid token')) {
    return 'رمز التحقق غير صحيح';
  }
  if (msg.includes('Expired')) {
    return 'رمز التحقق منتهي الصلاحية، يرجى طلب رمز جديد';
  }

  // Social Auth Errors
  if (msg.includes('popup_closed')) {
    return 'تم إغلاق نافذة تسجيل الدخول';
  }
  if (msg.includes('access_denied')) {
    return 'تم رفض تسجيل الدخول';
  }

  // Fallback for known technical errors
  if (msg.includes('SMTP') || msg.includes('email provider')) {
    return 'مشكلة في خدمة البريد الإلكتروني، يرجى التواصل مع الدعم';
  }

  // Generic return with the original message for debugging if needed, or just a generic one
  return `خطأ: ${msg}`;
};
