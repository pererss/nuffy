import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Конфиденциальность — NUFFY" };

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Политика конфиденциальности"
      description="Как мы обрабатываем ваши данные"
    >
      <div className="rule-box">
        <h3>1. Какие данные мы собираем</h3>
        <ul>
          <li>Логин и email, указанные при регистрации.</li>
          <li>История операций на платформе (покупки, продажи, обмены, апгрейды).</li>
          <li>Технические данные: IP-адрес, данные устройства, логи действий.</li>
        </ul>
      </div>
      <div className="rule-box">
        <h3>2. Как мы используем данные</h3>
        <ul>
          <li>Для предоставления сервиса и верификации операций.</li>
          <li>Для защиты от мошенничества и нарушений правил.</li>
          <li>Для улучшения качества сервиса.</li>
        </ul>
      </div>
      <div className="rule-box">
        <h3>3. Хранение данных</h3>
        <p>
          Данные хранятся на защищённых серверах. Мы не передаём ваши персональные
          данные третьим лицам, за исключением случаев, предусмотренных законом.
        </p>
      </div>
      <div className="rule-box">
        <h3>4. Связь с нами</h3>
        <p>
          По вопросам обработки данных пишите на{" "}
          <a href="mailto:nuffysup@gmail.com" className="text-brand hover:underline">nuffysup@gmail.com</a>.
        </p>
      </div>
    </LegalLayout>
  );
}