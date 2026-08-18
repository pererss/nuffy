import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata = { title: "Контакты — NUFFY" };

export default function ContactsPage() {
  return (
    <LegalLayout title="Контакты" description="Способы связи с администрацией">
      <div className="rule-box">
        <h3>Почта</h3>
        <p>
          <a href="mailto:nuffysup@gmail.com">nuffysup@gmail.com</a>
        </p>
        <p>По всем вопросам: поддержка, пополнение баланса, ошибки, предложения.</p>
      </div>
      <div className="rule-box">
        <h3>Время ответа</h3>
        <p>Обычно отвечаем в течение 24 часов в будние дни.</p>
      </div>
      <div className="rule-box">
        <h3>Технические проблемы</h3>
        <p>
          При обращении укажите ваш ID аккаунта (виден в профиле) и опишите
          проблему — это ускорит решение.
        </p>
      </div>
    </LegalLayout>
  );
}
