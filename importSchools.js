import mongoose from "mongoose";
import xlsx from "xlsx";
import School from "./models/School.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Read Excel file (single column)
const workbook = xlsx.readFile("C:/Users/Abishek K/Downloads/ALL SCHOOL.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert sheet to JSON as array of arrays
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

async function importSchools() {
  try {
    let added = 0;
    for (const row of rows) {
      const schoolName = row[0]?.toString().trim(); // first column, trim spaces
      if (schoolName) {
        const exists = await School.findOne({ school_name: schoolName });
        if (!exists) {
          await School.create({ school_name: schoolName });
          added++;
          console.log(`Added: ${schoolName}`);
        }
      }
    }
    console.log(`Done! Total new schools added: ${added}`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

importSchools();
