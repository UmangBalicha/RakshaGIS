-- =============================================================
-- RakshaGIS — live database seed (run ONCE in Supabase SQL editor)
-- Seeds 30 safe zones + 6 red zones + 10 habitations (the demo dataset).
-- Safe to re-run: each block only inserts when its table is empty.
-- Requires: supabase/schema.sql + supabase/relocation_schema.sql applied.
-- =============================================================

DO $$
BEGIN
  -- ---------------- Safe zones ----------------
  IF (SELECT count(*) FROM public.safe_zones) = 0 THEN
    INSERT INTO public.safe_zones
      (name, type, latitude, longitude, address, capacity, current_occupancy, amenities, is_active,
       is_relocation_site, water_access, road_access, health_access, school_access, allocated_population,
       created_at, updated_at)
    VALUES
      ('Doon Govt. Inter College Shelter', 'school', 30.3254, 78.0412, 'Race Course, Dehradun', 800, 120, '{water,food,medical,bedding,power}', true, false, false, false, false, false, 0, now() - interval '200 hours', now() - interval '195 hours'),
      ('District Hospital Relief Point', 'hospital', 30.3091, 78.0285, 'Haridwar Road, Dehradun', 300, 45, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '200 hours', now() - interval '195 hours'),
      ('Rangers Ground Open Shelter', 'open_ground', 30.3322, 78.0551, 'Clement Town, Dehradun', 2000, 0, '{water,comms}', true, false, false, false, false, false, 0, now() - interval '180 hours', now() - interval '175 hours'),
      ('Tapovan Community Hall Camp', 'relief_camp', 30.0912, 78.2744, 'Tapovan, Rishikesh', 500, 310, '{water,food,bedding}', true, false, false, false, false, false, 0, now() - interval '150 hours', now() - interval '145 hours'),
      ('AIIMS Rishikesh Triage Point', 'hospital', 30.0777, 78.2872, 'Virbhadra Road, Rishikesh', 400, 60, '{medical,water,power,comms}', true, false, false, false, false, false, 0, now() - interval '150 hours', now() - interval '145 hours'),
      ('Nainital Stadium Shelter', 'shelter', 29.3851, 79.4589, 'Flats Ground, Mallital, Nainital', 1200, 200, '{water,food,medical,bedding,power}', true, true, true, true, true, true, 150, now() - interval '120 hours', now() - interval '115 hours'),
      ('BD Pandey Hospital Point', 'hospital', 29.3889, 79.4488, 'Mall Road, Nainital', 250, 30, '{medical,water}', true, false, false, false, false, false, 0, now() - interval '120 hours', now() - interval '115 hours'),
      ('Uttarkashi Bus Stand Ground', 'open_ground', 30.7312, 78.4512, 'NH-108, Uttarkashi', 900, 0, '{water,comms}', true, false, false, false, false, false, 0, now() - interval '100 hours', now() - interval '95 hours'),
      ('Tehri Lake View Camp', 'relief_camp', 30.3812, 78.4822, 'New Tehri Town', 700, 90, '{water,food,bedding,power}', true, true, true, true, false, false, 0, now() - interval '90 hours', now() - interval '85 hours'),
      ('Chamoli Polytechnic Shelter', 'school', 30.4189, 79.3351, 'Gopeshwar, Chamoli', 600, 40, '{water,food,bedding}', true, false, false, false, false, false, 0, now() - interval '80 hours', now() - interval '75 hours'),
      ('Haridwar Ramlila Ground', 'open_ground', 29.9512, 78.1592, 'Near Har Ki Pauri, Haridwar', 2500, 150, '{water,food,comms}', true, false, false, false, false, false, 0, now() - interval '70 hours', now() - interval '65 hours'),
      ('Almora Army Ground Shelter', 'open_ground', 29.6012, 79.6644, 'Cantonment, Almora', 1500, 0, '{water,medical,comms}', true, false, false, false, false, false, 0, now() - interval '60 hours', now() - interval '55 hours'),
      ('Guwahati Nehru Stadium Camp', 'relief_camp', 26.1522, 91.7633, 'Nehru Stadium, Guwahati', 3000, 1450, '{water,food,medical,bedding,power}', true, true, true, true, true, true, 900, now() - interval '40 hours', now() - interval '35 hours'),
      ('Puri Town Hall Shelter', 'shelter', 19.8044, 85.8255, 'Grand Road, Puri', 1000, 320, '{water,food,bedding,power}', true, false, false, false, false, false, 0, now() - interval '30 hours', now() - interval '25 hours'),
      ('Ajmal Khan Park Shelter', 'shelter', 28.6219, 77.2015, 'Ajmal Khan Park, Karol Bagh, New Delhi', 900, 140, '{water,food,bedding}', true, false, false, false, false, false, 0, now() - interval '28 hours', now() - interval '23 hours'),
      ('RML Hospital Triage Point', 'hospital', 28.6245, 77.2093, 'Ram Manohar Lohia Hospital, New Delhi', 350, 80, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '26 hours', now() - interval '21 hours'),
      ('Ashok Vihar Govt School Shelter', 'school', 28.6955, 77.1132, 'Ashok Vihar Phase 1, Delhi', 600, 45, '{water,food,bedding,power}', true, false, false, false, false, false, 0, now() - interval '24 hours', now() - interval '19 hours'),
      ('Andheri Sports Complex Shelter', 'shelter', 19.0892, 72.8721, 'Veera Desai Road, Andheri West, Mumbai', 1200, 90, '{water,food,medical,bedding,power}', true, false, false, false, false, false, 0, now() - interval '22 hours', now() - interval '17 hours'),
      ('Cooper Hospital Triage Point', 'hospital', 19.0633, 72.8847, 'JVPD Scheme, Juhu, Mumbai', 400, 120, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '22 hours', now() - interval '17 hours'),
      ('Gilbert Hill Open Ground', 'open_ground', 19.0689, 72.8644, 'Sagar City, Andheri West, Mumbai', 1800, 0, '{water,comms}', true, false, false, false, false, false, 0, now() - interval '20 hours', now() - interval '15 hours'),
      ('Olcott School Shelter', 'school', 13.0889, 80.2744, 'Besant Avenue, Adyar, Chennai', 700, 60, '{water,food,bedding}', true, false, false, false, false, false, 0, now() - interval '18 hours', now() - interval '13 hours'),
      ('Island Grounds Relief Camp', 'relief_camp', 13.0677, 80.2745, 'Island Grounds, Marina Beach Road, Chennai', 2500, 300, '{water,food,medical,bedding,power,comms}', true, true, true, true, true, false, 200, now() - interval '18 hours', now() - interval '13 hours'),
      ('Naroda Fire Station Ground', 'open_ground', 23.0301, 72.5633, 'Naroda GIDC Phase 2, Ahmedabad', 1000, 0, '{water,comms}', true, false, false, false, false, false, 0, now() - interval '16 hours', now() - interval '11 hours'),
      ('Civil Hospital Asarwa Point', 'hospital', 23.0522, 72.6033, 'Civil Hospital Campus, Asarwa, Ahmedabad', 500, 150, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '16 hours', now() - interval '11 hours'),
      ('Judges Field Open Shelter', 'open_ground', 26.1566, 91.7455, 'Judges Field, Guwahati, Assam', 1500, 200, '{water,food,comms}', true, false, false, false, false, false, 0, now() - interval '14 hours', now() - interval '9 hours'),
      ('District HQ Hospital Point', 'hospital', 19.8089, 85.8366, 'Vip Road, Puri, Odisha', 300, 70, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '12 hours', now() - interval '7 hours'),
      ('IGMC Hospital Triage Point', 'hospital', 31.1089, 77.1801, 'IGMC Campus, Shimla, Himachal Pradesh', 350, 95, '{medical,water,power,comms}', true, false, false, false, false, false, 0, now() - interval '10 hours', now() - interval '5 hours'),
      ('Chaura Maidan Open Shelter', 'open_ground', 31.0966, 77.1644, 'Chaura Maidan, Shimla', 1200, 0, '{water,comms}', true, false, false, false, false, false, 0, now() - interval '10 hours', now() - interval '5 hours'),
      ('District Hospital Haridwar Point', 'hospital', 29.9399, 78.1522, 'Upper Road, Haridwar, Uttarakhand', 300, 55, '{medical,water,power}', true, false, false, false, false, false, 0, now() - interval '8 hours', now() - interval '3 hours'),
      ('Port Blair Staging Camp', 'relief_camp', 11.6644, 92.7412, 'Corbyns Cove Road, Port Blair, Andaman & Nicobar', 800, 20, '{water,food,medical,bedding,power,comms}', true, false, false, false, false, false, 0, now() - interval '6 hours', now() - interval '1 hour');
  END IF;

  -- ---------------- Red zones (fixed ids so habitations can link) ----------------
  IF (SELECT count(*) FROM public.red_zones) = 0 THEN
    INSERT INTO public.red_zones
      (id, name, hazard_types, latitude, longitude, radius_meters, intensity, status, incident_count, last_incident_at, population_exposed, notes, created_at, updated_at)
    VALUES
      ('a0010000-0000-0000-0000-000000000001', 'Rajpur-Mussoorie Wildfire Belt', '{wildfire}', 30.35, 78.06, 4000, 'high', 'active', 3, now() - interval '3 hours', 4200, 'Repeat pine-forest fire corridor; active flame front near Rajpur.', now() - interval '30 days', now() - interval '2 hours'),
      ('a0010000-0000-0000-0000-000000000002', 'Mallital-Almora Landslide Cradle', '{landslide}', 29.45, 79.55, 6000, 'extreme', 'active', 4, now() - interval '5 hours', 6800, 'Overnight-rain slope failures; road-blocking debris above habitations.', now() - interval '30 days', now() - interval '4 hours'),
      ('a0010000-0000-0000-0000-000000000003', 'Uttarkashi NH-108 Slope Zone', '{landslide}', 30.73, 78.45, 3000, 'high', 'active', 2, now() - interval '14 hours', 1500, 'Highway-adjacent slope failure; traffic halted during events.', now() - interval '30 days', now() - interval '13 hours'),
      ('a0010000-0000-0000-0000-000000000004', 'Bharalumukh Floodplain', '{flood}', 26.15, 91.74, 3500, 'high', 'active', 2, now() - interval '6 hours', 12000, 'Brahmaputra overflow lanes; knee-level waterlogging every monsoon.', now() - interval '30 days', now() - interval '5 hours'),
      ('a0010000-0000-0000-0000-000000000005', 'Naroda Industrial Hazard Pocket', '{industrial,chemical}', 23.02, 72.57, 2500, 'extreme', 'active', 2, now() - interval '11 hours', 9000, 'Chemical godown blast radius; fire spread to adjacent units.', now() - interval '30 days', now() - interval '10 hours'),
      ('a0010000-0000-0000-0000-000000000006', 'Puri Marine Cyclone Front', '{cyclone}', 19.8135, 85.8314, 5000, 'moderate', 'monitoring', 1, now() - interval '20 hours', 25000, 'Storm-surge watch strip; monitoring only after false-alarm surge.', now() - interval '30 days', now() - interval '19 hours');
  END IF;

  -- ---------------- Habitations ----------------
  IF (SELECT count(*) FROM public.habitations) = 0 THEN
    INSERT INTO public.habitations
      (name, habitation_type, latitude, longitude, address, population, households, vulnerable_count, kutcha_share, red_zone_id, past_incidents, notes, created_at, updated_at)
    VALUES
      ('Rajpur Village', 'village', 30.32, 78.04, 'Rajpur Road, Dehradun', 1800, 420, 520, 55, 'a0010000-0000-0000-0000-000000000001', 3, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Mussoorie Rural Fringe', 'village', 30.36, 78.07, 'George Everest foothills, Mussoorie', 2400, 560, 700, 48, 'a0010000-0000-0000-0000-000000000001', 2, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Mallital Ward 4', 'ward', 29.39, 79.45, 'Mallital, Nainital', 3200, 780, 900, 35, 'a0010000-0000-0000-0000-000000000002', 4, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Almora Lower Bazar', 'town', 29.6, 79.66, 'Lower Bazar, Almora', 5100, 1200, 1100, 30, 'a0010000-0000-0000-0000-000000000002', 2, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Uttarkashi Riverside Colony', 'town', 30.73, 78.44, 'Near NH-108, Uttarkashi', 2600, 610, 640, 42, 'a0010000-0000-0000-0000-000000000003', 3, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Bharalumukh Lane Cluster', 'ward', 26.145, 91.736, 'Bharalumukh, Guwahati', 4500, 980, 1500, 65, 'a0010000-0000-0000-0000-000000000004', 5, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Naroda Labour Quarters', 'ward', 23.023, 72.571, 'Naroda GIDC Phase 2, Ahmedabad', 6800, 1500, 2100, 58, 'a0010000-0000-0000-0000-000000000005', 2, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Puri Marine Fishing Hamlet', 'village', 19.813, 85.831, 'Marine Drive, Puri', 1500, 330, 480, 72, 'a0010000-0000-0000-0000-000000000006', 1, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Dhanaulti Road Hamlet', 'village', 30.375, 78.474, 'Dhanaulti Road, Tehri Garhwal', 700, 160, 210, 60, null, 1, '', now() - interval '60 days', now() - interval '24 hours'),
      ('Clement Town Extension', 'town', 30.33, 78.055, 'Clement Town, Dehradun', 8000, 1900, 1200, 12, null, 0, '', now() - interval '60 days', now() - interval '24 hours');
  END IF;
END $$;
