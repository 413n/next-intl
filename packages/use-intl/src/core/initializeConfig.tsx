import IntlConfig from "./IntlConfig";
import { defaultGetMessageFallback, defaultOnError } from "./defaults";

/**
 * Enhances the incoming props with defaults.
 */
export default function initializeConfig<
  // This is a generic to allow for stricter typing. E.g.
  // the RSC integration always provides a `now` value.
  Props extends Omit<IntlConfig, "children">
>({ getMessageFallback, messages, onError, ...rest }: Props) {
  const finalOnError = onError || defaultOnError;
  const finalGetMessageFallback =
    getMessageFallback || defaultGetMessageFallback;

  return {
    ...rest,
    messages,
    onError: finalOnError,
    getMessageFallback: finalGetMessageFallback,
  };
}
