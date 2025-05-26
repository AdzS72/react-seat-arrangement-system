import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';


export const Dashboard = () => {    
    const [peserta, setPeserta] = useState([
        { nama: 'Peserta 1', hadir: true },
        { nama: 'Peserta 2', hadir: true },
        { nama: 'Peserta 3', hadir: true },
        { nama: 'Peserta 4', hadir: true },
        // You can add more participants as needed
    ]);

    const [fixatedPeserta, setFixatedPeserta] = useState([
        { nama: 'Peserta 1', hadir: true },
        { nama: 'Peserta 2', hadir: true },
        { nama: 'Peserta 3', hadir: true },
        { nama: 'Peserta 4', hadir: true },
        // You can add more participants as needed
    ]);

    const [meja, setMeja] = useState(4);
    const [tableOrder, setTableOrder] = useState(Array.from({ length: meja }, (_, i) => i));
    const [tableSeats, setTableSeats] = useState(Array.from({ length: meja }, () => 6));
    const [selectedTables, setSelectedTables] = useState([]);

    const [dragZoneSize, setDragZoneSize] = useState({ width: 1200, height: 900 });
    const dragZoneRef = useRef(null);
    const isResizing = useRef(false);

    const total = peserta.length;
    const hadir = peserta.filter(p => p.hadir).length;
    const tidakHadir = total - hadir;

    const handleTambahMeja = () => setMeja(prev => prev + 1);
    const handleKurangiMeja = () => setMeja(prev => (prev > 1 ? prev - 1 : 1));
    const handlePrint = () => window.print();
    const handleTambahPeserta = () => {
        setPeserta([...peserta, { nama: `Peserta ${peserta.length + 1}`, hadir: true }]);
        setFixatedPeserta([...fixatedPeserta, { nama: `Peserta ${fixatedPeserta.length + 1}`, hadir: true }]);
    };

    // Track position for each table
    const [tablePositions, setTablePositions] = useState(
        Array.from({ length: meja }, () => ({ x: 0, y: 0 }))
    );

    // Update positions when meja changes
    React.useEffect(() => {
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
    }, [meja]);

    // Update seat counts when meja changes
    React.useEffect(() => {
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
    }, [meja]);

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            setDragZoneSize(prev => ({
                width: Math.max(600, e.clientX - dragZoneRef.current.getBoundingClientRect().left),
                height: Math.max(400, e.clientY - dragZoneRef.current.getBoundingClientRect().top)
            }));
        };
        const handleMouseUp = () => { isResizing.current = false; };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);


    // Update position on drag
    const handleDrag = (index, e, data) => {
        setTablePositions((prev) => {
            const updated = [...prev];
            updated[index] = { x: data.x, y: data.y };
            return updated;
        });
    };

    // Add seat to a table
    const handleAddSeat = (tableIdx) => {
        setTableSeats((prev) => {
            const updated = [...prev];
            updated[tableIdx] = Math.min(updated[tableIdx] + 1, 12); // max 12 seats
            return updated;
        });
    };

    // Remove seat from a table
    const handleRemoveSeat = (tableIdx) => {
        setTableSeats((prev) => {
            const updated = [...prev];
            updated[tableIdx] = Math.max(updated[tableIdx] - 1, 1); // min 1 seat
            return updated;
        });
    };

    const toggleHadir = index => {
        const updated = [...peserta];
        updated[index].hadir = !updated[index].hadir;
        setPeserta(updated);
    };

    // Update seatingOrder and arrangedPeserta to use tableSeats
    const seatingOrder = React.useMemo(() => {
        const order = [];
        for (let t = 0; t < meja; t++) {
            for (let s = 0; s < (tableSeats[t] || 6); s++) {
                order.push({ table: t, seat: s });
            }
        }
        return order;
    }, [meja, tableSeats]);

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

    const handleGantiNama = (index, value) => {
        const updated = [...peserta];
        updated[index].nama = value;
        setPeserta(updated);
    };

    // Multi-select handler
    const handleSelectTable = (mejaIndex, e) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedTables(prev =>
                prev.includes(mejaIndex)
                    ? prev.filter(idx => idx !== mejaIndex)
                    : [...prev, mejaIndex]
            );
        } else {
            setSelectedTables([mejaIndex]);
        }
    };

    // Multi-drag handler
    const handleMultiDrag = (visualIndex, mejaIndex, e, data) => {
        // If not selected, drag only this table
        if (!selectedTables.includes(mejaIndex)) {
            setTablePositions(prev => {
                const updated = [...prev];
                updated[visualIndex] = { x: data.x, y: data.y };
                return updated;
            });
            return;
        }
        // Calculate delta
        const deltaX = data.x - (tablePositions[visualIndex]?.x || 0);
        const deltaY = data.y - (tablePositions[visualIndex]?.y || 0);
        setTablePositions(prev =>
            prev.map((pos, idx) => {
                const idxMeja = tableOrder[idx];
                if (selectedTables.includes(idxMeja)) {
                    return {
                        x: (pos?.x || 0) + deltaX,
                        y: (pos?.y || 0) + deltaY,
                    };
                }
                return pos;
            })
        );
    };

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
    }, [meja]);

    return (
        // <DndProvider backend={HTML5Backend}>
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
                <div className='flex flex-col lg:flex-row gap-6'>
                    <div className='flex-1'>
                        <div className='mb-4 flex items-center gap-3 pb-3'>
                            <button onClick={handleTambahMeja} className='bg-blue-600 text-white mr-2 px-4 py-2 rounded hover:bg-blue-700'>
                                Tambah Meja
                            </button>
                            <button onClick={handleKurangiMeja} className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                                Kurangi Meja
                            </button>
                            <span className='bg-gray-200 ml-2 text-gray-800 px-4 py-2 rounded border text-sm font-medium'>
                                Total Meja: {meja}
                            </span>
                        </div>
                        
                        <div
                            ref={dragZoneRef}
                            className='relative'
                            style={{
                                minHeight: 600,
                                // minWidth: 600,
                                width: dragZoneSize.width,
                                height: dragZoneSize.height,
                                border: '1px dashed #ccc',
                                position: 'relative',
                                resize: 'none', // prevent browser default resize
                                overflow: 'auto'
                            }}
                        >
                        {tableOrder.map((mejaIndex, visualIndex) => (
                            <Draggable
                                key={mejaIndex}
                                position={tablePositions[visualIndex] || { x: 0, y: 0 }}
                                onDrag={(e, data) => handleMultiDrag(visualIndex, mejaIndex, e, data)}
                                bounds="parent"
                            >
                                <div
                                    className={`absolute ${selectedTables.includes(mejaIndex) ? 'ring-2 ring-blue-500' : ''}`}
                                    style={{ minWidth: 180, minHeight: 140, zIndex: 10 }}
                                    onClick={e => handleSelectTable(mejaIndex, e)}
                                >
                                    {/* Checkbox for selection */}
                                    <div className="absolute left-2 top-2 z-20">
                                        <input
                                            type="checkbox"
                                            checked={selectedTables.includes(mejaIndex)}
                                            // Toggle selection directly, ignore ctrl/meta for checkbox
                                            onChange={e => {
                                                e.stopPropagation();
                                                setSelectedTables(prev =>
                                                    prev.includes(mejaIndex)
                                                        ? prev.filter(idx => idx !== mejaIndex)
                                                        : [...prev, mejaIndex]
                                                );
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                    {/* + and - buttons */}
                                    <div className="flex justify-center items-center gap-2 mb-1 mt-6">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleRemoveSeat(mejaIndex); }}
                                            className="bg-red-500 text-white rounded px-2 py-1 text-xs font-bold hover:bg-red-700"
                                            title="Kurangi Kursi"
                                        >−</button>
                                        <span className="text-sm font-medium">
                                            Kursi: {tableSeats[mejaIndex] || 6}
                                        </span>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleAddSeat(mejaIndex); }}
                                            className="bg-green-500 text-white rounded px-2 py-1 text-xs font-bold hover:bg-green-700"
                                            title="Tambah Kursi"
                                        >+</button>
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
                                                                onClick={() => {
                                                                    if (peserta) {
                                                                        const pesertaIndex = fixatedPeserta.findIndex(
                                                                            p => fixatedPeserta && p.nama === peserta.nama
                                                                        );
                                                                        toggleHadir(pesertaIndex);
                                                                    }
                                                                }}
                                                            >
                                                                {peserta ? (
                                                                    <span className="truncate max-w-[80%]">
                                                                        {idx+1}
                                                                    </span>
                                                                ) : (
                                                                    "❌"
                                                                )}
                                                            </button>
                                                            {/* Tooltip on hover */}
                                                            {peserta && (
                                                                <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-10 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
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
                            </Draggable>
                        ))}
                        <div
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            bottom: 0,
                                            width: 24,
                                            height: 24,
                                            cursor: 'nwse-resize',
                                            zIndex: 50,
                                            background: 'rgba(0,0,0,0.05)',
                                            borderTop: '1px solid #ccc',
                                            borderLeft: '1px solid #ccc',
                                            borderBottomRightRadius: 6,
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'flex-end',
                                            userSelect: 'none'
                                        }}
                                        onMouseDown={e => {
                                            e.preventDefault();
                                            isResizing.current = true;
                                        }}
                                        title="Resize area"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18" className="opacity-40">
                                            <path d="M2 16h12M6 12h8M10 8h4" stroke="#888" strokeWidth="2" fill="none"/>
                                        </svg>
                                    </div>
                    </div>  

                        <div className="mt-6">
                            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                Cetak Layout
                            </button>
                        </div>
                    </div>
                    <div className='w-full lg:w-80 flex-shrink-0'>
                        <div className='flex justify-between items-center mb-3'>
                            <h2 className='text-lg font-semibold'>Daftar Peserta</h2>
                            <button onClick={handleTambahPeserta} className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600'>
                                + Tambah
                            </button>
                        </div>
                        <div className="space-y-3">
                            {peserta.map((p, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                    <input type='text' value={p.nama} onChange={e => handleGantiNama(index, e.target.value)} className='flex-grow border rounded px-2 py-1 text-sm' />
                                    <button onClick={() => toggleHadir(index)} className={`text-xs px-2 py-1 rounded ${p.hadir ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {p.hadir ? 'Hadir' : 'Tidak'}
                                    </button>
                                    <button onClick={() => {
                                        const updated = [...peserta];
                                        updated.splice(index, 1);
                                        setPeserta(updated);
                                    }} title='Hapus Peserta' className='text-red-500 hover:text-red-700 ml-1 text-sm font-bold px-2'> &times; </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        // </DndProvider>
    );
};
