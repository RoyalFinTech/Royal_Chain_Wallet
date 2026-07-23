/**
 * Translation hook with interpolation, pluralization, and fallback
 * (Language System).
 *
 * Usage: const { t } = useTranslation(); t("action.send")
 * With params: t("count.transaction", { count: 3 }) — automatically picks
 * the "_one"/"_other" key variant based on `count` when present.
 */
import { useCallback } from "react";
import { useLocale, FALLBACK_DICT } from "./provider";

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{{${key}}}`,
  );
}

export function useTranslation() {
  const { dict, locale } = useLocale();

  const t = useCallback(
    (key: string, params?: Params): string => {
      let resolvedKey = key;
      if (params && typeof params.count === "number") {
        const pluralSuffix = params.count === 1 ? "_one" : "_other";
        if (`${key}${pluralSuffix}` in dict || `${key}${pluralSuffix}` in FALLBACK_DICT) {
          resolvedKey = `${key}${pluralSuffix}`;
        }
      }
      const template = dict[resolvedKey] ?? FALLBACK_DICT[resolvedKey] ?? resolvedKey;
      return interpolate(template, params);
    },
    [dict],
  );

  return { t, locale };
}
