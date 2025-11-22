import { parseCookies } from "@/lib/cookies";
import { verifyJWT } from "@/lib/auth";
import { findById, publicUser, updateUser } from "@/lib/userStore";

async function requireUser(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.token;
  const payload = verifyJWT(token);
  if (!payload) return null;
  const user = await findById(payload.sub);
  return user || null;
}

export default async function handler(req, res) {
  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).end();
  }

  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    return res.status(200).json({ user: publicUser(user) });
  }

  const { name, bio, phone, address, age, gender } = req.body || {};
  const updated = await updateUser(user.id, {
    ...(name !== undefined ? { name: name || user.name } : {}),
    ...(bio !== undefined ? { bio: bio || "" } : {}),
    ...(phone !== undefined ? { phone: phone || "" } : {}),
    ...(address !== undefined ? { address: address || "" } : {}),
    ...(age !== undefined
      ? {
          age:
            typeof age === "string"
              ? parseInt(age, 10) || null
              : typeof age === "number" && age >= 0
              ? age
              : null,
        }
      : {}),
    ...(gender !== undefined ? { gender: gender || "" } : {}),
  });

  return res.status(200).json({ user: publicUser(updated) });
}
