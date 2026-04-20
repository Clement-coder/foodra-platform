-- Seed sample data for development/testing
-- Run AFTER schema.sql

-- Sample training programs
INSERT INTO trainings (title, summary, description, date, mode, location, instructor, capacity, enrolled, image_url)
VALUES
  ('Modern Crop Rotation Techniques', 'Learn how to maximize yield through strategic crop rotation', 'This comprehensive training covers the science and practice of crop rotation for Nigerian smallholder farmers. Topics include soil health, nitrogen fixation, pest management, and seasonal planning.', NOW() + INTERVAL '14 days', 'online', NULL, 'Dr. Amaka Okonkwo', 100, 0, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800'),
  ('Drip Irrigation for Small Farms', 'Cost-effective water management for dry season farming', 'Hands-on training on installing and maintaining drip irrigation systems. Covers water source assessment, pipe layout, emitter selection, and maintenance schedules for farms under 5 hectares.', NOW() + INTERVAL '21 days', 'offline', 'Ibadan, Oyo State', 'Engr. Bello Musa', 30, 0, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'),
  ('Poultry Business Fundamentals', 'Start and scale a profitable poultry operation', 'From day-old chicks to market — this training covers housing, feeding, disease prevention, record keeping, and marketing strategies for poultry farmers in Nigeria.', NOW() + INTERVAL '7 days', 'online', NULL, 'Mrs. Chidinma Eze', 200, 0, 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800'),
  ('Organic Farming Certification', 'Get certified and access premium organic markets', 'Learn the principles of organic farming, certification requirements, record keeping, and how to access premium buyers. Includes practical sessions on composting and natural pest control.', NOW() + INTERVAL '30 days', 'offline', 'Abuja, FCT', 'Prof. Taiwo Adeyemi', 50, 0, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800')
ON CONFLICT DO NOTHING;
