import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Select from 'react-select';
import { useAuth } from "../hooks/useAuth";
import logo_tni_au from "../images/Lambang_TNI_AU.png";

const Viewer = () => {
    const navigate = useNavigate();
    const { isViewer } = useAuth();

    const data = [
        { nama: 'Peserta 1', hadir: true, rank: "" },
        { nama: 'Peserta 2', hadir: true, rank: "" },
        { nama: 'Peserta 3', hadir: true, rank: "" },
        { nama: 'Peserta 4', hadir: true, rank: "" },
    ];

    const [meja, setMeja] = useState('');
    const [peserta, setPeserta] = useState(data);
    const [fixatedPeserta, setFixatedPeserta] = useState('');
    const [tableOrder, setTableOrder] = useState(Array.from({ length: meja }, (_, i) => i));
    const [tableSeats, setTableSeats] = useState('');
    const [tablePositions, setTablePositions] = useState('');
    const [dragZoneSize, setDragZoneSize] = useState({ width: 1800, height: 600 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [arrowPos, setArrowPos] = useState({ x: 0, y: 0 });
    const [eventName, setEventName] = useState('');
    const [layoutName, setLayoutName] = useState('');
    const [layouts, setLayouts] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [tableShape, setTableShape] = useState([]); // 'circle' or 'rectangle'

    const total = peserta.length;
    const hadir = peserta.filter(p => p.hadir).length;
    const tidakHadir = total - hadir;
    const dragZoneRef = useRef(null);

    useEffect(() => {
        setStagePos({
            x: (dragZoneSize.width - 320) / 2,
            y: 60,
        });
        setArrowPos({
            x: (dragZoneSize.width - 40) / 2,
            y: dragZoneSize.height / 2,
        });
    }, [dragZoneSize.width, dragZoneSize.height]);

    React.useEffect(() => {
        setFixatedPeserta([...peserta]);
    }, [peserta]);

    React.useEffect(() => {
        setTableOrder((prev) => {
            if (meja > prev.length) {
                return [...prev, ...Array.from({ length: meja - prev.length }, (_, i) => prev.length + i)];
            } else if (meja < prev.length) {
                return prev.slice(0, meja);
            }
            return prev;
        });

        setTablePositions((prev) => {
            if (meja > prev.length) {
                return [...prev, ...Array.from({ length: meja - prev.length }, () => ({ x: 0, y: 0 }))];
            } else if (meja < prev.length) {
                return prev.slice(0, meja);
            }
            return prev;
        });

        setTableSeats((prev) => {
            if (meja > prev.length) {
                return [...prev, ...Array.from({ length: meja - prev.length }, () => 6)];
            } else if (meja < prev.length) {
                return prev.slice(0, meja);
            }
            return prev;
        });
    }, [meja]);

    React.useEffect(() => {
        const token = localStorage.getItem("token");
        const id = localStorage.getItem("id");
        function verifikasi(id, token) {
            axios
                .post(`${process.env.REACT_APP_BACKEND}/api/verify`, {
                    token: token,
                })
                .then(function (response) {
                    if (response.status == 200 && id == response.data[0].user_id && (isViewer)) {
                        return;
                    } else {
                        navigate("/");
                    }
                })
                .catch(function (error) {
                    navigate("/");
                });
        }

        function getLayout() {
            axios
                .get(`${process.env.REACT_APP_BACKEND}/api/getLayout`)
                .then(function (response) {
                    if (response.status == 200) {
                        const layouts = response.data;
                        setLayouts(layouts);
                        if (layouts && layouts.length > 0) {
                            setOptions(
                                layouts.map((layout, idx) => ({
                                    value: layout.id || idx,
                                    label: layout.name,
                                    layoutData: layout,
                                }))
                            );
                            const lastName = localStorage.getItem('lastSelectedLayoutName');
                            if (lastName) {
                                const found = layouts.find(l => l.name === lastName);
                                if (found) {
                                    const option = {
                                        value: found.id || layouts.indexOf(found),
                                        label: found.name,
                                        layoutData: found,
                                    };
                                    setSelectedOption(option);
                                    handleSelectLayout(option);
                                    localStorage.removeItem('lastSelectedLayoutName');
                                }
                            }
                        }
                    } else {
                        return;
                    }
                })
                .catch(async function (error) {
                    // ignore
                });
        }

        verifikasi(id, token);
        getLayout();
    }, []);

    const handlePrint = () => window.print();

    const arrangedPeserta = React.useMemo(() => {
        const result = [];
        const listHadir = peserta.filter(p => p.hadir);
        let idx = 0;
        for (let t = 0; t < meja; t++) {
            for (let s = 0; s < (tableSeats[t] || 6); s++) {
                result[t * 100 + s] = listHadir[idx] || null;
                idx++;
            }
        }
        return result;
    }, [peserta, meja, tableSeats]);

    const pesertaByTable = React.useMemo(() => {
        const result = Array.from({ length: meja }, () => []);
        for (let t = 0; t < meja; t++) {
            const seatCount = tableSeats[t] || 6;
            for (let s = 0; s < seatCount; s++) {
                const peserta = arrangedPeserta[t * 100 + s];
                if (peserta) result[t].push({ ...peserta, seat: s });
            }
        }
        return result;
    }, [arrangedPeserta, meja, tableSeats]);

    const handleSelectLayout = (option) => {
        setSelectedOption(option);
        if (option && option.layoutData) {
            const layout = option.layoutData;
            setLayoutName(layout.name || '');
            setEventName(layout.event_name || '');
            setMeja(Number(layout.table) || 0);
            setPeserta(layout.peserta || []);
            setFixatedPeserta(layout.fixated_peserta || []);
            setTableSeats(layout.seat || []);
            setTablePositions(layout.position_table || []);
            setDragZoneSize(layout.dragzone_size || { width: 1800, height: 600 });
            setStagePos(layout.position_stage || { x: 0, y: 0 });
            setArrowPos(layout.position_arrow || { x: 0, y: 0 });
            setTableShape(layout.table_shape || []);
        }
    };

    // --- RANK COLOR LOGIC (copy from Dashboard) ---
    const RANKS = [
        { name: "Bintang 4", color: "#FFD700" },
        { name: "Bintang 3", color: "#FFB300" },
        { name: "Bintang 2", color: "#FF8C00" },
        { name: "Bintang 1", color: "#FF7043" },
        { name: "Pamen", color: "#7ED957" },
        { name: "Pama", color: "#38BDF8" },
        { name: "Bintara", color: "#a6a3a2" },
        { name: "Tamtama", color: "#F87171" },
        { name: "PIA", color: "#F472B6" },
        { name: "TNI AL", color: "#4279ad" },
        { name: "TNI AD", color: "#75946c" },
        { name: "Purnawirawan Bintang 4", color: "#FFE066" },
        { name: "Purnawirawan Bintang 3", color: "#FFD180" },
        { name: "Purnawirawan Bintang 2", color: "#FFAB91" },
        { name: "Purnawirawan Bintang 1", color: "#FFCCBC" },
        { name: "Purnawirawan Pamen", color: "#BBF7D0" },
    ];
    const getRankColor = (rank) => {
        const found = RANKS.find(r => r.name === rank);
        return found ? found.color : "#fff";
    };

    return (
        <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                {/* Total Peserta */}
                <div className='relative bg-blue-300 p-4 rounded text-center overflow-hidden'>
                    {/* Abstract fun pattern, spread on all corners */}
                    <svg
                        width="120"
                        height="120"
                        className="absolute left-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.35 }}
                    >
                        <circle cx="36" cy="36" r="28" fill="#fff" />
                        <rect x="70" y="12" width="32" height="32" rx="10" fill="#60a5fa" />
                        <ellipse cx="90" cy="100" rx="16" ry="8" fill="#3b82f6" />
                        <polygon points="100,10 110,40 80,30" fill="#2563eb" opacity="0.7" />
                        <circle cx="100" cy="60" r="8" fill="#bae6fd" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute right-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.25 }}
                    >
                        <ellipse cx="60" cy="20" rx="18" ry="10" fill="#60a5fa" />
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#fff" />
                        <circle cx="70" cy="60" r="10" fill="#3b82f6" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute left-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.22 }}
                    >
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#bae6fd" />
                        <ellipse cx="60" cy="60" rx="14" ry="8" fill="#fff" />
                        <circle cx="20" cy="20" r="12" fill="#2563eb" opacity="0.6" />
                    </svg>
                    <svg
                        width="60"
                        height="60"
                        className="absolute right-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.18 }}
                    >
                        <ellipse cx="40" cy="40" rx="14" ry="8" fill="#3b82f6" />
                        <rect x="10" y="10" width="20" height="10" rx="4" fill="#fff" />
                    </svg>
                    <h2 className='text-xl font-bold relative z-10'>Peserta</h2>
                    <p className='text-2xl relative z-10'>{total}</p>
                </div>
                {/* Hadir */}
                <div className='relative bg-green-300 p-4 rounded text-center overflow-hidden'>
                    <svg
                        width="120"
                        height="120"
                        className="absolute left-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.35 }}
                    >
                        <rect x="12" y="12" width="36" height="36" rx="12" fill="#fff" />
                        <circle cx="100" cy="36" r="20" fill="#bbf7d0" />
                        <ellipse cx="70" cy="100" rx="20" ry="10" fill="#22c55e" />
                        <polygon points="60,10 80,40 40,30" fill="#4ade80" opacity="0.7" />
                        <circle cx="100" cy="80" r="10" fill="#bbf7d0" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute right-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.25 }}
                    >
                        <ellipse cx="60" cy="20" rx="18" ry="10" fill="#bbf7d0" />
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#fff" />
                        <circle cx="70" cy="60" r="10" fill="#22c55e" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute left-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.22 }}
                    >
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#bbf7d0" />
                        <ellipse cx="60" cy="60" rx="14" ry="8" fill="#fff" />
                        <circle cx="20" cy="20" r="12" fill="#4ade80" opacity="0.6" />
                    </svg>
                    <svg
                        width="60"
                        height="60"
                        className="absolute right-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.18 }}
                    >
                        <ellipse cx="40" cy="40" rx="14" ry="8" fill="#22c55e" />
                        <rect x="10" y="10" width="20" height="10" rx="4" fill="#fff" />
                    </svg>
                    <h2 className='text-xl font-bold relative z-10'>Hadir</h2>
                    <p className='text-2xl relative z-10'>{hadir}</p>
                </div>
                {/* Tidak Hadir */}
                <div className='relative bg-red-300 p-4 rounded text-center overflow-hidden'>
                    <svg
                        width="120"
                        height="120"
                        className="absolute left-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.35 }}
                    >
                        <ellipse cx="36" cy="36" rx="22" ry="14" fill="#fff" />
                        <rect x="70" y="12" width="32" height="32" rx="10" fill="#fecaca" />
                        <circle cx="100" cy="100" r="16" fill="#ef4444" />
                        <polygon points="100,10 110,40 80,30" fill="#f87171" opacity="0.7" />
                        <circle cx="100" cy="60" r="8" fill="#fecaca" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute right-0 top-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.25 }}
                    >
                        <ellipse cx="60" cy="20" rx="18" ry="10" fill="#fecaca" />
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#fff" />
                        <circle cx="70" cy="60" r="10" fill="#ef4444" />
                    </svg>
                    <svg
                        width="80"
                        height="80"
                        className="absolute left-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.22 }}
                    >
                        <rect x="10" y="40" width="30" height="18" rx="6" fill="#fecaca" />
                        <ellipse cx="60" cy="60" rx="14" ry="8" fill="#fff" />
                        <circle cx="20" cy="20" r="12" fill="#f87171" opacity="0.6" />
                    </svg>
                    <svg
                        width="60"
                        height="60"
                        className="absolute right-0 bottom-0 pointer-events-none"
                        style={{ zIndex: 0, opacity: 0.18 }}
                    >
                        <ellipse cx="40" cy="40" rx="14" ry="8" fill="#ef4444" />
                        <rect x="10" y="10" width="20" height="10" rx="4" fill="#fff" />
                    </svg>
                    <h2 className='text-xl font-bold relative z-10'>Tidak Hadir</h2>
                    <p className='text-2xl relative z-10'>{tidakHadir}</p>
                </div>
            </div>
            <div className='flex flex-col gap-6 lg:flex-row flex-wrap '>
                <div className='flex-1'>
                    <div className="flex w-full justify-between items-center flex-col md:flex-row gap-3">
                        <div className=' flex items-center gap-3 py-3'>
                            <span className='no-print bg-gray-200 ml-2 text-gray-800 px-4 py-2 rounded border text-sm font-medium'>
                                Total Meja: {meja}
                            </span>
                        </div>
                        <div className="no-print flex flex-col md:flex-row gap-3 w-full md:w-auto mb-2">
                            <div className="flex flex-col md:flex-row gap-3 w-full">
                                <div style={{ minWidth: 320 }}>
                                    <div className="mb-1 ms-1 font-normal text-sm text-gray-700">
                                        Pilih layout yang tersimpan pada database
                                    </div>
                                    <Select
                                        options={options}
                                        value={selectedOption}
                                        onChange={handleSelectLayout}
                                        placeholder="Pilih layout"
                                        isClearable
                                        getOptionLabel={option => option.label}
                                        getOptionValue={option => option.value}
                                        styles={{
                                            container: base => ({ ...base, minWidth: 220 }),
                                            menu: base => ({ ...base, zIndex: 9999 }),
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full mt-3 md:mt-6">
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                                >
                                    <i className="bi bi-printer-fill pr-3"></i>Cetak Layout
                                </button>
                            </div>
                        </div>
                    </div>
                    <div><div className='pt-4 pb-2 text-center'>
                        <h2 className='text-xl font-bold'><i>SEATING ARRANGEMENT</i></h2>
                    </div>
                        <div className='text-center'>
                            <h2 className='text-xl font-bold'>{eventName}</h2>
                        </div></div>
                    <div
                        className="print-scale-zone"
                        style={{
                            width: "100%",
                            maxWidth: dragZoneSize.width,
                            height: dragZoneSize.height,
                            margin: "0 auto",
                            overflowX: "auto",
                        }}
                    >
                        <div
                            ref={dragZoneRef}
                            className='relative print:bg-none dragzone-print-scale'
                            style={{
                                minHeight: 400,
                                minWidth: 320,
                                width: "100%",
                                maxWidth: dragZoneSize.width,
                                height: dragZoneSize.height,
                                position: 'relative',
                                resize: 'none',
                                overflow: 'auto',
                                boxSizing: 'border-box',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 10px 10px'
                            }}
                        >
                            <div
                                style={{
                                    width: 320,
                                    height: 60,
                                    background: '#444',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    position: 'absolute',
                                    zIndex: 20,
                                    left: stagePos.x,
                                    top: stagePos.y,
                                }}
                            >
                                PANGGUNG
                            </div>
                            <div
                                style={{
                                    width: 40,
                                    height: 60,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'absolute',
                                    zIndex: 20,
                                    left: arrowPos.x,
                                    top: arrowPos.y,
                                    background: 'transparent'
                                }}
                            >
                                <svg width="100" height="300" viewBox="0 0 100 500">
                                    <rect x="35" y="60" width="30" height="370" fill="#111" />
                                    <polygon points="50,0 95,100 70,100 70,430 30,430 30,100 5,100" fill="#111" />
                                </svg>
                            </div>
                            {tableOrder.map((mejaIndex, visualIndex) => (
                                <div
                                    key={mejaIndex}
                                    className={`absolute`}
                                    style={{
                                        minWidth: tableShape[mejaIndex] === 'rectangle' ? 200 : 180,
                                        minHeight: 140,
                                        zIndex: 10,
                                        width: tableShape[mejaIndex] === 'rectangle' ? 260 : 140,
                                        left: (tablePositions[visualIndex]?.x || 0),
                                        top: (tablePositions[visualIndex]?.y || 0),
                                    }}
                                >
                                    <div className="relative flex flex-col items-center" style={{ minHeight: 120, paddingBottom: 32 }}>
                                        <h3 className="text-center font-semibold mb-2">Meja {visualIndex + 1}</h3>
                                        <div
                                            className="relative mx-auto"
                                            style={{
                                                width: 160,
                                                height: 100,
                                            }}
                                        >
                                            {tableShape[mejaIndex] === 'circle' ? (
                                                <div
                                                    className="absolute rounded-full bg-gray-200 border border-blue-400"
                                                    style={{
                                                        width: 70,
                                                        height: 70,
                                                        left: 45,
                                                        top: 15,
                                                        zIndex: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "bold",
                                                        fontSize: 18,
                                                    }}
                                                >
                                                    {visualIndex + 1}
                                                </div>
                                            ) : (
                                                <div
                                                    className="absolute bg-gray-200 border border-blue-400"
                                                    style={{
                                                        width: 180,
                                                        height: 60,
                                                        left: 0,
                                                        top: 25,
                                                        zIndex: 1,
                                                        borderRadius: 8,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "bold",
                                                        fontSize: 18,
                                                    }}
                                                >
                                                    {visualIndex + 1}
                                                </div>
                                            )}
                                            {/* Render seats dynamically */}
                                            {(() => {
                                                const seatCount = tableSeats[mejaIndex] || 6;
                                                if (tableShape[mejaIndex] === 'circle') {
                                                    return Array.from({ length: seatCount }).map((_, idx) => {
                                                        const angle = (idx / (seatCount - 1 || 1)) * Math.PI;
                                                        const radius = 65;
                                                        const seatSize = 36;
                                                        const centerX = 80;
                                                        const centerY = 50;
                                                        const left = centerX + radius * Math.cos(angle) - seatSize / 2;
                                                        const top = centerY + radius * Math.sin(angle) - seatSize / 2;
                                                        const peserta = arrangedPeserta[mejaIndex * 100 + idx];

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="absolute group"
                                                                style={{
                                                                    left,
                                                                    top,
                                                                    width: seatSize,
                                                                    height: seatSize,
                                                                    zIndex: 2,
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={`w-full h-full rounded-full border flex items-center justify-center text-xs font-medium transition
                                                                        ${peserta
                                                                            ? peserta.hadir
                                                                                ? "border-green-400"
                                                                                : "border-red-400"
                                                                            : "border-gray-300"}
                                                                        hover:ring-2 hover:ring-blue-400`}
                                                                    style={{
                                                                        backgroundColor: peserta ? getRankColor(peserta.rank) : "#f3f4f6"
                                                                    }}
                                                                    disabled
                                                                >
                                                                    {peserta ? (
                                                                        <span className="truncate max-w-[80%]">
                                                                            {idx + 1}
                                                                        </span>
                                                                    ) : (
                                                                        "❌"
                                                                    )}
                                                                </button>
                                                                {peserta && (
                                                                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                                                                        {peserta.nama}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                } else {
                                                    const seatSize = 32;
                                                    const tableWidth = 180;
                                                    const offsetX = 0;
                                                    const offsetY = 25;
                                                    const rectH = 60;
                                                    return Array.from({ length: seatCount }).map((_, idx) => {
                                                        const left = offsetX + ((tableWidth / (seatCount + 1)) * (idx + 1)) - seatSize / 2;
                                                        const top = offsetY + rectH + 8;
                                                        const peserta = arrangedPeserta[mejaIndex * 100 + idx];
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="absolute group"
                                                                style={{
                                                                    left,
                                                                    top,
                                                                    width: seatSize,
                                                                    height: seatSize,
                                                                    zIndex: 2,
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={`w-full h-full rounded-full border flex items-center justify-center text-xs font-medium transition
                                                                        ${peserta
                                                                            ? peserta.hadir
                                                                                ? "border-green-400"
                                                                                : "border-red-400"
                                                                            : "border-gray-300"}
                                                                        hover:ring-2 hover:ring-blue-400`}
                                                                    style={{
                                                                        backgroundColor: peserta ? getRankColor(peserta.rank) : "#f3f4f6"
                                                                    }}
                                                                    disabled
                                                                >
                                                                    {peserta ? (
                                                                        <span className="truncate max-w-[80%]">
                                                                            {idx + 1}
                                                                        </span>
                                                                    ) : (
                                                                        "❌"
                                                                    )}
                                                                </button>
                                                                {peserta && (
                                                                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                                                                        {peserta.nama}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                }
                                            })()}
                                        </div>
                                    </div>
                                    {(() => {
                                        const seatCount = tableSeats[mejaIndex] || 6;
                                        const pesertaTable = [];
                                        for (let idx = 0; idx < seatCount; idx++) {
                                            const peserta = arrangedPeserta[mejaIndex * 100 + idx];
                                            if (peserta) pesertaTable.push({ nama: peserta.nama, seat: idx });
                                        }
                                        const mid = Math.ceil(pesertaTable.length / 2);
                                        const col1 = pesertaTable.slice(0, mid);
                                        const col2 = pesertaTable.slice(mid);

                                        return (
                                            <div className="w-full mt-2 flex flex-row gap-2 justify-center">
                                                <div className="flex-1 text-xs bg-gray-50 rounded p-1 min-h-[24px]">
                                                    {col1.map((p, i) => (
                                                        <div key={i} className="truncate">{p.seat + 1}. {p.nama}</div>
                                                    ))}
                                                </div>
                                                <div className="flex-1 text-xs bg-gray-50 rounded p-1 min-h-[24px]">
                                                    {col2.map((p, i) => (
                                                        <div key={i} className="truncate">{p.seat + 1}. {p.nama}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='w-full flex-shrink-0' style={{ pageBreakBefore: 'always' }}>
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className='text-lg font-semibold'>Daftar Peserta per Meja</h2>
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 flex-wrap">
                        {pesertaByTable.map((pesertaList, tIdx) => (
                            <div key={tIdx} className="space-y-3 min-w-[220px]">
                                <div className="font-bold mb-1">Meja {tIdx + 1}</div>
                                {pesertaList.length === 0 && <div className="text-xs text-gray-400">Kosong</div>}
                                {pesertaList.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                        <p className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                            style={{
                                                backgroundColor: getRankColor(p.rank),
                                                transition: 'background 0.2s'
                                            }}
                                        >{p.nama}</p>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold
                                                ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            style={{
                                                minWidth: 60,
                                                textAlign: 'center',
                                                backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                color: p.hadir ? '#166534' : '#991b1b'
                                            }}
                                        >
                                            {p.hadir ? 'Hadir' : 'Tidak'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 flex-wrap mt-12">
                        <div className="space-y-3 min-w-[220px]">
                            <div className="font-bold mb-1">Belum Tertampung</div>
                            {(() => {
                                const assigned = new Set();
                                pesertaByTable.forEach(list => list.forEach(p => assigned.add(p.nama)));
                                const belumTertampung = peserta.filter(p => p.hadir && !assigned.has(p.nama));
                                if (belumTertampung.length === 0) return <div className="text-xs text-gray-400">Kosong</div>;
                                return belumTertampung.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                        <p className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                            style={{
                                                backgroundColor: getRankColor(p.rank),
                                                transition: 'background 0.2s'
                                            }}
                                        >{p.nama}</p>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold
                                                ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            style={{
                                                minWidth: 60,
                                                textAlign: 'center',
                                                backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                color: p.hadir ? '#166534' : '#991b1b'
                                            }}
                                        >
                                            {p.hadir ? 'Hadir' : 'Tidak'}
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>
                        <div className="space-y-3 min-w-[220px]">
                            <div className="font-bold mb-1">Tidak Hadir</div>
                            {(() => {
                                const tidakHadirList = peserta.filter(p => !p.hadir);
                                if (tidakHadirList.length === 0) return <div className="text-xs text-gray-400">Kosong</div>;
                                return tidakHadirList.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                        <p className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                            style={{
                                                backgroundColor: getRankColor(p.rank),
                                                transition: 'background 0.2s'
                                            }}
                                        >{p.nama}</p>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold
                                                ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            style={{
                                                minWidth: 60,
                                                textAlign: 'center',
                                                backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                color: p.hadir ? '#166534' : '#991b1b'
                                            }}
                                        >
                                            {p.hadir ? 'Hadir' : 'Tidak'}
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function ViewerWithFooter() {
    return (
        <>
            <header
                className="w-full flex flex-col md:flex-row items-center justify-between px-2 md:px-6 text-white shadow rounded-b-lg"
                style={{
                    background: `linear-gradient(100deg, #3b82f6 0%, #60a5fa 60%, #a5d8ff 100%)`,
                    position: 'relative',
                    overflow: 'visible',
                }}
            >
                {/* SVG pattern overlay for subtle futuristic dots */}
                <svg
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        zIndex: 0,
                        pointerEvents: "none",
                        opacity: 0.13,
                    }}
                >
                    <defs>
                        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="#fff" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
                <div className="flex items-center gap-3 z-10">
                    {/* Icon */}
                    <a href="#" className="d-flex pt-4 justify-content-center mb-4">
                        <img src={logo_tni_au} alt="" width="50" />
                    </a>
                    <span className="text-3xl font-semibold tracking-wide">SMART SEATING <sup>25</sup></span>
                </div>
                <div className="no-print flex items-center gap-4 z-10">

                    {/* Dropdown for Tutorial and Logout */}
                    <div className="dropdown">
                        <button
                            className="btn dropdown-toggle"
                            type="button"
                            id="dropdownMenuButton"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <span className="text-lg font-normal">
                                Selamat datang, {localStorage.getItem('username') || 'User'}!
                            </span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">

                            <li>
                                <button
                                    className="dropdown-item text-danger"
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.href = "/";
                                    }}
                                >
                                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

            <div>

                <Viewer />

                <footer className="w-full text-center py-4 text-gray-500 text-xs mt-8">
                    &copy; Disinfolahtaau {new Date().getFullYear()} Smart Seating 25: Seating Arrangement System. All rights reserved.
                </footer>
            </div>
        </>
    );
}