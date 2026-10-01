import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, LineChart, Line
} from 'recharts';
import { Cloud, Sun, CloudRain } from 'lucide-react';

const dataBar = [
    { name: '2015', uv: 30, pv: 40 },
    { name: '2016', uv: 50, pv: 30 },
    { name: '2017', uv: 70, pv: 90 },
    { name: '2018', uv: 60, pv: 50 },
];

const Dashboard = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Top Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'VOTANTES REGISTRADOS', val: '1,245', sub: 'Total general' },
                    { title: 'AVANCE META', val: '45%', sub: 'Progreso mensual', chart: true },
                    { title: 'MESAS HABILITADAS', val: '58', sub: 'En funcionamiento' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded shadow flex flex-col justify-between h-32 relative hover:shadow-lg transition-shadow border-l-4 border-[#00B894]">
                        <div>
                            <h3 className="text-[#00B894] font-bold uppercase text-sm mb-1">{stat.title}</h3>
                            <p className="text-gray-400 text-xs mb-2">{stat.sub}</p>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl text-gray-800 font-light">{stat.val}</span>
                            {stat.chart && (
                                <div className="absolute right-4 top-4">
                                    <div className="w-12 h-12 rounded-full border-[6px] border-[#00B894] border-t-transparent border-l-transparent rotate-45 opacity-80"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column (2/3 width) - Charts */}
                <div className="col-span-2 space-y-6">
                    {/* Bar Chart Section */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-[#00B894] font-bold uppercase text-sm mb-4">ESTADÍSTICAS DE VOTACIÓN POR AÑO</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataBar}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="pv" fill="#00B894" barSize={30} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="uv" fill="#2D3436" barSize={30} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex space-x-8 mt-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-4 bg-[#00B894] rounded-sm"></div>
                                <div className="text-xs">
                                    <p className="font-bold">PARTICIPACIÓN</p>
                                    <p className="text-gray-400">Alto Flujo</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-4 bg-[#2D3436] rounded-sm"></div>
                                <div className="text-xs">
                                    <p className="font-bold">ABSTENCIÓN</p>
                                    <p className="text-gray-400">Bajo Flujo</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-[#00B894] font-bold uppercase text-sm mb-4">COBERTURA GEOGRÁFICA</h3>
                        <div className="h-48 bg-emerald-50 rounded flex items-center justify-center relative overflow-hidden border border-emerald-100">
                            {/* Simplified World Map Placeholder */}
                            <svg viewBox="0 0 100 50" className="w-full h-full text-[#00B894] fill-current opacity-60">
                                <path d="M20,10 Q30,5 40,10 T60,10 T80,15 T90,30" stroke="none" />
                                <circle cx="25" cy="25" r="2" fill="#2D3436" />
                                <circle cx="50" cy="20" r="2" fill="#2D3436" />
                                <circle cx="75" cy="30" r="2" fill="#2D3436" />
                            </svg>
                            {/* Map Markers Text */}
                            <div className="absolute bottom-2 left-4 text-xs flex space-x-4">
                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#2D3436] mr-1"></span> Norte</div>
                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#2D3436] mr-1"></span> Centro</div>
                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#2D3436] mr-1"></span> Sur</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3 width) - Pyramid & Line Chart */}
                <div className="space-y-6">
                    {/* Pyramid Chart Placeholder */}
                    <div className="bg-white p-6 rounded shadow h-auto">
                        <h3 className="text-[#00B894] font-bold uppercase text-sm mb-4">DEMOGRAFÍA</h3>
                        <div className="flex flex-col items-center justify-center h-48 space-y-1 relative">
                            {/* CSS Pyramid */}
                            <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-[#1B5E20] relative opacity-90">
                                <div className="absolute top-[30px] -left-[30px] w-[60px] h-[30px] bg-[#2E7D32]" />
                                <div className="absolute top-[60px] -left-[45px] w-[90px] h-[30px] bg-[#00B894]" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-bold pt-8 shadow-sm">
                                <span className="drop-shadow-md">20%</span>
                                <span className="mt-2 drop-shadow-md">30%</span>
                                <span className="mt-2 drop-shadow-md">50%</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-xs font-semibold">
                            <div className="flex items-center"><span className="text-[#00B894] mr-2">▶</span> Jóvenes (18-28)</div>
                            <div className="flex items-center"><span className="text-[#2E7D32] mr-2">▶</span> Adultos (29-59)</div>
                            <div className="flex items-center"><span className="text-[#1B5E20] mr-2">▶</span> Mayores (60+)</div>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-[#00B894] font-bold uppercase text-sm mb-4">TENDENCIA DIARIA</h3>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dataBar}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="uv" stroke="#00B894" strokeWidth={3} dot={{ r: 4, fill: '#00B894', stroke: '#fff', strokeWidth: 2 }} />
                                    <Line type="monotone" dataKey="pv" stroke="#2D3436" strokeWidth={3} dot={{ r: 4, fill: '#2D3436', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weather Widgets */}
                    <div className="bg-white p-4 rounded shadow flex justify-between items-center bg-gray-50 border border-gray-100">
                        <div className="text-center">
                            <Cloud className="mx-auto text-[#00B894]" />
                            <span className="block font-bold text-xl mt-1 text-gray-700">20°C</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400">BOGOTÁ</span>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                            <CloudRain className="mx-auto text-[#00B894] w-4" />
                            <span className="block mt-1">18°C</span>
                            <span className="text-gray-400">MED</span>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                            <Sun className="mx-auto text-[#00B894] w-4" />
                            <span className="block mt-1">28°C</span>
                            <span className="text-gray-400">CAL</span>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                            <Cloud className="mx-auto text-[#00B894] w-4" />
                            <span className="block mt-1">24°C</span>
                            <span className="text-gray-400">BARR</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
