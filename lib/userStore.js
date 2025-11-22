import crypto from "crypto";
import { query } from "./db";

export const hashPassword = (pwd) => crypto.createHash("sha256").update(pwd).digest("hex");

const normalizeGender = (gender) => {
  if (!gender) return "";
  const g = gender.toLowerCase();
  if (["female", "male", "nonbinary"].includes(g)) return g;
  if (["other", "prefer_not_to_say", "prefer not to say"].includes(g)) return "other";
  return g;
};

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone,
    address: row.address,
    age: row.age,
    gender: row.gender,
    bio: row.bio,
    role: row.role,
    isVerified: row.is_verified,
    createdAt: row.created_at ? row.created_at.toISOString?.() || row.created_at : row.created_at,
    updatedAt: row.updated_at ? row.updated_at.toISOString?.() || row.updated_at : row.updated_at,
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString?.() || row.last_login_at : row.last_login_at,
  };
};

export const findByEmail = async (email) => {
  const normalized = email.trim().toLowerCase();
  const res = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [normalized]);
  return mapUser(res.rows[0]);
};

export const findById = async (id) => {
  const res = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return mapUser(res.rows[0]);
};

export async function addUser({ name, email, password, phone, address, age, gender, bio, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findByEmail(normalizedEmail);
  if (existing) throw new Error("User already exists");

  const id = crypto.randomUUID();
  const now = new Date();
  const genderVal = normalizeGender(gender);

  const res = await query(
    `INSERT INTO users (id, name, email, password_hash, phone, address, age, gender, bio, role, is_verified, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id,
      name || "New user",
      normalizedEmail,
      hashPassword(password),
      phone || "",
      address || "",
      typeof age === "number" && age >= 0 ? age : null,
      genderVal,
      bio || "",
      role || "member",
      false,
      now,
      now,
    ]
  );

  return mapUser(res.rows[0]);
}

export async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  const setField = (col, val) => {
    fields.push(`${col} = $${idx++}`);
    values.push(val);
  };

  if (updates.name !== undefined) setField("name", updates.name || "");
  if (updates.bio !== undefined) setField("bio", updates.bio || "");
  if (updates.phone !== undefined) setField("phone", updates.phone || "");
  if (updates.address !== undefined) setField("address", updates.address || "");
  if (updates.age !== undefined)
    setField(
      "age",
      typeof updates.age === "number" && updates.age >= 0 ? updates.age : null
    );
  if (updates.gender !== undefined) setField("gender", normalizeGender(updates.gender));
  if (updates.role !== undefined) setField("role", updates.role || "member");
  if (updates.isVerified !== undefined) setField("is_verified", !!updates.isVerified);
  if (updates.lastLoginAt !== undefined) setField("last_login_at", updates.lastLoginAt);

  setField("updated_at", new Date());

  if (fields.length === 0) return await findById(id);

  values.push(id);
  const res = await query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return mapUser(res.rows[0]);
}

export const publicUser = (user) => {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
};
