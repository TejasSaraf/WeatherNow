import { NextResponse } from 'next/server';

const FAMOUS_LANDMARKS = {
  'statue of liberty': { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445 },
  'eiffel tower': { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945 },
  'taj mahal': { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421 },
  'sydney opera house': { name: 'Sydney Opera House', lat: -33.8568, lon: 151.2153 },
  'big ben': { name: 'Big Ben', lat: 51.5007, lon: -0.1246 },
  'colosseum': { name: 'Colosseum', lat: 41.8902, lon: 12.4922 },
  'petra': { name: 'Petra', lat: 30.3285, lon: 35.4444 },
  'machu picchu': { name: 'Machu Picchu', lat: -13.1631, lon: -72.5450 },
  'great wall of china': { name: 'Great Wall of China', lat: 40.4319, lon: 116.5704 },
  'christ the redeemer': { name: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105 }
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
  BR: /^\d{5}-\d{3}$/ 
};

const DEFAULT_COUNTRY_CODES = ['us', 'gb', 'in', 'ca', 'au', 'de', 'fr', 'it', 'jp', 'br'];

// Helper function to round temperature values
const roundTemperature = (temp) => Math.round(temp);

// Helper function to process weather data and round temperatures
const processWeatherData = (data) => {
  if (!data) return data;
  
  // Round main temperature values
  if (data.main) {
    data.main.temp = roundTemperature(data.main.temp);
    data.main.feels_like = roundTemperature(data.main.feels_like);
    data.main.temp_min = roundTemperature(data.main.temp_min);
    data.main.temp_max = roundTemperature(data.main.temp_max);
  }
  
  return data;
};

// Helper function to process forecast data and round temperatures
const processForecastData = (data) => {
  if (!data || !data.list) return data;
  
  data.list = data.list.map(item => {
    if (item.main) {
      item.main.temp = roundTemperature(item.main.temp);
      item.main.feels_like = roundTemperature(item.main.feels_like);
      item.main.temp_min = roundTemperature(item.main.temp_min);
      item.main.temp_max = roundTemperature(item.main.temp_max);
    }
    return item;
  });
  
  return data;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const unit = searchParams.get('unit') || 'metric'; // Default to metric (Celsius)

  if (!location) {
    return NextResponse.json(
      { error: 'Location parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenWeather API key is not configured' },
      { status: 500 }
    );
  }

  try {
    let lat, lon, locationName;
    const searchTerm = location.toLowerCase().trim();

    if (FAMOUS_LANDMARKS[searchTerm]) {
      const landmark = FAMOUS_LANDMARKS[searchTerm];
      lat = landmark.lat;
      lon = landmark.lon;
      locationName = landmark.name;
    }

    else if (searchTerm.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)) {
      const [latStr, lonStr] = searchTerm.split(',').map(coord => coord.trim());
      lat = parseFloat(latStr);
      lon = parseFloat(lonStr);

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json(
          { error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' },
          { status: 400 }
        );
      }

      const reverseGeoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
      const reverseGeoResponse = await fetch(reverseGeoUrl);
      const reverseGeoData = await reverseGeoResponse.json();

      if (reverseGeoData && reverseGeoData.length > 0) {
        locationName = reverseGeoData[0].name;
      } else {
        locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }
    else {
      const isPostalCode = Object.values(POSTAL_CODE_FORMATS).some(format => format.test(location));
      
      if (isPostalCode) {
        let weatherData = null;
        let lastError = null;

        for (const countryCode of DEFAULT_COUNTRY_CODES) {
          try {
            const zipUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${location},${countryCode}&units=${unit}&appid=${apiKey}`;
            const zipResponse = await fetch(zipUrl);
            
            if (zipResponse.ok) {
              weatherData = await zipResponse.json();
              lat = weatherData.coord.lat;
              lon = weatherData.coord.lon;
              locationName = weatherData.name;
              break;
            }
          } catch (error) {
            lastError = error.message;
            continue;
          }
        }

        if (!weatherData) {
          const searchVariations = DEFAULT_COUNTRY_CODES.map(code => `${location},${code}`);
          let geocodeData = null;

          for (const searchTerm of searchVariations) {
            try {
              const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchTerm)}&limit=1&appid=${apiKey}`;
              const geocodeResponse = await fetch(geocodeUrl);
              
              if (geocodeResponse.ok) {
                const data = await geocodeResponse.json();
                if (data && data.length > 0) {
                  geocodeData = data;
                  break;
                }
              }
            } catch (error) {
              continue;
            }
          }

          if (!geocodeData || geocodeData.length === 0) {
            return NextResponse.json(
              { error: `Postal code "${location}" not found. Please check the format and try again.` },
              { status: 404 }
            );
          }

          lat = geocodeData[0].lat;
          lon = geocodeData[0].lon;
          locationName = geocodeData[0].name;

          if (geocodeData[0].local_names && Object.keys(geocodeData[0].local_names).length > 0) {
            locationName = geocodeData[0].local_names.en || geocodeData[0].local_names[Object.keys(geocodeData[0].local_names)[0]];
          }
        }
      } else {
        const searchVariations = [
          searchTerm,
          ...DEFAULT_COUNTRY_CODES.map(code => `${searchTerm},${code}`)
        ];

        let geocodeData = null;
        
        for (const searchTerm of searchVariations) {
          try {
            const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchTerm)}&limit=1&appid=${apiKey}`;
            const geocodeResponse = await fetch(geocodeUrl);
            
            if (geocodeResponse.ok) {
              const data = await geocodeResponse.json();
              if (data && data.length > 0) {
                geocodeData = data;
                break;
              }
            }
          } catch (error) {
            continue;
          }
        }

        if (!geocodeData || geocodeData.length === 0) {
          return NextResponse.json(
            { error: `Location "${location}" not found. Please check the spelling or try a different name.` },
            { status: 404 }
          );
        }

        lat = geocodeData[0].lat;
        lon = geocodeData[0].lon;
        locationName = geocodeData[0].name;

        if (geocodeData[0].local_names && Object.keys(geocodeData[0].local_names).length > 0) {
          locationName = geocodeData[0].local_names.en || geocodeData[0].local_names[Object.keys(geocodeData[0].local_names)[0]];
        }
      }
    }

    let weatherData;
    if (!weatherData) {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch weather data: ${weatherResponse.statusText}` },
          { status: weatherResponse.status }
        );
      }
      
      weatherData = await weatherResponse.json();
    }

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch forecast data: ${forecastResponse.statusText}` },
        { status: forecastResponse.status }
      );
    }
    
    const forecastData = await forecastResponse.json();
    const dailyForecasts = new Set();
    const processedForecast = forecastData.list.filter(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyForecasts.has(date)) {
        dailyForecasts.add(date);
        return true;
      }
      return false;
    }).slice(0, 10); 

    weatherData.name = locationName;

    // Process and round temperatures in both current weather and forecast data
    const processedWeatherData = processWeatherData(weatherData);
    const processedForecastData = processForecastData({
      ...forecastData,
      list: processedForecast
    });

    return NextResponse.json({
      current: processedWeatherData,
      forecast: processedForecastData,
      unit: unit // Include the unit in the response
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please try again later.' },
      { status: 500 }
    );
  }
}
