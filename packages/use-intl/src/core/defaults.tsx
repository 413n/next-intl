import IntlError from "./IntlError";

/**
 * Contains defaults that are used for all entry points into the core.
 * See also `InitializedIntlConfiguration`.
 */

export function defaultGetMessageFallback(props: {
  error: IntlError;
  key: string;
}) {
  return props.key;
}

export function defaultOnError(error: IntlError) {
  console.error(error);
}
