# Database schema and storage context

This backend uses Supabase (Postgres + APIs + Storage).

- Storage bucket used for assets: `storage.momentos` (images and 3D `.glb` files)
- `momentos.image_path` and `momentos.model_path` store storage paths into that bucket
- `profiles.avatar_image_path` stores a storage path to an image

SQL DDL (reference):

```sql
-- profiles: keep it tiny; expand later.
create table if not exists public.profiles (
  id uuid primary key,
  username text unique not null,
  display_name text,
  avatar_image_path text,
  created_at timestamptz default now()
);

-- momentos: exactly one hero image and one .glb model per momento.
create table if not exists public.momentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  note text,
  image_path text not null,
  model_path text not null,
  visibility text not null default 'public',
  taken_at timestamptz,
  created_at timestamptz default now()
);

-- follows: simple follower model for discovery/feeds.
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id)
);

-- likes: lightweight reactions.
create table if not exists public.likes (
  momento_id uuid not null references public.momentos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (momento_id, user_id)
);

-- comments: basic social threads.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  momento_id uuid not null references public.momentos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- collections (trophy cases), momentos inside are simply sorted by created_at
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  visibility text not null default 'public',
  created_at timestamptz default now()
);
```


