'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOrders } from '@/lib/firestore';
import { Users, Mail, Phone, ShoppingBag, Calendar, Search, MapPin, TrendingUp, CreditCard } from 'lucide-react';
import { Card, Input } from '@/components/ui';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const orders = await getOrders(user.uid);
        
        // Extract unique customers from orders
        const customerMap = {};
        orders.forEach(order => {
          if (!customerMap[order.customerPhone]) {
            customerMap[order.customerPhone] = {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.customerAddress,
              totalOrders: 1,
              totalSpent: parseFloat(order.total || 0),
              lastOrderAt: order.createdAt,
            };
          } else {
            customerMap[order.customerPhone].totalOrders += 1;
            customerMap[order.customerPhone].totalSpent += parseFloat(order.total || 0);
          }
        });

        setCustomers(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [user]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customer Database</h1>
          <p className="text-sm text-slate-500 font-medium">Analyze and manage your shop's shopper base</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card title={customers.length} subtitle="Registered Users" icon={Users} className="border-l-4 border-l-purple-500 shadow-sm" />
         <Card 
           title={`৳${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}`} 
           subtitle="Total Lifetime Value" 
           icon={TrendingUp} 
           className="border-l-4 border-l-blue-500 shadow-sm" 
         />
         <Card 
           title={customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0) : 0} 
           subtitle="Avg. Order Value" 
           icon={CreditCard} 
           className="border-l-4 border-l-green-500 shadow-sm" 
         />
      </div>

      <div className="bg-white border border-slate-100 p-2 rounded-2xl flex items-center gap-3 shadow-sm">
        <div className="pl-4 text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Filter by name or contact number..." 
          className="bg-transparent border-none outline-none w-full py-3 text-sm font-bold text-slate-700 placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4 shadowed-loader"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Processing Customer Records...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white py-24 text-center border-dashed border-2 border-slate-100 rounded-3xl">
           <Users size={48} className="mx-auto mb-6 text-slate-200" />
           <p className="text-xl font-black text-slate-900">No Customers Linked</p>
           <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium leading-relaxed">As soon as sales are recorded, your customer database will start populating automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <div className="col-span-4">Customer profile</div>
             <div className="col-span-2 text-center">Engagement</div>
             <div className="col-span-2 text-right">Total Revenue</div>
             <div className="col-span-4 text-right">Primary Address</div>
          </div>
          
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.phone} className="bg-white p-6 flex flex-col md:grid md:grid-cols-12 items-center gap-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
                <div className="col-span-4 flex items-center gap-5 w-full">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-purple-600 font-black text-lg border border-slate-100 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    {customer.name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-purple-600 transition-colors uppercase">{customer.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                       <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-bold"><Phone size={12} className="text-purple-500"/> {customer.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-center">
                   <div className="inline-flex items-center px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 border border-slate-100 uppercase tracking-widest">
                      {customer.totalOrders} Orders
                   </div>
                </div>
                
                <div className="col-span-2 text-right w-full">
                   <p className="text-xl font-black text-slate-900 leading-none">৳{customer.totalSpent.toLocaleString()}</p>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Life Value</p>
                </div>

                <div className="col-span-4 text-right w-full flex items-start justify-end gap-2 text-slate-500">
                   <MapPin size={14} className="mt-0.5 shrink-0 text-slate-300" />
                   <p className="text-[11px] font-medium leading-relaxed max-w-[240px] truncate md:whitespace-normal italic text-slate-400">{customer.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
