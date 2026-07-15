-- Migración manual opcional para instalaciones donde el usuario de la aplicación
-- no tenga permiso CREATE TABLE. Es seguro ejecutar este script más de una vez.
IF OBJECT_ID('dbo.usage_events', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usage_events (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        event_type NVARCHAR(32) NOT NULL,
        visitor_id VARCHAR(64) NULL,
        session_id VARCHAR(64) NULL,
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_usage_events_created_at DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_usage_events_created_at
        ON dbo.usage_events(created_at);

    CREATE INDEX IX_usage_events_type_date
        ON dbo.usage_events(event_type, created_at);
END;
