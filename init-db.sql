-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create spatial index function for better performance
CREATE OR REPLACE FUNCTION create_spatial_indexes() RETURNS void AS $$
BEGIN
    -- This function will be called after tables are created by TypeORM
    -- to add spatial indexes for better geolocation query performance
    
    -- Index for users.current_location
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_current_location') THEN
        CREATE INDEX idx_users_current_location ON users USING GIST (current_location);
    END IF;
    
    -- Index for gyms.location
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_gyms_location') THEN
        CREATE INDEX idx_gyms_location ON gyms USING GIST (location);
    END IF;
END;
$$ LANGUAGE plpgsql;

