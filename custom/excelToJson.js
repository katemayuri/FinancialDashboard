// excelToJson.js
const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('data/creditors_suppliers.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert sheet to an array of arrays (each array is a row)
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let result = { name: "Creditors", children: [] };
let currentLedger = null;
let state = "idle"; // states: idle, skipHeader, inLedger
let skipCount = 0;

data.forEach(row => {
  // Convert all cell values to string and trim
  row = row.map(cell => (cell || "").toString().trim());
  if (!row || row.length === 0 || row.every(cell => cell === "")) return;
  const line = row.join(" ");
  const lowerLine = line.toLowerCase();
  
  if (line.includes("[Creditors / Suppliers]")) {
    if (currentLedger) result.children.push(currentLedger);
    const ledgerName = line.split("[")[0].trim();
    currentLedger = {
      ledger_name: ledgerName,
      opening_balance: 0,
      closing_balance: 0,
      transactions: []
    };
    state = "skipHeader";
    skipCount = 2;  // Skip the next 2 header rows
    return;
  }
  
  if (state === "skipHeader") {
    skipCount--;
    if (skipCount <= 0) state = "inLedger";
    return;
  }
  
  if (lowerLine.includes("opening balance")) {
    const val = row[row.length - 1].replace(/,/g, "");
    currentLedger.opening_balance = parseFloat(val) || 0;
    return;
  }
  
  // Skip Total rows
  if (lowerLine.includes("total")) return;
  
  // If the row contains "Closing Balance"
  if (lowerLine.includes("closing balance")) {
    const val = row[row.length - 1].replace(/,/g, "");
    currentLedger.closing_balance = parseFloat(val) || 0;
    // Also set the treemap sizing property
    currentLedger.value = currentLedger.closing_balance;
    // Ledger block complete; push it and reset state.
    result.children.push(currentLedger);
    currentLedger = null;
    state = "idle";
    return;
  }
  
  if (/\d{1,2}-[A-Za-z]{3}-\d{4}/.test(row[0])) {
    const txn = {
      date: row[0] || "",
      party_name: row[1] || "",
      vno: row[2] || "",
      debit_amt: parseFloat((row[3] || "0").replace(/,/g, "")) || 0,
      credit_amt: parseFloat((row[4] || "0").replace(/,/g, "")) || 0,
      cheque_no: row[5] || "",
      narration: row[6] || "",
      type: row[7] || ""
    };
    if (currentLedger) {
      currentLedger.transactions.push(txn);
    }
  } else {
    if (currentLedger && currentLedger.transactions.length > 0) {
      currentLedger.transactions[currentLedger.transactions.length - 1].narration += " " + line;
    }
  }
});

if (currentLedger) result.children.push(currentLedger);

// Save the JSON object to a file (creditors.json)
fs.writeFileSync("creditors.json", JSON.stringify(result, null, 2));
console.log("JSON data saved to creditors.json");
