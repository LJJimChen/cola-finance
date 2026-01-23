
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyDir = path.join(__dirname, '../ETF-history');
const outputFile = path.join(__dirname, '../src/services/etf-data.ts');

// Check if directory exists
if (!fs.existsSync(historyDir)) {
    console.error(`Directory not found: ${historyDir}`);
    process.exit(1);
}

const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.csv'));

const etfData = {};

files.forEach(file => {
  const filePath = path.join(historyDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  // Parse filename for symbol and name
  // Format: "159202_恒生互联网科技ETF.csv"
  const basename = path.basename(file, '.csv');
  const [symbol, ...nameParts] = basename.split('_');
  const name = nameParts.join('_'); 

  const history = [];
  
  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(',');
    if (cols.length < 3) continue;
    
    const date = cols[0].trim(); // "日期"
    const close = parseFloat(cols[2].trim()); // "收盘"
    
    if (date && !isNaN(close)) {
      history.push({ date, price: close });
    }
  }
  
  // Sort by date ascending
  history.sort((a, b) => a.date.localeCompare(b.date));

  etfData[symbol] = {
    name,
    history
  };
});

const fileContent = `// Auto-generated from ETF-history CSVs
export type EtfHistoryItem = { date: string; price: number };
export type EtfData = {
  [symbol: string]: {
    name: string;
    history: EtfHistoryItem[];
  };
};

export const etfData: EtfData = ${JSON.stringify(etfData, null, 2)};
`;

fs.writeFileSync(outputFile, fileContent);
console.log(`Generated etf-data.ts with ${Object.keys(etfData).length} ETFs.`);
