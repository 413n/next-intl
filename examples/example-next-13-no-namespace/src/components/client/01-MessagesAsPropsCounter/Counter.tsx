import { useTranslations } from "next-intl";
import ClientCounter from "./ClientCounter";

export default function Counter() {
  const t = useTranslations();

  return (
    <ClientCounter
      messages={{
        count: t("count"),
        increment: t("increment"),
      }}
    />
  );
}
