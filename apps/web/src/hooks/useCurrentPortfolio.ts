import { useState, useEffect } from 'react';
import { getApiClient } from '@repo/shared-types';
import type { Portfolio } from '@repo/shared-types';

export function useCurrentPortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const portfolios = await client.getPortfolios();
        // Backend now guarantees at least one portfolio exists
        if (portfolios.length > 0) {
          setPortfolio(portfolios[0]);
        }
      } catch (err) {
        console.error('Failed to fetch current portfolio', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  return { 
    portfolio, 
    portfolioId: portfolio?.id || null, 
    loading, 
    error 
  };
}
