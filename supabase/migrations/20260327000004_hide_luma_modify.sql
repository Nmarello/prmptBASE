-- Hide luma-modify — vid2vid, no generate pipeline yet
UPDATE models SET coming_soon = false, is_active = false WHERE slug = 'luma-modify';
