import { loginAction } from "@/app/login/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  return (
    <form action={loginAction} className="form">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          defaultValue="alice@example.com"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          defaultValue="password123"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      <SubmitButton pendingLabel="Signing in...">Log in</SubmitButton>
    </form>
  );
}
