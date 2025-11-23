import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ContactUs from "@/components/ContactUs";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/profile");
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-xl font-semibold">EchoNet</Link>
          <Link href="/signup" className="text-sm text-cyan-300">Need an account?</Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-gray-400 mb-6">Access your profile and saved preferences.</p>

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <div className="relative">
              <input
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white pr-24"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-1 right-1 px-2 text-xs text-gray-200 bg-gray-600 rounded hover:bg-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-cyan-600 text-black rounded font-medium hover:bg-cyan-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
