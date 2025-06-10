'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  SunIcon, 
  MoonIcon, 
  CloudIcon, 
  MapPinIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  SunIcon as SunIconSolid,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowPathIcon,
  BeakerIcon,
  CloudIcon as CloudIconSolid,
  FireIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { WeatherIcon, TemperatureDisplay, WeatherInfo } from '../WeatherComponents';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
};

const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const isDaytime = (sunrise, sunset) => {
  const now = new Date().getTime() / 1000;
  return now >= sunrise && now <= sunset;
};

const getWindDirection = (degrees) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

// const ForecastCard = ({ day, isDay }) => {
//   const { weekday, date } = formatDate(day.dt);

//   return (
//     <div className="text-center p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors">
//       <div className="mb-2">
//         <p className="font-bold text-white">{weekday}</p>
//         <p className="text-sm text-white/80">{date}</p>
//       </div>
//       <WeatherIcon 
//         code={day.weather[0].icon} 
//         isDay={isDay} 
//         size="small"
//       />
//       <div className="mt-2">
//         <p className="text-2xl font-bold text-white">{day.main.temp}°C</p>
//         <p className="text-sm text-white/80 capitalize">{day.weather[0].description}</p>
//       </div>
//       <div className="mt-3 space-y-2 text-sm">
//         <div className="grid grid-cols-2 gap-2">
//           <WeatherInfo 
//             label="High" 
//             value={`${day.main.temp_max}°C`} 
//             icon={ArrowTrendingUpIcon}
//             color="text-red-400"
//           />
//           <WeatherInfo 
//             label="Low" 
//             value={`${day.main.temp_min}°C`} 
//             icon={ArrowTrendingDownIcon}
//             color="text-blue-400"
//           />
//         </div>
//         <WeatherInfo 
//           label="Wind" 
//           value={`${day.wind.speed} m/s ${getWindDirection(day.wind.deg)}`} 
//           icon={ArrowPathIcon}
//           color="text-blue-300"
//         />
//         <WeatherInfo 
//           label="Humidity" 
//           value={`${day.main.humidity}%`} 
//           icon={BeakerIcon}
//           color="text-cyan-300"
//         />
//         <WeatherInfo 
//           label="Rain" 
//           value={`${day.pop}%`} 
//           icon={CloudIconSolid}
//           color="text-indigo-300"
//         />
//         <WeatherInfo 
//           label="Feels Like" 
//           value={`${day.main.feels_like}°C`} 
//           icon={FireIcon}
//           color="text-orange-300"
//         />
//         <WeatherInfo 
//           label="UV Index" 
//           value={day.uvi} 
//           icon={SunIcon}
//         />
//         <WeatherInfo 
//           label="Visibility" 
//           value={`${(day.visibility / 1000).toFixed(1)} km`} 
//           icon={EyeIcon}
//         />
//         <WeatherInfo 
//           label="Dew Point" 
//           value={`${day.dew_point}°C`} 
//           icon={CloudIcon}
//         />
//       </div>
//     </div>
//   );
// };

// Country-specific postal code formats
const POSTAL_CODE_FORMATS = {
  US: /^\d{5}(-\d{4})?$/, // US ZIP code
  GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, // UK postcode
  IN: /^\d{6}$/, // Indian PIN code
  CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/, // Canadian postal code
  AU: /^\d{4}$/, // Australian postcode
  DE: /^\d{5}$/, // German postal code
  FR: /^\d{5}$/, // French postal code
  IT: /^\d{5}$/, // Italian postal code
  JP: /^\d{3}-\d{4}$/, // Japanese postal code
  BR: /^\d{5}-\d{3}$/ // Brazilian postal code
};

export default function WeatherDetails() {
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [inputError, setInputError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [unit, setUnit] = useState('metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit

  const debouncedLocation = useDebounce(location, 500);

  const validateLocation = useCallback((input) => {
    setInputError('');

    if (!input.trim()) {
      setInputError('Please enter a location');
      return false;
    }

    const searchTerm = input.toLowerCase().trim();

    // Check for coordinate format
    const coordPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    if (coordPattern.test(searchTerm)) {
      const [lat, lon] = searchTerm.split(',').map(coord => parseFloat(coord.trim()));
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setInputError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180');
        return false;
      }
      return true;
    }

    // Check for postal code format
    const isPostalCode = Object.values(POSTAL_CODE_FORMATS).some(format => format.test(input));
    if (isPostalCode) {
      return true;
    }

    // Check for special characters in location names
    const specialChars = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]+/;
    if (specialChars.test(searchTerm)) {
      setInputError('Location name contains invalid characters');
      return false;
    }

    if (searchTerm.length < 2) {
      setInputError('Location name is too short');
      return false;
    }

    if (searchTerm.length > 100) {
      setInputError('Location name is too long');
      return false;
    }

    return true;
  }, []);

  const getWeather = useCallback(async (searchLocation) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/weather?location=${encodeURIComponent(searchLocation)}&unit=${unit}`);
      if (!response.data.current || !response.data.forecast) {
        throw new Error('Invalid response from weather service');
      }
      setWeather(response.data.current);
      setForecast(response.data.forecast);
    } catch (err) {
      console.error('Weather Error:', err);
      if (err.response?.status === 404) {
        const isPostalCode = Object.values(POSTAL_CODE_FORMATS).some(format => format.test(searchLocation));
        if (isPostalCode) {
          setError(`Postal code "${searchLocation}" not found. Please check the format and try again.`);
        } else {
          setError(`Location "${searchLocation}" not found. Please check the spelling or try a different location.`);
        }
      } else if (err.response?.status === 400) {
        setError('Invalid location format. Please enter a valid city name, postal code, or coordinates.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please try again in a few minutes.');
      } else if (err.message === 'Invalid response from weather service') {
        setError('Unable to get weather data. Please try again.');
      } else {
        setError('Failed to fetch weather data. Please check your internet connection and try again.');
      }
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [unit]);

  useEffect(() => {
    if (debouncedLocation && validateLocation(debouncedLocation)) {
      setIsSearching(true);
      getWeather(debouncedLocation);
    }
  }, [debouncedLocation, validateLocation, getWeather]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateLocation(location)) {
      setIsSearching(true);
      getWeather(location);
    }
  }, [location, validateLocation, getWeather]);

  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    setError(null);
    setInputError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter a location manually.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const formattedCoords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          await getWeather(formattedCoords);
          setLocation('');
        } catch (err) {
          console.error('Geolocation Error:', err);
          setError('Failed to get weather for your location. Please try again.');
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation Error:', error);
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or enter a location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please enter a location manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please enter a location manually.';
        }
        setError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [getWeather]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    if (location && validateLocation(location)) {
      getWeather(location);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">WeatherNow</h1>
          <div className="relative">
            <select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="bg-white/10 backdrop-blur-md border border-white/20 outline-none  text-white px-4 py-2 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors pr-10"
            >
              <option value="metric">°C</option>
              <option value="imperial">°F</option>
            </select>
            <ChevronDownIcon className="h-5 w-5 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex flex-col gap-4 mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setInputError('');
                  setError(null);
                }}
                placeholder="Enter city name, postal code, coordinates (40.7128,-74.0060), or landmark (Statue of Liberty)"
                className={`bg-white/10 backdrop-blur-md border ${
                  inputError ? 'border-red-400' : 'border-white/20'
                } flex-1 p-2 rounded-lg text-white placeholder-white/50 w-full outline-none focus:ring-0 focus:border-white/30 transition-colors`}
              />
              {inputError && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-300">
                  <ExclamationCircleIcon className="h-5 w-5" />
                  <span className="text-sm">{inputError}</span>
                </div>
              )}
              {isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60">
                  Searching...
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors flex-1"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                Search
              </button>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPinIcon className="h-5 w-5" />
                {isGettingLocation ? 'Getting Location...' : 'Current Location'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100/10 backdrop-blur-md border border-red-400/50 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-white text-center">Loading weather data...</div>
        )}

        {weather && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 shadow-lg mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{weather.name}, {weather.sys.country}</h2>
                <p className="text-white/80">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80">Local Time</p>
                <p className="text-white">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <WeatherIcon 
                  code={weather.weather[0].icon} 
                  isDay={isDaytime(weather.sys.sunrise, weather.sys.sunset)} 
                  size="large"
                />
                <TemperatureDisplay 
                  temp={weather.main.temp}
                  max={weather.main.temp_max}
                  min={weather.main.temp_min}
                  unit={unit}
                />
                <p className="text-xl capitalize text-white/80">{weather.weather[0].description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/80 text-sm">Feels Like</p>
                  <p className="text-xl text-white">{weather.main.feels_like}°{unit === 'metric' ? 'C' : 'F'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/80 text-sm">Humidity</p>
                  <p className="text-xl text-white">{weather.main.humidity}%</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/80 text-sm">Wind</p>
                  <p className="text-xl text-white">{weather.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/80 text-sm">Pressure</p>
                  <p className="text-xl text-white">{weather.main.pressure} hPa</p>
                </div>
                <div className="col-span-2 bg-white/5 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <SunIcon className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-white/80 text-sm">Sunrise</p>
                        <p className="text-white">{formatTime(weather.sys.sunrise)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MoonIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-white/80 text-sm">Sunset</p>
                        <p className="text-white">{formatTime(weather.sys.sunset)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {forecast && forecast.list && forecast.list.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-white">Forecast</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {forecast.list.slice(0, 10).map((day, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <div className="text-center mb-3">
                    <p className="font-bold text-white">{formatDate(day.dt).weekday}</p>
                    <p className="text-sm text-white/80">{formatDate(day.dt).date}</p>
                  </div>
                  
                  <div className="flex justify-center mb-3">
                    <WeatherIcon 
                      code={day.weather[0].icon} 
                      isDay={isDaytime(weather.sys.sunrise, weather.sys.sunset)} 
                      size="small"
                    />
                  </div>

                  <div className="text-center mb-3">
                    <p className="text-2xl font-bold text-white">{day.main.temp}°{unit === 'metric' ? 'C' : 'F'}</p>
                    <p className="text-sm text-white/80 capitalize">{day.weather[0].description}</p>
                  </div>

                  <div className="flex justify-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-white/80">{day.main.temp_max}°{unit === 'metric' ? 'C' : 'F'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowTrendingDownIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white/80">{day.main.temp_min}°{unit === 'metric' ? 'C' : 'F'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs items-center justify-center">
                    <WeatherInfo 
                      label="Wind" 
                      value={`${day.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`} 
                      icon={ArrowPathIcon}
                      color="text-white/80"
                    />
                    <WeatherInfo 
                      label="Humidity" 
                      value={`${day.main.humidity}%`} 
                      icon={BeakerIcon}
                      color="text-white/80"
                    />
                    <WeatherInfo 
                      label="Rain" 
                      value={`${day.pop}%`} 
                      icon={CloudIconSolid}
                      color="text-white/80"
                    />
                    <WeatherInfo 
                      label="Feels" 
                      value={`${day.main.feels_like}°${unit === 'metric' ? 'C' : 'F'}`} 
                      icon={FireIcon}
                      color="text-white/80"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
