import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Parser } from "json2csv";
import { js2xml } from "xml-js";
import { renderToStream } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  record: {
    marginBottom: 20,
  },
  recordTitle: {
    fontSize: 16,
    marginBottom: 10,
    textDecoration: "underline",
  },
  text: {
    marginBottom: 5,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
  },
});

const convertToMarkdown = (records) => {
  try {
    let markdown = "# Weather Records\n\n";

    records.forEach((record, index) => {
      markdown += `## Record ${index + 1}\n\n`;
      markdown += `- Location: ${record.location}\n`;
      markdown += `- Date Range: ${formatDate(record.startDate)} - ${formatDate(
        record.endDate
      )}\n`;
      markdown += `- Temperature: ${record.temperatureCelsius}°C / ${record.temperatureFahrenheit}°F\n`;
      markdown += `- Description: ${record.description}\n`;
      markdown += `- Humidity: ${record.humidity}%\n`;
      markdown += `- Wind Speed: ${record.windSpeed} m/s\n\n`;
    });

    return markdown;
  } catch (error) {
    console.error("Error converting to markdown:", error);
    throw new Error("Failed to convert records to markdown");
  }
};

const convertToCSV = (records) => {
  try {
    const fields = [
      "location",
      "startDate",
      "endDate",
      "temperatureCelsius",
      "temperatureFahrenheit",
      "description",
      "humidity",
      "windSpeed",
    ];

    const parser = new Parser({ fields });
    return parser.parse(records);
  } catch (error) {
    console.error("Error converting to CSV:", error);
    throw new Error("Failed to convert records to CSV");
  }
};

const convertToXML = (records) => {
  try {
    const xmlObj = {
      weatherRecords: {
        record: records.map((record) => ({
          location: record.location,
          startDate: formatDate(record.startDate),
          endDate: formatDate(record.endDate),
          temperatureCelsius: record.temperatureCelsius,
          temperatureFahrenheit: record.temperatureFahrenheit,
          description: record.description,
          humidity: record.humidity,
          windSpeed: record.windSpeed,
        })),
      },
    };

    return js2xml(xmlObj, { compact: true, spaces: 2 });
  } catch (error) {
    console.error("Error converting to XML:", error);
    throw new Error("Failed to convert records to XML");
  }
};

const convertToPDF = async (records) => {
  try {
    console.log("Starting PDF generation for", records.length, "records");

    const MyDocument = ({ records }) => (
      <Document>
        {records.map((record, index) => (
          <Page key={index} size="A4" style={styles.page}>
            {index === 0 && <Text style={styles.title}>Weather Records</Text>}
            <View style={styles.record}>
              <Text style={styles.recordTitle}>Record {index + 1}</Text>
              <Text style={styles.text}>
                Location: {record.location || "N/A"}
              </Text>
              <Text style={styles.text}>
                Date Range: {formatDate(record.startDate)} -{" "}
                {formatDate(record.endDate)}
              </Text>
              <Text style={styles.text}>
                Temperature: {record.temperatureCelsius || "N/A"}°C /{" "}
                {record.temperatureFahrenheit || "N/A"}°F
              </Text>
              <Text style={styles.text}>
                Description: {record.description || "N/A"}
              </Text>
              <Text style={styles.text}>
                Humidity: {record.humidity || "N/A"}%
              </Text>
              <Text style={styles.text}>
                Wind Speed: {record.windSpeed || "N/A"} m/s
              </Text>
            </View>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
              fixed
            />
          </Page>
        ))}
      </Document>
    );

    const stream = await renderToStream(<MyDocument records={records} />);

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log("PDF generation completed successfully");
    return buffer;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw new Error("Failed to generate PDF");
  }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const location = searchParams.get("location");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("Export request received:", {
      format,
      location,
      startDate,
      endDate,
    });

    let where = {};
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            lte: new Date(endDate),
          },
          endDate: {
            gte: new Date(startDate),
          },
        },
      ];
    }

    const records = await prisma.weatherRecord.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${records.length} records to export`);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No records found to export" },
        { status: 404 }
      );
    }

    let data;
    let contentType;
    let filename;

    try {
      switch (format.toLowerCase()) {
        case "csv":
          data = convertToCSV(records);
          contentType = "text/csv";
          filename = "weather-records.csv";
          break;

        case "xml":
          data = convertToXML(records);
          contentType = "application/xml";
          filename = "weather-records.xml";
          break;

        case "markdown":
          data = convertToMarkdown(records);
          contentType = "text/markdown";
          filename = "weather-records.md";
          break;

        case "pdf":
          console.log("Starting PDF conversion");
          data = await convertToPDF(records);
          contentType = "application/pdf";
          filename = "weather-records.pdf";
          break;

        case "json":
        default:
          const formattedRecords = records.map((record) => ({
            ...record,
            startDate: formatDate(record.startDate),
            endDate: formatDate(record.endDate),
            createdAt: formatDate(record.createdAt),
            updatedAt: formatDate(record.updatedAt),
          }));
          data = JSON.stringify(formattedRecords, null, 2);
          contentType = "application/json";
          filename = "weather-records.json";
      }

      console.log(`Successfully converted to ${format}`);

      return new NextResponse(data, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (conversionError) {
      console.error(`Error converting to ${format}:`, conversionError);
      return NextResponse.json(
        {
          error: `Failed to convert records to ${format}`,
          details: conversionError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error exporting records:", error);
    return NextResponse.json(
      {
        error: "Failed to export records",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
