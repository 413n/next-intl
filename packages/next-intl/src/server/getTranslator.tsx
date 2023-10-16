import { cache } from "react";
import {
  Formats,
  RichTranslationValuesPlain,
  TranslationValues,
  createTranslator,
} from "use-intl/core";
import getConfig from "./getConfig";

async function getTranslatorImpl(
  locale: string
): // Explicitly defining the return type is necessary as TypeScript would get it wrong
Promise<{
  // Default invocation
  (key: string, values?: TranslationValues, formats?: Partial<Formats>): string;

  // `rich`
  rich(
    key: string,
    values?: RichTranslationValuesPlain,
    formats?: Partial<Formats>
  ): string;

  // `raw`
  raw(key: string): any;
}> {
  const config = await getConfig(locale);

  return createTranslator({
    ...config,
    messages: config.messages || {},
  });
}

export default cache(getTranslatorImpl);
