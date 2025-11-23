import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ContactUs from "@/components/ContactUs";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, address, age: age ? Number(age) : null, gender }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push("/profile");
    } catch (err) {
      setError(err.message || "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-rustic text-rustic-dark flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-rustic-card border border-rustic rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-gradient-rustic">EchoNet</Link>
          <Link href="/login" className="text-sm text-rustic-muted hover:text-rustic-dark underline underline-offset-4">Have an account?</Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2 text-rustic-dark">Create an account</h1>
        <p className="text-sm text-rustic-muted mb-6">Set up your profile to personalize EchoNet.</p>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-rustic-muted">Name</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Community volunteer"
              required
            />
          </div>
          <div>
            <label className="text-sm text-rustic-muted">Phone / Number</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+1 555 123 4567"
            />
          </div>
          <div>
            <label className="text-sm text-rustic-muted">Address</label>
            <textarea
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="School or community location"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-rustic-muted">Age</label>
              <input
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                type="number"
                min="0"
                max="130"
              />
            </div>
            <div>
              <label className="text-sm text-rustic-muted">Gender</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Nonbinary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-rustic-muted">Email</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm text-rustic-muted">Password</label>
            <div className="relative">
              <input
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark pr-24 placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-1 right-1 px-2 text-xs text-rustic-dark bg-white/85 border border-rustic rounded hover:bg-rustic-card transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-rustic text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 transition shadow"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>

      <ContactUs />

      <footer className="bg-rustic-translucent border-t border-rustic py-6 text-center text-rustic-muted relative z-10 w-full">
        Access for all - EchoNet {new Date().getFullYear()}
      </footer>
    </div>
  );
}
