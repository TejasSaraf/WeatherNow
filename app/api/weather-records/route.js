import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const validateDateRange = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: "Invalid date format" };
    }

    if (start > end) {
      return { valid: false, error: "Start date must be before end date" };
    }

    if (end < now) {
      return { valid: false, error: "Cannot create records for past dates" };
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 5) {
      return { valid: false, error: "Date range cannot exceed 5 days" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating date range:", error);
    return { valid: false, error: "Invalid date format" };
  }
};

const validateLocation = async (location) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeather API key is missing in validateLocation");
      return { valid: false, error: "Weather service configuration error" };
    }

    console.log("Validating location:", location);
    const response = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        location
      )}&limit=1&appid=${apiKey}`
    );

    console.log("Geocoding response:", response.data);

    if (!response.data || response.data.length === 0) {
      return {
        valid: false,
        error: `Location "${location}" not found. Please try a different city name.`,
      };
    }

    const searchedLocation = location;

    return {
      valid: true,
      data: {
        location: searchedLocation,
        latitude: response.data[0].lat,
        longitude: response.data[0].lon,
      },
    };
  } catch (error) {
    console.error("Location validation error:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      if (error.response.status === 401) {
        return {
          valid: false,
          error:
            "Invalid API key. Please check your OpenWeather API configuration.",
        };
      }
    }
    return {
      valid: false,
      error: "Failed to validate location. Please try again.",
    };
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { location, startDate, endDate } = body;

    console.log("Received request:", { location, startDate, endDate });

    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      console.log("Date validation failed:", dateValidation.error);
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    const locationValidation = await validateLocation(location);
    if (!locationValidation.valid) {
      console.log("Location validation failed:", locationValidation.error);
      return NextResponse.json(
        { error: locationValidation.error },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeather API key is missing");
      return NextResponse.json(
        { error: "Weather service configuration error" },
        { status: 500 }
      );
    }

    console.log("Fetching weather forecast for:", locationValidation.data);
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${locationValidation.data.latitude}&lon=${locationValidation.data.longitude}&units=metric&appid=${apiKey}`
    );

    const weatherData = weatherResponse.data;
    console.log("Weather forecast data received:", weatherData);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const relevantForecasts = weatherData.list.filter((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000);
      return forecastDate >= start && forecastDate <= end;
    });

    if (relevantForecasts.length === 0) {
      return NextResponse.json(
        { error: "No forecast data available for the selected date range" },
        { status: 400 }
      );
    }

    const avgTemp =
      relevantForecasts.reduce((sum, f) => sum + f.main.temp, 0) /
      relevantForecasts.length;
    const avgHumidity =
      relevantForecasts.reduce((sum, f) => sum + f.main.humidity, 0) /
      relevantForecasts.length;
    const avgWindSpeed =
      relevantForecasts.reduce((sum, f) => sum + f.wind.speed, 0) /
      relevantForecasts.length;

    const descriptions = relevantForecasts.map((f) => f.weather[0].description);
    const mostCommonDescription = descriptions
      .sort(
        (a, b) =>
          descriptions.filter((v) => v === a).length -
          descriptions.filter((v) => v === b).length
      )
      .pop();

    const record = await prisma.weatherRecord.create({
      data: {
        location: locationValidation.data.location,
        latitude: locationValidation.data.latitude,
        longitude: locationValidation.data.longitude,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        temperatureCelsius: Math.round(avgTemp * 10) / 10,
        temperatureFahrenheit: Math.round(((avgTemp * 9) / 5 + 32) * 10) / 10,
        description: mostCommonDescription,
        humidity: Math.round(avgHumidity),
        windSpeed: Math.round(avgWindSpeed * 10) / 10,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error creating weather record:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    return NextResponse.json(
      {
        error:
          error.response?.data?.message || "Failed to create weather record",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(request) {
  try {
    console.log("Starting GET request for weather records");
    console.log("Database URL:", process.env.DATABASE_URL);

    try {
      await prisma.$connect();
      console.log("Database connection successful");
    } catch (connError) {
      console.error("Database connection error:", connError);
      return NextResponse.json(
        { error: "Database connection failed: " + connError.message },
        { status: 500 }
      );
    }

    try {
      const count = await prisma.weatherRecord.count();
      console.log("Total records in database:", count);

      const records = await prisma.weatherRecord.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log("Successfully fetched records:", records);
      return NextResponse.json(records);
    } catch (dbError) {
      console.error("Database query error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      });

      return NextResponse.json(
        {
          error: "Error fetching records from database",
          details: dbError.message,
        },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error in GET /api/weather-records:", error);
    return NextResponse.json(
      {
        error: "Internal server error occurred",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, location, startDate, endDate } = body;

    console.log("Update request received:", {
      id,
      location,
      startDate,
      endDate,
    });

    if (!id) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    if (startDate && endDate) {
      const dateValidation = validateDateRange(startDate, endDate);
      if (!dateValidation.valid) {
        return NextResponse.json(
          { error: dateValidation.error },
          { status: 400 }
        );
      }
    }

    let locationData = null;
    if (location) {
      const locationValidation = await validateLocation(location);
      if (!locationValidation.valid) {
        return NextResponse.json(
          { error: locationValidation.error },
          { status: 400 }
        );
      }
      locationData = locationValidation.data;
    }

    const existingRecord = await prisma.weatherRecord.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    let weatherData = null;
    if (locationData) {
      try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
          console.error("OpenWeather API key is missing");
          return NextResponse.json(
            { error: "Weather service configuration error" },
            { status: 500 }
          );
        }

        console.log("Fetching weather forecast for:", locationData);
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${locationData.latitude}&lon=${locationData.longitude}&units=metric&appid=${apiKey}`
        );

        const forecastData = weatherResponse.data;
        console.log("Weather forecast data received:", forecastData);

        const start = new Date(startDate || existingRecord.startDate);
        const end = new Date(endDate || existingRecord.endDate);

        const relevantForecasts = forecastData.list.filter((forecast) => {
          const forecastDate = new Date(forecast.dt * 1000);
          return forecastDate >= start && forecastDate <= end;
        });

        if (relevantForecasts.length === 0) {
          return NextResponse.json(
            { error: "No forecast data available for the selected date range" },
            { status: 400 }
          );
        }

        const avgTemp =
          relevantForecasts.reduce((sum, f) => sum + f.main.temp, 0) /
          relevantForecasts.length;
        const avgHumidity =
          relevantForecasts.reduce((sum, f) => sum + f.main.humidity, 0) /
          relevantForecasts.length;
        const avgWindSpeed =
          relevantForecasts.reduce((sum, f) => sum + f.wind.speed, 0) /
          relevantForecasts.length;

        const descriptions = relevantForecasts.map(
          (f) => f.weather[0].description
        );
        const mostCommonDescription = descriptions
          .sort(
            (a, b) =>
              descriptions.filter((v) => v === a).length -
              descriptions.filter((v) => v === b).length
          )
          .pop();

        weatherData = {
          temperatureCelsius: Math.round(avgTemp * 10) / 10,
          temperatureFahrenheit: Math.round(((avgTemp * 9) / 5 + 32) * 10) / 10,
          description: mostCommonDescription,
          humidity: Math.round(avgHumidity),
          windSpeed: Math.round(avgWindSpeed * 10) / 10,
        };

        console.log("Processed weather data:", weatherData);
      } catch (weatherError) {
        console.error("Error fetching weather data:", weatherError);
        return NextResponse.json(
          { error: "Failed to fetch weather data: " + weatherError.message },
          { status: 500 }
        );
      }
    }

    const updateData = {
      ...(locationData && {
        location: locationData.location,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(weatherData && {
        temperatureCelsius: weatherData.temperatureCelsius,
        temperatureFahrenheit: weatherData.temperatureFahrenheit,
        description: weatherData.description,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
      }),
    };

    console.log("Updating record with data:", updateData);

    try {
      const updatedRecord = await prisma.weatherRecord.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      console.log("Record updated successfully:", updatedRecord);
      return NextResponse.json(updatedRecord);
    } catch (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update record in database: " + updateError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in PUT /api/weather-records:", error);
    return NextResponse.json(
      { error: "Failed to update weather record: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    const existingRecord = await prisma.weatherRecord.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.weatherRecord.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting weather record:", error);
    return NextResponse.json(
      { error: "Failed to delete weather record" },
      { status: 500 }
    );
  }
}
