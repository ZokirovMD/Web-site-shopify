import { redirect } from "next/navigation";
import { currentUser, needsFirstPassword } from "@/lib/auth/actions";
import { GirihGround } from "@/design/GirihGround";
import { SignInForm } from "./SignInForm";
import styles from "./page.module.css";

export const metadata = { title: "Вход · ORBIT" };

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
