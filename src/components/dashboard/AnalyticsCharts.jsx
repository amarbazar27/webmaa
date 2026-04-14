'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '@/components/ui';

const COLORS = ['#9333EA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsCharts({ orders = [] }) {
  
  // Parse orderIdVisual: "01#14042026"
  const processSalesData = () => {
    const dailySales = {};

    // Orders are usually descending from DB
    orders.forEach(order => {
      let dateString = "Unknown";
      if (order.orderIdVisual && order.orderIdVisual.includes('#')) {
        const parts = order.orderIdVisual.split('#');
        if (parts.length > 1) {
          const rawDate = parts[1]; // e.g. "14042026"
          if (rawDate.length === 8) {
            const dd = rawDate.slice(0, 2);
            const mm = rawDate.slice(2, 4);
            const yyyy = rawDate.slice(4, 8);
            dateString = `${dd}/${mm}/${yyyy}`;
          }
        }
      }

      if (dateString !== "Unknown") {
         if (!dailySales[dateString]) dailySales[dateString] = 0;
         dailySales[dateString] += parseFloat(order.total) || 0;
      }
    });

    const result = Object.keys(dailySales).map(date => ({
      name: date,
      sales: dailySales[date]
    }));
    
    // Reverse to show oldest first (chronological left to right)
    return result.reverse(); 
  };

  const salesData = useMemo(() => processSalesData(), [orders]);

  // Aggregate Top Products from orders
  const processTopProducts = () => {
     const productCount = {};
     orders.forEach(order => {
        if (order.items) {
           order.items.forEach(item => {
              if (item.name) {
                 productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
              }
           });
        }
     });

     return Object.keys(productCount)
       .map(key => ({ name: key, value: productCount[key] }))
       .sort((a, b) => b.value - a.value)
       .slice(0, 5);
  };

  const topProductsData = useMemo(() => processTopProducts(), [orders]);

  if (orders.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
       {/* Sales Trend Chart */}
       <Card title="Revenue Trends" subtitle="Sales volume based on order dates" className="overflow-hidden border border-slate-200 shadow-sm bg-white">
         <div className="h-64 mt-4 text-xs font-bold text-slate-600">
           {salesData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                 <RechartsTooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                   cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                   formatter={(value) => [`৳${value}`, 'Sales']}
                 />
                 <Line type="monotone" dataKey="sales" stroke="#9333EA" strokeWidth={3} dot={{ r: 4, fill: '#9333EA', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} animationDuration={1500} />
               </LineChart>
             </ResponsiveContainer>
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400">Not enough date data</div>
           )}
         </div>
       </Card>

       {/* Top Products Chart */}
       <Card title="Top Selling Items" subtitle="Most popular products by volume" className="border border-slate-200 shadow-sm bg-white">
         <div className="h-64 mt-4 text-xs font-bold text-slate-600">
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No product sales yet</div>
            )}
         </div>
       </Card>
    </div>
  );
}
