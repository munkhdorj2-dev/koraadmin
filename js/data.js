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

/** Hotel room tiers: guests = beds × 2. Keys: b1 / b1lux … b5 / b5lux */
export const HOTEL_BED_KEYS = [1, 2, 3, 4, 5].map((beds) => ({
  key: String(beds),
  stdKey: `b${beds}`,
  luxKey: `b${beds}lux`,
  label: `${beds * 2} хүний · ${beds} ортой`,
  placeholder: String(100000 + beds * 50000),
  luxPlaceholder: String(150000 + beds * 50000),
}));

export function emptyHotelPrices() {
  const o = {};
  HOTEL_BED_KEYS.forEach((bed) => {
    o[bed.stdKey] = '';
    o[bed.luxKey] = '';
  });
  return o;
}

export function parseHotelPrices(raw) {
  const out = emptyHotelPrices();
  if (!raw) return out;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return out;
    }
  }
  if (!obj || typeof obj !== 'object') return out;
  HOTEL_BED_KEYS.forEach((bed) => {
    const std = obj[bed.stdKey];
    const lux = obj[bed.luxKey];
    out[bed.stdKey] = std != null && std !== '' ? String(std).replace(/\D/g, '') : '';
    out[bed.luxKey] = lux != null && lux !== '' ? String(lux).replace(/\D/g, '') : '';
  });
  return out;
}

export function serializeHotelPrices(prices, stars) {
  const body = {};
  let hasAny = false;
  HOTEL_BED_KEYS.forEach((bed) => {
    const std = String(prices?.[bed.stdKey] || '').replace(/\D/g, '');
    const lux = String(prices?.[bed.luxKey] || '').replace(/\D/g, '');
    if (std) {
      body[bed.stdKey] = std;
      hasAny = true;
    }
    if (lux) {
      body[bed.luxKey] = lux;
      hasAny = true;
    }
  });
  const starNum = Number(stars);
  if (starNum >= 1 && starNum <= 5) {
    body.stars = starNum;
    hasAny = true;
  }
  return hasAny ? JSON.stringify(body) : '';
}
