import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { getLocalD1DB } from './utils/db-path';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: tsx scripts/dump-user-to-sql.ts <SOURCE_USER_EMAIL> <TARGET_USER_EMAIL>');
  console.error('Or with explicit DB path: tsx scripts/dump-user-to-sql.ts <DB_PATH> <SOURCE_USER_EMAIL> <TARGET_USER_EMAIL>');
  process.exit(1);
}

// Check if first arg is a path or email
let dbPath: string | undefined;
let sourceUserEmail: string;
let targetUserEmail: string;

if (args[0].includes('/') || args[0].endsWith('.sqlite')) {
  if (args.length < 3) {
    console.error('Usage: tsx scripts/dump-user-to-sql.ts <DB_PATH> <SOURCE_USER_EMAIL> <TARGET_USER_EMAIL>');
    process.exit(1);
  }
  dbPath = args[0];
  sourceUserEmail = args[1];
  targetUserEmail = args[2];
} else {
  // Try to resolve DB path automatically
  dbPath = getLocalD1DB();
  if (!dbPath) {
    console.error('Could not automatically find local D1 database. Please provide path explicitly.');
    process.exit(1);
  }
  sourceUserEmail = args[0];
  targetUserEmail = args[1];
}

// Determine output file path
const outputDir = '.temp';
if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}
const outputFile = `${outputDir}/seed_data_${targetUserEmail}.sql`;

console.log(`Reading from: ${dbPath}`);
console.log(`Source User Email: ${sourceUserEmail}`);
console.log(`Target User Email: ${targetUserEmail}`);
console.log(`Output File: ${outputFile}`);

try {
  const db = new Database(dbPath, { readonly: true });
  
  const sqlStatements: string[] = [];
  
  // Helper to escape strings for SQL
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (val instanceof Date) return `'${val.toISOString()}'`; // Assuming ISO strings for dates
    // Simple SQL escape for single quotes
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  // Resolve user IDs from emails
  // For source user, we look up in the local DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceUser = db.prepare('SELECT id FROM user WHERE email = ?').get(sourceUserEmail) as any;
  if (!sourceUser) {
    console.error(`Source user with email ${sourceUserEmail} not found in local DB.`);
    process.exit(1);
  }
  const sourceUserId = sourceUser.id;
  console.log(`Resolved Source User ID: ${sourceUserId}`);

  // For target user, we assume the user exists in the TARGET DB.
  // We need to generate a SQL query to lookup the ID at runtime in the target DB.
  
  const targetUserSql = `(SELECT id FROM user WHERE email = ${escape(targetUserEmail)})`;

  // 1.1 Clean up target user data
  console.log('Generating DELETE statements for target user...');
  
  // Delete histories
  sqlStatements.push(`DELETE FROM portfolio_histories WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ${targetUserSql});`);
  
  // Delete assets
  sqlStatements.push(`DELETE FROM assets WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ${targetUserSql});`);
  
  // Delete categories
  sqlStatements.push(`DELETE FROM categories WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ${targetUserSql});`);
  
  // Delete portfolios
  sqlStatements.push(`DELETE FROM portfolios WHERE user_id = ${targetUserSql};`);


  // 2. Export Portfolios
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ?').all(sourceUserId) as any[];
  console.log(`Found ${portfolios.length} portfolios.`);

  // Map old portfolio ID to new random ID
  const portfolioMap = new Map<string, string>();
  
  for (const p of portfolios) {
    const newId = crypto.randomUUID();
    portfolioMap.set(p.id, newId);
    
    // user_id is replaced by subquery for target user
    sqlStatements.push(
      `INSERT INTO portfolios (id, user_id, name, description, total_value_cny4, daily_profit_cny4, current_total_profit_cny4, created_at, updated_at) VALUES (${escape(newId)}, ${targetUserSql}, ${escape(p.name)}, ${escape(p.description)}, ${p.total_value_cny4}, ${p.daily_profit_cny4}, ${p.current_total_profit_cny4}, ${escape(p.created_at)}, ${escape(p.updated_at)});`
    );
  }

  // 3. Export Categories
  // We need to find categories belonging to these portfolios
  const categoryMap = new Map<string, string>();
  if (portfolios.length > 0) {
    const portfolioIds = portfolios.map(p => `'${p.id}'`).join(',');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = db.prepare(`SELECT * FROM categories WHERE portfolio_id IN (${portfolioIds})`).all() as any[];
    console.log(`Found ${categories.length} categories.`);

    for (const c of categories) {
      const newId = crypto.randomUUID();
      const newPortfolioId = portfolioMap.get(c.portfolio_id);
      if (!newPortfolioId) continue; // Should not happen

      categoryMap.set(c.id, newId);

      sqlStatements.push(
        `INSERT INTO categories (id, portfolio_id, name, target_allocation_bps, current_allocation_bps, created_at, updated_at) VALUES (${escape(newId)}, ${escape(newPortfolioId)}, ${escape(c.name)}, ${c.target_allocation_bps}, ${c.current_allocation_bps}, ${escape(c.created_at)}, ${escape(c.updated_at)});`
      );
    }
  }

  // 4. Export Assets
  if (portfolios.length > 0) {
    const portfolioIds = portfolios.map(p => `'${p.id}'`).join(',');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assets = db.prepare(`SELECT * FROM assets WHERE portfolio_id IN (${portfolioIds})`).all() as any[];
    console.log(`Found ${assets.length} assets.`);

    for (const a of assets) {
      const newId = crypto.randomUUID();
      const newPortfolioId = portfolioMap.get(a.portfolio_id);
      const newCategoryId = a.category_id ? categoryMap.get(a.category_id) : null;
      
      if (!newPortfolioId) continue;

      sqlStatements.push(
        `INSERT INTO assets (id, portfolio_id, category_id, symbol, name, quantity8, cost_basis4, daily_profit4, current_price4, currency, broker_source, broker_account, created_at, updated_at) VALUES (${escape(newId)}, ${escape(newPortfolioId)}, ${escape(newCategoryId)}, ${escape(a.symbol)}, ${escape(a.name)}, ${a.quantity8}, ${a.cost_basis4}, ${a.daily_profit4}, ${a.current_price4}, ${escape(a.currency)}, ${escape(a.broker_source)}, ${escape(a.broker_account)}, ${escape(a.created_at)}, ${escape(a.updated_at)});`
      );
    }
  }

  // 5. Export Portfolio Histories (The big one!)
  if (portfolios.length > 0) {
    const portfolioIds = portfolios.map(p => `'${p.id}'`).join(',');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const histories = db.prepare(`SELECT * FROM portfolio_histories WHERE portfolio_id IN (${portfolioIds})`).all() as any[];
    console.log(`Found ${histories.length} history records.`);

    
    // Batch inserts for history to avoid massive file size overhead
    // SQLite supports multiple VALUES (...), (...), (...)
    // We'll chunk them
    const CHUNK_SIZE = 500;
    let currentChunk: string[] = [];

    for (const h of histories) {
      const newId = crypto.randomUUID();
      const newPortfolioId = portfolioMap.get(h.portfolio_id);
      if (!newPortfolioId) continue;

      const values = `(${escape(newId)}, ${escape(newPortfolioId)}, ${escape(h.timestamp)}, ${h.total_value_cny4}, ${h.daily_profit_cny4}, ${h.current_total_profit_cny4})`;
      currentChunk.push(values);

      if (currentChunk.length >= CHUNK_SIZE) {
        sqlStatements.push(
          `INSERT INTO portfolio_histories (id, portfolio_id, timestamp, total_value_cny4, daily_profit_cny4, current_total_profit_cny4) VALUES ${currentChunk.join(',')};`
        );
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      sqlStatements.push(
        `INSERT INTO portfolio_histories (id, portfolio_id, timestamp, total_value_cny4, daily_profit_cny4, current_total_profit_cny4) VALUES ${currentChunk.join(',')};`
      );
    }
  }

  // Wrap in transaction (Removed because wrangler d1 execute --file doesn't support it for remote)
  const finalSql = [
    // 'BEGIN TRANSACTION;',
    ...sqlStatements,
    // 'COMMIT;'
  ].join('\n');

  writeFileSync(outputFile, finalSql);
  console.log(`\nSuccessfully wrote ${sqlStatements.length} statements to ${outputFile}`);
  
  // Auto execute
  console.log('Executing D1 command...');
  const cmd = `npx wrangler d1 execute cola-finance-db --remote --file=${outputFile} --yes`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });

} catch (error) {
  console.error('Error exporting data:', error);
  process.exit(1);
}
