/** Venue listing / subscription helpers for admin-web */

export const SUBSCRIPTION_EXTEND_MONTHS = [3, 6, 12];
export const EXPIRING_SOON_DAYS = 14;

export function toDateInputValue(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateValue(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatDisplayDate(value) {
  const d = parseDateValue(value);
  if (!d) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(date) {
  const end = parseDateValue(date);
  if (!end) return null;
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  return Math.round((endDay.getTime() - startOfToday().getTime()) / 86400000);
}

export function getSubscriptionStatus(venue) {
  const expiresAt = venue?.expires_at ?? venue?.expiresAt;
  const days = daysUntil(expiresAt);
  if (days == null) return 'none';
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'expiring';
  return 'active';
}

export function getSubscriptionStatusMeta(status) {
  switch (status) {
    case 'expired':
      return { id: 'expired', label: 'Дууссан', className: 'sub-badge-danger' };
    case 'expiring':
      return { id: 'expiring', label: 'Удахгүй', className: 'sub-badge-warn' };
    case 'active':
      return { id: 'active', label: 'Идэвхтэй', className: 'sub-badge-ok' };
    default:
      return { id: 'none', label: 'Хугацаагүй', className: 'sub-badge-muted' };
  }
}

export function addMonthsToDate(base, months) {
  const d = parseDateValue(base) || new Date();
  const next = new Date(d);
  next.setMonth(next.getMonth() + Number(months));
  return next;
}

export function extendSubscriptionExpiry(currentExpiresAt, months) {
  const current = parseDateValue(currentExpiresAt);
  const today = new Date();
  const base = current && current > today ? current : today;
  return toDateInputValue(addMonthsToDate(base, months));
}

export function matchesSubscriptionFilter(venue, filterId) {
  if (!filterId || filterId === 'all') return true;
  return getSubscriptionStatus(venue) === filterId;
}

export const SUBSCRIPTION_FILTERS = [
  { id: 'all', label: 'Бүгд' },
  { id: 'active', label: 'Идэвхтэй' },
  { id: 'expiring', label: 'Удахгүй' },
  { id: 'expired', label: 'Дууссан' },
  { id: 'none', label: 'Хугацаагүй' },
];
