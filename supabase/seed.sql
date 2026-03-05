-- Sample seed data for testing

-- Insert sample trainings
INSERT INTO trainings (title, summary, description, date, mode, location, instructor_name, capacity, image_url) VALUES
('Modern Irrigation Techniques', 'Learn efficient water management', 'Comprehensive training on drip irrigation, sprinkler systems, and water conservation methods for sustainable farming.', '2026-04-15 10:00:00+00', 'offline', 'Lagos, Nigeria', 'Dr. Adebayo Ogunlesi', 50, '/foodra_1.jpeg'),
('Organic Farming Practices', 'Sustainable agriculture methods', 'Discover organic farming techniques, natural pest control, composting, and soil health management.', '2026-04-20 14:00:00+00', 'online', NULL, 'Prof. Amina Mohammed', 100, '/foodra_2.jpeg'),
('Post-Harvest Management', 'Reduce crop losses', 'Learn proper storage, handling, and preservation techniques to minimize post-harvest losses and maximize profits.', '2026-05-01 09:00:00+00', 'offline', 'Ibadan, Nigeria', 'Engr. Chukwuma Nwosu', 40, '/foodra_3.jpeg');

-- Note: Users and products will be created through the application
-- as they require Privy authentication
