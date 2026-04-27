-- Roles enum + table (security best practice)
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Menu items table
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "Anyone can view available menu items"
  on public.menu_items for select
  using (is_available = true);

create policy "Admins can view all menu items"
  on public.menu_items for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert menu items"
  on public.menu_items for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update menu items"
  on public.menu_items for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete menu items"
  on public.menu_items for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- Seed sample menu
insert into public.menu_items (name, description, price, category) values
  ('Truffle Burrata', 'Hand-pulled burrata, shaved black truffle, heirloom tomato, basil oil, sourdough crisps', 18.00, 'Starters'),
  ('Charred Octopus', 'Spanish octopus, smoked paprika aioli, fingerling potatoes, lemon confit', 22.00, 'Starters'),
  ('Wild Mushroom Bisque', 'Forest mushrooms, cream, thyme, brown butter croutons', 14.00, 'Starters'),
  ('Wagyu Ribeye', '12oz Australian wagyu, bone marrow butter, charred shallot, pommes purée', 64.00, 'Mains'),
  ('Saffron Risotto', 'Carnaroli rice, saffron, parmigiano reggiano, seared scallops', 38.00, 'Mains'),
  ('Duck à l''Orange', 'Crispy duck breast, orange gastrique, glazed turnips, watercress', 42.00, 'Mains'),
  ('Pan-Seared Halibut', 'Atlantic halibut, brown butter, capers, asparagus, lemon beurre blanc', 39.00, 'Mains'),
  ('Dark Chocolate Tart', '70% Valrhona, salted caramel, hazelnut praline, vanilla bean ice cream', 13.00, 'Desserts'),
  ('Vanilla Crème Brûlée', 'Tahitian vanilla, crisp caramelized sugar, fresh berries', 12.00, 'Desserts'),
  ('Tiramisu', 'Espresso-soaked ladyfingers, mascarpone, cocoa, marsala', 12.00, 'Desserts'),
  ('Old Fashioned', 'Bourbon, demerara, angostura, orange peel', 16.00, 'Drinks'),
  ('Negroni', 'Gin, Campari, sweet vermouth, orange', 15.00, 'Drinks'),
  ('Sommelier''s Red', 'Daily selection, ask your server', 18.00, 'Drinks');
