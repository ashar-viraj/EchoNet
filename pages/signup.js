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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-xl font-semibold">EchoNet</Link>
          <Link href="/login" className="text-sm text-cyan-300">Have an account?</Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Create an account</h1>
        <p className="text-sm text-gray-400 mb-6">Set up your profile to personalize EchoNet.</p>

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Name</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Community volunteer"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Phone / Number</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+1 555 123 4567"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Address</label>
            <textarea
              className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="School or community location"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Age</label>
              <input
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                type="number"
                min="0"
                max="130"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Gender</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
