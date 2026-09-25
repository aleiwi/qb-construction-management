// Date formatting
export const formatDate = (date, format = 'short') => {
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return new Date(date).toLocaleDateString('en-US', options[format]);
};

// Time formatting
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Number formatting
export const formatNumber = (number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

// Currency formatting
export const formatCurrency = (amount, currency = 'SAR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Percentage formatting
export const formatPercentage = (value, decimals = 1) => {
  return `${formatNumber(value, decimals)}%`;
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Phone number formatting
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if the phone number starts with country code
  if (cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as local Saudi number
  if (cleaned.length === 10) {
    return `05${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

// Status formatting
export const formatStatus = (status) => {
  const statusMap = {
    'Planning': 'التخطيط',
    'In Progress': 'قيد التنفيذ',
    'Completed': 'مكتمل',
    'On Hold': 'معلق',
    'Cancelled': 'ملغي',
    'Pending': 'قيد الانتظار',
    'Active': 'نشط',
    'Inactive': 'غير نشط'
  };
  
  return statusMap[status] || status;
};

// Category formatting
export const formatCategory = (category) => {
  const categoryMap = {
    'Concrete': 'خرسانة',
    'Steel': 'حديد',
    'Brick': 'طوب',
    'Cement': 'أسمنت',
    'Sand': 'رمل',
    'Aggregate': 'زلط',
    'Wood': 'خشب',
    'Paint': 'دهانات',
    'Tiles': 'بلاط',
    'Plumbing': 'سباكة',
    'Electrical': 'كهرباء',
    'Other': 'أخرى'
  };
  
  return categoryMap[category] || category;
};

// Unit formatting
export const formatUnit = (unit) => {
  const unitMap = {
    'm³': 'متر مكعب',
    'm²': 'متر مربع',
    'm': 'متر',
    'kg': 'كيلوجرام',
    'ton': 'طن',
    'piece': 'قطعة',
    'bag': 'شيكارة',
    'liter': 'لتر'
  };
  
  return unitMap[unit] || unit;
};

// Text truncation
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert to title case
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const re = /^05\d{8}$/;
  return re.test(phone.replace(/\s/g, ''));
};

// Get color for status
export const getStatusColor = (status) => {
  const colorMap = {
    'Planning': 'yellow',
    'In Progress': 'blue',
    'Completed': 'green',
    'On Hold': 'red',
    'Cancelled': 'gray',
    'Pending': 'yellow',
    'Active': 'green',
    'Inactive': 'gray'
  };
  
  return colorMap[status] || 'gray';
};
// (no additional unit helpers; keep formatUnit above for unit translations)