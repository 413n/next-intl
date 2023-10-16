import { ReactElement, ReactNodeArray, cache } from "react";
import {
  Formats,
  RichTranslationValues,
  TranslationValues,
  createBaseTranslator,
} from "use-intl/core";
import getConfig from "../server/getConfig";

const getMessageFormatCache = cache(() => new Map());

async function getTranslatorImpl(
  locale: string
): // Explicitly defining the return type is necessary as TypeScript would get it wrong
Promise<{
  // Default invocation
  (key: string, values?: TranslationValues, formats?: Partial<Formats>): string;

  // `rich`
  rich(
    key: string,
    values?: RichTranslationValues,
    formats?: Partial<Formats>
  ): string | ReactElement | ReactNodeArray;

  // `raw`
  raw(key: string): any;
}> {
  const config = await getConfig(locale);
  return createBaseTranslator({
    ...config,
    messageFormatCache: getMessageFormatCache(),
    messages: config.messages,
  });
}

export default cache(getTranslatorImpl);
