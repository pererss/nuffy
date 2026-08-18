export type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function translateDbError(message: string | undefined | null): string {
  if (!message) return "Неизвестная ошибка";
  const m = message.toLowerCase();
  if (m.includes("not_authenticated")) return "Войдите, чтобы продолжить";
  if (m.includes("account_banned")) return "Аккаунт заблокирован";
  if (m.includes("profile_not_found")) return "Профиль не найден";
  if (m.includes("insufficient_balance")) return "Недостаточно средств на балансе";
  if (m.includes("chip_not_found")) return "Фишка не найдена";
  if (m.includes("chip_not_available")) return "Фишка недоступна для покупки";
  if (m.includes("chip_sold_out")) return "Тираж этой фишки распродан";
  if (m.includes("collection_not_available")) return "Коллекция недоступна";
  if (m.includes("collection_sold_out")) return "Коллекция распродана";
  if (m.includes("sale_not_allowed:lock"))
    return "Продажа недоступна: фишка заблокирована (7 дней с момента получения)";
  if (m.includes("sale_not_allowed:collection_not_sold_out"))
    return "Продажа недоступна: коллекция ещё не распродана";
  if (m.includes("sale_not_allowed:already_listed"))
    return "Эта фишка уже выставлена на торговой площадке";
  if (m.includes("sale_not_allowed:not_owner"))
    return "Вы не владелец этой фишки";
  if (m.includes("sale_not_allowed"))
    return "Продажа недоступна: не выполнены условия продажи";
  if (m.includes("invalid_price")) return "Некорректная цена";
  if (m.includes("listing_not_found")) return "Объявление не найдено";
  if (m.includes("listing_not_active")) return "Объявление уже неактивно";
  if (m.includes("cannot_buy_own")) return "Нельзя купить собственное объявление";
  if (m.includes("pack_not_found")) return "Пак не найден";
  if (m.includes("pack_not_active")) return "Пак сейчас недоступен";
  if (m.includes("pack_not_started")) return "Пак ещё не стартовал";
  if (m.includes("pack_ended")) return "Пак закончился";
  if (m.includes("pack_sold_out")) return "Пак распродан";
  if (m.includes("pack_no_version")) return "У пака нет конфигурации версии";
  if (m.includes("pack_empty_config")) return "Конфигурация пака пуста";
  if (m.includes("pack_tier_empty")) return "В тире пака нет фишек";
  if (m.includes("pack_no_chips")) return "Не удалось выдать фишку: все распроданы";
  if (m.includes("trade_not_found")) return "Обмен не найден";
  if (m.includes("trade_not_pending")) return "Обмен уже не активен";
  if (m.includes("trade_expired")) return "Срок обмена истёк";
  if (m.includes("cannot_accept_own")) return "Нельзя принять собственный обмен";
  if (m.includes("items_count_mismatch")) return "Количество фишек не совпадает";
  if (m.includes("not_ownable")) return "Некоторые фишки недоступны для передачи";
  if (m.includes("code_taken")) return "Такой код уже занят";
  if (m.includes("invalid_status")) return "Некорректный статус фишки";
  if (m.includes("target_free")) return "Целевая фишка не может быть бесплатной";
  if (m.includes("invalid_amount")) return "Некорректная сумма";
  if (m.includes("txn_not_found")) return "Транзакция не найдена";
  if (m.includes("txn_not_pending")) return "Транзакция уже обработана";
  if (m.includes("promo_not_found")) return "Промокод не найден";
  if (m.includes("promo_inactive")) return "Промокод неактивен";
  if (m.includes("promo_not_started")) return "Промокод ещё не активен";
  if (m.includes("promo_expired")) return "Срок действия промокода истёк";
  if (m.includes("promo_used_up")) return "Промокод больше не действует";
  if (m.includes("promo_claimed")) return "Вы уже использовали этот промокод";
  if (m.includes("promo_zero")) return "Бонус промокода равен нулю";
  if (m.includes("forbidden")) return "Недостаточно прав";
  if (m.includes("tiers_empty")) return "Конфигурация пака: тиры не заданы";
  if (m.includes("tiers_sum_not_100"))
    return "Сумма вероятностей тиров не равна 100%";
  if (m.includes("tier_items_empty")) return "В тире нет фишек";
  if (m.includes("tier_weight_invalid")) return "Некорректный вес тира";
  if (m.includes("item_weight_invalid")) return "Некорректный вес фишки";
  if (m.includes("items_sum_not_100"))
    return "Сумма вероятностей фишек в тире не равна 100%";
  if (m.includes("chip_rarity_mismatch"))
    return "Фишка не соответствует редкости тира";
  if (m.includes("chip_level_mismatch"))
    return "Фишка не соответствует уровню тира";
  if (m.includes("chip_invalid")) return "Фишка недоступна";
  if (m.includes("rarity_not_found")) return "Редкость не найдена";
  if (m.includes("level_not_found")) return "Уровень не найден";
  if (m.includes("code_taken")) return "Код занят";
  if (m.includes("cannot_buy_own")) return "Нельзя купить свой товар";
  if (m.includes("invalid_tier")) return "Некорректный тир";
  if (m.includes("not_owner")) return "Недостаточно прав: вы не владелец";
  if (m.includes("duplicate key")) return "Конфликт с существующей записью";
  return message;
}