import { useTranslations } from "next-intl";
import PageLayout from "../../components/PageLayout";

export default function NotFound() {
  const t = useTranslations();
  return <PageLayout title={t("title")} />;
}
