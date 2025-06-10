const WeatherInfo = ({ label, value, icon: Icon, color = "text-white/80" }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center gap-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
    <span className={`text-sm font-medium ${color}`}>{value}</span>
  </div>
);

export default WeatherInfo; 