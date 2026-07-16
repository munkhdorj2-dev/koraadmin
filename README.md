# Kora Web Admin

Computer дээрээс газар нэмэх, засах, устгах.

## Тохиргоо

1. `js/config.example.js` → `js/config.js` хуулна
2. App-ийн `.env` доторх утгуудыг оруулна:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Локал шалгах: `admin-web` хавтас дотор simple server ажиллуулна  
   Жишээ: VS Code Live Server эсвэл `npx serve admin-web`

## Netlify deploy

1. [netlify.com](https://netlify.com) → **Add new site** → **Deploy manually**
2. **`admin-web` хавтсыг бүхэлд нь** drag & drop (config.js орсон байх!)
3. URL гарна — жишээ: `https://kora-admin.netlify.app`

### Нууцлал (санал)

- Netlify → **Site configuration** → **Access control** → Password protect
- Эсвэл URL-ийг нууц байлга

## PIN

App-ийн admin PIN-тэй ижил (`app_settings` → `admin_pin`, default: `2026`).

## Одоогийн боломж

- 5 ангилал: karaoke, lounge, stripclub, hotel, resort
- Газар нэмэх / засах / устгах
- Banner нэмэх / засах / устгах
- Бүртгүүлэх хүсэлт харах, төлөв солих, устгах
- App news / мэдээ нэмэх / засах / устгах
- Admin PIN солих
- Байршил (lat/lng) + миний байршил
- Зураг URL + Supabase upload
- Боломжууд (features)
- Hotel: JSON үнэ
- Resort: гэр/өрөө мөрүүд

## Дараа нэмэгдэх боломжтой

- News publish хийхэд push notification илгээх
- Map дээр pin чирэх
- Dashboard дээр статистик картууд
