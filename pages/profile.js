import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen theme-rustic text-rustic-dark flex flex-col">
      <header className="bg-rustic-translucent border-b border-rustic shadow sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/echonet-logo.svg"
              alt="EchoNet"
              width={128}
              height={40}
              className="w-32 h-auto drop-shadow"
              priority
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-rustic-muted">EchoNet</p>
              <p className="text-xl font-semibold text-gradient-rustic leading-none">Library for Everyone</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-rustic-muted">
            <Link href="/text" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Books</Link>
            <Link href="/image" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Image</Link>
            <Link href="/movies" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Movies</Link>
            <Link href="/audio" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Audio</Link>
            <Link href="/software" className="hover:text-rustic-dark transition-transform duration-300 hover:-translate-y-0.5">Software</Link>
            <button onClick={logout} className="text-sm text-gradient-rustic hover:opacity-80">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl flex-1 w-full">
        <div className="bg-rustic-card border border-rustic rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-semibold mb-2 text-rustic-dark">Your profile</h1>
          <p className="text-sm text-rustic-muted mb-6">Edit your info for offline learning outreach.</p>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          {loading ? (
            <div className="text-rustic-muted">Loading profile...</div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-rustic-muted">Name</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-rustic-muted">Email</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-white/85 border border-rustic text-rustic-muted"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-rustic-muted">Bio</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 border border-rustic text-rustic-dark placeholder:text-rustic-muted focus:outline-none focus:ring-1 focus:ring-[rgba(139,69,19,0.35)]"
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
                  className="px-4 py-2 bg-gradient-rustic text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 transition shadow"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={logout} className="text-sm text-rustic-muted underline hover:text-rustic-dark">
                  Sign out
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <ContactUs />

      <footer className="bg-rustic-translucent border-t border-rustic py-6 text-center text-rustic-muted relative z-10">
        Access for all - EchoNet {new Date().getFullYear()}
      </footer>
    </div>
  );
}
