import type { useTranslations as useTranslationsType } from "use-intl";
import getBaseTranslator from "./getBaseTranslator";
import useHook from "./useHook";
import useLocale from "./useLocale";

export default function useTranslations(): ReturnType<
  typeof useTranslationsType
> {
  const locale = useLocale();

  const result = useHook("useTranslations", getBaseTranslator(locale));

  return result;
}
