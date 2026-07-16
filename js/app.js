import {
  VENUE_TYPES, UB_DISTRICTS, REGIONS, FEATURES, FEATURE_LABELS, ACCOMMODATION_KINDS,
} from './data.js';
import {
  initSupabase,
  fetchAdminPin,
  saveAdminPin,
  fetchVenues,
  saveVenue,
  deleteVenue,
  fetchBanners,
  saveBanner,
  deleteBanner,
  fetchNews,
  saveNews,
  deleteNews,
  fetchRequests,
  updateRequestStatus,
  deleteRequest,
  updateVenueSortOrders,
  fetchDashboardStats,
  uploadImage,
  rowToForm,
  formToRow,
  rowToBannerForm,
  bannerFormToRow,
  emptyBannerForm,
  rowToNewsForm,
  newsFormToRow,
  emptyNewsForm,
  emptyForm,
} from './api.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const app = $('#app');

let state = {
  screen: 'loading',
  type: null,
  venues: [],
  banners: [],
  requests: [],
  news: [],
  venueSearch: '',
  form: emptyForm(),
  bannerForm: emptyBannerForm(),
  newsForm: emptyNewsForm(),
  dashboardStats: null,
  error: '',
};

let venueMap = null;
let venueMarker = null;

function getHistoryState() {
  return {
    screen: state.screen,
    type: state.type,
    venueSearch: state.venueSearch,
  };
}

function syncHistory(mode = 'push') {
  const payload = getHistoryState();
  if (mode === 'replace') {
    window.history.replaceState(payload, '');
  } else {
    window.history.pushState(payload, '');
  }
}

function goToScreen(screen, options = {}) {
  const {
    push = true,
    replace = false,
    type = state.type,
    venueSearch = state.venueSearch,
  } = options;
  state.screen = screen;
  state.type = type;
  state.venueSearch = venueSearch;
  if (replace) {
    syncHistory('replace');
  } else if (push) {
    syncHistory('push');
  }
  render();
}

async function boot() {
  const cfg = window.KORA_CONFIG;
  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey || cfg.supabaseUrl.includes('YOUR_PROJECT')) {
    state.screen = 'setup';
    render();
    return;
  }
  try {
    initSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey);
    state.screen = sessionStorage.getItem('kora_admin_ok') === '1' ? 'home' : 'pin';
  } catch (e) {
    state.error = e.message;
    state.screen = 'setup';
  }
  syncHistory('replace');
  window.addEventListener('popstate', handlePopState);
  render();
}

async function handlePopState(event) {
  const route = event.state;
  if (!route?.screen) return;
  state.type = route.type ?? null;
  state.venueSearch = route.venueSearch || '';

  if (route.screen === 'venue-list' && route.type) {
    await loadVenueType(route.type, { push: false });
    return;
  }
  if (route.screen === 'banner-list' && route.type) {
    await loadBannerType(route.type, { push: false });
    return;
  }
  if (route.screen === 'requests') {
    await loadRequestsScreen({ push: false });
    return;
  }
  if (route.screen === 'news-list') {
    await loadNewsScreen({ push: false });
    return;
  }

  state.screen = route.screen;
  render();
}

function render() {
  if (state.screen !== 'venue-form') destroyVenueMap();
  switch (state.screen) {
    case 'setup': return renderSetup();
    case 'pin': return renderPin();
    case 'home': return renderHome();
    case 'venue-list': return renderVenueList();
    case 'venue-form': return renderVenueForm();
    case 'banner-types': return renderBannerTypes();
    case 'banner-list': return renderBannerList();
    case 'banner-form': return renderBannerForm();
    case 'requests': return renderRequests();
    case 'news-list': return renderNewsList();
    case 'news-form': return renderNewsForm();
    case 'settings': return renderSettings();
    default: return renderLoading();
  }
}

function shell(title, body, actions = '') {
  app.innerHTML = `
    <header class="topbar">
      <div class="brand">Kora <span>Admin</span></div>
      ${actions}
    </header>
    <main class="main">
      ${title ? `<h1 class="page-title">${title}</h1>` : ''}
      <div id="error-bar" class="error-bar" ${state.error ? '' : 'hidden'}>${esc(state.error || '')}</div>
      ${body}
    </main>
  `;
}

function showError(msg) {
  state.error = msg || '';
  const el = $('#error-bar');
  if (el) {
    el.textContent = state.error;
    el.hidden = !state.error;
  }
}

function renderLoading() {
  shell('', '<p class="muted">Ачааллаж байна…</p>');
}

function renderSetup() {
  shell('Тохиргоо', `
    <section class="card">
      <p>Supabase холболт тохируулаагүй байна.</p>
      <ol class="steps">
        <li><code>admin-web/js/config.example.js</code> → <code>config.js</code> хуулна</li>
        <li>App-ийн <code>.env</code> дахь Supabase URL болон anon key-г оруулна</li>
        <li>Хуудсыг дахин ачаална</li>
      </ol>
    </section>
  `);
}

function renderPin() {
  shell('', `
    <section class="card pin-card">
      <h2>Admin нэвтрэх</h2>
      <p class="muted">App-ийн admin PIN оруулна уу</p>
      <input type="password" id="pin-input" class="input" placeholder="PIN" maxlength="12" />
      <button class="btn btn-primary" id="pin-btn">Нэвтрэх</button>
    </section>
  `);
  $('#pin-btn').onclick = submitPin;
  $('#pin-input').onkeydown = (e) => { if (e.key === 'Enter') submitPin(); };
}

async function submitPin() {
  showError('');
  try {
    const expected = await fetchAdminPin();
    const entered = ($('#pin-input')?.value || '').trim();
    if (entered !== expected) {
      showError('PIN буруу байна');
      return;
    }
    sessionStorage.setItem('kora_admin_ok', '1');
    goToScreen('home');
  } catch (e) {
    showError(e.message);
  }
}

function renderHome() {
  const stats = state.dashboardStats;
  const venueCards = VENUE_TYPES.map((t) => `
    <button class="cat-card" data-type="${t.id}" style="--accent:${t.color}">
      <span class="cat-title">${t.title}</span>
      <span class="cat-go">${stats ? `${stats.venuesByType[t.id] || 0} газар` : 'Газрууд →'}</span>
    </button>
  `).join('');

  const statsBlock = stats ? `
    <section class="section-block">
      <h2 class="section-title">Статистик</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${stats.totalVenues}</span>
          <span class="stat-label">Нийт газар</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.banners}</span>
          <span class="stat-label">Banner</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${stats.news}</span>
          <span class="stat-label">Мэдээ</span>
        </div>
        <div class="stat-card ${stats.newRequests ? 'stat-card-alert' : ''}">
          <span class="stat-value">${stats.newRequests}</span>
          <span class="stat-label">Шинэ хүсэлт</span>
        </div>
      </div>
    </section>
  ` : '<p class="muted stats-loading">Статистик ачааллаж байна…</p>';

  shell('Admin Home', `
    ${statsBlock}
    <section class="section-block">
      <h2 class="section-title">Газар удирдах</h2>
      <div class="cat-grid">${venueCards}</div>
    </section>
    <section class="section-block">
      <h2 class="section-title">Бусад</h2>
      <div class="dashboard-grid">
        <button class="dashboard-card" id="open-banners">
          <strong>Banner</strong>
          <span class="muted">${stats ? `${stats.banners} banner` : 'Ангилал тус бүрийн header banner'}</span>
        </button>
        <button class="dashboard-card" id="open-requests">
          <strong>Бүртгүүлэх хүсэлт</strong>
          <span class="muted">${stats?.newRequests ? `${stats.newRequests} шинэ / ${stats.totalRequests} нийт` : 'Шинэ хүсэлт алга'}</span>
        </button>
        <button class="dashboard-card" id="open-news">
          <strong>Мэдээ</strong>
          <span class="muted">${stats ? `${stats.news} мэдээ` : 'App дотор харагдах мэдээ'}</span>
        </button>
        <button class="dashboard-card" id="open-settings">
          <strong>Тохиргоо</strong>
          <span class="muted">Admin PIN солих</span>
        </button>
      </div>
    </section>
  `, `<button class="btn btn-ghost" id="refresh-stats">Сэргээх</button><button class="btn btn-ghost" id="logout-btn">Гарах</button>`);

  if (!stats) {
    loadDashboardStats().then(() => render());
    return;
  }

  $$('.cat-card').forEach((btn) => {
    btn.onclick = () => loadVenueType(btn.dataset.type);
  });
  $('#open-banners').onclick = () => { goToScreen('banner-types'); };
  $('#open-requests').onclick = loadRequestsScreen;
  $('#open-news').onclick = loadNewsScreen;
  $('#open-settings').onclick = () => { goToScreen('settings'); };
  $('#refresh-stats').onclick = async () => {
    state.dashboardStats = null;
    await loadDashboardStats();
    render();
  };
  $('#logout-btn').onclick = () => {
    sessionStorage.removeItem('kora_admin_ok');
    goToScreen('pin');
  };
}

async function loadDashboardStats() {
  try {
    state.dashboardStats = await fetchDashboardStats();
    state.requests = await fetchRequests();
  } catch (e) {
    state.dashboardStats = {
      venuesByType: Object.fromEntries(VENUE_TYPES.map((t) => [t.id, 0])),
      totalVenues: 0,
      banners: 0,
      news: 0,
      newRequests: 0,
      totalRequests: 0,
    };
    showError(e.message);
  }
}

async function loadVenueType(type, options = {}) {
  const { push = true } = options;
  showError('');
  state.type = type;
  state.venueSearch = '';
  state.screen = 'loading';
  render();
  try {
    state.venues = await fetchVenues(type);
    goToScreen('venue-list', { push, type, venueSearch: '' });
  } catch (e) {
    goToScreen('home', { push: false });
    showError(e.message);
  }
}

function renderVenueList() {
  const meta = getTypeMeta(state.type);
  shell(meta.title, `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-home">← Буцах</button>
      <button class="btn btn-primary" id="add-venue">+ Шинэ нэмэх</button>
    </div>
    <div class="search-row">
      <input class="input search-input" id="venue-search" value="${esc(state.venueSearch)}" placeholder="Нэр, дүүрэг, хаягаар хайх" />
      <span class="muted small" id="venue-search-count"></span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th></th><th>Нэр</th><th>Төлөв</th><th>VIP</th><th></th></tr></thead>
        <tbody id="venue-table-body"></tbody>
      </table>
    </div>
  `);
  $('#back-home').onclick = () => { window.history.back(); };
  $('#venue-search').oninput = (e) => {
    state.venueSearch = e.target.value;
    updateVenueListResults();
  };
  $('#add-venue').onclick = () => {
    state.form = emptyForm();
    goToScreen('venue-form');
  };
  updateVenueListResults();
}

function getFilteredVenues() {
  const query = state.venueSearch.trim().toLowerCase();
  if (!query) return state.venues;
  return state.venues.filter((v) => {
    const name = String(v.name || '').toLowerCase();
    const district = String(v.district || '').toLowerCase();
    const location = String(v.location || '').toLowerCase();
    return name.includes(query) || district.includes(query) || location.includes(query);
  });
}

function updateVenueListResults() {
  const tbody = $('#venue-table-body');
  const count = $('#venue-search-count');
  if (!tbody || !count) return;
  const query = state.venueSearch.trim().toLowerCase();
  const canReorder = !query;
  const filteredVenues = getFilteredVenues();
  count.textContent = `${filteredVenues.length} / ${state.venues.length}`;
  tbody.innerHTML = filteredVenues.length
    ? filteredVenues.map((v, i) => {
        const fullIdx = state.venues.findIndex((row) => row.id === v.id);
        const sortBtns = canReorder ? `
          <div class="sort-btns">
            <button type="button" class="btn btn-sm btn-ghost sort-btn" data-move-up="${v.id}" ${fullIdx <= 0 ? 'disabled' : ''} title="Дээш">↑</button>
            <button type="button" class="btn btn-sm btn-ghost sort-btn" data-move-down="${v.id}" ${fullIdx >= state.venues.length - 1 ? 'disabled' : ''} title="Доош">↓</button>
          </div>
        ` : '<span class="muted small">—</span>';
        return `
      <tr>
        <td class="sort-cell">${sortBtns}</td>
        <td><strong>${esc(v.name)}</strong><br><span class="muted small">${esc(v.district || v.location || '')}</span></td>
        <td>${v.visible === false ? '🔒 Нуугдсан' : '✓ Идэвхтэй'}</td>
        <td>${v.featured ? '⭐' : '—'}</td>
        <td class="actions-cell">
          <button class="btn btn-sm" data-edit="${v.id}">Засах</button>
          <button class="btn btn-sm btn-danger" data-del="${v.id}">Устгах</button>
        </td>
      </tr>
    `;
      }).join('')
    : `<tr><td colspan="5" class="muted">${query ? 'Олдсонгүй' : 'Одоогоор хоосон'}</td></tr>`;

  $$('[data-move-up]').forEach((btn) => {
    btn.onclick = () => moveVenue(btn.dataset.moveUp, 'up');
  });
  $$('[data-move-down]').forEach((btn) => {
    btn.onclick = () => moveVenue(btn.dataset.moveDown, 'down');
  });
  $$('[data-edit]').forEach((btn) => {
    btn.onclick = () => {
      const row = state.venues.find((v) => v.id === btn.dataset.edit);
      state.form = rowToForm(row);
      goToScreen('venue-form', { push: true, type: state.type, venueSearch: state.venueSearch });
    };
  });
  $$('[data-del]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Устгах уу?')) return;
      try {
        await deleteVenue(btn.dataset.del);
        state.dashboardStats = null;
        await loadVenueType(state.type, { push: false });
      } catch (e) {
        showError(e.message);
      }
    };
  });
}

async function moveVenue(id, direction) {
  if (state.venueSearch.trim()) return;
  const list = [...state.venues];
  const idx = list.findIndex((v) => v.id === id);
  if (idx < 0) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;

  [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
  const updates = list.map((v, i) => ({ id: v.id, sort_order: i }));

  try {
    await updateVenueSortOrders(updates);
    state.venues = list.map((v, i) => ({ ...v, sort_order: i }));
    state.dashboardStats = null;
    updateVenueListResults();
  } catch (e) {
    showError(e.message);
  }
}

function renderVenueForm() {
  destroyVenueMap();
  const f = state.form;
  const isHotel = state.type === 'hotel';
  const isResort = state.type === 'resort';
  const districtOpts = UB_DISTRICTS.map((d) =>
    `<option value="${d}" ${f.district === d ? 'selected' : ''}>${d}</option>`
  ).join('');
  const regionOpts = REGIONS.map((r) =>
    `<option value="${r.id}" ${f.region === r.id ? 'selected' : ''}>${r.label}</option>`
  ).join('');
  const featureChecks = FEATURES.map((key) => `
    <label class="check-label"><input type="checkbox" data-feat="${key}" ${f.features[key] ? 'checked' : ''} /> ${FEATURE_LABELS[key] || key}</label>
  `).join('');

  let priceSection = '';
  if (isHotel) {
    priceSection = `
      <label class="field"><span>Зочид буудлын од (1-5)</span>
        <input class="input" id="f-stars" value="${esc(f.hotelStars)}" placeholder="4" /></label>
      <label class="field"><span>Өрөөний үнэ (JSON)</span>
        <p class="hint">b1=2 хүний·1 ор, b2=4 хүний·2 ор … b1lux/b2lux = Lux</p>
        <textarea class="input" id="f-hotel-json" rows="4" placeholder='{"b1":"180000","b1lux":"230000","stars":4}'>${esc(f.hotelPriceJson)}</textarea>
      </label>`;
  } else if (isResort) {
    const units = (f.accommodationUnits || []).map((u, i) => renderUnitRow(u, i)).join('');
    priceSection = `
      <div class="field"><span>Байршуулалтын үнэ</span>
        <div id="units-wrap">${units}</div>
        <button type="button" class="btn btn-sm" id="add-unit">+ Нэмэх</button>
      </div>`;
  } else {
    priceSection = `
      <label class="field"><span>Үнэ</span>
        <input class="input" id="f-price" value="${esc(f.price)}" placeholder="Цагийн: 55,000₮" />
      </label>`;
  }

  shell(f.id ? 'Газар засах' : 'Шинэ газар', `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-list">← Жагсаалт</button>
      <button class="btn btn-primary" id="save-btn">Хадгалах</button>
    </div>
    <form class="form-grid" onsubmit="return false">
      <label class="field"><span>Нэр *</span><input class="input" id="f-name" value="${esc(f.name)}" /></label>
      <label class="field"><span>Утас</span><input class="input" id="f-phone" value="${esc(f.phone)}" /></label>
      <label class="field"><span>Дүүрэг</span><select class="input" id="f-district"><option value="">—</option>${districtOpts}</select></label>
      <label class="field"><span>Аймаг / хот</span><select class="input" id="f-region">${regionOpts}</select></label>
      <label class="field"><span>Цагийн хуваарь</span><input class="input" id="f-hours" value="${esc(f.hours)}" /></label>

      <div class="location-block">
        <div class="location-title">Байршил</div>
        <label class="field"><span>Хаяг / байршил</span><input class="input" id="f-location" value="${esc(f.location)}" /></label>
        <div class="field-row location-coords">
          <label class="field"><span>Өргөрөг</span><input class="input" id="f-lat" type="number" step="any" value="${f.latitude}" /></label>
          <label class="field"><span>Уртраг</span><input class="input" id="f-lng" type="number" step="any" value="${f.longitude}" /></label>
        </div>
        <div class="location-actions">
          <button type="button" class="btn btn-sm" id="my-loc">📍 Миний байршил</button>
          <a class="btn btn-sm btn-ghost" id="open-maps" href="https://www.google.com/maps?q=${escAttr(f.latitude)},${escAttr(f.longitude)}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
        <div class="map-preview-wrap">
          <div id="venue-map" class="venue-map"></div>
          <p class="muted small map-hint">Pin-ийг чирэх эсвэл газар дээр дарж байршил сонгоно</p>
        </div>
      </div>
      ${priceSection}
      <label class="field"><span>Facebook</span><input class="input" id="f-fb" value="${esc(f.facebook)}" /></label>
      <label class="field"><span>Instagram</span><input class="input" id="f-ig" value="${esc(f.instagram)}" /></label>
      <div class="field">
        <span>Зургууд</span>
        <p class="hint">Эхний зураг нь cover (гол зураг). ↑↓ эсвэл «Cover» дарж дараалал солино.</p>
        <div id="images-wrap" class="img-gallery">${buildImageGalleryHtml(f.images)}</div>
        <div class="toolbar compact">
          <button type="button" class="btn btn-sm" id="add-img">+ URL нэмэх</button>
          <label class="btn btn-sm upload-label">📷 Upload<input type="file" id="file-upload" accept="image/*" multiple hidden /></label>
        </div>
      </div>
      <div class="field"><span>Боломжууд</span><div class="checks-grid">${featureChecks}</div></div>
      <div class="toggles">
        <label class="toggle"><input type="checkbox" id="f-visible" ${f.visible ? 'checked' : ''} /> Харагдах</label>
        <label class="toggle"><input type="checkbox" id="f-featured" ${f.featured ? 'checked' : ''} /> VIP / Онцлох</label>
        <label class="toggle"><input type="checkbox" id="f-showprice" ${f.show_price ? 'checked' : ''} /> Үнэ харуулах</label>
      </div>
    </form>
  `);

  $('#back-list').onclick = () => { window.history.back(); };
  $('#save-btn').onclick = saveVenueForm;
  $('#my-loc').onclick = useMyLocation;
  $('#f-lat').oninput = updateLocationPreview;
  $('#f-lng').oninput = updateLocationPreview;
  bindImageGallery();
  if (isResort) {
    $('#add-unit').onclick = () => {
      state.form.accommodationUnits.push({ id: `u${Date.now()}`, kind: 'ger', beds: '', label: '', amount: '', luxAmount: '' });
      renderVenueForm();
    };
    bindUnitRows();
  }
  requestAnimationFrame(() => initVenueMap());
}

function buildImageGalleryHtml(images) {
  const list = images || [];
  if (!list.length) {
    return '<p class="muted small img-gallery-empty">Зураг байхгүй. Upload эсвэл URL нэмнэ үү.</p>';
  }
  return list.map((url, i) => {
    const isCover = i === 0;
    const hasUrl = Boolean((url || '').trim());
    return `
      <div class="img-card ${isCover ? 'img-card-cover' : ''}">
        <div class="img-card-preview">
          ${hasUrl
            ? `<img src="${escAttr(url)}" alt="" loading="lazy" />`
            : '<div class="img-placeholder">Preview</div>'}
          ${isCover ? '<span class="img-cover-badge">Cover</span>' : ''}
        </div>
        <div class="img-card-body">
          <input class="input img-url-input" data-img="${i}" value="${esc(url)}" placeholder="Зурагны URL" />
          <div class="img-card-actions">
            <button type="button" class="btn btn-sm btn-ghost sort-btn" data-img-up="${i}" ${i === 0 ? 'disabled' : ''} title="Дээш">↑</button>
            <button type="button" class="btn btn-sm btn-ghost sort-btn" data-img-down="${i}" ${i >= list.length - 1 ? 'disabled' : ''} title="Доош">↓</button>
            ${!isCover ? `<button type="button" class="btn btn-sm" data-img-cover="${i}">Cover</button>` : ''}
            <button type="button" class="btn btn-sm btn-danger" data-rmimg="${i}">×</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function syncImagesFromInputs() {
  $$('[data-img]').forEach((inp) => {
    const i = Number(inp.dataset.img);
    if (state.form.images[i] !== undefined) {
      state.form.images[i] = inp.value;
    }
  });
}

function updateImageGallery() {
  const wrap = $('#images-wrap');
  if (!wrap) return;
  wrap.innerHTML = buildImageGalleryHtml(state.form.images);
  bindImageGallery();
}

function bindImageGallery() {
  const addBtn = $('#add-img');
  const uploadInput = $('#file-upload');
  if (addBtn) {
    addBtn.onclick = () => {
      syncImagesFromInputs();
      state.form.images.push('');
      updateImageGallery();
    };
  }
  if (uploadInput) {
    uploadInput.onchange = async (e) => {
      const files = [...(e.target.files || [])];
      if (!files.length) return;
      syncImagesFromInputs();
      try {
        for (const file of files) {
          const url = await uploadImage(file, `venues/${state.type}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`);
          state.form.images.push(url);
        }
        updateImageGallery();
      } catch (err) {
        showError(err.message);
      } finally {
        uploadInput.value = '';
      }
    };
  }
  $$('[data-img]').forEach((inp) => {
    inp.oninput = () => {
      const i = Number(inp.dataset.img);
      state.form.images[i] = inp.value;
      const card = inp.closest('.img-card');
      const preview = card?.querySelector('.img-card-preview');
      if (!preview) return;
      const trimmed = inp.value.trim();
      let img = preview.querySelector('img');
      const placeholder = preview.querySelector('.img-placeholder');
      if (trimmed) {
        if (!img) {
          img = document.createElement('img');
          img.loading = 'lazy';
          preview.insertBefore(img, preview.firstChild);
        }
        img.src = trimmed;
        img.alt = '';
        if (placeholder) placeholder.remove();
      } else if (img) {
        img.remove();
        if (!preview.querySelector('.img-placeholder')) {
          const ph = document.createElement('div');
          ph.className = 'img-placeholder';
          ph.textContent = 'Preview';
          preview.insertBefore(ph, preview.firstChild);
        }
      }
    };
  });
  $$('[data-rmimg]').forEach((btn) => {
    btn.onclick = () => {
      syncImagesFromInputs();
      state.form.images.splice(Number(btn.dataset.rmimg), 1);
      updateImageGallery();
    };
  });
  $$('[data-img-up]').forEach((btn) => {
    btn.onclick = () => moveImage(Number(btn.dataset.imgUp), 'up');
  });
  $$('[data-img-down]').forEach((btn) => {
    btn.onclick = () => moveImage(Number(btn.dataset.imgDown), 'down');
  });
  $$('[data-img-cover]').forEach((btn) => {
    btn.onclick = () => setImageCover(Number(btn.dataset.imgCover));
  });
}

function moveImage(index, direction) {
  syncImagesFromInputs();
  const list = state.form.images;
  const swapIdx = direction === 'up' ? index - 1 : index + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;
  [list[index], list[swapIdx]] = [list[swapIdx], list[index]];
  updateImageGallery();
}

function setImageCover(index) {
  if (index <= 0) return;
  syncImagesFromInputs();
  const [item] = state.form.images.splice(index, 1);
  state.form.images.unshift(item);
  updateImageGallery();
}

function renderUnitRow(u, i) {
  const kinds = ACCOMMODATION_KINDS.map((k) =>
    `<option value="${k.id}" ${u.kind === k.id ? 'selected' : ''}>${k.label}</option>`
  ).join('');
  return `
    <div class="unit-card">
      <select class="input" data-ukind="${i}">${kinds}</select>
      <input class="input" data-ubeds="${i}" value="${esc(u.beds)}" placeholder="Орны тоо" />
      <input class="input" data-uamount="${i}" value="${esc(u.amount)}" placeholder="Үнэ ₮" />
      <input class="input" data-ulux="${i}" value="${esc(u.luxAmount || '')}" placeholder="Lux ₮" />
      <button type="button" class="btn btn-sm btn-danger" data-rmunit="${i}">×</button>
    </div>`;
}

function bindUnitRows() {
  const units = state.form.accommodationUnits || [];
  $$('[data-ukind]').forEach((el) => { el.onchange = () => { units[el.dataset.ukind].kind = el.value; }; });
  $$('[data-ubeds]').forEach((el) => { el.oninput = () => { units[el.dataset.ubeds].beds = el.value.replace(/\D/g, ''); }; });
  $$('[data-uamount]').forEach((el) => { el.oninput = () => { units[el.dataset.uamount].amount = el.value.replace(/\D/g, ''); }; });
  $$('[data-ulux]').forEach((el) => { el.oninput = () => { units[el.dataset.ulux].luxAmount = el.value.replace(/\D/g, ''); }; });
  $$('[data-rmunit]').forEach((btn) => {
    btn.onclick = () => {
      state.form.accommodationUnits.splice(Number(btn.dataset.rmunit), 1);
      renderVenueForm();
    };
  });
}

async function saveVenueForm() {
  showError('');
  if (!($('#f-name')?.value || '').trim()) {
    showError('Нэр оруулна уу');
    return;
  }
  try {
    const f = { ...state.form };
    f.name = $('#f-name').value;
    f.phone = $('#f-phone').value;
    f.location = $('#f-location').value;
    f.district = $('#f-district').value;
    f.region = $('#f-region').value;
    f.hours = $('#f-hours').value;
    f.latitude = parseFloat($('#f-lat').value) || 47.9188;
    f.longitude = parseFloat($('#f-lng').value) || 106.9174;
    f.facebook = $('#f-fb').value;
    f.instagram = $('#f-ig').value;
    f.visible = $('#f-visible').checked;
    f.featured = $('#f-featured').checked;
    f.show_price = $('#f-showprice').checked;
    f.features = {};
    $$('[data-feat]').forEach((cb) => { if (cb.checked) f.features[cb.dataset.feat] = true; });
    syncImagesFromInputs();
    f.images = [...state.form.images].map((u) => (u || '').trim()).filter(Boolean);
    if (state.type === 'hotel') {
      f.hotelStars = $('#f-stars').value;
      f.hotelPriceJson = $('#f-hotel-json').value;
    } else if (state.type !== 'resort') {
      f.price = $('#f-price').value;
    }
    const row = formToRow(f, state.type);
    if (!state.form.id) row.sort_order = state.venues.length;
    await saveVenue(state.type, row);
    state.dashboardStats = null;
    await loadVenueType(state.type, { push: false });
  } catch (e) {
    showError(e.message);
  }
}

function renderBannerTypes() {
  const cards = VENUE_TYPES.map((t) => `
    <button class="cat-card" data-banner-type="${t.id}" style="--accent:${t.color}">
      <span class="cat-title">${t.title}</span>
      <span class="cat-go">Banner →</span>
    </button>
  `).join('');
  shell('Banner', `
    <div class="toolbar"><button class="btn btn-ghost" id="back-home">← Буцах</button></div>
    <div class="cat-grid">${cards}</div>
  `);
  $('#back-home').onclick = () => { window.history.back(); };
  $$('[data-banner-type]').forEach((btn) => {
    btn.onclick = () => loadBannerType(btn.dataset.bannerType);
  });
}

async function loadBannerType(type, options = {}) {
  const { push = true } = options;
  showError('');
  state.type = type;
  state.screen = 'loading';
  render();
  try {
    state.banners = await fetchBanners(type);
    goToScreen('banner-list', { push, type });
  } catch (e) {
    goToScreen('banner-types', { push: false });
    showError(e.message);
  }
}

function renderBannerList() {
  const meta = getTypeMeta(state.type);
  const rows = state.banners.map((b) => `
    <tr>
      <td><img class="thumb" src="${escAttr(b.image)}" alt="" /></td>
      <td>${esc(b.link_url || 'Холбоосгүй')}</td>
      <td>${b.sort_order ?? 0}</td>
      <td class="actions-cell">
        <button class="btn btn-sm" data-edit-banner="${b.id}">Засах</button>
        <button class="btn btn-sm btn-danger" data-del-banner="${b.id}">Устгах</button>
      </td>
    </tr>
  `).join('');
  shell(`${meta.title} Banner`, `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-banner-types">← Буцах</button>
      <button class="btn btn-primary" id="add-banner">+ Banner нэмэх</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Зураг</th><th>Холбоос</th><th>Эрэмбэ</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="muted">Banner байхгүй</td></tr>'}</tbody>
      </table>
    </div>
  `);
  $('#back-banner-types').onclick = () => { window.history.back(); };
  $('#add-banner').onclick = () => {
    state.bannerForm = emptyBannerForm();
    goToScreen('banner-form');
  };
  $$('[data-edit-banner]').forEach((btn) => {
    btn.onclick = () => {
      const row = state.banners.find((b) => b.id === btn.dataset.editBanner);
      state.bannerForm = rowToBannerForm(row);
      goToScreen('banner-form');
    };
  });
  $$('[data-del-banner]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Banner устгах уу?')) return;
      try {
        await deleteBanner(btn.dataset.delBanner);
        await loadBannerType(state.type);
      } catch (e) {
        showError(e.message);
      }
    };
  });
}

function renderBannerForm() {
  const f = state.bannerForm;
  shell(f.id ? 'Banner засах' : 'Banner нэмэх', `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-banner-list">← Жагсаалт</button>
      <button class="btn btn-primary" id="save-banner">Хадгалах</button>
    </div>
    <form class="form-grid" onsubmit="return false">
      <label class="field"><span>Зураг URL *</span><input class="input" id="b-image" value="${esc(f.image)}" /></label>
      <div class="toolbar compact">
        <label class="btn btn-sm upload-label">📷 Upload<input type="file" id="banner-upload" accept="image/*" hidden /></label>
      </div>
      ${f.image ? `<img class="banner-preview" src="${escAttr(f.image)}" alt="" />` : ''}
      <label class="field"><span>Холбоос</span><input class="input" id="b-link" value="${esc(f.linkUrl)}" placeholder="https://..." /></label>
      <label class="field"><span>Эрэмбэ</span><input class="input" id="b-sort" type="number" value="${Number(f.sortOrder) || 0}" /></label>
    </form>
  `);
  $('#back-banner-list').onclick = () => { window.history.back(); };
  $('#save-banner').onclick = saveBannerForm;
  $('#banner-upload').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      state.bannerForm.image = await uploadImage(file, `banners/${state.type}/${Date.now()}.jpg`);
      renderBannerForm();
    } catch (err) {
      showError(err.message);
    }
  };
}

async function saveBannerForm() {
  try {
    const form = {
      ...state.bannerForm,
      image: ($('#b-image')?.value || '').trim(),
      linkUrl: ($('#b-link')?.value || '').trim(),
      sortOrder: Number($('#b-sort')?.value || 0),
    };
    if (!form.image) {
      showError('Banner зураг оруулна уу');
      return;
    }
    await saveBanner(state.type, bannerFormToRow(form, state.type));
    await loadBannerType(state.type);
  } catch (e) {
    showError(e.message);
  }
}

async function loadRequestsScreen(options = {}) {
  const { push = true } = options;
  showError('');
  state.screen = 'loading';
  render();
  try {
    state.requests = await fetchRequests();
    goToScreen('requests', { push });
  } catch (e) {
    goToScreen('home', { push: false });
    showError(e.message);
  }
}

function renderRequests() {
  const rows = state.requests.map((item) => `
    <div class="request-card ${item.status === 'new' ? 'request-card-new' : ''}">
      <div class="request-top">
        <strong>${esc(item.venue_name || item.venueName || '')}</strong>
        <span class="status-pill status-${escAttr(item.status || 'new')}">${requestStatusLabel(item.status)}</span>
      </div>
      <div class="request-meta">${esc(getTypeMeta(item.type).title)} · ${esc(getRegionLabel(item.region))}</div>
      <div class="request-line">👤 ${esc(item.contact_name || item.contactName || '')}</div>
      ${item.location ? `<div class="request-line">📍 ${esc(item.location)}</div>` : ''}
      <div class="request-line">📞 ${esc(item.phone || '')}</div>
      ${item.email ? `<div class="request-line">✉️ ${esc(item.email)}</div>` : ''}
      <div class="request-line muted small">${formatDateTime(item.created_at || item.createdAt)}</div>
      <div class="toolbar compact">
        <button class="btn btn-sm" data-mark="${item.id}" data-status="read">Уншсан</button>
        <button class="btn btn-sm" data-mark="${item.id}" data-status="done">Дууссан</button>
        <button class="btn btn-sm btn-danger" data-del-req="${item.id}">Устгах</button>
      </div>
    </div>
  `).join('');
  shell('Бүртгүүлэх хүсэлт', `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-home">← Буцах</button>
      <button class="btn btn-primary" id="refresh-req">Сэргээх</button>
    </div>
    <div class="request-list">${rows || '<div class="card muted">Хүсэлт байхгүй</div>'}</div>
  `);
  $('#back-home').onclick = () => { window.history.back(); };
  $('#refresh-req').onclick = loadRequestsScreen;
  $$('[data-mark]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await updateRequestStatus(btn.dataset.mark, btn.dataset.status);
        await loadRequestsScreen();
      } catch (e) {
        showError(e.message);
      }
    };
  });
  $$('[data-del-req]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Хүсэлт устгах уу?')) return;
      try {
        await deleteRequest(btn.dataset.delReq);
        await loadRequestsScreen();
      } catch (e) {
        showError(e.message);
      }
    };
  });
}

async function loadNewsScreen(options = {}) {
  const { push = true } = options;
  showError('');
  state.screen = 'loading';
  render();
  try {
    state.news = await fetchNews();
    goToScreen('news-list', { push });
  } catch (e) {
    goToScreen('home', { push: false });
    showError(e.message);
  }
}

function renderNewsList() {
  const rows = state.news.map((item) => `
    <tr>
      <td><strong>${esc(item.title || '')}</strong><br><span class="muted small">${esc(item.audience || 'all')}</span></td>
      <td>${formatDateTime(item.published_at)}</td>
      <td class="actions-cell">
        <button class="btn btn-sm" data-edit-news="${item.id}">Засах</button>
        <button class="btn btn-sm btn-danger" data-del-news="${item.id}">Устгах</button>
      </td>
    </tr>
  `).join('');
  shell('Мэдээ', `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-home">← Буцах</button>
      <button class="btn btn-primary" id="add-news">+ Мэдээ нэмэх</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Гарчиг</th><th>Нийтэлсэн</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" class="muted">Мэдээ байхгүй</td></tr>'}</tbody>
      </table>
    </div>
  `);
  $('#back-home').onclick = () => { window.history.back(); };
  $('#add-news').onclick = () => {
    state.newsForm = emptyNewsForm();
    goToScreen('news-form');
  };
  $$('[data-edit-news]').forEach((btn) => {
    btn.onclick = () => {
      const row = state.news.find((n) => n.id === btn.dataset.editNews);
      state.newsForm = rowToNewsForm(row);
      goToScreen('news-form');
    };
  });
  $$('[data-del-news]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Мэдээ устгах уу?')) return;
      try {
        await deleteNews(btn.dataset.delNews);
        await loadNewsScreen();
      } catch (e) {
        showError(e.message);
      }
    };
  });
}

function renderNewsForm() {
  const f = state.newsForm;
  const audienceOpts = ['all', ...VENUE_TYPES.map((t) => t.id)].map((id) => {
    const label = id === 'all' ? 'Бүгд' : getTypeMeta(id).title;
    return `<option value="${id}" ${f.audience === id ? 'selected' : ''}>${label}</option>`;
  }).join('');
  shell(f.id ? 'Мэдээ засах' : 'Мэдээ нэмэх', `
    <div class="toolbar">
      <button class="btn btn-ghost" id="back-news-list">← Жагсаалт</button>
      <button class="btn btn-primary" id="save-news">Хадгалах</button>
    </div>
    <form class="form-grid" onsubmit="return false">
      <label class="field"><span>Гарчиг *</span><input class="input" id="n-title" value="${esc(f.title)}" /></label>
      <label class="field"><span>Текст *</span><textarea class="input" id="n-body" rows="6">${esc(f.body)}</textarea></label>
      <label class="field"><span>Зураг URL</span><input class="input" id="n-image" value="${esc(f.image)}" /></label>
      <div class="toolbar compact">
        <label class="btn btn-sm upload-label">📷 Upload<input type="file" id="news-upload" accept="image/*" hidden /></label>
      </div>
      ${f.image ? `<img class="banner-preview" src="${escAttr(f.image)}" alt="" />` : ''}
      <label class="field"><span>Холбоос</span><input class="input" id="n-link" value="${esc(f.linkUrl)}" placeholder="https://..." /></label>
      <label class="field"><span>Хэнд харагдах</span><select class="input" id="n-audience">${audienceOpts}</select></label>
    </form>
  `);
  $('#back-news-list').onclick = () => { window.history.back(); };
  $('#save-news').onclick = saveNewsForm;
  $('#news-upload').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      state.newsForm.image = await uploadImage(file, `news/${Date.now()}.jpg`);
      renderNewsForm();
    } catch (err) {
      showError(err.message);
    }
  };
}

async function saveNewsForm() {
  try {
    const form = {
      ...state.newsForm,
      title: ($('#n-title')?.value || '').trim(),
      body: ($('#n-body')?.value || '').trim(),
      image: ($('#n-image')?.value || '').trim(),
      linkUrl: ($('#n-link')?.value || '').trim(),
      audience: $('#n-audience')?.value || 'all',
    };
    if (!form.title || !form.body) {
      showError('Гарчиг болон текст оруулна уу');
      return;
    }
    await saveNews(newsFormToRow(form));
    await loadNewsScreen();
  } catch (e) {
    showError(e.message);
  }
}

function renderSettings() {
  shell('Тохиргоо', `
    <div class="toolbar"><button class="btn btn-ghost" id="back-home">← Буцах</button></div>
    <section class="card narrow-card">
      <label class="field"><span>Шинэ Admin PIN</span><input class="input" id="new-pin" type="password" maxlength="12" placeholder="Шинэ PIN" /></label>
      <button class="btn btn-primary" id="save-pin">PIN хадгалах</button>
      <p class="muted small">Хадгалсны дараа mobile app болон web admin хоёул шинэ PIN-ээр нэвтэрнэ.</p>
    </section>
  `);
  $('#back-home').onclick = () => { window.history.back(); };
  $('#save-pin').onclick = async () => {
    try {
      const pin = ($('#new-pin')?.value || '').trim();
      if (pin.length < 4) {
        showError('PIN хамгийн багадаа 4 оронтой байна');
        return;
      }
      await saveAdminPin(pin);
      alert('PIN хадгалагдлаа');
      $('#new-pin').value = '';
      showError('');
    } catch (e) {
      showError(e.message);
    }
  };
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert('Байршил дэмжигдэхгүй');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    $('#f-lat').value = pos.coords.latitude.toFixed(6);
    $('#f-lng').value = pos.coords.longitude.toFixed(6);
    updateLocationPreview();
  }, () => alert('Байршлын зөвшөөрөл өгнө үү'));
}

function destroyVenueMap() {
  if (venueMap) {
    venueMap.remove();
    venueMap = null;
    venueMarker = null;
  }
}

function initVenueMap() {
  const container = $('#venue-map');
  if (!container || !window.L) return;

  const lat = parseFloat($('#f-lat')?.value) || 47.9188;
  const lng = parseFloat($('#f-lng')?.value) || 106.9174;

  venueMap = window.L.map(container, { scrollWheelZoom: true }).setView([lat, lng], 15);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(venueMap);

  venueMarker = window.L.marker([lat, lng], { draggable: true }).addTo(venueMap);

  venueMarker.on('dragend', () => {
    const pos = venueMarker.getLatLng();
    setCoordsFromMap(pos.lat, pos.lng);
  });

  venueMap.on('click', (e) => {
    venueMarker.setLatLng(e.latlng);
    setCoordsFromMap(e.latlng.lat, e.latlng.lng);
  });

  requestAnimationFrame(() => venueMap?.invalidateSize());
}

function setCoordsFromMap(lat, lng) {
  const latEl = $('#f-lat');
  const lngEl = $('#f-lng');
  if (latEl) latEl.value = lat.toFixed(6);
  if (lngEl) lngEl.value = lng.toFixed(6);
  updateLocationPreview();
}

function updateLocationPreview() {
  const lat = parseFloat($('#f-lat')?.value) || 47.9188;
  const lng = parseFloat($('#f-lng')?.value) || 106.9174;
  const link = $('#open-maps');
  if (link) {
    link.setAttribute('href', `https://www.google.com/maps?q=${lat},${lng}`);
  }
  if (venueMap && venueMarker) {
    venueMarker.setLatLng([lat, lng]);
    venueMap.panTo([lat, lng]);
  }
}

function getTypeMeta(type) {
  return VENUE_TYPES.find((t) => t.id === type) || VENUE_TYPES[0];
}

function requestStatusLabel(status) {
  if (status === 'done') return 'Дууссан';
  if (status === 'read') return 'Уншсан';
  return 'Шинэ';
}

function getRegionLabel(id) {
  const match = REGIONS.find((r) => r.id === id);
  return match ? match.label : 'Улаанбаатар';
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('mn-MN');
  } catch {
    return value;
  }
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return esc(s).replace(/'/g, '&#39;');
}

boot();
