-- DEV COPY of the section 6 schema so Part 1 can be tested alone.
-- The real one is db/schema.sql (Role B). Names are identical, so nothing changes at integration.
create extension if not exists postgis;

create table if not exists users (
  id serial primary key,
  name text,
  phone text unique,
  emergency_phone text,
  trip_active boolean default false,
  created_at timestamptz default now()
);

create table if not exists places (
  id serial primary key,
  type text,
  name text,
  phone text,
  highway_ref text,
  geom geography(Point,4326)
);
create index if not exists places_geom_idx on places using gist(geom);

create table if not exists heartbeats (
  id serial primary key,
  user_id int references users(id),
  lat double precision,
  lng double precision,
  battery int,
  at timestamptz default now()
);
create index if not exists heartbeats_user_at_idx on heartbeats (user_id, at desc);

create table if not exists alerts (
  id serial primary key,
  user_id int references users(id),
  source text,
  status text,
  last_lat double precision,
  last_lng double precision,
  patrol_unit_id int,
  created_at timestamptz default now(),
  sms_sent_at timestamptz,
  escalated_at timestamptz,
  resolved_at timestamptz
);

create table if not exists patrol_units (
  id serial primary key,
  name text,
  phone text,
  geom geography(Point,4326)
);
create index if not exists patrol_units_geom_idx on patrol_units using gist(geom);
