import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ModuleKey } from "@/components/shell/nav";

/**
 * Заголовок вкладки для страницы модуля.
 *
 * Собирается из словаря, а не склеивается строкой в каждой странице: порядок
 * «имя · бренд» и сам разделитель — вещи языковые, и в словаре им место.
 */
export async function moduleMetadata(key: ModuleKey): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("common.pageTitle", {
      title: t(`modules.${key}.label`),
      brand: t("brand.name"),
    }),
  };
}
