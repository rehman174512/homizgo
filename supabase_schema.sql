-- Run this script in your Supabase SQL Editor

-- 1. Create a table for Users (Extending Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  role text default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.users enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create the Properties Table
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.users(id) not null,
  title text not null,
  location text not null,
  price numeric not null,
  type text not null, -- 'room', 'flat', 'pg'
  description text,
  images text[] default '{}',
  amenities text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.properties enable row level security;
create policy "Anyone can view properties" on public.properties for select using (true);
create policy "Owners can insert properties" on public.properties for insert with check (auth.uid() = owner_id);
create policy "Owners can update own properties" on public.properties for update using (auth.uid() = owner_id);
create policy "Owners can delete own properties" on public.properties for delete using (auth.uid() = owner_id);


-- 3. Create Chat Threads Table
create table public.chat_threads (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Thread Participants
create table public.thread_participants (
  thread_id uuid references public.chat_threads(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  primary key (thread_id, user_id)
);

alter table public.chat_threads enable row level security;
alter table public.thread_participants enable row level security;

create policy "Users can view threads they are in" on public.chat_threads
  for select using (
    exists (
      select 1 from public.thread_participants
      where thread_id = public.chat_threads.id and user_id = auth.uid()
    )
  );

create policy "Users can insert threads" on public.chat_threads for insert with check (true);

create policy "Users can view participants for their threads" on public.thread_participants
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = public.thread_participants.thread_id and tp.user_id = auth.uid()
    )
  );

create policy "Users can add participants" on public.thread_participants for insert with check (true);


-- 4. Create Chat Messages Table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_messages enable row level security;

create policy "Users can view messages in their threads" on public.chat_messages
  for select using (
    exists (
      select 1 from public.thread_participants
      where thread_id = public.chat_messages.thread_id and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their threads" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.thread_participants
      where thread_id = public.chat_messages.thread_id and user_id = auth.uid()
    )
  );

-- Enable Realtime for Chat Messages
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_threads;
