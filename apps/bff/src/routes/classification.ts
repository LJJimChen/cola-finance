/**
 * Classification routes
 *
 * Intent: Handle classification scheme operations (list, create, manage targets)
 * Provides endpoints for classification scheme management and rebalance previews
 *
 * Contract:
 * - GET /classification/schemes: Return list of preset and user's custom schemes
 * - POST /classification/schemes: Create custom classification scheme
 * - GET /classification/schemes/{schemeId}/targets: Get target allocation for scheme
 * - PUT /classification/schemes/{schemeId}/targets: Set target allocation for scheme (validates sum=100%)
 * - GET /classification/schemes/{schemeId}/rebalance-preview: Compute and return rebalance preview
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { ClassificationService } from '../services/classification.service';
import { RebalanceService } from '../services/rebalance.service';
import type { Bindings } from '../index';

// Create Hono app for classification routes
const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes except GET /schemes (which can return presets)
app.use('*', authMiddleware);

// GET /classification/schemes - Get list of classification schemes
app.get('/schemes', async (c) => {
  const userId = c.get('userId');
  const classificationService = new ClassificationService(c.env);

  try {
    // Get both preset schemes and user's custom schemes
    const schemes = await classificationService.getSchemes(userId);
    return c.json({ schemes });
  } catch (error) {
    console.error('Error fetching classification schemes:', error);
    return c.json(
      { error_code: 'FETCH_SCHEMES_FAILED', message: 'Failed to fetch classification schemes' },
      500
    );
  }
});

// POST /classification/schemes - Create custom classification scheme
app.post('/schemes', 
  zValidator('json', 
    z.object({
      name: z.string().min(1).max(100),
      nameZh: z.string().max(100).optional(),
      description: z.string().max(500).optional(),
      categories: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          nameZh: z.string().optional(),
          rules: z.record(z.unknown()).optional(),
        })
      ),
    })
  ), 
  async (c) => {
    const userId = c.get('userId');
    const { name, nameZh, description, categories } = c.req.valid('json');
    const classificationService = new ClassificationService(c.env);

    try {
      // Validate that categories have unique IDs
      const categoryIds = categories.map(cat => cat.id);
      if (new Set(categoryIds).size !== categoryIds.length) {
        return c.json(
          { error_code: 'DUPLICATE_CATEGORY_IDS', message: 'Category IDs must be unique' },
          400
        );
      }

      const newScheme = await classificationService.createScheme({
        userId,
        name,
        nameZh,
        description,
        categories,
      });

      return c.json({ scheme: newScheme });
    } catch (error) {
      console.error('Error creating classification scheme:', error);
      return c.json(
        { error_code: 'CREATE_SCHEME_FAILED', message: 'Failed to create classification scheme' },
        500
      );
    }
  }
);

// GET /classification/schemes/:schemeId/targets - Get target allocation for a scheme
app.get('/schemes/:schemeId/targets', async (c) => {
  const userId = c.get('userId');
  const schemeId = c.req.param('schemeId');
  const classificationService = new ClassificationService(c.env);

  try {
    const targets = await classificationService.getTargets(userId, schemeId);
    return c.json({ targets });
  } catch (error) {
    console.error('Error fetching target allocation:', error);
    return c.json(
      { error_code: 'FETCH_TARGETS_FAILED', message: 'Failed to fetch target allocation' },
      500
    );
  }
});

// PUT /classification/schemes/:schemeId/targets - Set target allocation for a scheme
app.put('/schemes/:schemeId/targets',
  zValidator('json',
    z.object({
      targets: z.record(z.number().min(0).max(100)) // { categoryId: percentage }
    })
  ),
  async (c) => {
    const userId = c.get('userId');
    const schemeId = c.req.param('schemeId');
    const { targets } = c.req.valid('json');
    const classificationService = new ClassificationService(c.env);

    try {
      // Validate that the sum of targets is approximately 100%
      const total = Object.values(targets).reduce((sum, value) => sum + value, 0);
      if (Math.abs(total - 100) > 0.01) { // Allow small floating point differences
        return c.json(
          { 
            error_code: 'INVALID_TARGET_SUM', 
            message: `Target allocation must sum to 100%. Current sum: ${total}%` 
          },
          400
        );
      }

      // Validate that all category IDs exist in the scheme
      const scheme = await classificationService.getSchemeById(schemeId);
      if (!scheme) {
        return c.json(
          { error_code: 'SCHEME_NOT_FOUND', message: 'Classification scheme not found' },
          404
        );
      }

      const schemeCategoryIds = scheme.categories.map((cat: any) => cat.id);
      const targetCategoryIds = Object.keys(targets);
      
      for (const targetCatId of targetCategoryIds) {
        if (!schemeCategoryIds.includes(targetCatId)) {
          return c.json(
            { error_code: 'INVALID_CATEGORY_ID', message: `Category ID '${targetCatId}' does not exist in this scheme` },
            400
          );
        }
      }

      const updatedTargets = await classificationService.setTargets({
        userId,
        schemeId,
        targets,
      });

      return c.json({ targets: updatedTargets });
    } catch (error) {
      console.error('Error setting target allocation:', error);
      return c.json(
        { error_code: 'SET_TARGETS_FAILED', message: 'Failed to set target allocation' },
        500
      );
    }
  }
);

// GET /classification/schemes/:schemeId/rebalance-preview - Get rebalance preview
app.get('/schemes/:schemeId/rebalance-preview', async (c) => {
  const userId = c.get('userId');
  const schemeId = c.req.param('schemeId');
  const { currency } = c.req.query(); // Optional currency parameter
  
  const rebalanceService = new RebalanceService(c.env);

  try {
    const preview = await rebalanceService.computeRebalancePreview({
      userId,
      schemeId,
      displayCurrency: currency || 'USD', // Default to USD if not specified
    });

    return c.json(preview);
  } catch (error) {
    console.error('Error computing rebalance preview:', error);
    return c.json(
      { error_code: 'COMPUTE_PREVIEW_FAILED', message: 'Failed to compute rebalance preview' },
      500
    );
  }
});

export default app;