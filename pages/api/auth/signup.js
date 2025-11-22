import { authCookie, signJWT } from "@/lib/auth";
import { addUser, publicUser } from "@/lib/userStore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const {
    name = "",
    email = "",
    password = "",
    phone = "",
    address = "",
    age = null,
    gender = "",
    bio = "",
  } = req.body || {};
  if (!email.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const parsedAge = typeof age === "string" ? parseInt(age, 10) : age;
    const user = await addUser({ name, email, password, phone, address, age: parsedAge, gender, bio });
    const token = signJWT({ sub: user.id, email: user.email });
    res.setHeader("Set-Cookie", authCookie(token));
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Could not create user." });
  }
}
