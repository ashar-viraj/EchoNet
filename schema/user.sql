-- User table schema for EchoNet
-- Fields: name, email (not null), phone number, address, age, gender (enum with 3+ values), plus sensible extras.

CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash CHAR(64) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 130),
  gender VARCHAR(20) CHECK (gender IN ('female', 'male', 'nonbinary', 'other', 'prefer_not_to_say')),
  bio TEXT,
  role VARCHAR(30) DEFAULT 'member', -- e.g., member, admin
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
