import WeatherDetails from "./components/WeatherDetails/WeatherDetails";
import Header from "./components/Header/Header";

export default function Home() {
  return (
    <div className="min-h-screen background from-blue-900 via-blue-800 to-blue-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WeatherDetails />
      </main>
    </div>
  );
}
