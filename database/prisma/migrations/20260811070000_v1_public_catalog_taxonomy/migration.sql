-- Preserve the V1 production category taxonomy as published ProductCategory
-- rows. No products are inserted: there is no local production catalogue
-- dataset to migrate. Demo SKUs (procurement-sample) must not be published here.

INSERT INTO product_categories (id, name, slug, status, created_at, updated_at)
VALUES
  ('0190c8a0-1000-7000-8000-000000000001', 'iPhones & Gadgets', 'iphones-gadgets', 'published', now(), now()),
  ('0190c8a0-1000-7000-8000-000000000002', 'Medical Equipments', 'medical-equipments', 'published', now(), now()),
  ('0190c8a0-1000-7000-8000-000000000003', 'Home & Garden Wares', 'home-garden-wares', 'published', now(), now()),
  ('0190c8a0-1000-7000-8000-000000000004', 'Machineries', 'machineries', 'published', now(), now()),
  ('0190c8a0-1000-7000-8000-000000000005', 'General Procurement', 'general-procurement', 'published', now(), now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = CASE
    WHEN product_categories.status = 'archived' THEN product_categories.status
    ELSE 'published'
  END,
  updated_at = now();
