/*
  Warnings:

  - You are about to drop the column `temperature` on the `WeatherRecord` table. All the data in the column will be lost.
  - Added the required column `temperatureCelsius` to the `WeatherRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `temperatureFahrenheit` to the `WeatherRecord` table without a default value. This is not possible if the table is not empty.

*/
-- First add the new columns as nullable
ALTER TABLE "WeatherRecord" 
ADD COLUMN "temperatureCelsius" DOUBLE PRECISION,
ADD COLUMN "temperatureFahrenheit" DOUBLE PRECISION;

-- Update existing records to convert temperature to both units
UPDATE "WeatherRecord"
SET 
    "temperatureCelsius" = "temperature",
    "temperatureFahrenheit" = ("temperature" * 9/5 + 32);

-- Make the new columns required
ALTER TABLE "WeatherRecord" 
ALTER COLUMN "temperatureCelsius" SET NOT NULL,
ALTER COLUMN "temperatureFahrenheit" SET NOT NULL;

-- Finally drop the old column
ALTER TABLE "WeatherRecord" DROP COLUMN "temperature";
