import Image from 'next/image';

const getWeatherIcon = (weatherCode, isDay = true) => {
  if (weatherCode === '01d' || weatherCode === '01n') {
    return isDay ? '01d' : '01n';
  }
  return weatherCode;
};

const WeatherIcon = ({ code, isDay, size = 'large' }) => {
  const dimensions = size === 'large' ? 96 : 64;
  return (
    <Image
      src={`http://openweathermap.org/img/wn/${getWeatherIcon(code, isDay)}@2x.png`}
      alt="Weather icon"
      width={dimensions}
      height={dimensions}
      className="mx-auto"
    />
  );
};

export default WeatherIcon; 