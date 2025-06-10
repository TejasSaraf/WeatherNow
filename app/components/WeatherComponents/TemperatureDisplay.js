import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const TemperatureDisplay = ({ temp, max, min, unit = 'metric' }) => (
  <div className="text-center">
    <p className="text-5xl font-bold text-white mt-2">{temp}°{unit === 'metric' ? 'C' : 'F'}</p>
    <div className="flex justify-center gap-4 mt-2">
      <p className="text-sm text-white/60">
        <ArrowUpIcon className="h-4 w-4 inline-block text-red-400" />
        {max}°{unit === 'metric' ? 'C' : 'F'}
      </p>
      <p className="text-sm text-white/60">
        <ArrowDownIcon className="h-4 w-4 inline-block text-blue-600" />
        {min}°{unit === 'metric' ? 'C' : 'F'}
      </p>
    </div>
  </div>
);

export default TemperatureDisplay; 