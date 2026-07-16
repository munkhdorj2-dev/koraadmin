export const VENUE_TYPES = [
  { id: 'karaoke', title: 'Караоке', color: '#FF6B35', prefix: 'k' },
  { id: 'lounge', title: 'Лоунж', color: '#C9A96E', prefix: 'l' },
  { id: 'stripclub', title: 'Стрип клуб', color: '#E84393', prefix: 'sc' },
  { id: 'hotel', title: 'Зочид буудал', color: '#3B82F6', prefix: 'h' },
  { id: 'resort', title: 'Амралтын газар', color: '#22C55E', prefix: 'r' },
];

export const UB_DISTRICTS = [
  'Баянзүрх', 'Баянгол', 'Сүхбаатар', 'Хан-Уул', 'Чингэлтэй',
  'Сонгинохайрхан', 'Багануур', 'Багахангай', 'Налайх',
];

export const REGIONS = [
  { id: 'ulaanbaatar', label: 'Улаанбаатар' },
  { id: 'arkhangai', label: 'Архангай' },
  { id: 'bayanolgii', label: 'Баян-Өлгий' },
  { id: 'bayankhongor', label: 'Баянхонгор' },
  { id: 'bulgan', label: 'Булган' },
  { id: 'govi-altai', label: 'Говь-Алтай' },
  { id: 'govisumber', label: 'Говьсүмбэр' },
  { id: 'darkhan-uul', label: 'Дархан-Уул' },
  { id: 'dornogovi', label: 'Дорноговь' },
  { id: 'dornod', label: 'Дорнод' },
  { id: 'dundgovi', label: 'Дундговь' },
  { id: 'zavkhan', label: 'Завхан' },
  { id: 'orkhon', label: 'Орхон' },
  { id: 'uvurkhangai', label: 'Өвөрхангай' },
  { id: 'omnogovi', label: 'Өмнөговь' },
  { id: 'sukhbaatar', label: 'Сүхбаатар' },
  { id: 'selenge', label: 'Сэлэнгэ' },
  { id: 'tuv', label: 'Төв' },
  { id: 'uvs', label: 'Увс' },
  { id: 'khovd', label: 'Ховд' },
  { id: 'khuvsgul', label: 'Хөвсгөл' },
  { id: 'khentii', label: 'Хэнтий' },
];

export const FEATURES = [
  'wifi', 'parking', 'outdoorParking', 'garage', 'sound', 'kitchen', 'restaurant',
  'outdoorDining', 'coffeeShop', 'bar', 'alcohol', 'mic', 'vip', 'speaker', 'kidsRoom',
  'liveMusic', 'shisha', 'terrace', 'smokingRoom', 'birthday', 'breakfast', 'ac',
  'laundry', 'roomService', 'security24h', 'hotelShop', 'massage', 'sauna', 'transfer',
  'horseRiding', 'cycling', 'hiking', 'mountainHiking', 'gameRoom', 'basketball',
  'handball', 'football',
];

export const FEATURE_LABELS = {
  wifi: 'Wifi', parking: 'Зогсоол', outdoorParking: 'Ил зогсоол', garage: 'Граж',
  sound: 'Дуу систем', kitchen: 'Хоол ундаа', restaurant: 'Ресторан',
  outdoorDining: 'Гадна хоол', coffeeShop: 'Кофе шоп', bar: 'Бар', alcohol: 'Alcohol',
  mic: 'Микрофон', vip: 'VIP', speaker: 'Спикер', kidsRoom: 'Хүүхдийн өрөө',
  liveMusic: 'Амьд хөгжим', shisha: 'Shisha', terrace: 'Террас', smokingRoom: 'Тамхины өрөө',
  birthday: 'Төрсөн өдөр', breakfast: 'Өглөөний хоол', ac: 'Кондиционер',
  laundry: 'Угаалга', roomService: 'Room service', security24h: '24ц хамгаалалт',
  hotelShop: 'Буудлын дэлгүүр', massage: 'Массаж', sauna: 'Саун', transfer: 'Тосох хүргэх',
  horseRiding: 'Морь унах', cycling: 'Дугуй', hiking: 'Явган аялал',
  mountainHiking: 'Уулын аялал', gameRoom: 'Тоглоомын өрөө', basketball: 'Сагсан бөмбөг',
  handball: 'Гар бөмбөг', football: 'Хөл бөмбөг',
};

export const ACCOMMODATION_KINDS = [
  { id: 'ger', label: 'Гэр' },
  { id: 'room', label: 'Өрөө' },
  { id: 'tsomtsog', label: 'Цомцог гэр' },
  { id: 'muurin', label: 'Муурын байшин' },
  { id: 'wooden', label: 'Модон байшин' },
  { id: 'custom', label: 'Бусад' },
];

export const HOTEL_ROOM_TIERS = [
  { key: 'amount', label: 'Энгийн', placeholder: '180000' },
  { key: 'halfLux', label: 'Хагас lux', placeholder: '200000' },
  { key: 'fullLux', label: 'Бүтэн lux', placeholder: '230000' },
  { key: 'suiteLux', label: 'Тасалгаатай lux', placeholder: '280000' },
];

function newHotelRoomId() {
  return `hr${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyHotelRoom(overrides = {}) {
  return {
    id: newHotelRoomId(),
    guests: '2',
    beds: '1',
    amount: '',
    halfLux: '',
    fullLux: '',
    suiteLux: '',
    ...overrides,
  };
}

export function emptyHotelRooms() {
  return [];
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function tierAmounts(raw) {
  const amount = digitsOnly(raw?.amount);
  const fullLux = digitsOnly(raw?.fullLux ?? raw?.luxAmount);
  return {
    amount,
    halfLux: digitsOnly(raw?.halfLux),
    fullLux,
    suiteLux: digitsOnly(raw?.suiteLux),
  };
}

function normalizeHotelRoom(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const tiers = tierAmounts(raw);
  if (!HOTEL_ROOM_TIERS.some((t) => tiers[t.key])) return null;
  let beds = digitsOnly(raw.beds) || '1';
  let guests = digitsOnly(raw.guests);
  if (!guests) guests = String(Math.max(1, Number(beds) * 2));
  return {
    id: raw.id || newHotelRoomId(),
    guests,
    beds,
    ...tiers,
  };
}

function roomsFromLegacyFlat(obj) {
  const rooms = [];
  for (let beds = 1; beds <= 5; beds += 1) {
    const amount = digitsOnly(obj[`b${beds}`]);
    const fullLux = digitsOnly(obj[`b${beds}lux`]);
    if (!amount && !fullLux) continue;
    rooms.push(
      emptyHotelRoom({
        guests: String(beds * 2),
        beds: String(beds),
        amount,
        fullLux,
      })
    );
  }
  return rooms;
}

/** Parse hotel price JSON → { rooms, stars }. Supports new rooms[] + legacy b1 keys. */
export function parseHotelPrices(raw) {
  const empty = { rooms: [], stars: '' };
  if (!raw) return empty;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return empty;
    }
  }
  if (!obj || typeof obj !== 'object') return empty;
  const stars = obj.stars ? String(obj.stars) : '';
  if (Array.isArray(obj.rooms) && obj.rooms.length) {
    return { rooms: obj.rooms.map(normalizeHotelRoom).filter(Boolean), stars };
  }
  if (Array.isArray(obj.units) && obj.units.length) {
    return { rooms: obj.units.map(normalizeHotelRoom).filter(Boolean), stars };
  }
  return { rooms: roomsFromLegacyFlat(obj), stars };
}

export function serializeHotelPrices(rooms, stars) {
  const list = (Array.isArray(rooms) ? rooms : [])
    .map(normalizeHotelRoom)
    .filter(Boolean);
  const starNum = Number(stars);
  const hasStars = starNum >= 1 && starNum <= 5;
  if (!list.length && !hasStars) return '';
  return JSON.stringify({
    stars: hasStars ? starNum : null,
    rooms: list.map((r) => ({
      id: r.id,
      guests: r.guests,
      beds: r.beds,
      amount: r.amount || null,
      halfLux: r.halfLux || null,
      fullLux: r.fullLux || null,
      suiteLux: r.suiteLux || null,
    })),
  });
}

export function hotelRoomTitle(room) {
  const guests = digitsOnly(room?.guests) || '?';
  const beds = digitsOnly(room?.beds) || '?';
  return `${guests} хүний · ${beds} ортой`;
}
