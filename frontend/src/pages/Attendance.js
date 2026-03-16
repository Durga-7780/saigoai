import {
    AccessTime as AccessTimeIcon,
    CalendarMonth as CalendarMonthIcon,
    Check as CheckIcon,
    ChevronLeft,
    ChevronRight,
    Close as CloseIcon,
    EventAvailable as EventAvailableIcon,
    History as HistoryIcon,
    Laptop as LaptopIcon,
    Login as LoginIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { attendanceAPI, holidayAPI, requestAPI } from '../services/api';
import { getErrorMessage } from '../utils/error';

const Attendance = () => {
    const theme = useTheme();
    const { user } = useSelector((state) => state.auth);
    
    const [status, setStatus] = useState(null);
    const [monthData, setMonthData] = useState([]); // Full month attendance
    const [holidays, setHolidays] = useState([]);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(7);
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [currentLocation, setCurrentLocation] = useState(null);

    // Calculated metrics
    const [workingDays, setWorkingDays] = useState(0);
    const [monthDays, setMonthDays] = useState([]);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setCurrentLocation('Unavailable');
                }
            );
        } else {
            setCurrentLocation('Not supported');
        }
    }, []);

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            
            // Calculate start and end of selected month
            // Be careful with timezones, using local date strings for API
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0);
            
            // Format as YYYY-MM-DD
            // We use local date parts to avoid timezone shift issues when creating the string
            const formatDate = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const [statusRes, monthRes, statsRes, holidayRes, requestsRes] = await Promise.all([
                attendanceAPI.getTodayAttendance(),
                attendanceAPI.getMyAttendance({ 
                    start_date: formatDate(firstDay), 
                    end_date: formatDate(lastDay) 
                }),
                attendanceAPI.getStats({ month, year }),
                holidayAPI.getAll(),
                requestAPI.getAll({ status: 'pending' }) // Fetch pending requests first or all? The UI shows approved too. Let's fetch all relevant.
            ]);
            
            setStatus(statusRes.data);
            setMonthData(monthRes.data.records || []);
            setStats(statsRes.data);
            setHolidays(holidayRes.data || []);
            setRequests(requestsRes.data || []);
            
        } catch (error) {
            showSnackbar(getErrorMessage(error), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    // Recalculate calendar days and working days when data changes
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        let potentialWorkingDays = 0;

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const holiday = (Array.isArray(holidays) ? holidays : []).find(h => h.date.split('T')[0] === dStr);
            
            if (!isWeekend && !holiday) {
                potentialWorkingDays++;
            }
        }
        setWorkingDays(potentialWorkingDays);
        
        const displayDays = [];
        // Loop forwards to show earliest date first, as per user request
        for (let i = 1; i <= daysInMonth; i++) {
             const date = new Date(year, month, i);
             // Use local YYYY-MM-DD for comparison
             const dateStr = [
                 date.getFullYear(),
                 String(date.getMonth() + 1).padStart(2, '0'),
                 String(date.getDate()).padStart(2, '0')
             ].join('-');

             const dayOfWeek = date.getDay();
             const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
             const holiday = (Array.isArray(holidays) ? holidays : []).find(h => h.date.split('T')[0] === dateStr);
             const records = monthData.filter(r => r.date && r.date.startsWith(dateStr));
             
             let totalHours = 0;
             let firstIn = null;
             let lastOut = null;
             let status = 'Absent';
             let isLate = false;
             let sessions = [];

            if (records.length > 0) {
                records.forEach(r => {
                    totalHours += r.total_hours || 0;
                    if (r.is_late) isLate = true;
                    sessions.push({
                        start: r.check_in_time,
                        end: r.check_out_time,
                        duration: r.total_hours
                    });
                });
                
                const sorted = [...records].sort((a, b) => new Date(a.check_in_time) - new Date(b.check_in_time));
                firstIn = sorted[0].check_in_time;
                const lastRecord = sorted[sorted.length - 1];
                lastOut = lastRecord.check_out_time;
                
                status = isLate ? 'Late' : 'Present';
                
                if (isWeekend) status = 'Weekend Work';
                if (holiday) status = 'Holiday Work';
            } else {
                if (isWeekend) status = 'Week Off';
                else if (holiday) status = 'Holiday';
                else if (date > new Date()) status = '--';
            }
            
            let grossHours = 0;
            if (firstIn && lastOut) {
                const diff = new Date(lastOut) - new Date(firstIn);
                grossHours = diff / (1000 * 60 * 60);
            } else if (firstIn && !lastOut && dateStr === new Date().toISOString().split('T')[0]) {
                 // Active
                 const diff = new Date() - new Date(firstIn);
                 grossHours = diff / (1000 * 60 * 60);
            }

             displayDays.push({
                 date: date,
                 dateStr: dateStr,
                 status: status,
                 totalHours: totalHours,
                 grossHours: grossHours,
                 firstIn: firstIn,
                 lastOut: lastOut,
                 sessions: sessions,
                 holidayName: holiday ? holiday.name : null,
                 isWeekend: isWeekend
             });
        }
        
        setMonthDays(displayDays);

    }, [monthData, holidays, currentDate]);

    const handleAction = async (type) => {
        setActionLoading(true);

        try {
            const data = {
                employee_id: user.employee_id,
                [type === 'in' ? 'check_in_type' : 'check_out_type']: 'manual',
                location: { latitude: 0, longitude: 0 },
                device_info: navigator.userAgent
            };

            if (type === 'in') {
                await attendanceAPI.checkIn(data);
                showSnackbar('Checked in successfully!', 'success');
            } else {
                await attendanceAPI.checkOut(data);
                showSnackbar('Checked out successfully!', 'success');
            }
            fetchData(); // Refresh data to show new check-in/out
        } catch (error) {
            console.error(error);
            showSnackbar(getErrorMessage(error), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            await requestAPI.updateStatus(id, { status });
            showSnackbar(`Request ${status} successfully`, 'success');
            fetchData(); // Refresh list
        } catch (error) {
            showSnackbar(getErrorMessage(error), 'error');
        }
    };

    // Helper to format time
    const formatTime = (dateString) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    
    // Duration helper eg 8h 43m
    const formatDuration = (hours) => {
        if (!hours) return '-';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    const isCheckedIn = status?.checked_in && !status?.checked_out;
    
    const handleMonthChange = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    return (
        <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: theme.palette.text.primary }}>
                        Attendance
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {!isCheckedIn ? (
                        <Button
                            variant="contained"
                            disabled={actionLoading}
                            onClick={() => handleAction('in')}
                            startIcon={<LoginIcon />}
                            sx={{ 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 14px 0 rgba(102,126,234,0.5)'
                            }}
                        >
                            Check In
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="error"
                            disabled={actionLoading}
                            onClick={() => handleAction('out')}
                            startIcon={<LogoutIcon />}
                            sx={{ 
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                                boxShadow: '0 4px 14px 0 rgba(255, 65, 108, 0.5)'
                            }}
                        >
                            Check Out
                        </Button>
                    )}
                    <Chip 
                        label={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        color="primary"
                        variant="outlined"
                        sx={{ py: 2, px: 1, borderRadius: 2, fontSize: '0.9rem' }}
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Stats Row */}
                <Grid item xs={12}>
                     <Box sx={{ display: 'flex', gap: 2, mb: 2, overflowX: 'auto', pb: 1 }}>
                        <Card sx={{ minWidth: 200, flex: 1, borderRadius: 3 }} elevation={0} variant="outlined">
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">My Stats (This Month)</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                                    <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}><AccessTimeIcon fontSize="small" /></Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">{formatDuration(stats?.average_hours)}</Typography>
                                        <Typography variant="caption" color="text.secondary">Avg Hrs / Day</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                         <Card sx={{ minWidth: 200, flex: 1, borderRadius: 3 }} elevation={0} variant="outlined">
                             <CardContent>
                                 <Typography variant="caption" color="text.secondary">On Time Arrival</Typography>
                                 <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                                     <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}><EventAvailableIcon fontSize="small" /></Avatar>
                                     <Box>
                                         <Typography variant="h5" fontWeight="bold">
                                             {stats?.total_days > 0 ? Math.round(((stats.present_days - stats.late_days)/stats.total_days)*100) : 0}%
                                         </Typography>
                                         <Typography variant="caption" color="text.secondary">Punctuality</Typography>
                                     </Box>
                                 </Box>
                             </CardContent>
                         </Card>
                        <Card sx={{ minWidth: 200, flex: 1, borderRadius: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }} elevation={0}>
                            <CardContent>
                                <Typography variant="caption" color="primary.main">Working Days ({currentDate.toLocaleString('default', { month: 'short' })})</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><CalendarMonthIcon fontSize="small" /></Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" color="primary.main">{workingDays}</Typography>
                                        <Typography variant="caption" color="primary.main">Excl. Weekends/Holidays</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                     </Box>
                </Grid>



                {/* Main Content Area */}
                <Grid item xs={12}>
                    <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                                <Tab label="Attendance Log" />
                                <Tab label="Attendance Requests" />
                            </Tabs>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton size="small" onClick={() => handleMonthChange(-1)}><ChevronLeft /></IconButton>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <IconButton size="small" onClick={() => handleMonthChange(1)}><ChevronRight /></IconButton>
                            </Box>
                        </Box>

                        {tabValue === 0 && (
                            <>
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Attendance Visual</TableCell>
                                            <TableCell>Effective Hours</TableCell>
                                            <TableCell>Gross Hours</TableCell>
                                            <TableCell>Arrival</TableCell>
                                            <TableCell align="right">Log</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {monthDays
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((day) => (
                                            <TableRow key={day.dateStr} hover sx={{ bgcolor: day.status === 'Week Off' || day.status === 'Holiday' ? 'action.hover' : 'inherit' }}>
                                                <TableCell component="th" scope="row">
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {day.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                            </Typography>
                                                            {day.holidayName && (
                                                                <Chip 
                                                                    label={day.holidayName} 
                                                                    size="small" 
                                                                    color="secondary" 
                                                                    sx={{ height: 16, fontSize: '0.6rem' }} 
                                                                />
                                                            )}
                                                            {day.status === 'Week Off' && (
                                                                <Chip 
                                                                    label="W-OFF" 
                                                                    size="small" 
                                                                    sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'grey.300' }} 
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 200 }}>
                                                     {/* Attendance Visual Bar */}
                                                     {day.firstIn ? (
                                                         <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                                                             {/* A simple visual representation - mapping 8am to 8pm roughly */}
                                                             {day.sessions.map((session, idx) => {
                                                                 const start = new Date(session.start);
                                                                 const startHour = start.getHours() + start.getMinutes()/60;
                                                                 // Assume day starts at 8am and ends at 8pm (12 hours span) for visual
                                                                 // Normalized: (hour - 8) / 12 * 100
                                                                 let left = ((startHour - 8) / 12) * 100;
                                                                 if(left < 0) left = 0;
                                                                 
                                                                 let width = 0;
                                                                 if (session.end) {
                                                                     const end = new Date(session.end);
                                                                     const endHour = end.getHours() + end.getMinutes()/60;
                                                                     width = ((endHour - startHour) / 12) * 100;
                                                                 } else {
                                                                     // Active, assume until now
                                                                     const now = new Date();
                                                                     const nowHour = now.getHours() + now.getMinutes()/60;
                                                                     width = ((nowHour - startHour) / 12) * 100;
                                                                 }
                                                                 if (width < 2) width = 2; // Min width

                                                                 return (
                                                                     <Box 
                                                                         key={idx}
                                                                         sx={{ 
                                                                             position: 'absolute', 
                                                                             left: `${left}%`, 
                                                                             width: `${width}%`, 
                                                                             height: '100%', 
                                                                             bgcolor: 'primary.main',
                                                                             borderRadius: 4
                                                                         }} 
                                                                     />
                                                                 );
                                                             })}
                                                         </Box>
                                                     ) : (
                                                         <Typography variant="caption" color="text.secondary">
                                                            {day.status === 'Week Off' ? 'Weekly Off' : day.status === 'Holiday' ? 'Holiday' : day.status === '--' ? '' : 'Absent'}
                                                         </Typography>
                                                     )}
                                                </TableCell>
                                                <TableCell>
                                                    {day.totalHours > 0 ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                                                            {formatDuration(day.totalHours)}
                                                        </Box>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {day.grossHours > 0 ? formatDuration(day.grossHours) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {day.status === 'Late' ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <AccessTimeIcon color="warning" sx={{ fontSize: 16 }} />
                                                            <Typography variant="caption" color="warning.main">Late</Typography>
                                                        </Box>
                                                    ) : day.status === 'Present' ? (
                                                        <Typography variant="caption" color="success.main">On Time</Typography>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {day.firstIn && (
                                                        <Tooltip title={
                                                            <Box sx={{ p: 1 }}>
                                                                {day.sessions.map((s, i) => (
                                                                    <div key={i}>
                                                                        {formatTime(s.start)} - {s.end ? formatTime(s.end) : 'Active'} 
                                                                        ({formatDuration(s.duration || 0)})
                                                                    </div>
                                                                ))}
                                                            </Box>
                                                        }>
                                                            <IconButton size="small"><HistoryIcon fontSize="small" /></IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[7, 14, 21, 30]}
                                component="div"
                                count={monthDays.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(event, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(event) => {
                                    setRowsPerPage(parseInt(event.target.value, 10));
                                    setPage(0);
                                }}
                            />
                            </>
                        )}
                        
                        {tabValue === 1 && (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Box sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <LaptopIcon color="primary" />
                                    <Typography variant="h6">Work From Home Requests</Typography>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Request Type</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Requested On</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {requests.filter(r => r.request_type === 'work_from_home').map((req) => {
                                                // Parse reason for dates
                                                // Format: Work From Home Request\nFrom: YYYY-MM-DD\nTo: YYYY-MM-DD\nNotify: ...\nReason: ...
                                                let startDate = 'N/A';
                                                let endDate = 'N/A';
                                                let userReason = req.reason;
                                                
                                                try {
                                                    const lines = req.reason.split('\n');
                                                    const fromLine = lines.find(l => l.startsWith('From: '));
                                                    const toLine = lines.find(l => l.startsWith('To: '));
                                                    const reasonLineIndex = lines.findIndex(l => l.startsWith('Reason: '));
                                                    
                                                    if (fromLine) startDate = fromLine.replace('From: ', '');
                                                    if (toLine) endDate = toLine.replace('To: ', '');
                                                    if (reasonLineIndex !== -1) {
                                                        userReason = lines.slice(reasonLineIndex).join('\n').replace('Reason: ', '');
                                                    }
                                                } catch (e) {
                                                    console.error("Error parsing request reason", e);
                                                }

                                                // Calculate duration roughly
                                                let durationDisplay = '1 Day';
                                                if(startDate !== 'N/A' && endDate !== 'N/A') {
                                                    const d1 = new Date(startDate);
                                                    const d2 = new Date(endDate);
                                                    const diffTime = Math.abs(d2 - d1);
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                                                    durationDisplay = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
                                                }

                                                return (
                                                    <TableRow hover key={req._id || req.id}>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {startDate !== 'N/A' ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                                                                    <Typography variant="caption">{durationDisplay}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ textTransform: 'capitalize' }}>
                                                            {req.request_type.replace(/_/g, ' ')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2">
                                                                     {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </Typography>
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                     {new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ maxWidth: 300 }}>
                                                            <Tooltip title={userReason}>
                                                                <Typography variant="body2" noWrap>
                                                                    {userReason}
                                                                </Typography>
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={req.status} 
                                                                color={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'warning'} 
                                                                size="small" 
                                                                variant="outlined" 
                                                                sx={{ textTransform: 'capitalize' }}
                                                            />
                                                            {req.approver_id && (
                                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                    Approver: {req.approver_id}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {/* Show Actions for Pending Requests */}
                                                            {req.status === 'pending' && (
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <Tooltip title="Approve">
                                                                        <IconButton size="small" sx={{ color: 'success.main', bgcolor: 'success.lighter' }} onClick={() => handleRequestAction(req._id || req.id, 'approved')}>
                                                                            <CheckIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Reject">
                                                                        <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'error.lighter' }} onClick={() => handleRequestAction(req._id || req.id, 'rejected')}>
                                                                            <CloseIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            
                                            {requests.filter(r => r.request_type === 'work_from_home').length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            No Work From Home requests found.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Attendance;
