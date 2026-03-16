/**
 * Dashboard Page
 * Main dashboard with overview statistics
 */
import {
    Campaign,
    Celebration,
    Chat,
    CheckCircle,
    RestaurantMenu,
    Schedule,
    TrendingUp
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Popover,
    Typography
} from '@mui/material';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { announcementAPI, attendanceAPI, dashboardAPI, mealAPI } from '../services/api';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${gradient})`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            width: 56,
            height: 56,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Avatar>
      </Box>
      {trend && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp fontSize="small" />
          <Typography variant="caption">{trend}</Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [overview, setOverview] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [mealStats, setMealStats] = useState(null);
  
  // Popover States
  const [announcementAnchor, setAnnouncementAnchor] = useState(null);
  const [holidayAnchor, setHolidayAnchor] = useState(null);
  
  // Timeout references for hover delay
  const [announcementTimeout, setAnnouncementTimeout] = useState(null);
  const [holidayTimeout, setHolidayTimeout] = useState(null);

  const handleAnnouncementEnter = (event) => {
      clearTimeout(announcementTimeout);
      setAnnouncementAnchor(event.currentTarget);
  };

  const handleAnnouncementLeave = () => {
      setAnnouncementTimeout(setTimeout(() => {
          setAnnouncementAnchor(null);
      }, 200));
  };
  
  const handleHolidayEnter = (event) => {
      clearTimeout(holidayTimeout);
      setHolidayAnchor(event.currentTarget);
  };

  const handleHolidayLeave = () => {
      setHolidayTimeout(setTimeout(() => {
          setHolidayAnchor(null);
      }, 200));
  };

  useEffect(() => {
    if (user) {
        fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const formatDate = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
      };

      const promises = [
          dashboardAPI.getOverview(),
          announcementAPI.getAll(),
          attendanceAPI.getMyAttendance({
              start_date: formatDate(firstDay),
              end_date: formatDate(lastDay)
          })
      ];

      if (user?.role === 'admin') {
          promises.push(mealAPI.getStats());
      }

      const [overviewRes, annRes, attendanceRes, mealStatsRes] = await Promise.all(promises);

      setOverview(overviewRes.data);
      setAnnouncements(annRes.data || []);
      if (mealStatsRes) setMealStats(mealStatsRes.data);
      
      // Process Chart Data (Last 7 Days)
      const records = attendanceRes.data.records || [];
      const labels = [];
      const dataPoints = [];
      
      // Get last 7 days dates
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = formatDate(d);
          
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          
          const record = records.find(r => r.date.startsWith(dStr));
          dataPoints.push(record ? record.total_hours || 0 : 0);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Hours Worked',
            data: dataPoints,
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderRadius: 4,
          },
        ],
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's your attendance overview
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Card sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 4 }}>
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3
        }}>
          <Box sx={{ color: 'white', textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              {user?.role === 'admin' ? 'Administrative Control Center' : (overview?.today?.checked_in ? 'You\'re checked in!' : 'Ready to start your day?')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user?.role === 'admin' 
                ? 'Manage workforce, approvals, and system reports from here.' 
                : (overview?.today?.checked_in
                    ? `Active Session started at ${new Date(overview.today.checked_in).toLocaleTimeString()}`
                    : 'Mark your attendance to get started today')}
            </Typography>
          </Box>
          <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              width: { xs: '100%', sm: 'auto' }
          }}>

            <Button
              variant="outlined"
              size="large"
              startIcon={<Chat />}
              onClick={() => navigate('/chatbot')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 3,
                flex: { xs: 1, sm: 'initial' },
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Ask AI
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Box onClick={() => navigate('/attendance')} sx={{ cursor: 'pointer', height: '100%' }}>
            <StatCard
                title="Attendance Rate"
                value={`${overview?.this_month?.attendance_percentage || 0}%`}
                subtitle="This month"
                icon={CheckCircle}
                gradient="#11998e 0%, #38ef7d 100%"
                trend="+5% from last month"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box onClick={() => navigate('/attendance')} sx={{ cursor: 'pointer', height: '100%' }}>
              <StatCard
                title="Total Hours"
                value={overview?.this_month?.total_hours || 0}
                subtitle="This month"
                icon={Schedule}
                gradient="#4facfe 0%, #00f2fe 100%"
              />
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
           <Box onClick={() => navigate('/leaves')} sx={{ cursor: 'pointer', height: '100%' }}>
              <StatCard
                title="Pending Leaves"
                value={overview?.pending_leaves || 0}
                subtitle="Awaiting approval"
                icon={TrendingUp}
                gradient="#fa709a 0%, #fee140 100%"
              />
           </Box>
        </Grid>

        {/* Admin Meal Stats Card - Only for Admin */}
        {user?.role === 'admin' && mealStats && (
            <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', bgcolor: '#fff' }}>
                    <CardContent>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <RestaurantMenu color="primary"/>
                            <Typography variant="h6" fontWeight={700}>Today's Meals</Typography>
                        </Box>
                        <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pie 
                                data={{
                                    labels: ['Veg', 'Non-Veg'],
                                    datasets: [{
                                        data: [mealStats.veg, mealStats.non_veg],
                                        backgroundColor: ['#4caf50', '#f44336'],
                                        borderWidth: 0
                                    }]
                                }}
                                options={{
                                    plugins: { legend: { position: 'right' } }
                                }}
                            />
                        </Box>
                        <Typography variant="body2" align="center" color="text.secondary">
                            Total Bookings: {mealStats.total}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        )}
        {user?.role !== 'admin' && (
        <Grid item xs={12} md={3}>
          <Box onClick={() => navigate('/meals')} sx={{ cursor: 'pointer', height: '100%' }}>
            <StatCard
                title="Meals Booked"
                value={overview?.booked_meals || 0}
                subtitle="Upcoming"
                icon={RestaurantMenu}
                gradient="#ff9a9e 0%, #fecfef 99%, #fecfef 100%"
            />
          </Box>
        </Grid>
        )}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', minHeight: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Weekly Activity
              </Typography>
              {chartData && (
                  <Box sx={{ height: 300 }}>
                      <Bar 
                        data={chartData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    padding: 12,
                                    callbacks: {
                                        label: (context) => `${context.raw} Hours`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { borderDash: [2, 2] },
                                    ticks: { stepSize: 2 }
                                },
                                x: {
                                    grid: { display: false }
                                }
                            }
                        }} 
                      />
                  </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Announcements Card */}
            <Box 
              onMouseEnter={handleAnnouncementEnter}
              onMouseLeave={handleAnnouncementLeave}
            >
              <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                          <Campaign color="secondary" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>Announcements</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {(Array.isArray(announcements) ? announcements : []).slice(0, 2).map((ann) => (
                              <Box key={ann.id} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{ann.title}</Typography>
                                      <Chip label={ann.priority} size="small" color={ann.priority === 'urgent' ? 'error' : ann.priority === 'high' ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>{ann.content}</Typography>
                                  <Typography variant="caption" color="text.disabled">{new Date(ann.created_at).toLocaleDateString()} • {ann.posted_by}</Typography>
                              </Box>
                          ))}
                          {announcements.length === 0 && <Typography variant="body2" color="text.secondary" align="center">No new announcements</Typography>}
                      </Box>
                  </CardContent>
              </Card>

              <Popover
                sx={{ 
                    pointerEvents: 'none', 
                    '& .MuiBackdrop-root': {
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0,0,0,0.1)'
                    }
                }}
                open={Boolean(announcementAnchor)}
                anchorReference="none"
                onClose={() => setAnnouncementAnchor(null)}
                transitionDuration={200}
                disableRestoreFocus
                PaperProps={{
                    onMouseEnter: () => clearTimeout(announcementTimeout),
                    onMouseLeave: handleAnnouncementLeave,
                    sx: {
                        pointerEvents: 'auto',
                        width: 500,
                        maxHeight: 600,
                        overflowY: 'auto',
                        p: 3,
                        borderRadius: 3,
                        top: '50% !important',
                        left: '50% !important',
                        transform: 'translate(-50%, -50%) !important',
                        position: 'fixed',
                        boxShadow: 24
                    }
                }}
              >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Campaign color="secondary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>All Announcements</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(Array.isArray(announcements) ? announcements : []).map((ann) => (
                          <Box key={ann.id} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{ann.title}</Typography>
                                  <Chip label={ann.priority} size="small" color={ann.priority === 'urgent' ? 'error' : ann.priority === 'high' ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>{ann.content}</Typography>
                              <Typography variant="caption" color="text.disabled">{new Date(ann.created_at).toLocaleDateString()} • {ann.posted_by}</Typography>
                          </Box>
                      ))}
                  </Box>
              </Popover>
            </Box>

            {/* Upcoming Holidays */}
            <Box 
              onMouseEnter={handleHolidayEnter}
              onMouseLeave={handleHolidayLeave}
            >
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Celebration color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Upcoming Holidays</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(overview?.upcoming_holidays || []).slice(0, 2).map((holiday, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{holiday.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography>
                          </Box>
                          <Chip label={holiday.type} size="small" variant="outlined" color={holiday.type === 'public' ? 'success' : 'primary'} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </Box>
                    ))}
                    {!overview?.upcoming_holidays?.length && <Typography variant="body2" color="text.secondary">No upcoming holidays</Typography>}
                  </Box>
                </CardContent>
              </Card>

              <Popover
                sx={{ 
                    pointerEvents: 'none', 
                    '& .MuiBackdrop-root': {
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(0,0,0,0.1)'
                    }
                }}
                open={Boolean(holidayAnchor)}
                anchorReference="none"
                onClose={() => setHolidayAnchor(null)}
                transitionDuration={200}
                disableRestoreFocus
                PaperProps={{
                    onMouseEnter: () => clearTimeout(holidayTimeout),
                    onMouseLeave: handleHolidayLeave,
                    sx: {
                        pointerEvents: 'auto',
                        width: 500,
                        maxHeight: 600,
                        overflowY: 'auto',
                        p: 3,
                        borderRadius: 3,
                        top: '50% !important',
                        left: '50% !important',
                        transform: 'translate(-50%, -50%) !important',
                        position: 'fixed',
                        boxShadow: 24
                    }
                }}
              >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Celebration color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>All Holidays</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {overview?.upcoming_holidays?.map((holiday, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{holiday.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography>
                          </Box>
                          <Chip label={holiday.type} size="small" variant="outlined" color={holiday.type === 'public' ? 'success' : 'primary'} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </Box>
                    ))}
                  </Box>
              </Popover>
            </Box>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
