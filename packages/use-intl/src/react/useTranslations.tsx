import useIntlContext from "./useIntlContext";
import useTranslationsImpl from "./useTranslationsImpl";

/**
 * Translates messages by using the ICU syntax.
 * See https://formatjs.io/docs/core-concepts/icu-syntax.
 */
export default function useTranslations() {
  const context = useIntlContext();
  const messages = context.messages as IntlMessages;

  return useTranslationsImpl<IntlMessages>(messages);
}
