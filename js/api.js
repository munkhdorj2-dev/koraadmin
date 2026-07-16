import { VENUE_TYPES } from './data.js';

const BUCKET = 'media';
let client = null;

export function initSupabase(url, key) {
  client = window.supabase.createClient(url, key);
  return client;
}

export function getClient() {
  return client;
}

export async function fetchAdminPin() {
  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_pin')
    .maybeSingle();
  if (error) throw error;
  return data?.value || '2026';
}

export async function saveAdminPin(pin) {
  const { error } = await client.from('app_settings').upsert({
    key: 'admin_pin',
    value: String(pin || '').trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchVenues(type) {
  const { data, error } = await client
    .from('venues')
    .select('*')
    .eq('type', type)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveVenue(type, row) {
  const { error } = await client.from('venues').upsert({ ...row, type, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteVenue(id) {
  const { error } = await client.from('venues').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBanners(type) {
  const { data, error } = await client
    .from('banners')
    .select('*')
    .eq('type', type)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveBanner(type, row) {
  const { error } = await client.from('banners').upsert({
    ...row,
    type,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteBanner(id) {
  const { error } = await client.from('banners').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchNews() {
  const { data, error } = await client
    .from('app_news')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveNews(row) {
  const { error } = await client.from('app_news').upsert(row);
  if (error) throw error;
}

export async function deleteNews(id) {
  const { error } = await client.from('app_news').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRequests() {
  const { data, error } = await client
    .from('venue_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateRequestStatus(id, status) {
  const { error } = await client
    .from('venue_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRequest(id) {
  const { error } = await client.from('venue_requests').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadImage(file, path) {
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function rowToForm(row) {
  const coords = typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates || {};
  const images = Array.isArray(row.images) ? row.images : row.image ? [row.image] : [];
  let hotelStars = '';
  let accommodationUnits = [];
  if (row.type === 'hotel' && row.price) {
    try {
      const p = JSON.parse(row.price);
      hotelStars = p.stars ? String(p.stars) : '';
    } catch { /* plain price */ }
  }
  if (row.type === 'resort' && row.price) {
    try {
      const p = JSON.parse(row.price);
      accommodationUnits = p.units || [];
    } catch { /* ignore */ }
  }
  return {
    id: row.id || '',
    name: row.name || '',
    district: row.district || '',
    region: row.region || 'ulaanbaatar',
    location: row.location || '',
    phone: row.phone || '',
    hours: row.hours || '12:00-00:00',
    price: row.type === 'hotel' || row.type === 'resort' ? '' : row.price || '',
    hotelPriceJson: row.type === 'hotel' ? row.price || '' : '',
    hotelStars,
    accommodationUnits,
    latitude: coords.latitude ?? 47.9188,
    longitude: coords.longitude ?? 106.9174,
    images,
    featured: Boolean(row.featured),
    visible: row.visible !== false,
    show_price: row.show_price !== false,
    features: row.features || {},
    facebook: row.facebook || '',
    instagram: row.instagram || '',
    sortOrder: row.sort_order ?? 0,
    closedDays: row.closed_days || [],
    capacity: row.capacity || '',
    call_count: row.call_count ?? 0,
    direction_count: row.direction_count ?? 0,
    rating_sum: row.rating_sum ?? 0,
    rating_count: row.rating_count ?? 0,
  };
}

export function formToRow(form, type) {
  const meta = VENUE_TYPES.find((t) => t.id === type);
  const id = form.id || `${meta.prefix}${Date.now()}`;
  let price = form.price || '';
  if (type === 'hotel') {
    price = form.hotelPriceJson || '';
    if (form.hotelStars && price) {
      try {
        const p = JSON.parse(price);
        p.stars = Number(form.hotelStars) || null;
        price = JSON.stringify(p);
      } catch {
        price = JSON.stringify({ stars: Number(form.hotelStars) || null });
      }
    }
  }
  if (type === 'resort') {
    const units = (form.accommodationUnits || [])
      .map((u) => ({
        id: u.id || `u${Date.now()}`,
        kind: u.kind || 'ger',
        beds: String(u.beds || '').replace(/\D/g, ''),
        label: (u.label || '').trim(),
        amount: String(u.amount || '').replace(/\D/g, ''),
        luxAmount: String(u.luxAmount || '').replace(/\D/g, ''),
      }))
      .filter((u) => u.amount || u.luxAmount);
    price = units.length ? JSON.stringify({ units }) : '';
  }
  return {
    id,
    type,
    name: form.name.trim(),
    district: form.district || '',
    region: form.region || 'ulaanbaatar',
    location: form.location || '',
    phone: form.phone || '',
    hours: form.hours || '',
    price,
    show_price: form.show_price !== false,
    image: form.images[0] || '',
    images: form.images,
    featured: Boolean(form.featured),
    visible: form.visible !== false,
    features: form.features || {},
    coordinates: { latitude: Number(form.latitude), longitude: Number(form.longitude) },
    facebook: form.facebook || '',
    instagram: form.instagram || '',
    closed_days: form.closedDays || [],
    capacity: form.capacity || '',
    sort_order: form.sortOrder ?? 0,
    call_count: form.call_count ?? 0,
    direction_count: form.direction_count ?? 0,
    rating_sum: form.rating_sum ?? 0,
    rating_count: form.rating_count ?? 0,
  };
}

export function rowToBannerForm(row) {
  return {
    id: row.id || '',
    image: row.image || '',
    linkUrl: row.link_url || '',
    sortOrder: row.sort_order ?? 0,
  };
}

export function bannerFormToRow(form, type) {
  const meta = VENUE_TYPES.find((t) => t.id === type);
  return {
    id: form.id || `b${meta.prefix}${Date.now()}`,
    type,
    image: form.image || '',
    link_url: (form.linkUrl || '').trim(),
    sort_order: Number(form.sortOrder) || 0,
  };
}

export function emptyBannerForm() {
  return {
    id: '',
    image: '',
    linkUrl: '',
    sortOrder: 0,
  };
}

export function rowToNewsForm(row) {
  return {
    id: row.id || '',
    title: row.title || '',
    body: row.body || '',
    image: row.image || '',
    linkUrl: row.link_url || '',
    audience: row.audience || 'all',
    publishedAt: row.published_at || '',
  };
}

export function newsFormToRow(form) {
  return {
    id: form.id || `news${Date.now()}`,
    title: (form.title || '').trim(),
    body: (form.body || '').trim(),
    image: (form.image || '').trim(),
    link_url: (form.linkUrl || '').trim(),
    audience: form.audience || 'all',
    published_at: form.publishedAt || new Date().toISOString(),
  };
}

export function emptyNewsForm() {
  return {
    id: '',
    title: '',
    body: '',
    image: '',
    linkUrl: '',
    audience: 'all',
    publishedAt: '',
  };
}

export function emptyForm() {
  return {
    id: '',
    name: '',
    district: '',
    region: 'ulaanbaatar',
    location: '',
    phone: '',
    hours: '12:00-00:00',
    price: '',
    hotelPriceJson: '',
    hotelStars: '',
    accommodationUnits: [],
    latitude: 47.9188,
    longitude: 106.9174,
    images: [],
    featured: false,
    visible: true,
    show_price: true,
    features: { wifi: true, sound: true },
    facebook: '',
    instagram: '',
    sortOrder: 0,
    closedDays: [],
    capacity: '',
    call_count: 0,
    direction_count: 0,
    rating_sum: 0,
    rating_count: 0,
  };
}
