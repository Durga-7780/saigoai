/**
 * Reports Page
 * AI-powered analytics and reports for Admin/HR
 * Features advanced Chart.js visualizations
 */
import {
    Download,
    Insights,
    Refresh,
    Send
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { chatbotAPI, dashboardAPI } from '../services/api';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler // Import Filler for area charts
);


const Reports = () => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [query, setQuery] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false); // New state for PDF generation

    // Refs for Charts
    const trendChartRef = useRef(null);
    const deptChartRef = useRef(null);
    const leaveChartRef = useRef(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await dashboardAPI.getAdminStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAiQuery = async () => {
        if (!query.trim()) return;
        setAiLoading(true);
        try {
            const response = await chatbotAPI.ask({ 
                query: query,
                context: { 
                    type: 'admin_reports',
                    all_stats: stats // Pass stats to AI
                }
            });
            setAiResponse(response.data.answer);
        } catch (error) {
            console.error('AI Query failed:', error);
            setAiResponse("Sorry, I couldn't generate that report right now. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            // 1. Get AI Summary
            let summary = "Summary not available.";
            try {
                const aiRes = await chatbotAPI.ask({
                    query: "Generate a comprehensive executive summary of this dashboard data for a PDF report. Focus on attendance trends, department distribution, and leave status. Keep it professional and concise (approx 100 words).",
                    context: { 
                        type: 'admin_reports',
                        all_stats: stats 
                    }
                });
                summary = aiRes.data.answer;
            } catch (e) {
                console.error("AI Summary generation failed", e);
                summary = "Automated summary generation failed. Please refer to charts below.";
            }

            // 2. Capture Charts
            const trendImg = trendChartRef.current.toBase64Image();
            const deptImg = deptChartRef.current.toBase64Image();
            const leaveImg = leaveChartRef.current.toBase64Image();

            // 3. Build HTML Content
            const element = document.createElement('div');
            element.innerHTML = `
                <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                        <h1 style="color: #1976d2; margin: 0;">Workforce Analytics Report</h1>
                        <span style="color: #666;">Generated: ${new Date().toLocaleDateString()}</span>
                    </div>

                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                        <h3 style="margin-top: 0; color: #444;">Executive Summary</h3>
                        <p style="line-height: 1.6; color: #555;">${summary}</p>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Attendance Trends (7 Days)</h3>
                        <img src="${trendImg}" style="width: 100%; max-height: 300px; object-fit: contain; margin-top: 10px;" />
                    </div>

                    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                        <div style="flex: 1;">
                            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Department Distribution</h3>
                            <img src="${deptImg}" style="width: 100%; max-height: 200px; object-fit: contain; margin-top: 10px;" />
                        </div>
                        <div style="flex: 1;">
                            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Leave Status</h3>
                            <img src="${leaveImg}" style="width: 100%; max-height: 200px; object-fit: contain; margin-top: 10px;" />
                        </div>
                    </div>
                </div>
            `;

            // 4. Generate PDF
            const opt = {
                margin: 0.5,
                filename: `Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().from(element).set(opt).save();

        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF report.");
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
        </Box>
    );

    // Prepare Chart Data
    const trendData = {
        labels: stats.attendance_trends?.map(t => t.date) || [],
        datasets: [
            {
                label: 'Present',
                data: stats.attendance_trends?.map(t => t.present) || [],
                borderColor: theme.palette.primary.main,
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Late',
                data: stats.attendance_trends?.map(t => t.late) || [],
                borderColor: theme.palette.error.main,
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                tension: 0.4,
            }
        ]
    };

    const deptData = {
        labels: Object.keys(stats.departments || {}),
        datasets: [{
            label: 'Headcount',
            data: Object.values(stats.departments || {}).map(d => d.total),
            backgroundColor: [
                '#667eea', '#764ba2', '#6dd5ed', '#2193b0', '#11998e', '#38ef7d'
            ],
            hoverOffset: 4
        }]
    };

    const leaveData = {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
            label: 'Leaves',
            data: [
                stats.leave_stats?.approved || 0,
                stats.leave_stats?.pending || 0,
                stats.leave_stats?.rejected || 0
            ],
            backgroundColor: [
                theme.palette.success.main,
                theme.palette.warning.main,
                theme.palette.error.main
            ]
        }]
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Advanced Workforce Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        AI-driven insights combined with real-time biometric and attendance data.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={fetchStats}>Sync</Button>
                    <Button 
                        variant="contained" 
                        startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <Download />}
                        onClick={handleDownloadPDF}
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? 'Generating...' : 'Report PDF'}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* AI Insight Box */}
                <Grid item xs={12}>
                    <Card 
                        sx={{ 
                            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                            color: 'white',
                            borderRadius: 4,
                            p: 1
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Insights sx={{ fontSize: 32 }} />
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>Company AI Analyst</Typography>
                            </Box>
                            
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Try: 'Analyze departmental punctuality' or 'Give me a summary of last week'"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& input::placeholder': { color: 'rgba(255,255,255,0.6)' }
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleAiQuery} sx={{ color: 'white' }}>
                                                {aiLoading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            {aiResponse && (
                                <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>AI Synthesis:</Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{aiResponse}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Left: Attendance Trends */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Attendance Tendencies (7 Days)</Typography>
                                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} size="small">
                                    <Tab label="Trends" />
                                </Tabs>
                            </Box>
                            <Box sx={{ height: 350 }}>
                                <Line 
                                    ref={trendChartRef}
                                    data={trendData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom' } },
                                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                                    }} 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Top: Dept Distribution */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>By Department</Typography>
                                    <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                                        <Doughnut 
                                            ref={deptChartRef}
                                            data={deptData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { position: 'right' } }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right Bottom: Leave Flow */}
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Leave Flow Status</Typography>
                                    <Box sx={{ height: 180 }}>
                                        <Bar 
                                            ref={leaveChartRef}
                                            data={leaveData}
                                            options={{
                                                indexAxis: 'y',
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Reports;
