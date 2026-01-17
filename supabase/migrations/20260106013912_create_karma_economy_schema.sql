/*
  # Karma Economy Platform Schema

  ## Overview
  A circular economy platform where users trade items for karma points instead of cash,
  fostering community and sustainability.

  ## New Tables

  ### 1. profiles
  Extends auth.users with additional profile information
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique) - Display name
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `bio` (text) - User bio
  - `location` (text) - City/area for local trading
  - `karma_balance` (integer, default 100) - Available karma points (starting bonus)
  - `total_karma_earned` (integer, default 0) - Lifetime karma earned
  - `total_karma_spent` (integer, default 0) - Lifetime karma spent
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. items
  Items listed for trade
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references profiles) - Who listed the item
  - `title` (text) - Item name
  - `description` (text) - Item details
  - `image_url` (text) - Photo of the item
  - `karma_value` (integer) - Points needed to claim
  - `category` (text) - Type of item (clothing, books, electronics, etc.)
  - `condition` (text) - Item condition (new, like-new, good, fair)
  - `status` (text, default 'available') - available, pending, claimed, completed
  - `claimed_by` (uuid, references profiles, nullable) - Who claimed it
  - `claimed_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. transactions
  Records of completed trades
  - `id` (uuid, primary key)
  - `item_id` (uuid, references items)
  - `giver_id` (uuid, references profiles) - Original owner
  - `receiver_id` (uuid, references profiles) - Person who claimed
  - `karma_amount` (integer) - Karma transferred
  - `delivery_method` (text) - meetup, delivery, shipping
  - `status` (text, default 'pending') - pending, completed, cancelled
  - `completed_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

  ### 4. follows
  Social connections between users
  - `id` (uuid, primary key)
  - `follower_id` (uuid, references profiles) - Who is following
  - `following_id` (uuid, references profiles) - Who is being followed
  - `created_at` (timestamptz)
  - Unique constraint on (follower_id, following_id)

  ### 5. karma_gifts
  Karma points gifted between users
  - `id` (uuid, primary key)
  - `giver_id` (uuid, references profiles) - Who gave the karma
  - `receiver_id` (uuid, references profiles) - Who received the karma
  - `amount` (integer) - Karma points gifted
  - `message` (text, nullable) - Optional gift message
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read their own profile and update their own data
  - Users can read public profiles (limited fields)
  - Users can create/update/delete their own items
  - Users can view available items
  - Users can create transactions for items they claim
  - Users can manage their own follows
  - Users can gift karma if they have sufficient balance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  karma_balance integer DEFAULT 100 NOT NULL CHECK (karma_balance >= 0),
  total_karma_earned integer DEFAULT 0 NOT NULL,
  total_karma_spent integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  karma_value integer NOT NULL CHECK (karma_value > 0),
  category text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('new', 'like-new', 'good', 'fair')),
  status text DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'pending', 'claimed', 'completed')),
  claimed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  giver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  karma_amount integer NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('meetup', 'delivery', 'shipping')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create karma_gifts table
CREATE TABLE IF NOT EXISTS karma_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (giver_id != receiver_id)
);

ALTER TABLE karma_gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for items
CREATE POLICY "Anyone can view available items"
  ON items FOR SELECT
  TO authenticated
  USING (status = 'available' OR owner_id = auth.uid() OR claimed_by = auth.uid());

CREATE POLICY "Users can create own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = claimed_by)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = claimed_by);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id AND status = 'available');

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = giver_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = giver_id OR auth.uid() = receiver_id);

-- RLS Policies for follows
CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for karma_gifts
CREATE POLICY "Users can view karma gifts they sent or received"
  ON karma_gifts FOR SELECT
  TO authenticated
  USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create karma gifts"
  ON karma_gifts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = giver_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_giver ON transactions(giver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
