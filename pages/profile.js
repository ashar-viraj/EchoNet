import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ContactUs from "@/components/ContactUs";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setName(data.user?.name || "");
      setBio(data.user?.bio || "");
    } catch (err) {
      setError("Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update profile");
      setUser(data.user);
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">EchoNet</Link>
          <nav className="space-x-4 text-gray-300">
            <Link href="/text">Books</Link>
            <Link href="/image">Image</Link>
            <Link href="/movies">Movies</Link>
            <Link href="/audio">Audio</Link>
            <Link href="/software">Software</Link>
            <button onClick={logout} className="text-sm text-cyan-300">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h1 className="text-2xl font-semibold mb-2">Your profile</h1>
          <p className="text-sm text-gray-400 mb-6">Edit your info for offline learning outreach.</p>

          {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
          {loading ? (
            <div className="text-gray-300">Loading profile...</div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300">Name</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Email</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-gray-400"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300">Bio</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Educator focused on low-data learning access."
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-cyan-600 text-black rounded font-medium hover:bg-cyan-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={logout} className="text-sm text-gray-300 underline">
                  Sign out
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <ContactUs compact />
    </div>
  );
}
