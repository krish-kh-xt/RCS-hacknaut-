-- RCS database schema (section 6 of the team guide). Table and column names are FIXED.
-- Safe to run more than once. Needs PostGIS (Supabase has it; the line below switches it on).
-- PostGIS reminder: ST_MakePoint(lng, lat) takes LONGITUDE FIRST.

create extension if not exists postgis;

create table if not exists users (
  id              serial primary key,
  name            text,
  phone           text unique,               -- international format, e.g. +919876543210
  emergency_phone text,                      -- shown to patrol on escalation
  trip_active     boolean default false,     -- the worker only watches users with this = true
  created_at      timestamptz default now()
);

create table if not exists places (
  id          serial primary key,
  type        text check (type in ('hospital', 'police', 'highway')),
  name        text,
  phone       text,                          -- may be empty
  highway_ref text,                          -- highway rows only, e.g. NH-44
  geom        geography(Point,4326)
);
create index if not exists places_geom_idx on places using gist(geom);

create table if not exists heartbeats (
  id      serial primary key,
  user_id int references users(id),
  lat     double precision,
  lng     double precision,
  battery int,                               -- percent 0..100, may be null
  at      timestamptz default now()
);
create index if not exists heartbeats_user_at_idx on heartbeats (user_id, at desc);

create table if not exists alerts (
  id             serial primary key,
  user_id        int references users(id),
  source         text check (source in ('SILENCE', 'SOS')),
  status         text check (status in ('SMS_SENT', 'ESCALATED', 'RESOLVED')),
  last_lat       double precision,
  last_lng       double precision,
  patrol_unit_id int,                        -- set on escalation
  created_at     timestamptz default now(),
  sms_sent_at    timestamptz,
  escalated_at   timestamptz,
  resolved_at    timestamptz
);

create table if not exists patrol_units (
  id    serial primary key,
  name  text,
  phone text,
  geom  geography(Point,4326)
);
create index if not exists patrol_units_geom_idx on patrol_units using gist(geom);
