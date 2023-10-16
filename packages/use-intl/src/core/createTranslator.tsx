import Formats from "./Formats";
import IntlConfig from "./IntlConfig";
import TranslationValues, {
  RichTranslationValuesPlain,
} from "./TranslationValues";
import createTranslatorImpl from "./createTranslatorImpl";
import { defaultGetMessageFallback, defaultOnError } from "./defaults";

/**
 * Translates messages by using the ICU syntax.
 * See https://formatjs.io/docs/core-concepts/icu-syntax.
 */
export default function createTranslator({
  getMessageFallback = defaultGetMessageFallback,
  messages,
  onError = defaultOnError,
  ...rest
}: Omit<IntlConfig<IntlMessages>, "defaultTranslationValues" | "messages"> & {
  messages: NonNullable<IntlConfig<IntlMessages>["messages"]>;
}): // Explicitly defining the return type is necessary as TypeScript would get it wrong
{
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
} {
  return createTranslatorImpl({
    ...rest,
    onError,
    getMessageFallback,
    messages,
  });
}
