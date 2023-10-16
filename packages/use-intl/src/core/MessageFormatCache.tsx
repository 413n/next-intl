// eslint-disable-next-line import/no-named-as-default -- False positive
import type IntlMessageFormat from "intl-messageformat";

type MessageFormatCache = Map<
  /** Format: `${locale}.${key}.${message}` */
  string,
  IntlMessageFormat
>;

export default MessageFormatCache;
