const { stringify } = require("csv-stringify/sync");
const fs = require("fs");

const exportToCSV = (data, filePath) => {
  const csv = stringify(data, { header: true });
  fs.writeFileSync(filePath, csv);
  console.log(`✅ CSV exported successfully: ${filePath}`);
};

module.exports = exportToCSV;
