import { parseCookies } from "@/lib/cookies";
import { verifyJWT } from "@/lib/auth";
import { findById, publicUser } from "@/lib/userStore";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.token;
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const user = await findById(payload.sub);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  return res.status(200).json({ user: publicUser(user) });
}
