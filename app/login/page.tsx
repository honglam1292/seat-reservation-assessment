import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <h1>Log in</h1>
          <p className="muted">Use a seeded demo account to reserve a seat.</p>
        </div>
        <Link href="/">Back to seats</Link>
      </div>

      <section className="panel stack">
        {params.error ? (
          <div className="notice notice-error" role="alert">
            {params.error}
          </div>
        ) : null}

        <LoginForm />
      </section>
    </main>
  );
}
