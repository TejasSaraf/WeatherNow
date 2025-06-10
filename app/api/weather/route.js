import { NextResponse } from "next/server";

const FAMOUS_LANDMARKS = {
  "statue of liberty": {
    name: "Statue of Liberty",
    lat: 40.6892,
    lon: -74.0445,
  },
  "eiffel tower": { name: "Eiffel Tower", lat: 48.8584, lon: 2.2945 },
  "taj mahal": { name: "Taj Mahal", lat: 27.1751, lon: 78.0421 },
  "sydney opera house": {
    name: "Sydney Opera House",
    lat: -33.8568,
    lon: 151.2153,
  },
  "big ben": { name: "Big Ben", lat: 51.5007, lon: -0.1246 },
  colosseum: { name: "Colosseum", lat: 41.8902, lon: 12.4922 },
  petra: { name: "Petra", lat: 30.3285, lon: 35.4444 },
  "machu picchu": { name: "Machu Picchu", lat: -13.1631, lon: -72.545 },
  "great wall of china": {
    name: "Great Wall of China",
    lat: 40.4319,
    lon: 116.5704,
  },
  "christ the redeemer": {
    name: "Christ the Redeemer",
    lat: -22.9519,
    lon: -43.2105,
  },
};

const POSTAL_CODE_FORMATS = {
  US: /^\d{5}(-\d{4})?$/,
  GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/,
  IN: /^\d{6}$/,
  CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  IT: /^\d{5}$/,
  JP: /^\d{3}-\d{4}$/,
  BR: /^\d{5}-\d{3}$/,
};

const DEFAULT_COUNTRY_CODES = [
  "us",
  "gb",
  "in",
  "ca",
  "au",
  "de",
  "fr",
  "it",
  "jp",
  "br",
];

const roundTemperature = (temp) => Math.round(temp);

const processWeatherData = (data) => {
  if (!data) return data;

  if (data.main) {
    data.main.temp = roundTemperature(data.main.temp);
    data.main.feels_like = roundTemperature(data.main.feels_like);
    data.main.temp_min = roundTemperature(data.main.temp_min);
    data.main.temp_max = roundTemperature(data.main.temp_max);
  }

  return data;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const unit = searchParams.get("unit") || "metric";

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
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

    let lat, lon, locationName;

    const coordPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (coordPattern.test(location)) {
      [lat, lon] = location.split(",").map((coord) => parseFloat(coord.trim()));

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json(
          {
            error:
              "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
          },
          { status: 400 }
        );
      }

      const reverseGeoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
      const reverseGeoResponse = await fetch(reverseGeoUrl);

      if (!reverseGeoResponse.ok) {
        return NextResponse.json(
          { error: "Failed to get location name from coordinates" },
          { status: reverseGeoResponse.status }
        );
      }

      const reverseGeoData = await reverseGeoResponse.json();
      locationName =
        reverseGeoData && reverseGeoData.length > 0
          ? reverseGeoData[0].name
          : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } else {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        location
      )}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        return NextResponse.json(
          { error: `Failed to get location data: ${geoResponse.statusText}` },
          { status: geoResponse.status }
        );
      }

      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }

      ({ lat, lon, name: locationName } = geoData[0]);
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch weather data: ${weatherResponse.statusText}`,
        },
        { status: weatherResponse.status }
      );
    }

    const weatherData = await weatherResponse.json();

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch forecast data: ${forecastResponse.statusText}`,
        },
        { status: forecastResponse.status }
      );
    }

    const forecastData = await forecastResponse.json();
    const dailyForecasts = new Set();
    const today = new Date().toLocaleDateString();

    const processedForecast = forecastData.list
      .filter((item) => {
        const itemDate = new Date(item.dt * 1000).toLocaleDateString();
        if (itemDate === today) return false;
        if (!dailyForecasts.has(itemDate)) {
          dailyForecasts.add(itemDate);
          return true;
        }
        return false;
      })
      .slice(0, 5);

    weatherData.name = locationName;

    return NextResponse.json({
      current: weatherData,
      forecast: {
        ...forecastData,
        list: processedForecast,
      },
      unit: unit,
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data. Please try again later." },
      { status: 500 }
    );
  }
}
