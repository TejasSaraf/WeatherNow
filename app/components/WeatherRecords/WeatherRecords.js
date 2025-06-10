"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const EXPORT_FORMATS = {
  JSON: "json",
  CSV: "csv",
  XML: "xml",
  MARKDOWN: "markdown",
  PDF: "pdf",
};

const TEMPERATURE_UNITS = {
  CELSIUS: "C",
  FAHRENHEIT: "F",
};

export default function WeatherRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    endDate: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [temperatureUnit, setTemperatureUnit] = useState(
    TEMPERATURE_UNITS.CELSIUS
  );
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/weather-records");
      console.log("Fetched records:", response.data);
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
      setError(
        error.response?.data?.error ||
          "Failed to fetch records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDisplayDate = (dateString) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);

      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatInputDate = (dateString) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);

      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "";
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting input date:", error);
      return "";
    }
  };

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    setFormData({
      location: record.location,
      startDate: formatInputDate(record.startDate),
      endDate: formatInputDate(record.endDate),
    });
    setEditingId(record.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const now = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setError("Invalid date format");
        return;
      }

      if (start > end) {
        setError("Start date must be before end date");
        return;
      }

      if (end < now) {
        setError("Cannot create records for past dates");
        return;
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 5) {
        setError("Date range cannot exceed 5 days");
        return;
      }

      const response = editingId
        ? await axios.put("/api/weather-records", {
            id: editingId,
            ...formData,
          })
        : await axios.post("/api/weather-records", formData);

      setFormData({ location: "", startDate: "", endDate: "" });
      setEditingId(null);

      setRecords((prevRecords) =>
        editingId
          ? prevRecords.map((record) =>
              record.id === editingId ? response.data : record
            )
          : [response.data, ...prevRecords]
      );
    } catch (error) {
      console.error("Error saving record:", error);
      setError(
        error.response?.data?.error ||
          "Failed to save record. Please check your input and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      setLoading(true);
      await axios.delete(`/api/weather-records?id=${id}`);
      await fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      setError("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const getTemperature = (record) => {
    if (!record) return "N/A";
    return temperatureUnit === TEMPERATURE_UNITS.FAHRENHEIT
      ? record.temperatureFahrenheit
      : record.temperatureCelsius;
  };

  // Toggle temperature unit
  const toggleTemperatureUnit = () => {
    setTemperatureUnit((prev) =>
      prev === TEMPERATURE_UNITS.CELSIUS
        ? TEMPERATURE_UNITS.FAHRENHEIT
        : TEMPERATURE_UNITS.CELSIUS
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest(".export-menu")) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setError(null);
      setShowExportMenu(false);

      const params = new URLSearchParams();
      params.append("format", format);
      if (formData.location) params.append("location", formData.location);
      if (formData.startDate) params.append("startDate", formData.startDate);
      if (formData.endDate) params.append("endDate", formData.endDate);

      console.log("Exporting records in", format, "format");

      const response = await axios.get(
        `/api/weather-records/export?${params.toString()}`,
        { responseType: "blob" }
      );

      if (response.data.type === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (data.error) {
              console.error("Export error:", data);
              setError(
                data.details || data.error || "Failed to export records"
              );
            } else {
              const blob = new Blob([reader.result], {
                type: "application/json",
              });
              downloadFile(blob, `weather-records.${format}`);
            }
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
            setError("Failed to export records");
          }
        };
        reader.readAsText(response.data);
        return;
      }

      downloadFile(response.data, `weather-records.${format}`);
    } catch (error) {
      console.error("Error exporting records:", error);
      if (error.response?.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(
              errorData.details || errorData.error || "Failed to export records"
            );
          } catch (parseError) {
            setError("Failed to export records");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        setError("Failed to export records. Please try again.");
      }
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Weather Records</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleTemperatureUnit}
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            Switch to{" "}
            {temperatureUnit === TEMPERATURE_UNITS.CELSIUS ? "°F" : "°C"}
          </button>
          <div className="relative export-menu">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleExport(EXPORT_FORMATS.JSON)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport(EXPORT_FORMATS.CSV)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(EXPORT_FORMATS.XML)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                  >
                    XML
                  </button>
                  <button
                    onClick={() => handleExport(EXPORT_FORMATS.MARKDOWN)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => handleExport(EXPORT_FORMATS.PDF)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/20"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Location</label>
            <div className="relative">
              <MapPinIcon className="h-5 w-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter location"
                className="bg-white/10 border border-white/20 text-white rounded-lg pl-10 p-2 w-full outline-none focus:ring-0 focus:border-white/30"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">
              Start Date
            </label>
            <div className="relative">
              <CalendarIcon className="h-5 w-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="bg-white/10 border border-white/20 text-white rounded-lg pl-10 p-2 w-full outline-none focus:ring-0 focus:border-white/30"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-2">End Date</label>
            <div className="relative">
              <CalendarIcon className="h-5 w-5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="bg-white/10 border border-white/20 text-white rounded-lg pl-10 p-2 w-full outline-none focus:ring-0 focus:border-white/30"
                required
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5" />
            {editingId ? "Update Record" : "Add Record"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100/10 backdrop-blur-md border border-red-400/50 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-white">
                {record.location}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(record)}
                  className="text-white/60 hover:text-white"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-white/60 hover:text-white"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-white/80">
                <span className="text-white/60">Date Range:</span>{" "}
                {formatDisplayDate(record.startDate)} -{" "}
                {formatDisplayDate(record.endDate)}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">Temperature:</span>{" "}
                {getTemperature(record)}°{temperatureUnit}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">Description:</span>{" "}
                {record.description}
              </p>
              <p className="text-white/80">
                <span className="text-white/60">Humidity:</span>{" "}
                {record.humidity}%
              </p>
              <p className="text-white/80">
                <span className="text-white/60">Wind Speed:</span>{" "}
                {record.windSpeed} m/s
              </p>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-white text-center mt-4">Loading...</div>}
    </div>
  );
}
