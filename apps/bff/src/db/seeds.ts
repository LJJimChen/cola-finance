/**
 * Database seed script
 *
 * Intent: Populate database with initial data (brokers, classification schemes)
 * Run after migrations to set up system presets
 *
 * Contract:
 * - Idempotent: Can be run multiple times safely
 * - Seeds preset brokers (Schwab, 天天基金)
 * - Seeds preset classification scheme (Asset Class)
 */
import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import { brokers } from './schema/brokers'
import { classificationSchemes } from './schema/classification-schemes'

/**
 * Seed brokers data
 *
 * Intent: Populate brokers table with supported platforms
 * MVP supports: Schwab (API) and 天天基金 (Playwright scraping)
 */
export async function seedBrokers(db: D1Database) {
  const orm = drizzle(db)

  const brokerData = [
    {
      id: 'schwab',
      name: 'Charles Schwab',
      name_zh: '嘉信理财',
      logo_url: 'https://cdn.cola-finance.app/logos/schwab.png',
      default_currency: 'USD',
      supported: true,
      adapter_version: '1.0.0',
      requires_verification: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tiantian',
      name: 'Tiantian Fund',
      name_zh: '天天基金',
      logo_url: 'https://cdn.cola-finance.app/logos/tiantian.png',
      default_currency: 'CNY',
      supported: true,
      adapter_version: '1.0.0',
      requires_verification: true, // Requires captcha
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  for (const broker of brokerData) {
    await orm
      .insert(brokers)
      .values(broker)
      .onConflictDoUpdate({
        target: brokers.id,
        set: {
          name: broker.name,
          name_zh: broker.name_zh,
          logo_url: broker.logo_url,
          default_currency: broker.default_currency,
          adapter_version: broker.adapter_version,
          updated_at: broker.updated_at,
        },
      })
  }

  console.log('✅ Seeded brokers')
}

/**
 * Seed classification schemes data
 *
 * Intent: Populate classification_schemes table with preset schemes
 * MVP includes: Asset Class (stocks, bonds, funds, cash, crypto, other)
 */
export async function seedClassificationSchemes(db: D1Database) {
  const orm = drizzle(db)

  const classificationSchemeData = [
    {
      id: 'preset_asset_class',
      userId: null, // Null for preset schemes
      name: 'Asset Class',
      nameZh: '资产类别',
      description: 'Classify holdings by asset class (stocks, bonds, cash, etc.)',
      isPreset: true,
      categories: [
        { id: 'stocks', name: 'Stocks', name_zh: '股票' },
        { id: 'bonds', name: 'Bonds', name_zh: '债券' },
        { id: 'funds', name: 'Funds', name_zh: '基金' },
        { id: 'cash', name: 'Cash', name_zh: '现金' },
        { id: 'crypto', name: 'Crypto', name_zh: '加密货币' },
        { id: 'other', name: 'Other', name_zh: '其他' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]

  for (const scheme of classificationSchemeData) {
    await orm
      .insert(classificationSchemes)
      .values(scheme)
      .onConflictDoUpdate({
        target: classificationSchemes.id,
        set: {
          name: scheme.name,
          nameZh: scheme.nameZh,
          description: scheme.description,
          isPreset: scheme.isPreset,
          categories: scheme.categories,
          updated_at: scheme.updatedAt,
        },
      })
  }

  console.log('✅ Seeded classification schemes')
}

/**
 * Run all seed functions
 */
export async function seedDatabase(db: D1Database) {
  await seedBrokers(db)
  await seedClassificationSchemes(db)
  console.log('✅ Database seeding complete')
}
