import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '@/lib/api';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  const [trend, setTrend] = useState([]);
  const [dist, setDist] = useState([]);
  const [feeMix, setFeeMix] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    api.get('/analytics/attendance-trend').then(r => setTrend(r.data)).catch(()=>{});
    api.get('/analytics/class-distribution').then(r => setDist(r.data)).catch(()=>{});
    api.get('/analytics/fee-status').then(r => setFeeMix(r.data)).catch(()=>{});
  }, []);

  const cardCls = 'rounded-2xl border border-border bg-card p-6';

  return (
    <div>
      <div className="mb-8">
        <p className="overline">Insights</p>
        <h1 className="font-serif text-4xl mt-2">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time metrics across attendance, class strength, and fee collection.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
          <p className="overline">Attendance Trend</p>
          <h3 className="font-serif text-xl mt-1 mb-4">Last 7 days</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="present" fill="#1E3F2D" radius={[4,4,0,0]} animationDuration={1400} />
                <Bar dataKey="absent" fill="#7A1022" radius={[4,4,0,0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardCls}>
          <p className="overline">Fee Status</p>
          <h3 className="font-serif text-xl mt-1 mb-4">Paid vs Pending</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: 'Paid', value: feeMix.paid }, { name: 'Pending', value: feeMix.pending }]} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" animationDuration={1200}>
                  <Cell fill="#1E3F2D" />
                  <Cell fill="#7A1022" />
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${cardCls} mt-4`}>
        <p className="overline">Roster</p>
        <h3 className="font-serif text-xl mt-1 mb-4">Class-wise Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={dist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#C4A454" strokeWidth={3} dot={{ r: 5 }} animationDuration={1600} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
