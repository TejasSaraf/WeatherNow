import { NextResponse } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");

    if (!YOUTUBE_API_KEY) {
      console.error("YouTube API key is missing");
    }

    console.log("API Keys present:", {
      openweather: !!OPENWEATHER_API_KEY,
      youtube: !!YOUTUBE_API_KEY
    });

    if (!location) {
      console.log("Error: No location provided");
      return NextResponse.json(
        { error: "Location parameter is required" },
        { status: 400 }
      );
    }

    console.log("Fetching data for location:", location);

    let coordinates = null;
    try {
      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const geocodeResponse = await fetch(geocodeUrl);
      
      if (!geocodeResponse.ok) {
        throw new Error('Failed to fetch coordinates');
      }

      const geocodeData = await geocodeResponse.json();
      if (geocodeData && geocodeData.length > 0) {
        coordinates = {
          lat: geocodeData[0].lat,
          lon: geocodeData[0].lon
        };
      }
    } catch (geocodeError) {
      console.error("Geocoding Error:", geocodeError);
      return NextResponse.json(
        { error: "Failed to get coordinates for location" },
        { status: 500 }
      );
    }

    let videos = [];
    if (YOUTUBE_API_KEY) {
      try {
        const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          location + " travel guide"
        )}&type=video&maxResults=4&key=${YOUTUBE_API_KEY}`;
        
        console.log("Fetching YouTube videos...");
        const youtubeResponse = await fetch(youtubeUrl);
        
        if (!youtubeResponse.ok) {
          const errorData = await youtubeResponse.json();
          console.error("YouTube API Error:", errorData);
          throw new Error(`Failed to fetch YouTube data: ${errorData.error?.message || 'Unknown error'}`);
        }

        const youtubeData = await youtubeResponse.json();
        console.log("YouTube data received:", youtubeData.items?.length || 0, "videos");

        if (youtubeData.items && youtubeData.items.length > 0) {
          videos = youtubeData.items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high.url,
            channelTitle: item.snippet.channelTitle,
          }));
        }
      } catch (youtubeError) {
        console.error("YouTube API Error:", youtubeError);
        videos = [];
      }
    } else {
      console.log("Skipping YouTube API call - API key not available");
    }

    const response = {
      maps: {
        location: coordinates ? `${coordinates.lat},${coordinates.lon}` : location,
      },
      youtube: videos
    };

    console.log("Sending response with:", {
      location: location,
      coordinates: coordinates,
      videoCount: videos.length
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Location data error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch location data",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 