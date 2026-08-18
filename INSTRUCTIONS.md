# Инструкция по запуску NUFFY

## 1. Требования

- Node.js 18.18+ (проверить: `node -v`)
- Созданный проект на [supabase.com](https://supabase.com) (бесплатный план подходит)
- Git-репозиторий уже настроен и подключён к `origin`

---

## 2. Переменные окружения (`.env.local`)

Файл `.env.local` уже заполнен частично. Проверьте, что в нём есть:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://gnktrmjlpnrcfunegiik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_f8aomMXZ1Qf1AImg6Bc91A_nrU7M8Ei
SUPABASE_SERVICE_ROLE_KEY=            # ← пусто, заполнить!
```

**Где взять ключи** (Dashboard → Project Settings → API):

| Переменная | Что копировать | Нужно для |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | всё |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable key** (новое название anon-ключа) | клиент, регистрация, чтения, RPC |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret key** (в старых проектах — «Service Role key») | только админ-панель |

> **Важно:** `SUPABASE_SERVICE_ROLE_KEY` — секрет. Он используется только на сервере (Next.js) и никогда не попадает в браузер. `.env.local` в git не коммитится. Без него сайт работает, но `/admin` покажет «Админ-панель отключена».

После изменения ключей ОБЯЗАТЕЛЬНО перезапустите `npm run dev`.

---

## 3. Создание таблиц — ОДНА миграция

Всё необходимое находится в **одном файле**:

- `supabase/migrations/005_full_setup.sql` — схема + функции + RLS + Storage + демо-данные; безопасен для повторного запуска (демо-данные применятся только один раз)

Файлы `001_schema.sql` – `004_seed.sql` — только история/справочник, **выполнять их не нужно**, они уже внутри `005`.

### Способ А — SQL-редактор в браузере (рекомендую)

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Откройте файл `supabase/migrations/005_full_setup.sql`, вставьте его содержимое целиком в редактор
3. **Run** (или Ctrl+Enter)
4. Внизу должны появиться числа проверки (`rarities` = 5, `chips` = 33, `pack_versions` = 2, `seed_applied` = 1)

### Способ Б — Supabase CLI

```powershell
npm i -g supabase
supabase login                          # браузер с GitHub
supabase link --project-ref gnktrmjlpnrcfunegiik
supabase db push                        # применит миграции из supabase/migrations
```

---

## 4. Запуск

```powershell
npm install
npm run dev
```

Откройте http://localhost:3000.

---

## 5. Демо-данные и вход

Миграция `004_seed.sql` создаёт:

| Что | Значение |
|---|---|
| Демо-пользователь | `demo@nuffy.app` / `demo123456` (баланс 5000 ₽) |
| Коллекции | 4 шт. (e.g. «Kanto», «Johto», «Hoenn», «Sinnoh», статус active) |
| Фишки | 33 шт., серийники, раритеты, уровни |
| Паки | Genesis Starter 250 ₽, Verdant Booster 600 ₽ (с вероятностями) |
| Промокоды | `NUFFY100` (минус 100 ₽), `NUFFY10` (скидка 10%) |

Вход: http://localhost:3000/login → войдите с `demo@nuffy.app` / `demo123456` или зарегистрируйте нового пользователя (баланс 0 ₽ — пополнение только через админку или промокод).

---

## 6. Назначение админа

После входа в чей-нибудь аккаунт выполните в SQL-редакторе:

```sql
update public.profiles
set role = 'admin'
where email = 'demo@nuffy.app';   -- или ваш email после регистрации
```

Затем откройте http://localhost:3000/admin — слева появится меню админки.

---

## 7. Чеклист проверки

Пользователь:
- [ ] `/shop` — коллекции и паки, покупка за баланс, промокод
- [ ] `/inventory` — фишки видны, продажа на площадку
- [ ] `/marketplace` — чужой лот покупается, деньги списываются, lock 7 дней
- [ ] `/upgrades` — апгрейд сжигает фишку, шансы из таблицы `upgrade_config`
- [ ] `/trades` — создать обмен по коду, принять вторым аккаунтом, отменить
- [ ] `/profile` — баланс, промокод, статистика, лучший дроп

Админ:
- [ ] `/admin/dashboard` — статистика
- [ ] `/admin/users` — бан/роль
- [ ] `/admin/collections`, `/admin/chips`, `/admin/packs`, `/admin/promocodes` — CRUD, загрузка картинок
- [ ] `/admin/transactions` — подтверждение пополнений
- [ ] `/admin/marketplace` — отмена лотов

---

## 8. Сборка и деплой

```powershell
npm run build     # обязателен перед пушем
npm run start     # проверить prod-сборку локально
```

Деплой: Vercel/Netlify с env-переменными из шага 2 (`SUPABASE_SERVICE_ROLE_KEY` в Vercel ставится в Settings → Environment Variables).

---

## 9. Правила работы с репозиторием

- **Каждое завершённое изменение коммитится и пушится** (`git add -A`, `git commit -m "..."`, `git push`).
- **Никогда не коммитить** `.env.local` и ключи (уже в `.gitignore`).
- **Изменения схемы БД — только одним файлом миграции** `supabase/migrations/00X_*.sql`: не редактировать предыдущие миграции, а добавлять новую, применимую поверх уже применённых. Единственное исключение — база ещё не развёрнута (тогда правки в `001`–`004` допустимы до первого применения).
- `npm run build` должен быть зелёным перед пушем.

---

## 10. Проблемы (Troubleshooting)

**«Supabase не настроен: добавьте переменные окружения»**
→ Проверьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в `.env.local`, перезапустите dev-сервер.

**«Админ-панель отключена»**
→ Пустой `SUPABASE_SERVICE_ROLE_KEY`. Вставьте Secret key из Dashboard → Project Settings → API.

**`relation "chips" does not exist` / `could not find the function public.buy_chip`**
→ Миграции не применены. Выполните `005_full_setup.sql` целиком (см. шаг 3); внизу должны появиться числа проверки.

**`permission denied for function/table` (RLS)**
→ Не применена часть RLS из `005_full_setup.sql` (или миграции делались до добавления политик). Перезапустите `005_full_setup.sql` целиком — он идемпотентен.

**Ошибка авторизации при входе / «Invalid claim»**
→ Старый anon-ключ vs publishable key. Убедитесь, что в `NEXT_PUBLIC_SUPABASE_ANON_KEY` именно **publishable** ключ из настроек API (приложение работает на publishable-ключах, supabase-js ≥ 2.49).

**Демо-пользователь не логинится**
→ Проверьте, что Auth → Users → Enable email provider (email подтверждение можно отключить для дева). Если seed выполнялся после создания пользователя вручную — просто войдите под своим аккаунтом.

**Картинки не загружаются из админки**
→ В Storage созданы бакеты `chips`, `collections`, `packs` (миграция 004) и политики на них (003). Если создавали бакеты сами — проверьте имена и policies.