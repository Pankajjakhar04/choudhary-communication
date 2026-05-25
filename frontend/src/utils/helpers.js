export const formatPrice = (value) => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

export const formatDate = (value, locale = 'en-IN') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const whatsappLink = (phone, text = '') => {
  if (!phone) return '';
  const digits = String(phone).replace(/[^\d]/g, '');
  const suffix = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${suffix}`;
};
