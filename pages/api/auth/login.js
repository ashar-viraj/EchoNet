import { authCookie, signJWT } from "@/lib/auth";
import { findByEmail, hashPassword, publicUser, updateUser } from "@/lib/userStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { email = "", password = "" } = req.body || {};
  if (!email.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await findByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  await updateUser(user.id, { lastLoginAt: new Date() });

  const token = signJWT({ sub: user.id, email: user.email });
  res.setHeader("Set-Cookie", authCookie(token));

  return res.status(200).json({ user: publicUser(user) });
}
