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
        { nama: 'Peserta 1', hadir: true },
        { nama: 'Peserta 2', hadir: true },
        { nama: 'Peserta 3', hadir: true },
        { nama: 'Peserta 4', hadir: true },
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

    const total = peserta.length;
    const hadir = peserta.filter(p => p.hadir).length;
    const tidakHadir = total - hadir;
    const dragZoneRef = useRef(null);

    useEffect(() => {
        // Center stage horizontally, place near top (e.g., 60px below top)
        setStagePos({
            x: (dragZoneSize.width - 320) / 2, // 320 is the stage width
            y: 60,
        });
        // Center arrow horizontally, place below stage (e.g., 40px gap)
        setArrowPos({
            x: (dragZoneSize.width - 40) / 2, // 100 is the arrow width
            y: dragZoneSize.height / 2, // 500 is the arrow height
        });
    }, [dragZoneSize.width, dragZoneSize.height]);

    React.useEffect(() => {
        setFixatedPeserta([...peserta]);
        localStorage.setItem('peserta', JSON.stringify(peserta));
        localStorage.setItem('fixatedPeserta', JSON.stringify(fixatedPeserta));
    }, [peserta]);

    React.useEffect(() => {
        localStorage.setItem('tableSeats', JSON.stringify(tableSeats));
    }, [tableSeats]);

    React.useEffect(() => {
        localStorage.setItem('tablePositions', JSON.stringify(tablePositions));
    }, [tablePositions]);

    React.useEffect(() => {
        localStorage.setItem('dragZoneSize', JSON.stringify(dragZoneSize));
    }, [dragZoneSize]);

    React.useEffect(() => {
        setTableOrder((prev) => {
            if (meja > prev.length) {
                // Add new tables at the end
                return [...prev, ...Array.from({ length: meja - prev.length }, (_, i) => prev.length + i)];
            } else if (meja < prev.length) {
                // Remove tables from the end
                return prev.slice(0, meja);
            }
            return prev;
        });

        setTablePositions((prev) => {
            if (meja > prev.length) {
                // Add new positions
                return [...prev, ...Array.from({ length: meja - prev.length }, () => ({ x: 0, y: 0 }))];
            } else if (meja < prev.length) {
                // Remove positions
                return prev.slice(0, meja);
            }
            return prev;
        });

        setTableSeats((prev) => {
            if (meja > prev.length) {
                // Add new tables with 6 seats
                return [...prev, ...Array.from({ length: meja - prev.length }, () => 6)];
            } else if (meja < prev.length) {
                // Remove tables from the end
                return prev.slice(0, meja);
            }
            return prev;
        });

        localStorage.setItem('meja', JSON.stringify(meja));

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
                        // Convert peserta and fixated_peserta fields to array of objects
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
                            // Auto-select last saved layout if exists
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
                                    // Also set all layout states
                                    handleSelectLayout(option);
                                    // Remove from localStorage so it only auto-selects once
                                    localStorage.removeItem('lastSelectedLayoutName');
                                }
                            }
                        }
                    } else {
                        return;
                    }
                })
                .catch(async function (error) {
                    if (!error.response) {
                        // network error
                        error.errorStatus = "Error: Network Error";
                    } else {
                        error.errorStatus = error.response.data.message;
                    }
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
                result[t * 100 + s] = listHadir[idx] || null; // unique key per seat
                idx++;
            }
        }
        return result;
    }, [peserta, meja, tableSeats]);

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
        }
    };


    return (
        <div className='p-6'>
            <div className='grid grid-cols-3 gap-4 mb-6'>
                <div className='bg-blue-100 p-4 rounded shadow text-center'>
                    <h2 className='text-xl font-bold'>Total Peserta</h2>
                    <p className='text-2xl'>{total}</p>
                </div>
                <div className='bg-green-100 p-4 rounded shadow text-center'>
                    <h2 className='text-xl font-bold'>Hadir</h2>
                    <p className='text-2xl'>{hadir}</p>
                </div>
                <div className='bg-red-100 p-4 rounded shadow text-center'>
                    <h2 className='text-xl font-bold'>Tidak Hadir</h2>
                    <p className='text-2xl'>{tidakHadir}</p>
                </div>
            </div>
            <div className='flex flex-col lg:flex-row flex-wrap gap-6'>
                <div className='flex-1'>
                    <div className='flex items-center gap-3 pb-3'>
                        <span className='bg-gray-200 ml-2 text-gray-800 px-4 py-2 rounded border text-sm font-medium' style={{ minWidth: 150 }}>
                            Total Meja: {meja}
                        </span>
                        <div className="flex w-full justify-between items-center flex-col md:flex-row gap-3">
                            <div className="flex items-center h-full">
                                <span className="text-lg font-semibold">Nama Kegiatan: {eventName}</span>
                            </div>
                            <div className='flex gap-3 flex-col md:flex-row items-center w-full md:w-auto no-print'>
                                <div className="mb-2 md:mb-0" style={{ minWidth: 220 }}>
                                    <div className="mb-1 ms-1 font-normal text-sm text-gray-700 ">
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
                                <div className="mt-3 md:mb-0">
                                    <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto">
                                        <i className="bi bi-printer-fill pr-3"></i>Cetak Layout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={dragZoneRef}
                        className='relative'
                        style={{
                            minHeight: 600,
                            width: dragZoneSize.width,
                            height: dragZoneSize.height,
                            border: '1px dashed #ccc',
                            position: 'relative',
                            resize: 'none', // prevent browser default resize
                            overflow: 'auto'
                        }}
                    >
                        <div className='pt-4 pb-2 text-center'>
                            <h2 className='text-xl font-bold'><i>SEATING ARRANGEMENT</i></h2>
                        </div>
                        <div className='text-center mb-4'>
                            <h2 className='text-xl font-bold'>{eventName}</h2>
                        </div>
                        {/* Static Stage */}
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
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                marginTop: 60,

                            }}
                        >
                            PANGGUNG
                        </div>
                        {/* Static Entrance Arrow */}
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
                                background: 'transparent',
                                marginTop: 25,

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
                                    minWidth: 180,
                                    minHeight: 140,
                                    zIndex: 10,
                                    left: (tablePositions[visualIndex]?.x || 0),
                                    top: (tablePositions[visualIndex]?.y || 0),
                                    marginTop: 25,
                                }}
                            >

                                {/* + and - buttons */}
                                <div className="flex justify-center items-center gap-2 mb-1 mt-6">

                                    <span className="text-sm font-medium">
                                        Kursi: {tableSeats[mejaIndex] || 6}
                                    </span>

                                </div>
                                {/* ...rest of your table rendering code... */}
                                <div className="relative flex flex-col items-center" style={{ minHeight: 120, paddingBottom: 32 }}>
                                    <h3 className="text-center font-semibold mb-2">Meja {visualIndex + 1}</h3>
                                    <div
                                        className="relative mx-auto"
                                        style={{
                                            width: 160,
                                            height: 100,
                                        }}
                                    >
                                        {/* Table circle */}
                                        <div
                                            className="absolute rounded-full bg-blue-200 border border-blue-400 shadow"
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
                                        {/* Render seats dynamically */}
                                        {(() => {
                                            const seatCount = tableSeats[mejaIndex] || 6;
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
                                                                        ? "bg-green-200 border-green-400"
                                                                        : "bg-red-200 border-red-400"
                                                                    : "bg-gray-100 border-gray-300"}
                                                                    hover:ring-2 hover:ring-blue-400`}
                                                        >
                                                            {peserta ? (
                                                                <span className="truncate max-w-[80%]">
                                                                    {idx + 1}
                                                                </span>
                                                            ) : (
                                                                "❌"
                                                            )}
                                                        </button>
                                                        {/* Tooltip on hover */}
                                                        {peserta && (
                                                            <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                                                                {peserta.nama}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}

                                    </div>

                                </div>
                                {(() => {
                                    const seatCount = tableSeats[mejaIndex] || 6;
                                    // Collect peserta for this table with seat number
                                    const pesertaTable = [];
                                    for (let idx = 0; idx < seatCount; idx++) {
                                        const peserta = arrangedPeserta[mejaIndex * 100 + idx];
                                        if (peserta) pesertaTable.push({ nama: peserta.nama, seat: idx });
                                    }
                                    // Split into two columns
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


                <div className='w-full flex-shrink-0' style={{ pageBreakBefore: 'always' }}>
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className='text-lg font-semibold'>Daftar Peserta</h2>
                    </div>
                    <div className="flex gap-5 flex-wrap">
                        {Array.from({ length: Math.ceil(peserta.length / 15) }).map((_, colIdx) => (
                            <div key={colIdx} className="space-y-3 min-w-[220px]">
                                {peserta.slice(colIdx * 15, (colIdx + 1) * 15).map((p, index) => {
                                    const realIndex = colIdx * 15 + index;
                                    return (
                                        <div key={realIndex} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                            <p
                                                type='text'
                                                className='flex-grow rounded px-2 py-1 text-sm min-w-[200px]'
                                            >{p.nama}</p>
                                            {/* Status tampil saja, tidak bisa diubah, tidak ada tombol hapus */}
                                            <span
                                                className={`text-xs px-2 py-1 rounded font-semibold
                                ${p.hadir
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                                style={{
                                                    minWidth: 60,
                                                    textAlign: 'center',
                                                    backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca', // pastel green or pastel red
                                                    color: p.hadir ? '#166534' : '#991b1b'
                                                }}
                                            >
                                                {p.hadir ? 'Hadir' : 'Tidak'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function ViewerWithFooter() {
    return (
        <>
            <header className="w-full flex items-center justify-between px-6 bg-blue-700 text-white shadow rounded-b-lg">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <a href="#" class="d-flex pt-4 justify-content-center mb-4">
                        <img src={logo_tni_au} alt="" width="50"></img>
                        {/* <img src={logo_kpl} alt="" width="100"></img> */}
                    </a>
                    <span className="text-2xl font-semibold tracking-wide">Seating Arrangement System</span>
                </div>
                <div className="flex items-center gap-4 no-print">
                    <span className="text-lg font-normal">
                        Selamat datang, {localStorage.getItem('username') || 'User'}!
                    </span>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = "/";
                        }}

                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-normal transition"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <Viewer />
            <footer className="w-full text-center py-4 text-gray-500 text-xs mt-8">
                &copy; Disinfolahtaau {new Date().getFullYear()} Seating Arrangement System. All rights reserved.
            </footer>
        </>
    );
}
