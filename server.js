require("dotenv").config();
const express = require("express");
const { errorLogger, responseTimeLogger } = require('./middleware/errorLogger');
const FRONTEND_ORIGIN =  "http://localhost:3000";

const helmet = require('helmet');
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const multer = require("multer");
const rateLimit = require('express-rate-limit'); // ✅ added
const uploadRoutes = require('./routes/uploadRoutes');
const fs = require("fs");
const path = require("path");
const systemRoutes = require('./routes/systemRoutes');
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
	try {
		fs.mkdirSync(uploadsDir, { recursive: true });
		console.log("Created uploads directory");
	} catch (err) {
		console.error("Error creating uploads directory:", err);
	}
}

// Create temp directory for uploads
const tempDir = path.join(__dirname, 'uploads', 'temp');
if (!fs.existsSync(tempDir)) {
	try {
		fs.mkdirSync(tempDir, { recursive: true });
		console.log("Created temp uploads directory");
	} catch (err) {
		console.error("Error creating temp uploads directory:", err);
	}
}

// Function to clean up old temporary files
function cleanupOldFiles() {
	const now = Date.now();
	const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
	
	// Clean temporary files
	try {
		const tempFiles = fs.readdirSync(tempDir);
		console.log(`Checking ${tempFiles.length} temporary files for cleanup`);
		
		let deletedCount = 0;
		tempFiles.forEach(file => {
			const filePath = path.join(tempDir, file);
			try {
				const stats = fs.statSync(filePath);
				// Delete files older than 1 day
				if (now - stats.mtimeMs > ONE_DAY) {
					fs.unlinkSync(filePath);
					deletedCount++;
				}
			} catch (err) {
				console.error(`Error checking file ${filePath}:`, err);
			}
		});
		
		if (deletedCount > 0) {
			console.log(`Cleaned up ${deletedCount} old temporary files`);
		}
	} catch (err) {
		console.error("Error during file cleanup:", err);
	}
}

// Clean up temporary files on startup
cleanupOldFiles();

// Schedule cleanup to run every 3 hours
setInterval(cleanupOldFiles, 3 * 60 * 60 * 1000);

const app = express();

const port = process.env.PORT || 80;

let db = require("./dbConnection");

app.use('/api/system', systemRoutes)


// CORS
//app.options("*", cors({ origin: "http://localhost:3000" }));
//app.use(cors({ origin: "http://localhost:3000" }));


app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,                      
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.set("trust proxy", 1);

// Helmet Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Global Rate Limiting Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many requests, please try again later.",
    },
});
app.use(limiter); // apply globally

// Swagger Docs
const swaggerDocument = yaml.load("./index.yaml");
// Remove externalDocs if present to avoid CORS issues
if (swaggerDocument && swaggerDocument.externalDocs) {
	delete swaggerDocument.externalDocs;
}
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Response time monitoring
app.use(responseTimeLogger);
// JSON & URL parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
const routes = require("./routes");
routes(app);

app.use("/api", uploadRoutes);
app.use("/uploads", express.static("uploads"));

//signup
app.use("/api/signup", require("./routes/signup"));

// Error handler
app.use(errorLogger);

// Final error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message;
        
    res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
const { uncaughtExceptionHandler, unhandledRejectionHandler } = require('./middleware/errorLogger');
process.on('uncaughtException', uncaughtExceptionHandler);
process.on('unhandledRejection', unhandledRejectionHandler);

// Start server
app.listen(port, async () => {
    console.log('\n🎉 NutriHelp API launched successfully!');
    console.log('='.repeat(50));
	console.log(`Server is running on port ${port}`);
	console.log(`📚 Swagger UI: http://localhost/api-docs`);
	console.log('='.repeat(50));
	console.log('💡 Press Ctrl+C to stop the server \n');
	exec(`start http://localhost:${port}/api-docs`);
});