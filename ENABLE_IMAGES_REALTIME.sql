-- Enable realtime for product_images table
ALTER PUBLICATION supabase_realtime ADD TABLE product_images;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
