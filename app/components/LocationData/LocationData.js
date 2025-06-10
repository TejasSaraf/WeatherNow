"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { MapIcon, PlayIcon } from "@heroicons/react/24/outline";

export default function LocationData({ location }) {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!location) return;

      try {
        setLoading(true);
        setError(null);
        console.log("Fetching location data for:", location);
        const response = await axios.get(`/api/location-data?location=${encodeURIComponent(location)}`);
        console.log("Location data received:", response.data);
        setLocationData(response.data);
      } catch (error) {
        console.error("Error fetching location data:", error);
        const errorMessage = error.response?.data?.details || 
                           error.response?.data?.error || 
                           error.message || 
                           "Failed to fetch location data. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [location]);

  if (loading) {
    return (
      <div className="text-white/60 text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto mb-2"></div>
        Loading location data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100/10 backdrop-blur-md border border-red-400/50 text-red-300 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!locationData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-white/80 font-semibold mb-2 flex items-center gap-2">
          <MapIcon className="h-5 w-5" />
          Wind Map
        </h4>
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://embed.windy.com/embed2.html?lat=${locationData.maps.location.split(',')[0]}&lon=${locationData.maps.location.split(',')[1]}&zoom=5&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            className="absolute inset-0"
          />
        </div>
      </div>

      {locationData.youtube && locationData.youtube.length > 0 && (
        <div>
          <h4 className="text-white/80 font-semibold mb-2 flex items-center gap-2">
            <PlayIcon className="h-5 w-5" />
            Related Videos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locationData.youtube.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
              >
                <div className="aspect-video relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <PlayIcon className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h5 className="text-white text-sm font-medium line-clamp-2">
                    {video.title}
                  </h5>
                  <p className="text-white/60 text-xs mt-1">
                    {video.channelTitle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 