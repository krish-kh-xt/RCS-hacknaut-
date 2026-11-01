-- A few fake places near lat 31.2, lng 76.5 for testing /sync. ST_MakePoint(lng, lat)!
insert into places (type, name, phone, highway_ref, geom) values
 ('hospital', 'Civil Hospital',        '01887-000000', null,    ST_SetSRID(ST_MakePoint(76.51, 31.21), 4326)::geography),
 ('hospital', 'Far Away Hospital',     '01887-111111', null,    ST_SetSRID(ST_MakePoint(76.90, 31.60), 4326)::geography),
 ('police',   'City Police Station',   '100',          null,    ST_SetSRID(ST_MakePoint(76.49, 31.19), 4326)::geography),
 ('highway',  'Toll Plaza Help Point', '1033',         'NH-44', ST_SetSRID(ST_MakePoint(76.48, 31.19), 4326)::geography);
insert into patrol_units (name, phone, geom) values
 ('Patrol Unit 3', '+910000000003', ST_SetSRID(ST_MakePoint(76.40, 31.25), 4326)::geography);
