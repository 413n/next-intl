// eslint-disable-next-line import/no-named-as-default -- False positive
import IntlMessageFormat from "intl-messageformat";
import {
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  ReactNodeArray,
} from "react";
import AbstractIntlMessages from "./AbstractIntlMessages";
import convertFormatsToIntlMessageFormat from "./convertFormatsToIntlMessageFormat";
import { defaultGetMessageFallback, defaultOnError } from "./defaults";
import Formats from "./Formats";
import { InitializedIntlConfig } from "./IntlConfig";
import IntlError, { IntlErrorCode } from "./IntlError";
import MessageFormatCache from "./MessageFormatCache";
import TranslationValues, { RichTranslationValues } from "./TranslationValues";

function resolvePath(messages: AbstractIntlMessages | undefined, key: string) {
  if (!messages) {
    throw new Error(
      process.env.NODE_ENV !== "production"
        ? `No messages available.`
        : undefined
    );
  }

  const message = messages[key] || key || "Translation missing";

  return message;
}

function prepareTranslationValues(values: RichTranslationValues) {
  if (Object.keys(values).length === 0) return undefined;

  // Workaround for https://github.com/formatjs/formatjs/issues/1467
  const transformedValues: RichTranslationValues = {};
  Object.keys(values).forEach((key) => {
    let index = 0;
    const value = values[key];

    let transformed;
    if (typeof value === "function") {
      transformed = (chunks: ReactNode) => {
        const result = value(chunks);

        return isValidElement(result)
          ? cloneElement(result, { key: key + index++ })
          : result;
      };
    } else {
      transformed = value;
    }

    transformedValues[key] = transformed;
  });

  return transformedValues;
}

function getMessagesOrError<Messages extends AbstractIntlMessages>({
  messages,
  onError = defaultOnError,
}: {
  messages?: Messages;
  onError?(error: IntlError): void;
}) {
  try {
    if (!messages) {
      throw new Error(
        process.env.NODE_ENV !== "production"
          ? `No messages were configured on the provider.`
          : undefined
      );
    }

    if (!messages) {
      throw new Error(
        process.env.NODE_ENV !== "production" ? `No messages found.` : undefined
      );
    }

    return messages;
  } catch (error) {
    const intlError = new IntlError(
      IntlErrorCode.MISSING_MESSAGE,
      (error as Error).message
    );
    onError(intlError);
    return intlError;
  }
}

export type CreateBaseTranslatorProps<Messages> = InitializedIntlConfig & {
  messageFormatCache?: MessageFormatCache;
  defaultTranslationValues?: RichTranslationValues;
  messagesOrError: Messages | IntlError;
};

function getPlainMessage(candidate: string, values?: unknown) {
  if (values) return undefined;

  const unescapedMessage = candidate.replace(/'([{}])/gi, "$1");

  // Placeholders can be in the message if there are default values,
  // or if the user has forgotten to provide values. In the latter
  // case we need to compile the message to receive an error.
  const hasPlaceholders = /<|{/.test(unescapedMessage);

  if (!hasPlaceholders) {
    return unescapedMessage;
  }

  return undefined;
}

export default function createBaseTranslator<
  Messages extends AbstractIntlMessages
>(config: Omit<CreateBaseTranslatorProps<Messages>, "messagesOrError">) {
  const messagesOrError = getMessagesOrError({
    messages: config.messages,
    onError: config.onError,
  }) as Messages | IntlError;

  return createBaseTranslatorImpl<Messages>({
    ...config,
    messagesOrError,
  });
}

function createBaseTranslatorImpl<Messages extends AbstractIntlMessages>({
  defaultTranslationValues,
  formats: globalFormats,
  getMessageFallback = defaultGetMessageFallback,
  locale,
  messageFormatCache,
  messagesOrError,
  onError,
  timeZone,
}: CreateBaseTranslatorProps<Messages>) {
  function getFallbackFromErrorAndNotify(
    key: string,
    code: IntlErrorCode,
    message?: string
  ) {
    const error = new IntlError(code, message);
    onError(error);
    return getMessageFallback({ error, key });
  }

  function translateBaseFn(
    key: string,
    /** Key value pairs for values to interpolate into the message. */
    values?: RichTranslationValues,
    /** Provide custom formats for numbers, dates and times. */
    formats?: Partial<Formats>
  ): string | ReactElement | ReactNodeArray {
    if (messagesOrError instanceof IntlError) {
      // We have already warned about this during render
      return getMessageFallback({
        error: messagesOrError,
        key,
      });
    }
    const messages = messagesOrError;

    let message;
    try {
      message = resolvePath(messages, key);
    } catch (error) {
      return getFallbackFromErrorAndNotify(
        key,
        IntlErrorCode.MISSING_MESSAGE,
        (error as Error).message
      );
    }

    function joinPath(parts: Array<string | undefined>) {
      return parts.filter((part) => part != null).join(".");
    }

    const cacheKey = joinPath([locale, key, String(message)]);

    let messageFormat: IntlMessageFormat;
    if (messageFormatCache?.has(cacheKey)) {
      messageFormat = messageFormatCache.get(cacheKey)!;
    } else {
      if (typeof message === "object") {
        let code, errorMessage;
        if (Array.isArray(message)) {
          code = IntlErrorCode.INVALID_MESSAGE;
          if (process.env.NODE_ENV !== "production") {
            errorMessage = `Message at \`${key}\` resolved to an array, but only strings are supported. See https://next-intl-docs.vercel.app/docs/usage/messages#arrays-of-messages`;
          }
        } else {
          code = IntlErrorCode.INSUFFICIENT_PATH;
          if (process.env.NODE_ENV !== "production") {
            errorMessage = `Message at \`${key}\` resolved to an object, but only strings are supported. Use a \`.\` to retrieve nested messages. See https://next-intl-docs.vercel.app/docs/usage/messages#structuring-messages`;
          }
        }

        return getFallbackFromErrorAndNotify(key, code, errorMessage);
      }

      // Hot path that avoids creating an `IntlMessageFormat` instance
      const plainMessage = getPlainMessage(message, values);
      if (plainMessage) return plainMessage;

      try {
        messageFormat = new IntlMessageFormat(
          message,
          locale,
          convertFormatsToIntlMessageFormat(
            { ...globalFormats, ...formats },
            timeZone
          )
        );
      } catch (error) {
        return getFallbackFromErrorAndNotify(
          key,
          IntlErrorCode.INVALID_MESSAGE,
          (error as Error).message
        );
      }

      messageFormatCache?.set(cacheKey, messageFormat);
    }

    try {
      const formattedMessage = messageFormat.format(
        // @ts-expect-error `intl-messageformat` expects a different format
        // for rich text elements since a recent minor update. This
        // needs to be evaluated in detail, possibly also in regards
        // to be able to format to parts.
        prepareTranslationValues({ ...defaultTranslationValues, ...values })
      );

      if (formattedMessage == null) {
        throw new Error(
          process.env.NODE_ENV !== "production"
            ? `Unable to format \`${key}\``
            : undefined
        );
      }

      // Limit the function signature to return strings or React elements
      return isValidElement(formattedMessage) ||
        // Arrays of React elements
        Array.isArray(formattedMessage) ||
        typeof formattedMessage === "string"
        ? formattedMessage
        : String(formattedMessage);
    } catch (error) {
      return getFallbackFromErrorAndNotify(
        key,
        IntlErrorCode.FORMATTING_ERROR,
        (error as Error).message
      );
    }
  }

  function translateFn(
    key: string,
    /** Key value pairs for values to interpolate into the message. */
    values?: TranslationValues,
    /** Provide custom formats for numbers, dates and times. */
    formats?: Partial<Formats>
  ): string {
    const result = translateBaseFn(key, values, formats);

    if (typeof result !== "string") {
      return getFallbackFromErrorAndNotify(
        key,
        IntlErrorCode.INVALID_MESSAGE,
        process.env.NODE_ENV !== "production"
          ? `The message \`${key}\` didn't resolve to a string. If you want to format rich text, use \`t.rich\` instead.`
          : undefined
      );
    }

    return result;
  }

  translateFn.rich = translateBaseFn;

  translateFn.raw = (key: string): any => {
    if (messagesOrError instanceof IntlError) {
      // We have already warned about this during render
      return getMessageFallback({
        error: messagesOrError,
        key,
      });
    }
    const messages = messagesOrError;

    try {
      return resolvePath(messages, key);
    } catch (error) {
      return getFallbackFromErrorAndNotify(
        key,
        IntlErrorCode.MISSING_MESSAGE,
        (error as Error).message
      );
    }
  };

  return translateFn;
}
