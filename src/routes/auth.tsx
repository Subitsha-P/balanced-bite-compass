import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-shell";
import hero from "@/assets/foods/vegetables.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup"; redirect?: string } => {
    const o: { mode?: "signup"; redirect?: string } = {};
    if (s["mode"] === "signup") o.mode = "signup";
    if (typeof s["redirect"] === "string") o.redirect = s["redirect"];
    return o;
  },
  head: () => ({
    meta: [
      { title: "Log in or register – NutriGuide" },
      { name: "description", content: "Create your NutriGuide account or log in to see your personalised diet plan." },
      { property: "og:title", content: "Log in or register – NutriGuide" },
      { property: "og:description", content: "Access your personalised diet recommendations." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(80),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });
const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(search.mode === "signup" ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = (mode === "signup" ? signupSchema : loginSchema).safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: form.name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else toast.success("Welcome to NutriGuide!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw error;
        toast.success("Logged in");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/already registered/i.test(msg)) setErrors({ email: "An account with this email already exists." });
      else if (/invalid login/i.test(msg)) setErrors({ password: "Incorrect email or password." });
      else if (/not confirmed/i.test(msg)) setErrors({ email: "Please confirm your email first — check your inbox." });
      else toast.error(msg || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {sent ? (
            <div>
              <h1 className="font-display text-3xl font-semibold">Check your email</h1>
              <p className="mt-3 text-muted-foreground">
                We sent a confirmation link to <strong>{form.email}</strong>. Open it to activate your account, then log in.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => { setSent(false); setMode("login"); }}>Back to log in</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-semibold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-2 text-muted-foreground">
                {mode === "signup" ? "Start getting personalised diet recommendations." : "Log in to see your plan."}
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                {mode === "signup" && <Field id="name" label="Full name" value={form.name} onChange={set("name")} error={errors["name"]} />}
                <Field id="email" label="Email" type="email" value={form.email} onChange={set("email")} error={errors["email"]} />
                <Field id="password" label="Password" type="password" value={form.password} onChange={set("password")} error={errors["password"]} />
                {mode === "signup" && (
                  <Field id="confirm" label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} error={errors["confirm"]} />
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "signup" ? "Register" : "Log in"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already have an account?" : "New to NutriGuide?"}{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErrors({}); }}>
                  {mode === "signup" ? "Log in" : "Register"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img src={hero} alt="Fresh vegetables" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}

function Field({ id, label, error, ...rest }: { id: string; label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} {...rest} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
