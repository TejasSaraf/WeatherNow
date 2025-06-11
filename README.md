# Wheatherly - Modern Weather Application

Wheatherly is a modern, feature-rich weather application built with Next.js that provides real-time weather information, wind maps, and location-based content.

## Features

- 🌤️ Real-time weather data
- 🗺️ Interactive wind map visualization
- 📍 Location search with support for:
  - City names
  - Postal codes
  - Coordinates
  - Famous landmarks
- 📊 Weather records management
- 📱 Responsive design
- 🎥 Location-based YouTube videos
- 📤 Data export in multiple formats:
  - JSON
  - CSV
  - XML
  - PDF
  - Markdown

## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **APIs**:
  - OpenWeatherMap API
  - YouTube Data API
  - Windy API
- **Backend**: Postgres, Prisma Orm

## Dependencies

### Core Dependencies
- `next`: ^14.1.0 - React framework
- `react`: ^18.2.0 - UI library
- `react-dom`: ^18.2.0 - React DOM rendering
- `axios`: ^1.6.7 - HTTP client
- `@heroicons/react`: ^2.1.1 - Icon library

### Styling
- `tailwindcss`: ^3.4.1 - Utility-first CSS framework
- `autoprefixer`: ^10.4.17 - PostCSS plugin
- `postcss`: ^8.4.35 - CSS transformation tool

### Development Dependencies
- `typescript`: ^5.3.3 - Type checking
- `eslint`: ^8.56.0 - Code linting
- `@types/react`: ^18.2.57 - TypeScript definitions
- `@types/node`: ^20.11.19 - Node.js TypeScript definitions

## Prerequisites

Before you begin, ensure you have the following:
- Node.js (v14 or higher)
- npm or yarn
- API keys for:
  - OpenWeatherMap
  - YouTube Data API
- Postgres

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wheatherly.git
cd wheatherly
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your API keys:
```env
OPENWEATHER_API_KEY=your_openweather_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
wheatherly/
├── app/
│   ├── api/              # API routes
│   ├── components/       # React components
│   └── page.js          # Main page
├── public/              # Static assets
└── styles/             # Global styles
```

## API Routes

- `/api/weather` - Fetches weather data
- `/api/location-data` - Fetches location data and coordinates
- `/api/weather-records` - Manages weather records

## Components

- `WeatherDetails` - Main weather display component
- `LocationData` - Location information and wind map
- `WeatherRecords` - Weather records management
- `WeatherComponents` - Reusable weather-related components

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenWeatherMap for weather data
- YouTube Data API for video content
- Windy for wind map visualization
- Next.js team for the amazing framework
- Tailwind CSS for the styling framework
