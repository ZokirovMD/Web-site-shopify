import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { currentUser, needsFirstPassword } from "@/lib/auth/actions";
import { GirihGround } from "@/design/GirihGround";
import { SignInForm } from "./SignInForm";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("common.pageTitle", { title: t("auth.title"), brand: t("brand.name") }),
  };
}

export default async function SignInPage() {
  if (await currentUser()) redirect("/");
  const first = await needsFirstPassword();

  return (
    <>
      {/* Экран входа — одно из трёх мест, где узор звучит в полную силу. */}
      <GirihGround cell={196} />
      <div className={styles.page}>
        <SignInForm first={first} />
      </div>
    </>
  );
}
