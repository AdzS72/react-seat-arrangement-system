import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Select from 'react-select';
import { useAuth } from "../hooks/useAuth";
import logo_tni_au from "../images/Lambang_TNI_AU.png";
import bg from "../images/bg_login.jpg";

const Dashboard = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const data = [
        { nama: 'Peserta 1', hadir: true, rank: "" },
        { nama: 'Peserta 2', hadir: true, rank: "" },
        { nama: 'Peserta 3', hadir: true, rank: "" },
        { nama: 'Peserta 4', hadir: true, rank: "" },
    ];

    const RANKS = [
        { name: "Bintang 4", color: "#FFD700" },      // Gold
        { name: "Bintang 3", color: "#FFB300" },      // Vivid Orange-Yellow
        { name: "Bintang 2", color: "#FF8C00" },      // Dark Orange
        { name: "Bintang 1", color: "#FF7043" },      // Coral
        { name: "Pamen", color: "#7ED957" },          // Soft Green
        { name: "Pama", color: "#38BDF8" },           // Sky Blue
        { name: "Bintara", color: "#a6a3a2" },        // Light Purple
        { name: "Tamtama", color: "#F87171" },        // Light Red
        { name: "PIA", color: "#F472B6" },            // Pink
        { name: "TNI AL", color: "#4279ad" },         // Light Blue
        { name: "TNI AD", color: "#75946c" },         // Light Green
        { name: "Purnawirawan Bintang 4", color: "#FFE066" }, // Lighter Gold
        { name: "Purnawirawan Bintang 3", color: "#FFD180" }, // Lighter Orange-Yellow
        { name: "Purnawirawan Bintang 2", color: "#FFAB91" }, // Lighter Orange
        { name: "Purnawirawan Bintang 1", color: "#FFCCBC" }, // Lighter Coral
        { name: "Purnawirawan Pamen", color: "#BBF7D0" },     // Lighter Soft Green
    ];

    const ItemTypes = { PESERTA: 'peserta' };
    const SPECIAL_LISTS = {
        BELUM_TERTAMPUNG: 'belum_tertampung',
        TIDAK_HADIR: 'tidak_hadir',
    };

    const [meja, setMeja] = useState(0);
    const [peserta, setPeserta] = useState(data);
    const [fixatedPeserta, setFixatedPeserta] = useState('');
    const [tableOrder, setTableOrder] = useState(Array.from({ length: meja }, (_, i) => i));
    const [tableSeats, setTableSeats] = useState('');
    const [selectedTables, setSelectedTables] = useState([]);
    const [tablePositions, setTablePositions] = useState('');
    const [dragZoneSize, setDragZoneSize] = useState({ width: 1800, height: 600 });
    const [prevDragZoneSize, setPrevDragZoneSize] = useState({ width: 1800, height: 600 });
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [arrowPos, setArrowPos] = useState({ x: 0, y: 0 });
    const [eventName, setEventName] = useState('');
    const [layoutName, setLayoutName] = useState('');
    const [layouts, setLayouts] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [successAlert, setSuccessAlert] = useState(false);
    const [error, setError] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [tableShape, setTableShape] = useState([]); // 'circle' or 'rectangle'
    const [seatAssignments, setSeatAssignments] = useState([]); // [ [pesertaIndex, ...], ...] per table

    const total = peserta.length;
    const hadir = peserta.filter(p => p.hadir).length;
    const tidakHadir = total - hadir;
    const dragZoneRef = useRef(null);
    const isResizing = useRef(false);

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

    useEffect(() => {
        // Only scale if any item would overflow the new drag zone
        const STAGE_WIDTH = 320;
        const STAGE_HEIGHT = 60;
        const ARROW_WIDTH = 40;
        const ARROW_HEIGHT = 60;
        const TABLE_MIN_WIDTH = 140; // adjust if your table is wider
        const TABLE_MIN_HEIGHT = 140;

        function willOverflow() {
            // Check tables
            if (Array.isArray(tablePositions)) {
                for (let i = 0; i < tablePositions.length; i++) {
                    const pos = tablePositions[i];
                    if (!pos) continue;
                    const width = tableShape[i] === 'rectangle' ? 260 : TABLE_MIN_WIDTH;
                    const height = TABLE_MIN_HEIGHT;
                    if (
                        pos.x < 0 ||
                        pos.y < 0 ||
                        pos.x + width > dragZoneSize.width ||
                        pos.y + height > dragZoneSize.height
                    ) {
                        return true;
                    }
                }
            }
            // Check stage
            if (
                stagePos.x < 0 ||
                stagePos.y < 0 ||
                stagePos.x + STAGE_WIDTH > dragZoneSize.width ||
                stagePos.y + STAGE_HEIGHT > dragZoneSize.height
            ) {
                return true;
            }
            // Check arrow
            if (
                arrowPos.x < 0 ||
                arrowPos.y < 0 ||
                arrowPos.x + ARROW_WIDTH > dragZoneSize.width ||
                arrowPos.y + ARROW_HEIGHT > dragZoneSize.height
            ) {
                return true;
            }
            return false;
        }

        if (
            (prevDragZoneSize.width !== dragZoneSize.width ||
                prevDragZoneSize.height !== dragZoneSize.height) &&
            willOverflow()
        ) {
            const scaleX = dragZoneSize.width / prevDragZoneSize.width;
            const scaleY = dragZoneSize.height / prevDragZoneSize.height;

            setTablePositions(prev =>
                prev.map((pos, i) => ({
                    x: Math.round((pos?.x || 0) * scaleX),
                    y: Math.round((pos?.y || 0) * scaleY),
                }))
            );
            setStagePos(prev => ({
                x: Math.round((prev?.x || 0) * scaleX),
                y: Math.round((prev?.y || 0) * scaleY),
            }));
            setArrowPos(prev => ({
                x: Math.round((prev?.x || 0) * scaleX),
                y: Math.round((prev?.y || 0) * scaleY),
            }));
        }
        setPrevDragZoneSize({ ...dragZoneSize });
        // eslint-disable-next-line
    }, [dragZoneSize]);

    useEffect(() => {
        // Only center horizontally if width changes
        if (prevDragZoneSize.width !== dragZoneSize.width && Array.isArray(tablePositions) && tablePositions.length > 0) {
            // Get bounding box of all tables
            let minX = Infinity, maxX = -Infinity;
            tablePositions.forEach((pos, i) => {
                if (!pos) return;
                const width = tableShape[i] === 'rectangle' ? 260 : 140;
                minX = Math.min(minX, pos.x);
                maxX = Math.max(maxX, pos.x + width);
            });
            // If no valid tables, skip
            if (minX === Infinity || maxX === -Infinity) return;

            const tablesWidth = maxX - minX;
            const zoneWidth = dragZoneSize.width;

            // Only center if tables fit in the zone
            if (tablesWidth < zoneWidth) {
                const offsetX = (zoneWidth - tablesWidth) / 2 - minX;
                setTablePositions(prev =>
                    prev.map((pos, i) => ({
                        x: (pos?.x || 0) + offsetX,
                        y: pos?.y || 0,
                    }))
                );
            }
            // If tablesWidth > zoneWidth, do nothing (let scroll handle it)
        }
        setPrevDragZoneSize({ ...dragZoneSize });
        // eslint-disable-next-line
    }, [dragZoneSize.width]);

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

        setTableShape((prev) => {
            if (meja > prev.length) {
                // Default new tables to 'circle'
                return [...prev, ...Array.from({ length: meja - prev.length }, () => 'circle')];
            } else if (meja < prev.length) {
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
                    if (response.status == 200 && id == response.data[0].user_id && (isAdmin)) {
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
                        console.log("Layouts fetched successfully:", layouts);
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

        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const maxWidth = window.innerWidth - dragZoneRef.current.getBoundingClientRect().left - 50; // 32px for some margin
            setDragZoneSize(prev => ({
                width: Math.min(Math.max(600, e.clientX - dragZoneRef.current.getBoundingClientRect().left), maxWidth),
                height: Math.max(400, e.clientY - dragZoneRef.current.getBoundingClientRect().top)
            }));
        };
        const handleMouseUp = () => { isResizing.current = false; };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        verifikasi(id, token);
        getLayout();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

        };
    }, []);

    const getRankColor = (rank) => {
        const found = RANKS.find(r => r.name === rank);
        return found ? found.color : "#fff";
    };

    const RankSelector = ({ value, onChange }) => {
        const [open, setOpen] = useState(false);
        const ref = useRef();

        // Close dropdown on outside click
        useEffect(() => {
            if (!open) return;
            const handleClick = (e) => {
                if (ref.current && !ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, [open]);

        // Group ranks for display
        const bintangRanks = RANKS.filter(r => r.name.startsWith("Bintang"));
        const purnBintangRanks = RANKS.filter(r => r.name.startsWith("Purnawirawan Bintang"));
        const purnPamenRanks = RANKS.filter(r => r.name === "Purnawirawan Pamen");
        const pamenBelow = RANKS.filter(r =>
            !r.name.startsWith("Bintang") &&
            !r.name.startsWith("Purnawirawan Bintang") &&
            r.name !== "Purnawirawan Pamen" &&
            r.name !== "PIA" &&
            r.name !== "TNI AL" &&
            r.name !== "TNI AD"
        );
        const otherRanks = RANKS.filter(r =>
            !r.name.startsWith("Bintang") &&
            !r.name.startsWith("Purnawirawan Bintang") &&
            r.name !== "Pamen" &&
            r.name !== "Purnawirawan Pamen" &&
            r.name !== "Pama" &&
            r.name !== "Bintara" &&
            r.name !== "Tamtama"
        );

        return (
            <div className="relative inline-block" ref={ref}>
                <div
                    className="w-6 h-6 rounded cursor-pointer border flex items-center justify-center"
                    style={{ background: getRankColor(value) }}
                    onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                    title={value || "Pilih Pangkat"}
                >
                    {value ? value.split(" ")[0][0] : "?"}
                </div>
                {open && (
                    <div
                        className="absolute z-50 bg-white border rounded shadow-lg mt-1 left-0 flex gap-4 p-2"
                        style={{ minWidth: 320 }}
                    >
                        {/* Bintang */}
                        <div>
                            <div className="font-semibold text-xs mb-1" style={{ minWidth: 120 }}>Bintang</div>
                            {bintangRanks.map(rank => (
                                <div
                                    key={rank.name}
                                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                                    onClick={() => { onChange(rank.name); setOpen(false); }}
                                >
                                    <span className="w-4 h-4 rounded" style={{ background: rank.color }}></span>
                                    <span>{rank.name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Purnawirawan Bintang */}
                        <div>
                            <div className="font-semibold text-xs mb-1" style={{ minWidth: 140 }}>Purnawirawan</div>
                            {purnBintangRanks.map(rank => (
                                <div
                                    key={rank.name}
                                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                                    onClick={() => { onChange(rank.name); setOpen(false); }}
                                >
                                    <span className="w-4 h-4 rounded" style={{ background: rank.color }}></span>
                                    <span>{rank.name.replace("Purnawirawan ", "")}</span>
                                </div>
                            ))}
                            {purnPamenRanks.map(rank => (
                                <div
                                    key={rank.name}
                                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                                    onClick={() => { onChange(rank.name); setOpen(false); }}
                                >
                                    <span className="w-4 h-4 rounded" style={{ background: rank.color }}></span>
                                    <span>{rank.name.replace("Purnawirawan ", "")}</span>
                                </div>
                            ))}
                        </div>
                        {/* Pamen & Purnawirawan Pamen */}
                        <div>
                            <div className="font-semibold text-xs mb-1">Pamen Ke Bawah</div>
                            {pamenBelow.map(rank => (
                                <div
                                    key={rank.name}
                                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                                    onClick={() => { onChange(rank.name); setOpen(false); }}
                                >
                                    <span className="w-4 h-4 rounded" style={{ background: rank.color }}></span>
                                    <span>{rank.name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Other */}
                        <div>
                            <div className="font-semibold text-xs mb-1">Lainnya</div>
                            {otherRanks.map(rank => (
                                <div
                                    key={rank.name}
                                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                                    onClick={() => { onChange(rank.name); setOpen(false); }}
                                >
                                    <span className="w-4 h-4 rounded" style={{ background: rank.color }}></span>
                                    <span>{rank.name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Hapus */}
                        <div className="bottom-1 left-1 right-1 text-center ">
                            <div
                                className="px-2 py-1 text-xs text-gray-400 cursor-pointer hover:bg-gray-100 rounded"
                                onClick={() => { onChange(""); setOpen(false); }}
                            >
                                Hapus Pangkat
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleChangeRank = (index, rank) => {
        const updated = [...peserta];
        updated[index].rank = rank;
        setPeserta(updated);
    };

    const handleKurangiMeja = () => {
        setMeja(prev => {
            if (prev > 1) {
                setTableShape(shape => shape.slice(0, prev - 1));
                return prev - 1;
            } else if (prev === 1) {
                setTableShape([]);
                return 0;
            }
            return 0;
        });
    };

    const handlePrint = () => window.print();

    const handleTambahPeserta = () => {
        setPeserta([...peserta, { nama: `Peserta ${peserta.length + 1}`, hadir: true }]);
        setFixatedPeserta([...fixatedPeserta, { nama: `Peserta ${fixatedPeserta.length + 1}`, hadir: true }]);
    };

    const handleChangeEventName = (text) => {
        setEventName(text);
        localStorage.setItem('eventName', text);
    };

    const handleChangeLayoutName = (text) => {
        setLayoutName(text);
    };

    const handleAddSeat = (tableIdx) => {
        setTableSeats((prev) => {
            const updated = [...prev];
            updated[tableIdx] = Math.min(updated[tableIdx] + 1, 12); // max 12 seats
            return updated;
        });
    };

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

    useEffect(() => {
        // Only assign hadir peserta
        const hadirPeserta = peserta.filter(p => p.hadir);
        let idx = 0;
        const assignments = [];
        for (let t = 0; t < meja; t++) {
            const seats = tableSeats[t] || 6;
            assignments[t] = [];
            for (let s = 0; s < seats; s++) {
                assignments[t][s] = hadirPeserta[idx] ? peserta.indexOf(hadirPeserta[idx]) : null;
                idx++;
            }
        }
        setSeatAssignments(assignments);
    }, [peserta, meja, tableSeats]);

    const arrangedPeserta = React.useMemo(() => {
        // Flatten seatAssignments to a map: [table*100+seat] = peserta object
        const result = [];
        for (let t = 0; t < seatAssignments.length; t++) {
            for (let s = 0; s < (seatAssignments[t]?.length || 0); s++) {
                const pesertaIdx = seatAssignments[t][s];
                result[t * 100 + s] = pesertaIdx !== null && pesertaIdx !== undefined ? peserta[pesertaIdx] : null;
            }
        }
        return result;
    }, [seatAssignments, peserta]);

    const pesertaByTable = React.useMemo(() => {
        const result = Array.from({ length: meja }, () => []);
        for (let t = 0; t < meja; t++) {
            for (let s = 0; s < (seatAssignments[t]?.length || 0); s++) {
                const pesertaIdx = seatAssignments[t][s];
                if (pesertaIdx !== null && pesertaIdx !== undefined && peserta[pesertaIdx]) {
                    result[t].push({ ...peserta[pesertaIdx], seat: s });
                }
            }
        }
        return result;
    }, [seatAssignments, peserta, meja]);

    const handleGantiNama = (index, value) => {
        const updated = [...peserta];
        updated[index].nama = value;
        setPeserta(updated);
    };

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

    const handleSaveLayout = async (event) => {
        event.preventDefault();
        if (!layoutName) {
            setError("Nama layout tidak boleh kosong");
            setTimeout(() => setError(null), 3000);
            return;
        }
        const payload = {
            name: layoutName,
            event_name: eventName,
            table: meja,
            peserta: peserta,
            fixated_peserta: fixatedPeserta,
            seat: tableSeats,
            position_table: tablePositions,
            dragzone_size: dragZoneSize,
            position_stage: stagePos,
            position_arrow: arrowPos,
            table_shape: tableShape,
        };

        try {
            // Check if layout name already exists
            const existingLayout = Array.isArray(layouts) ? layouts.find(l => l.name === layoutName) : null;

            let response;
            if (existingLayout) {
                // Update existing layout
                response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}/api/updateLayout`,
                    payload
                );
                if (response.data.message === "Layout berhasil diupdate") {
                    setSuccessAlert(true);
                    setTimeout(() => setSuccessAlert(false), 3000);
                    // Save last selected layout name for auto-select after reload
                    localStorage.setItem('lastSelectedLayoutName', layoutName);
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    setError("Gagal mengupdate layout");
                    setTimeout(() => setError(null), 3000);
                }
            } else {
                // Save new layout
                response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}/api/saveLayout`,
                    payload
                );
                if (response.data.message === "Layout berhasil disimpan") {
                    setSuccessAlert(true);
                    setTimeout(() => setSuccessAlert(false), 3000);
                    localStorage.setItem('lastSelectedLayoutName', layoutName);
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    setError("Gagal menyimpan layout");
                    setTimeout(() => setError(null), 3000);
                }
            }
        } catch (error) {
            console.error("Error saving layout:", error);
            setError("Gagal menyimpan layout");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDeleteLayout = async () => {
        if (!selectedOption || !selectedOption.layoutData) {
            setError("Pilih layout yang ingin dihapus.");
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (!window.confirm(`Yakin ingin menghapus layout "${selectedOption.label}"?`)) return;
        try {
            const id = selectedOption.layoutData.id;
            // If your backend expects an id, use it; otherwise, send the name
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}/api/deleteLayout`,
                { name: selectedOption.label }
            );
            if (response.data.message === "Layout berhasil dihapus") {
                setSuccessAlert(true);
                setTimeout(() => setSuccessAlert(false), 3000);
                // Remove from local state
                setLayouts(prev => prev.filter(l => (l.id || l.name) !== (id || selectedOption.label)));
                setSelectedOption(null);
                setLayoutName('');
                setEventName('');
                setMeja(0);
                setPeserta([]);
                setFixatedPeserta([]);
                setTableSeats([]);
                setTablePositions([]);
                setDragZoneSize({ width: 1800, height: 600 });
                setStagePos({ x: 0, y: 0 });
                setArrowPos({ x: 0, y: 0 });
                // Refresh options
                setOptions(prev => prev.filter(opt => opt.value !== selectedOption.value));
            } else {
                setError("Gagal menghapus layout");
                setTimeout(() => setError(null), 3000);
            }
        } catch (error) {
            setError("Gagal menghapus layout");
            setTimeout(() => setError(null), 3000);
        }
    };

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

    const handleTambahMejaCircle = () => {
        setMeja(prev => prev + 1);
        setTableShape(prev => [...prev, 'circle']);
        setShowDropdown(false);
    };

    const handleTambahMejaRectangle = () => {
        setMeja(prev => prev + 1);
        setTableShape(prev => [...prev, 'rectangle']);
        setShowDropdown(false);
    };

    function PesertaRow({ peserta, index, tableIdx, listType, movePeserta, children }) {
        const ref = React.useRef(null);

        const [, drop] = useDrop({
            accept: ItemTypes.PESERTA,
            hover(item) {
                // Only move if not the same position
                if (
                    item.tableIdx !== tableIdx ||
                    item.index !== index ||
                    item.listType !== listType
                ) {
                    movePeserta(item.tableIdx, item.index, tableIdx, index, item.listType, listType);
                    item.tableIdx = tableIdx;
                    item.index = index;
                    item.listType = listType;
                }
            },
        });

        const [{ isDragging }, drag] = useDrag({
            type: ItemTypes.PESERTA,
            item: { index, tableIdx, listType },
            collect: monitor => ({
                isDragging: monitor.isDragging(),
            }),
        });

        drag(drop(ref));

        return (
            <div
                ref={ref}
                style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
                className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm"
            >
                {children}
            </div>
        );
    }

    const movePeserta = (
        fromTableIdx,
        fromIdx,
        toTableIdx,
        toIdx,
        fromListType,
        toListType
    ) => {
        setPeserta(prevPeserta => {
            let peserta = [...prevPeserta];

            // Helper to get peserta index in main array
            const getPesertaIdx = (listType, tableIdx, idx) => {
                if (listType === SPECIAL_LISTS.BELUM_TERTAMPUNG) {
                    // Peserta hadir not assigned to any table
                    const assigned = new Set();
                    pesertaByTable.forEach(list => list.forEach(p => assigned.add(p.nama)));
                    const belumTertampung = peserta.filter(p => p.hadir && !assigned.has(p.nama));
                    return peserta.findIndex(p => p.nama === belumTertampung[idx]?.nama);
                }
                if (listType === SPECIAL_LISTS.TIDAK_HADIR) {
                    const tidakHadirList = peserta.filter(p => !p.hadir);
                    return peserta.findIndex(p => p.nama === tidakHadirList[idx]?.nama);
                }
                // Table
                const p = pesertaByTable[tableIdx]?.[idx];
                return peserta.findIndex(x => x.nama === p?.nama);
            };

            const fromPesertaIdx = getPesertaIdx(fromListType, fromTableIdx, fromIdx);
            if (fromPesertaIdx === -1) return peserta;

            // Remove from old location
            const [movedPeserta] = peserta.splice(fromPesertaIdx, 1);

            // Insert into new location
            if (toListType === SPECIAL_LISTS.BELUM_TERTAMPUNG) {
                // Insert before the toIdx-th belum tertampung
                const assigned = new Set();
                pesertaByTable.forEach(list => list.forEach(p => assigned.add(p.nama)));
                const belumTertampung = peserta.filter(p => p.hadir && !assigned.has(p.nama));
                const targetPeserta = belumTertampung[toIdx];
                const insertIdx = targetPeserta
                    ? peserta.findIndex(p => p.nama === targetPeserta.nama)
                    : peserta.length;
                peserta.splice(insertIdx, 0, movedPeserta);
            } else if (toListType === SPECIAL_LISTS.TIDAK_HADIR) {
                // Insert before the toIdx-th tidak hadir
                const tidakHadirList = peserta.filter(p => !p.hadir);
                const targetPeserta = tidakHadirList[toIdx];
                const insertIdx = targetPeserta
                    ? peserta.findIndex(p => p.nama === targetPeserta.nama)
                    : peserta.length;
                peserta.splice(insertIdx, 0, movedPeserta);
            } else {
                // Table: insert before the toIdx-th peserta in that table
                // Find the peserta in that table
                const p = pesertaByTable[toTableIdx]?.[toIdx];
                const insertIdx = p
                    ? peserta.findIndex(x => x.nama === p.nama)
                    : peserta.length;
                peserta.splice(insertIdx, 0, movedPeserta);
            }
            return peserta;
        });
    };


    return (
        // <DndProvider backend={HTML5Backend}>
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

                            <div class="dropdown no-print">
                                <button className="dropdown-toggle no-print btn btn-primary text-white px-4 py-2 text-base md:text-m"
                                    style={{ minWidth: 44, minHeight: 44 }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Tambah Meja
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" onClick={handleTambahMejaCircle}>Meja Bulat</a></li>
                                    <li><a class="dropdown-item" onClick={handleTambahMejaRectangle}>Meja Persegi</a></li>
                                </ul>
                            </div>
                            <button
                                onClick={handleKurangiMeja}
                                className="no-print btn btn-primary text-white px-4 py-2 text-base md:text-m"
                                style={{ minWidth: 44, minHeight: 44 }} // Minimum touch target
                            >
                                Kurangi Meja
                            </button>
                            <span className='bg-gray-200 ml-2 text-gray-800 px-4 py-2 rounded border text-sm font-medium'>
                                Total Meja: {meja}
                            </span>
                        </div>

                        <div className=' flex items-center gap-3 text-sm'>
                            {successAlert && (
                                <div class="alert alert-success" role="alert">
                                    Data Berhasil Disimpan!
                                </div>
                            )}
                            {error && (
                                <div class="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
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
                                {/* Input for new layout name */}
                                <div style={{ minWidth: 300 }}>
                                    <div className="mb-1 ms-1 font-normal text-sm text-gray-700">
                                        Nama Layout
                                    </div>
                                    <input
                                        type="text"
                                        value={layoutName}
                                        onChange={e => handleChangeLayoutName(e.target.value)}
                                        className="form-control border rounded px-3 py-2 text-sm w-full"
                                        placeholder="Masukkan nama layout"
                                        styles={{
                                            container: base => ({ ...base, minWidth: 220 }),
                                            menu: base => ({ ...base, zIndex: 9999 }),
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Responsive action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full mt-3 md:mt-6">
                                <button
                                    onClick={handleSaveLayout}
                                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex-1"
                                >
                                    <i className="bi bi-floppy-fill pr-3"></i>Simpan Layout
                                </button>
                                <button
                                    onClick={handleDeleteLayout}
                                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                                    disabled={!selectedOption}
                                >
                                    <i className="bi bi-trash-fill pr-3"></i>Hapus Layout
                                </button>
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
                            width: "100%", // Responsive width
                            maxWidth: dragZoneSize.width,
                            height: dragZoneSize.height,
                            margin: "0 auto",
                            overflowX: "auto", // Allow horizontal scroll on small screens
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
                                border: '1px dashed #ccc',
                                position: 'relative',
                                resize: 'none',
                                overflow: 'auto',
                                boxSizing: 'border-box',
                                backgroundImage: `radial-gradient(#bbb 1px, transparent 1px), radial-gradient(#bbb 1px, transparent 1px)`,
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 10px 10px'
                            }}
                        >

                            {/* Draggable Stage */}
                            <Draggable
                                position={stagePos}
                                onStop={(e, data) => setStagePos({ x: data.x, y: data.y })}
                                bounds="parent"
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
                                        cursor: 'move',
                                        // boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    PANGGUNG
                                </div>
                            </Draggable>

                            {/* Draggable Entrance Arrow */}
                            <Draggable
                                position={arrowPos}
                                onStop={(e, data) => setArrowPos({ x: data.x, y: data.y })}
                                bounds="parent"
                            >
                                <div
                                    style={{
                                        width: 40,
                                        height: 60,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'absolute',
                                        zIndex: 20,
                                        cursor: 'move',
                                        background: 'transparent'
                                    }}
                                >
                                    {/* Large Black Arrow with Long Body */}
                                    <svg width="100" height="300" viewBox="0 0 100 500">
                                        {/* Arrow body */}
                                        <rect x="35" y="60" width="30" height="370" fill="#111" />
                                        {/* Arrow head */}
                                        <polygon points="50,0 95,100 70,100 70,430 30,430 30,100 5,100" fill="#111" />
                                    </svg>
                                </div>
                            </Draggable>

                            {tableOrder.map((mejaIndex, visualIndex) => (
                                <Draggable
                                    key={mejaIndex}
                                    position={tablePositions[visualIndex] || { x: 0, y: 0 }}
                                    onDrag={(e, data) => handleMultiDrag(visualIndex, mejaIndex, e, data)}
                                    bounds="parent"
                                >
                                    <div
                                        className={`absolute ${selectedTables.includes(mejaIndex) ? 'ring-2 ring-blue-500' : ''}`}
                                        style={{
                                            minWidth: tableShape[mejaIndex] === 'rectangle' ? 200 : 180,
                                            minHeight: 140,
                                            zIndex: 10,
                                            width: tableShape[mejaIndex] === 'rectangle' ? 260 : 140,
                                        }}
                                        onClick={e => handleSelectTable(mejaIndex, e)}
                                    >
                                        {/* Checkbox for selection */}
                                        <div className="no-print absolute left-2 top-2 z-20">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                                                className="no-print bg-red-500 text-white rounded px-2 py-1 text-xs font-bold hover:bg-red-700"
                                                title="Kurangi Kursi"
                                            >−</button>
                                            <span className="text-sm font-medium">
                                                Kursi: {tableSeats[mejaIndex] || 6}
                                            </span>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleAddSeat(mejaIndex); }}
                                                className="no-print bg-green-500 text-white rounded px-2 py-1 text-xs font-bold hover:bg-green-700"
                                                title="Tambah Kursi"
                                            >+</button>
                                        </div>
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
                                                    // Rectangle table
                                                    <div
                                                        className="absolute bg-gray-200 border border-blue-400"
                                                        style={{
                                                            width: 180, // make table longer
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
                                                                        onClick={() => {
                                                                            if (peserta) {
                                                                                const pesertaIndex = fixatedPeserta.findIndex(
                                                                                    p => p && p.nama === peserta.nama
                                                                                );
                                                                                if (pesertaIndex !== -1) {
                                                                                    toggleHadir(pesertaIndex);
                                                                                }
                                                                            }
                                                                        }}
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
                                                    } else {
                                                        // Rectangle: distribute seats on left, right, and bottom sides only
                                                        const seatCount = tableSeats[mejaIndex] || 6;
                                                        const seatSize = 32;
                                                        const tableWidth = 180;
                                                        const offsetX = 0;
                                                        const offsetY = 25;
                                                        const rectH = 60;
                                                        return Array.from({ length: seatCount }).map((_, idx) => {
                                                            // Evenly distribute seats along the bottom
                                                            const left = offsetX + ((tableWidth / (seatCount + 1)) * (idx + 1)) - seatSize / 2;
                                                            const top = offsetY + rectH + 8; // 8px gap below table
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
                                                                        onClick={() => {
                                                                            if (peserta) {
                                                                                const pesertaIndex = fixatedPeserta.findIndex(
                                                                                    p => p && p.nama === peserta.nama
                                                                                );
                                                                                if (pesertaIndex !== -1) {
                                                                                    toggleHadir(pesertaIndex);
                                                                                }
                                                                            }
                                                                        }}
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
                                                    }
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
                                    <path d="M2 16h12M6 12h8M10 8h4" stroke="#888" strokeWidth="2" fill="none" />
                                </svg>
                            </div>
                        </div></div>


                </div>

                <div className='w-full flex-shrink-0' style={{ pageBreakBefore: 'always' }}>
                    <div className="space-y-3 mb-3" >
                        <span className="text-lg font-semibold">Nama Kegiatan: </span>
                    </div>
                    <div className="space-y-3" >
                        <textarea type='text' value={eventName} onChange={e => handleChangeEventName(e.target.value)} className="form-control flex-grow border rounded px-2 py-1 text-sm w-full"
                            style={{ resize: "vertical" }} />
                    </div>
                </div>
                <div className='w-full flex-shrink-0' >
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className='text-lg font-semibold'>Daftar Peserta per Meja</h2>
                        <button onClick={handleTambahPeserta} className='no-print bg-blue-500 text-white px-3 py-1 rounded hover:btn btn-primary'>
                            + Tambah
                        </button>
                    </div>
                    {/* Per Meja tables */}
                    <div className="flex flex-col md:flex-row gap-5 flex-wrap overflow-x-auto">
                        {pesertaByTable.map((pesertaList, tIdx) => (
                            <div key={tIdx} className="space-y-3 min-w-[220px]">
                                <div className="font-bold mb-1">Meja {tIdx + 1}</div>
                                {pesertaList.length === 0 && <div className="text-xs text-gray-400">Kosong</div>}
                                {pesertaList.map((p, idx) => (
                                    <PesertaRow
                                        key={idx}
                                        peserta={p}
                                        index={idx}
                                        tableIdx={tIdx}
                                        listType={tIdx}
                                        movePeserta={movePeserta}
                                    >
                                        <div ><i class="bi bi-grip-vertical"></i></div>
                                        <p>{idx + 1}.</p>
                                        {/* Rank box */}
                                        <RankSelector
                                            value={p.rank}
                                            onChange={rank => handleChangeRank(peserta.findIndex(x => x.nama === p.nama), rank)}
                                        />
                                        <input
                                            type='text'
                                            value={p.nama}
                                            onChange={e => handleGantiNama(peserta.findIndex(x => x.nama === p.nama), e.target.value)}
                                            className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                            style={{
                                                backgroundColor: getRankColor(p.rank),
                                                transition: 'background 0.2s'
                                            }}
                                        />
                                        <button
                                            onClick={() => toggleHadir(peserta.findIndex(x => x.nama === p.nama))}
                                            className={`text-xs px-2 py-1 rounded font-semibold
        ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            style={{
                                                minWidth: 60,
                                                textAlign: 'center',
                                                backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                color: p.hadir ? '#166534' : '#991b1b'
                                            }}>
                                            {p.hadir ? 'Hadir' : 'Tidak'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const idxPeserta = peserta.findIndex(x => x.nama === p.nama);
                                                const updated = [...peserta];
                                                updated.splice(idxPeserta, 1);
                                                setPeserta(updated);
                                            }}
                                            title='Hapus Peserta'
                                            className='no-print text-red-500 hover:text-red-700 ml-1 text-sm font-bold px-2'>
                                            &times;
                                        </button>
                                    </PesertaRow>
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* Below: Belum tertampung & Tidak Hadir */}
                    <div className="flex flex-col md:flex-row gap-5 flex-wrap overflow-x-auto mt-12">
                        {/* Belum tertampung */}
                        <div className="space-y-3 min-w-[220px]">
                            <div className="font-bold mb-1">Belum Tertampung</div>
                            {(() => {
                                // Peserta hadir yang tidak tertampung di meja manapun
                                const assigned = new Set();
                                pesertaByTable.forEach(list => list.forEach(p => assigned.add(p.nama)));
                                const belumTertampung = peserta.filter(p => p.hadir && !assigned.has(p.nama));
                                if (belumTertampung.length === 0) return <div className="text-xs text-gray-400">Kosong</div>;
                                return belumTertampung.map((p, idx) => (
                                    <PesertaRow
                                        key={idx}
                                        peserta={p}
                                        index={idx}
                                        tableIdx={null}
                                        listType={SPECIAL_LISTS.BELUM_TERTAMPUNG}
                                        movePeserta={movePeserta}
                                    >

                                        <div ><i class="bi bi-grip-vertical"></i></div>
                                        <p>{idx + 1}.</p>
                                        <RankSelector
                                            value={p.rank}
                                            onChange={rank => handleChangeRank(peserta.findIndex(x => x.nama === p.nama), rank)}
                                        />
                                        <input
                                            type='text'
                                            value={p.nama}
                                            onChange={e => handleGantiNama(peserta.findIndex(x => x.nama === p.nama), e.target.value)}
                                            className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                            style={{
                                                backgroundColor: getRankColor(p.rank),
                                                transition: 'background 0.2s'
                                            }}
                                        />
                                        <button
                                            onClick={() => toggleHadir(peserta.findIndex(x => x.nama === p.nama))}
                                            className={`text-xs px-2 py-1 rounded font-semibold
                                ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            style={{
                                                minWidth: 60,
                                                textAlign: 'center',
                                                backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                color: p.hadir ? '#166534' : '#991b1b'
                                            }}>
                                            {p.hadir ? 'Hadir' : 'Tidak'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const idxPeserta = peserta.findIndex(x => x.nama === p.nama);
                                                const updated = [...peserta];
                                                updated.splice(idxPeserta, 1);
                                                setPeserta(updated);
                                            }}
                                            title='Hapus Peserta'
                                            className='no-print text-red-500 hover:text-red-700 ml-1 text-sm font-bold px-2'>
                                            &times;
                                        </button>
                                    </PesertaRow>
                                ));
                            })()}
                        </div>
                        {/* Tidak Hadir */}
                        <div className="space-y-3 min-w-[220px]">
                            <div className="font-bold mb-1">Tidak Hadir</div>
                            {(() => {
                                const tidakHadirList = peserta.filter(p => !p.hadir);
                                if (tidakHadirList.length === 0) return <div className="text-xs text-gray-400">Kosong</div>;
                                return tidakHadirList.map((p, idx) => (
                                    <PesertaRow
                                        key={idx}
                                        peserta={p}
                                        index={idx}
                                        tableIdx={null}
                                        listType={SPECIAL_LISTS.TIDAK_HADIR}
                                        movePeserta={movePeserta}
                                    >
                                        <div key={idx} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
                                            <RankSelector
                                                value={p.rank}
                                                onChange={rank => handleChangeRank(peserta.findIndex(x => x.nama === p.nama), rank)}
                                            />
                                            <input
                                                type='text'
                                                value={p.nama}
                                                onChange={e => handleGantiNama(peserta.findIndex(x => x.nama === p.nama), e.target.value)}
                                                className='flex-grow border rounded px-2 py-1 text-sm min-w-[120px]'
                                                style={{
                                                    backgroundColor: getRankColor(p.rank),
                                                    transition: 'background 0.2s'
                                                }}
                                            />
                                            <button
                                                onClick={() => toggleHadir(peserta.findIndex(x => x.nama === p.nama))}
                                                className={`text-xs px-2 py-1 rounded font-semibold
                                ${p.hadir ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                style={{
                                                    minWidth: 60,
                                                    textAlign: 'center',
                                                    backgroundColor: p.hadir ? '#bbf7d0' : '#fecaca',
                                                    color: p.hadir ? '#166534' : '#991b1b'
                                                }}>
                                                {p.hadir ? 'Hadir' : 'Tidak'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const idxPeserta = peserta.findIndex(x => x.nama === p.nama);
                                                    const updated = [...peserta];
                                                    updated.splice(idxPeserta, 1);
                                                    setPeserta(updated);
                                                }}
                                                title='Hapus Peserta'
                                                className='no-print text-red-500 hover:text-red-700 ml-1 text-sm font-bold px-2'>
                                                &times;
                                            </button>
                                        </div>
                                    </PesertaRow>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        // </DndProvider>
    );
};

export function DashboardWithFooter() {
    return (
        <>
            <header
                className="w-full flex flex-col md:flex-row items-center justify-between px-2 md:px-6 text-white shadow rounded-b-lg"
                style={{
                    background: `linear-gradient(100deg, #3b82f6 0%, #60a5fa 60%, #a5d8ff 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
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
            <DndProvider backend={HTML5Backend}>
                <Dashboard />
            </DndProvider>
            <footer className="w-full text-center py-4 text-gray-500 text-xs mt-8">
                &copy; Disinfolahtaau {new Date().getFullYear()} Smart Seating 25: Seating Arrangement System. All rights reserved.
            </footer>
        </>
    );
}
