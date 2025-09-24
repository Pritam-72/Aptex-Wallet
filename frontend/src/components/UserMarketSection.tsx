import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

const UserMarketSection = () => {
  const cryptoData = [
    { name: 'Bitcoin', symbol: 'BTC', price: '$112,704.95', change: '+2.47%', changePositive: true },
    { name: 'Ethereum', symbol: 'ETH', price: '$4,234.56', change: '-1.23%', changePositive: false },
    { name: 'Solana', symbol: 'SOL', price: '$234.12', change: '+5.67%', changePositive: true },
    { name: 'Cardano', symbol: 'ADA', price: '$0.89', change: '-2.34%', changePositive: false },
    { name: 'Polkadot', symbol: 'DOT', price: '$12.45', change: '+3.21%', changePositive: true },
  ];

  return (
    <section className="py-8 px-6 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Market Cap</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">$4.0T</div>
            <div className="text-green-500 text-sm">↑ 0.1%</div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">24h Volume</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">$161.2B</div>
            <div className="text-gray-400 text-sm">Global trading volume</div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">BTC Dominance</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">56.3%</div>
            <div className="text-gray-400 text-sm">Bitcoin market share</div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bitcoin Price Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6 h-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Bitcoin Price</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>BTCUSD</span>
                  <span>1D</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-white">$112,704.95</div>
                <div className="text-green-500 text-sm">+2.47% (+$2,704.95)</div>
              </div>
              {/* Chart placeholder */}
              <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Chart visualization would go here</div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bitcoin Performance */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bitcoin Performance</h3>
              <div className="h-32 bg-gray-700/30 rounded-lg flex items-center justify-center mb-4">
                <div className="text-gray-500 text-sm">Performance chart</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">$112,704.95</div>
                <div className="text-green-500 text-sm">+2.47%</div>
              </div>
            </Card>

            {/* Fear & Greed Index */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fear & Greed Index</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">44</div>
                <div className="text-orange-500 font-medium">Fear</div>
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
                {cryptoData.map((crypto, index) => (
                  <div key={crypto.symbol} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white">{crypto.name}</div>
                        <div className="text-sm text-gray-400">{crypto.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">{crypto.price}</div>
                      <div className={`text-sm ${crypto.changePositive ? 'text-green-500' : 'text-red-500'}`}>
                        {crypto.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default UserMarketSection;