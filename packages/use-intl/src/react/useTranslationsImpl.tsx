import { useMemo } from "react";
import { IntlError, IntlErrorCode } from "../core";
import AbstractIntlMessages from "../core/AbstractIntlMessages";
import createBaseTranslator from "../core/createBaseTranslator";
import useIntlContext from "./useIntlContext";

let hasWarnedForMissingTimezone = false;
const isServer = typeof window === "undefined";

export default function useTranslationsImpl<
  Messages extends AbstractIntlMessages
>(allMessages: Messages) {
  const {
    defaultTranslationValues,
    formats: globalFormats,
    getMessageFallback,
    locale,
    messageFormatCache,
    onError,
    timeZone,
  } = useIntlContext();

  if (!timeZone && !hasWarnedForMissingTimezone && isServer) {
    hasWarnedForMissingTimezone = true;
    onError(
      new IntlError(
        IntlErrorCode.ENVIRONMENT_FALLBACK,
        process.env.NODE_ENV !== "production"
          ? `There is no \`timeZone\` configured, this can lead to markup mismatches caused by environment differences. Consider adding a global default: https://next-intl-docs.vercel.app/docs/configuration#time-zone`
          : undefined
      )
    );
  }

  const translate = useMemo(
    () =>
      createBaseTranslator({
        messageFormatCache,
        getMessageFallback,
        messages: allMessages,
        defaultTranslationValues,
        onError,
        formats: globalFormats,
        locale,
        timeZone,
      }),
    [
      messageFormatCache,
      getMessageFallback,
      allMessages,
      onError,
      defaultTranslationValues,
      globalFormats,
      locale,
      timeZone,
    ]
  );

  return translate;
}
