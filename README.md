# Skin Vault

Персональная коллекция скинов VALORANT: каталог, вишлист, цены VP, фильтры оружия и редкости, скрытие боевого пропуска и рулетка. Тёмная лиловая тема, адаптация для ПК и телефона.

Это самостоятельная версия для **GitHub Pages + Supabase**. Старая рабочая версия: https://skin-vault.jujulia0088.chatgpt.site

## Ссылки после запуска Pages

- Владелец: `https://lillakattenme.github.io/skin-vault/`
- Зрители: `https://lillakattenme.github.io/skin-vault/?view=guest`

Владелец входит через Supabase Auth. Зрители открывают коллекцию и вишлист без входа. Запрет изменений обеспечивают права базы и проверка владельца в серверных функциях, а не только скрытые кнопки.

## Подключение Supabase

1. Создайте проект Supabase.
2. В SQL Editor выполните **supabase/schema.sql** один раз в новом проекте.
3. В Authentication → Users создайте свой аккаунт владельца (email и пароль). Пароль не добавляйте в GitHub и не присылайте в чат.
4. Скопируйте UUID созданного пользователя. Подставьте его в **supabase/set-owner.sql** и выполните этот запрос. Владельца назначает администратор; регистрация посетителя не даёт права редактировать коллекцию.
5. Скопируйте URL проекта и **publishable key** (либо legacy anon key). Service role/secret key для сайта использовать нельзя.
6. В GitHub → Settings → Secrets and variables → Actions → Variables добавьте:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
7. В GitHub → Settings → Pages → Build and deployment выберите **GitHub Actions**.
8. В Actions запустите **Publish Skin Vault** через Run workflow. Затем изменения main публикуются автоматически.

URL проекта и publishable key предназначены для браузера и будут присутствовать в сборке. Доступ к данным ограничен RLS и серверными функциями. Пароли, service role/secret keys, почта владельца и идентификаторы аккаунта ChatGPT в репозитории не хранятся.

Пока конфигурация Supabase отсутствует, сайт показывает страницу подготовки со ссылкой на действующий сайт. Он не имитирует сохранение в облаке.

## Перенос коллекции

Данные существующей коллекции нужно импортировать отдельно в `public.skin_selections` через доверенное администраторское подключение. Поля: `skin_id`, `owned`, `wished`, `price_override`. UUID пользователя из ChatGPT не переносится: нового владельца назначают по UUID Supabase Auth. Само добавление кода в GitHub не переносит пользовательские записи.

## Локальная разработка

Node.js 22.13+:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Заполните `.env.local` публичным URL проекта и publishable key. Для проверки:

```sh
npm test
npm run build
```

## Каталог и цены

Публичные данные и изображения — Valorant-API. Каталог обновляется при открытии (не чаще одного раза за 6 часов в текущем сеансе); есть кнопка ручной проверки. Если источник недоступен, используется встроенный снимок каталога. Облачная коллекция хранится отдельно.

Скины боевого пропуска определяются по наградам сезонных контрактов. Цены справочные: известные цены из снимка предложений и базовые тарифы Select/Deluxe/Premium для огнестрельного оружия. Цена ножа или особой серии не угадывается. Владелец может задать подтверждённую цену вручную. Скидки, цена комплектов и улучшения за Radianite в сумме не учитываются.

Источники:
- https://valorant-api.com/
- https://github.com/weedeej/valorant-api-json/blob/master/offers.json
- https://support.riotgames.com/en-us/valorant/store/price-tiers-for-skins-in-valorant

Проект не связан с Riot Games. VALORANT и игровые изображения принадлежат Riot Games.
