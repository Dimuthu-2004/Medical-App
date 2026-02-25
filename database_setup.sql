USE master;
GO

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SmartClinic')
BEGIN
    CREATE DATABASE [SmartClinic];
    PRINT 'Database SmartClinic created successfully.';
END
ELSE
BEGIN
    PRINT 'Database SmartClinic already exists.';
END
GO
