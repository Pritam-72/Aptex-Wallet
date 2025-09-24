import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const UserMarketSection = () => {
  const [globalStats, setGlobalStats] = useState<{ marketCap: number; volume24h: number; btcDominance: number } | null>(null);
  const [fearGreed, setFearGreed] = useState<{ value: number; classification: string } | null>(null);
  const [topCoins, setTopCoins] = useState<Array<{ id: string; name: string; symbol: string; image: string; current_price: number; price_change_percentage_24h: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aptFallback, setAptFallback] = useState<{ price: number; change24h: number } | null>(null);

  const tvContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // CoinGecko Global stats
        const [globalRes, marketsRes, fngRes, aptRes] = await Promise.all([
          fetch('https://api.coingecko.com/api/v3/global'),
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'),
          fetch('https://api.alternative.me/fng/?limit=1&format=json'),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd&include_24hr_change=true')
        ]);

        if (!globalRes.ok || !marketsRes.ok || !fngRes.ok || !aptRes.ok) {
          throw new Error('Failed fetching market data');
        }

        const globalJson = await globalRes.json();
        const marketsJson = await marketsRes.json();
        const fngJson = await fngRes.json();
        const aptJson = await aptRes.json();

        if (!isMounted) return;

        setGlobalStats({
          marketCap: globalJson?.data?.total_market_cap?.usd ?? 0,
          volume24h: globalJson?.data?.total_volume?.usd ?? 0,
          btcDominance: globalJson?.data?.market_cap_percentage?.btc ?? 0
        });

        setTopCoins(marketsJson || []);

        const fngData = fngJson?.data?.[0];
        setFearGreed(
          fngData
            ? { value: Number(fngData.value), classification: fngData.value_classification }
            : null
        );

        const aptPrice = aptJson?.aptos?.usd;
        const aptChange = aptJson?.aptos?.usd_24h_change;
        if (typeof aptPrice === 'number' && typeof aptChange === 'number') {
          setAptFallback({ price: aptPrice, change24h: aptChange });
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Unexpected error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // TradingView widget
  useEffect(() => {
    if (!tvContainerRef.current) return;
    // Cleanup existing widget container
    tvContainerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:APTUSDT',
      interval: 'D',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false
    });
    tvContainerRef.current.appendChild(script);
  }, []);

  const formatCurrency = (num?: number) => {
    if (num === undefined || num === null) return '-';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    } catch {
      return `$${num.toLocaleString()}`;
    }
  };

  const aptCoin = useMemo(() => topCoins.find(c => c.id === 'aptos' || c.symbol?.toLowerCase() === 'apt'), [topCoins]);
  const aptPrice = aptCoin?.current_price ?? aptFallback?.price;
  const aptChange = aptCoin?.price_change_percentage_24h ?? aptFallback?.change24h ?? 0;

  return (
    <section className="pt-24 pb-8 px-6 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Market Cap</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">{globalStats ? formatCurrency(globalStats.marketCap) : '—'}</div>
            <div className="text-yellow-500/80 text-xs">Global crypto market cap</div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">24h Volume</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">{globalStats ? formatCurrency(globalStats.volume24h) : '—'}</div>
            <div className="text-gray-400 text-sm">Global trading volume</div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">BTC Dominance</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">{globalStats ? `${globalStats.btcDominance.toFixed(1)}%` : '—'}</div>
            <div className="text-gray-400 text-sm">Bitcoin market share</div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bitcoin Price Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6 h-[620px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Aptos Price</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>APTUSDT</span>
                  <span>1D</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-white">{typeof aptPrice === 'number' ? `$${aptPrice.toLocaleString()}` : '—'}</div>
                <div className={`${(aptChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
                  {(aptChange ?? 0) >= 0 ? '+' : ''}{(aptChange ?? 0).toFixed(2)}%
                </div>
              </div>
              <div className="relative flex-1 bg-gray-700/30 rounded-lg overflow-hidden">
                {typeof aptPrice === 'number' && (
                  <div className="absolute top-3 left-3 z-10 rounded-md bg-black/60 backdrop-blur px-3 py-1.5 text-sm text-white border border-white/10">
                    <span className="font-semibold mr-2">APT</span>
                    <span className="mr-2">${aptPrice.toLocaleString()}</span>
                    <span className={`${(aptChange ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(aptChange ?? 0) >= 0 ? '+' : ''}{(aptChange ?? 0).toFixed(2)}%
                    </span>
                  </div>
                )}
                <div className="tradingview-widget-container h-full" ref={tvContainerRef} />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Aptos Performance */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Aptos Performance</h3>
              <div className="h-32 bg-gray-700/30 rounded-lg flex items-center justify-center mb-4">
                <div className="text-gray-500 text-sm">Last 6 months</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{aptCoin ? `$${aptCoin.current_price.toLocaleString()}` : '—'}</div>
                <div className={`${(aptChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
                  {(aptChange ?? 0) >= 0 ? '+' : ''}{(aptChange ?? 0).toFixed(2)}%
                </div>
              </div>
            </Card>

            {/* Fear & Greed Index */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fear & Greed Index</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{fearGreed ? fearGreed.value : '—'}</div>
                <div className={`font-medium ${!fearGreed ? 'text-gray-400' : fearGreed.value >= 60 ? 'text-green-500' : fearGreed.value <= 40 ? 'text-orange-500' : 'text-yellow-400'}`}>{fearGreed ? fearGreed.classification : '—'}</div>
                <div className="text-gray-400 text-sm mt-2">Market sentiment indicator</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Cryptocurrencies */}
        <div className="mt-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Top Cryptocurrencies</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(topCoins.length ? topCoins : []).map((coin, index) => (
                  <div key={coin.id} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-orange-500/80 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <div className="font-medium text-white">{coin.name}</div>
                        <div className="text-sm text-gray-400">{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">${coin.current_price.toLocaleString()}</div>
                      <div className={`${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
                        {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
                {loading && <div className="text-gray-400 text-sm">Loading market data…</div>}
                {error && <div className="text-red-400 text-sm">{error}</div>}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default UserMarketSection;