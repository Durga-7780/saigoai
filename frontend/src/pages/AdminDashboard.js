/**
 * Admin Dashboard Page
 * Comprehensive statistics and management for Admin/HR
 */
import {
  Assignment,
  Badge,
  Block,
  Campaign,
  Celebration,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  CurrencyRupee,
  Delete,
  Edit,
  Group,
  ListAlt,
  PendingActions,
  PersonAdd,
  QrCodeScanner,
  RestaurantMenu,
  Schedule as ScheduleIcon,
  Search,
  Settings,
  TrendingDown,
  TrendingUp
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import QrReader from 'react-qr-scanner';
import { useSelector } from 'react-redux';
import {
  announcementAPI,
  companyAPI,
  dashboardAPI,
  employeeAPI,
  holidayAPI,
  leaveAPI,
  mealAPI,
  payrollAPI,
  requestAPI
} from '../services/api';
import { getErrorMessage } from '../utils/error';

ChartJS.register(ArcElement, Tooltip, Legend);

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend, trendUp }) => (
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
          {trendUp ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
          <Typography variant="caption">{trend}</Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
    const theme = useTheme();
    const { user } = useSelector((state) => state.auth);
    const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [mealStats, setMealStats] = useState(null);
  const [mealDate, setMealDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [companySettings, setCompanySettings] = useState({
      name: '',
      address: '',
      logo_url: '',
      phone: '',
      email: '',
      website: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  
  // Scanner state
  const [openScanner, setOpenScanner] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null); // To prevent rapid double scans
  const [scanStatus, setScanStatus] = useState({ msg: '', type: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 4;
  
  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '1995-01-01',
      gender: 'Male',
      password: 'Employee123!',
      department: '',
      designation: '',
      role: 'employee',
      joining_date: new Date().toISOString().split('T')[0],
      employment_type: 'full-time',
      address: {
          street: 'Main Street',
          city: '',
          state: 'State',
          postal_code: '123456',
          country: 'India'
      },
      emergency_contact: {
          name: '',
          relationship: 'Emergency Contact',
          phone: ''
      }
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Edit states
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editData, setEditData] = useState({
      shift_start_time: '09:00',
      designation: ''
  });

  const [openHolidayModal, setOpenHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'public',
      description: ''
  });

  const [openAnnounceModal, setOpenAnnounceModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
      title: '',
      content: '',
      priority: 'normal',
      category: 'general',
      expires_at: ''
  });

  const [openPayrollModal, setOpenPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState({
      salary_structure: {
          basic: 0, hra: 0, conveyance: 0, special_allowance: 0,
          professional_allowance: 0, uniform_allowance: 0,
          shift_allowance: 0, medical_allowance: 0,
          pf_employer: 1500, pf_employee: 1500, professional_tax: 200
      },
      bank_details: {
          account_number: '', bank_name: '', ifsc_code: '',
          pan_number: '', uan_number: '', pf_number: '', payment_mode: 'Bank Transfer'
      }
  });
  const [generateData, setGenerateData] = useState({
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      working_days: 30,
      loss_of_pay_days: 0
  });
  const [payrollTab, setPayrollTab] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, empRes, leavesRes, holidayRes, companyRes] = await Promise.all([
        dashboardAPI.getAdminStats(),
        employeeAPI.getAllEmployees(),
        leaveAPI.getAllLeaves(),
        holidayAPI.getAll(),
        companyAPI.getSettings()
      ]);
      
      setStats(statsRes.data);
      setEmployees(empRes.data.employees);
      setLeaves(leavesRes.data.leaves || []); 
      setHolidays(holidayRes.data);
      if (companyRes) setCompanySettings(companyRes.data);
      // Meal stats fetched separately via useEffect on mealDate
      
      try {
          const announceRes = await announcementAPI.getAll();
          setAnnouncements(announceRes.data || []);
      } catch (err) { console.error('Failed to load announcements', err);}

      try {
          const reqRes = await requestAPI.getAll();
          setRequests(reqRes.data || []);
      } catch (err) { console.error('Failed to load requests', err); }
      
      try {
          const compRes = await companyAPI.getSettings();
          setCompanySettings(compRes.data);
      } catch (err) { console.error('Failed to load settings', err); }

    } catch (error) {

      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      const fetchMeals = async () => {
          try {
              const res = await mealAPI.getStats({ date: mealDate });
              setMealStats(res.data);
          } catch(e) { console.error("Failed to load meal stats", e); }
      };
      fetchMeals();
  }, [mealDate]);

  const changeMealDate = (days) => {
      const [y, m, d] = mealDate.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      current.setDate(current.getDate() + days);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      setMealDate(`${year}-${month}-${day}`);
  };

  const handleScan = async (data) => {
      if (data && data.text) {
          try {
              const parsed = JSON.parse(data.text);
              const mealId = parsed.meal_id;
              
              if(mealId === lastScannedId) return; // Prevent duplicate reads of same frame
              setLastScannedId(mealId);

              // Play beep sound (optional but good for UX)
              // const audio = new Audio('/beep.mp3'); audio.play().catch(e=>{});

              try {
                  const res = await mealAPI.scan({ meal_id: mealId });
                  setScanStatus({ msg: `✅ Success: ${res.data.meal.employee_name} (${res.data.meal.category})`, type: 'success' });
              } catch (err) {
                  setScanStatus({ msg: `❌ Error: ${err.response?.data?.detail || 'Scan failed'}`, type: 'error' });
              }

              // Reset last scanned after 3 seconds to allow re-scanning if needed (or keep it blocked)
              setTimeout(() => setLastScannedId(null), 3000);

          } catch (e) {
              console.error("Invalid QR", e);
          }
      }
  };

  const handleScanError = (err) => {
      console.error(err);
      // setScanStatus({ msg: 'Camera error', type: 'error' });
  };

  const handleApproveReject = async (leaveId, status) => {
    try {
        await leaveAPI.approveLeave({
            leave_id: leaveId,
            approver_id: user?.employee_id,
            status,
            comments: `Processed via Admin Dashboard`
        });
        fetchData();
    } catch (error) {
        console.error('Failed to update leave status:', error);
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
        await requestAPI.updateStatus(requestId, { status, admin_comment: 'Processed by Admin' });
        setSuccessMsg(`Request ${status} successfully`);
        setShowSuccess(true);
        fetchData();
    } catch (error) {
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handleAddEmployee = async () => {
      try {
          await employeeAPI.createEmployee(newEmployee);
          setOpenAddModal(false);
          fetchData();
          // Reset form
          setNewEmployee({
              employee_id: '',
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              date_of_birth: '1995-01-01',
              gender: 'Male',
              password: 'Employee123!',
              department: '',
              designation: '',
              role: 'employee',
              joining_date: new Date().toISOString().split('T')[0],
              employment_type: 'full-time',
              address: {
                  street: 'Required',
                  city: 'Required',
                  state: 'Required',
                  postal_code: '000000',
                  country: 'India'
              },
              emergency_contact: {
                  name: 'Guardian',
                  relationship: 'Family',
                  phone: '0000000000'
              }
          });
      } catch (error) {
          const message = error.response?.data?.detail || 'Failed to add employee';
          setErrorMsg(message);
          setShowError(true);
          console.error('Failed to add employee:', error);
      }
  };

  const handleEditClick = (emp) => {
      setSelectedEmployee(emp);
      setEditData({
          shift_start_time: emp.shift_start_time || '09:00',
          shift_end_time: emp.shift_end_time || '18:00',
          department: emp.department,
          designation: emp.designation
      });
      setOpenEditModal(true);
  };

  const handleUpdateEmployee = async () => {
      try {
          await employeeAPI.updateEmployeeAdmin(selectedEmployee.employee_id, editData);
          setOpenEditModal(false);
          setSuccessMsg('Employee schedule updated successfully!');
          setShowSuccess(true);
          fetchData();
      } catch (error) {
          setErrorMsg(getErrorMessage(error));
          setShowError(true);
      }
  };

  const handleAddHoliday = async () => {
    try {
        await holidayAPI.create(newHoliday);
        setOpenHolidayModal(false);
        setSuccessMsg('Holiday added successfully!');
        setShowSuccess(true);
        fetchData();
        setNewHoliday({
            name: '',
            date: new Date().toISOString().split('T')[0],
            type: 'public',
            description: ''
        });
    } catch (error) {
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
        await holidayAPI.delete(id);
        setSuccessMsg('Holiday deleted successfully!');
        setShowSuccess(true);
        fetchData();
    } catch (error) {
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handleAddAnnouncement = async () => {
    try {
        const payload = {
            ...newAnnouncement,
            expires_at: newAnnouncement.expires_at || null
        };
        await announcementAPI.create(payload);
        setOpenAnnounceModal(false);
        setSuccessMsg('Announcement posted successfully!');
        setShowSuccess(true);
        fetchData();
        setNewAnnouncement({
            title: '',
            content: '',
            priority: 'normal',
            category: 'general',
            expires_at: ''
        });
    } catch (error) {
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
        await announcementAPI.delete(id);
        setSuccessMsg('Announcement removed!');
        setShowSuccess(true);
        fetchData();
    } catch (error) {
        setErrorMsg(getErrorMessage(error));
        setShowError(true);
    }
  };

  const handlePayrollClick = (emp) => {
      setSelectedEmployee(emp);
      setPayrollData({
          salary_structure: emp.salary_details || {
            basic: 12500, hra: 6250, conveyance: 1250, special_allowance: 1500,
            professional_allowance: 1225, uniform_allowance: 875,
            shift_allowance: 1400, medical_allowance: 0,
            pf_employer: 1500, pf_employee: 1500, professional_tax: 200
          },
          bank_details: emp.bank_details || {
              account_number: '', bank_name: '', ifsc_code: '',
              pan_number: '', uan_number: '', pf_number: '', payment_mode: 'Bank Transfer'
          }
      });
      setOpenPayrollModal(true);
  };

  const handleSaveSalary = async () => {
      try {
          await payrollAPI.updateSalaryDetails(selectedEmployee.employee_id, payrollData);
          setSuccessMsg('Salary details updated!');
          setShowSuccess(true);
          fetchData(); // Refresh to get updated data
      } catch (error) {
           setErrorMsg(getErrorMessage(error));
           setShowError(true);
      }
  };

  const handleGeneratePayslip = async () => {
      try {
          await payrollAPI.generatePayslip({
              employee_id: selectedEmployee.employee_id,
              ...generateData
          });
           setSuccessMsg('Payslip generated successfully!');
           setShowSuccess(true);
           setOpenPayrollModal(false);
      } catch (error) {
           setErrorMsg(getErrorMessage(error));
           setShowError(true);
      }
  };

  // Menu Management State
  const [openMenuModal, setOpenMenuModal] = useState(false);
  const [menuData, setMenuData] = useState({
      date: new Date().toISOString().split('T')[0],
      options: ['Veg Box Meal', 'Non-Veg Box Meal'] // Default
  });
  const [menuInput, setMenuInput] = useState('');
  
  const handleSaveMenu = async () => {
      try {
          await mealAPI.createMenu(menuData);
          setSuccessMsg('Daily menu updated successfully');
          setShowSuccess(true);
          setOpenMenuModal(false);
      } catch (error) {
          setErrorMsg(getErrorMessage(error));
          setShowError(true);
      }
  };

  const handleSaveSettings = async () => {
      try {
          const formData = new FormData();
          formData.append('name', companySettings.name);
          formData.append('address', companySettings.address);
          formData.append('phone', companySettings.phone || '');
          formData.append('email', companySettings.email || '');
          formData.append('website', companySettings.website || '');
          if (logoFile) {
              formData.append('logo', logoFile);
          }

          const res = await companyAPI.updateSettings(formData);
          setCompanySettings(res.data); // Update state with returned data (new logo url)
          setLogoFile(null); // Clear file
          setSuccessMsg('Company settings updated successfully!');
          setShowSuccess(true);
      } catch (error) {
          setErrorMsg(getErrorMessage(error));
          setShowError(true);
      }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Admin Panel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your workforce and monitor real-time company performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
              bgcolor: '#0070f3',
              '&:hover': {
                bgcolor: '#0062d1',
              },
            }}
          >
            Add New Employee
          </Button>
          <Button
              variant="outlined"
              startIcon={<Celebration />}
              onClick={() => setOpenHolidayModal(true)}
              sx={{
                  ml: 2,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
              }}
          >
            Add Holiday
          </Button>
          <Button
              variant="outlined"
              color="secondary"
              startIcon={<Campaign />}
              onClick={() => setOpenAnnounceModal(true)}
              sx={{
                  ml: 2,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
              }}
          >
              Announce
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.employees?.total || 0}
            subtitle={`${stats?.employees?.active || 0} Active Staff`}
            icon={Group}
            gradient="#667eea 0%, #764ba2 100%"
            trend="+2 this week"
            trendUp={true}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Today's Attendance"
            value={`${stats?.today_attendance?.percentage || 0}%`}
            subtitle={`${stats?.today_attendance?.present || 0} Present Today`}
            icon={CheckCircle}
            gradient="#11998e 0%, #38ef7d 100%"
            trend="-3% from yesterday"
            trendUp={false}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Pending Requests"
            value={stats?.pending_leaves || 0}
            subtitle="Leave applications"
            icon={PendingActions}
            gradient="#f093fb 0%, #f5576c 100%"
          />
        </Grid>
        <Grid item xs={12} md={3}>
            {mealStats ? (
                <Card sx={{ height: '100%', bgcolor: '#fff' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RestaurantMenu color="primary"/>
                                <Typography variant="h6" fontWeight={700}>Meals</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton size="small" onClick={() => setOpenMenuModal(true)} title="Manage Menu">
                                    <Edit />
                                </IconButton>
                                <IconButton size="small" onClick={() => setOpenScanner(true)} title="Scan QR">
                                    <QrCodeScanner />
                                </IconButton>
                                <IconButton size="small" onClick={() => changeMealDate(-1)}><ChevronLeft/></IconButton>
                                <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 75, textAlign: 'center' }}>
                                    {new Date(mealDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </Typography>
                                <IconButton size="small" onClick={() => changeMealDate(1)}><ChevronRight/></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }
                                }}
                            />
                        </Box>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                            Total: {mealStats.total}
                        </Typography>
                    </CardContent>
                </Card>
            ) : null}
        </Grid>
      </Grid>
      
      {/* Menu Management Modal */}
      <Dialog open={openMenuModal} onClose={() => setOpenMenuModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configure Daily Menu</DialogTitle>
          <DialogContent>
              <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={menuData.date}
                  onChange={async (e) => {
                      const newDate = e.target.value;
                      setMenuData({...menuData, date: newDate, options: []});
                      try {
                        const res = await mealAPI.getMenu(newDate);
                        if(res.data) setMenuData({ date: newDate, options: res.data.options });
                      } catch {
                        // Default if not found
                        setMenuData({ date: newDate, options: ['Veg Box Meal', 'Non-Veg Box Meal'] });
                      }
                  }}
                  sx={{ mb: 3, mt: 1 }}
                  InputLabelProps={{ shrink: true }}
              />
              <Typography variant="subtitle2" gutterBottom>Available Options:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {menuData.options.map((opt, idx) => (
                      <Chip 
                        key={idx} 
                        label={opt} 
                        onDelete={() => {
                            const newOpts = menuData.options.filter((_, i) => i !== idx);
                            setMenuData({...menuData, options: newOpts});
                        }} 
                      />
                  ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Add option (e.g. Special Thali)"
                    value={menuInput}
                    onChange={(e) => setMenuInput(e.target.value)}
                  />
                  <Button variant="contained" onClick={() => {
                      if(menuInput.trim()) {
                          setMenuData({...menuData, options: [...menuData.options, menuInput.trim()]});
                          setMenuInput('');
                      }
                  }}>Add</Button>
              </Box>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setOpenMenuModal(false)}>Close</Button>
              <Button variant="contained" onClick={handleSaveMenu}>Save Menu</Button>
          </DialogActions>
      </Dialog>

      {/* Scanner Modal */}
      <Dialog open={openScanner} onClose={() => { setOpenScanner(false); setScanStatus({msg:'', type:''}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Scan Meal QR</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400 }}>
             {openScanner && (
                 <QrReader
                    delay={300}
                    onError={handleScanError}
                    onScan={handleScan}
                    style={{ width: '100%', borderRadius: 8 }}
                    constraints={{
                        video: { facingMode: 'environment' }
                    }}
                 />
             )}
             {scanStatus.msg && (
                <MuiAlert 
                    severity={scanStatus.type} 
                    sx={{ mt: 2, width: '100%', animation: 'fadeIn 0.5s' }}
                    action={
                        <Button color="inherit" size="small" onClick={() => setScanStatus({msg:'',type:''})}>
                            CLEAR
                        </Button>
                    }
                >
                    {scanStatus.msg}
                </MuiAlert>
             )}
             <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
                Point camera at employee's QR code
             </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenScanner(false)}>Close</Button>
        </DialogActions>
      </Dialog>


      {/* Tabs Section */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.02)', pr: 2 }}>
            <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{ px: 2 }}
            >
            <Tab icon={<Group />} iconPosition="start" label="Employees" sx={{ py: 2 }} />
            <Tab icon={<ListAlt />} iconPosition="start" label="Leave Requests" sx={{ py: 2 }} />
            <Tab icon={<Celebration />} iconPosition="start" label="Holidays" sx={{ py: 2 }} />
            <Tab icon={<Badge />} iconPosition="start" label="Departments" sx={{ py: 2 }} />
            <Tab icon={<Campaign />} iconPosition="start" label="Announcements" sx={{ py: 2 }} />
            <Tab icon={<Assignment />} iconPosition="start" label="Other Requests" sx={{ py: 2 }} />
            <Tab icon={<Settings />} iconPosition="start" label="Settings" sx={{ py: 2 }} />
            </Tabs>
            {tabValue === 0 && (
                <Pagination 
                    count={Math.ceil((employees || []).length / rowsPerPage)} 
                    page={page} 
                    onChange={(e, v) => setPage(v)} 
                    color="primary" 
                    size="small"
                />
            )}
        </Box>

        <Box sx={{ p: 0 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  sx={{ flex: 1 }}
                  placeholder="Search employees by name, ID or department..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
                <Button 
                    variant="outlined" 
                    color="warning"
                    size="small"
                    startIcon={<CurrencyRupee />}
                    onClick={async () => {
                        if(!window.confirm(`Generate payslips for ALL employees for ${generateData.month} ${generateData.year}? This uses auto-calculated attendance.`)) return;
                        try {
                            const res = await payrollAPI.bulkGeneratePayslips({
                                month: generateData.month,
                                year: generateData.year,
                                working_days: generateData.working_days
                            });
                            setSuccessMsg(res.data.message);
                            setShowSuccess(true);
                        } catch (error) {
                            setErrorMsg(getErrorMessage(error));
                            setShowError(true);
                        }
                    }}
                    sx={{ height: 40, whiteSpace: 'nowrap', px: 3 }}
                >
                    Run Payroll
                </Button>
              </Box>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Shift Timing</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(employees || []).slice((page - 1) * rowsPerPage, page * rowsPerPage).map((emp) => (
                      <TableRow key={emp.employee_id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              {emp.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {emp.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {emp.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{emp.employee_id}</Typography>
                        </TableCell>
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {emp.shift_start_time} - {emp.shift_end_time}
                                </Typography>
                            </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{emp.department}</Typography>
                          <Typography variant="caption" color="text.secondary">{emp.designation}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.is_active ? 'Active' : 'Inactive'}
                            color={emp.is_active ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditClick(emp)} color="primary"><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handlePayrollClick(emp)} color="secondary" title="Payroll"><CurrencyRupee fontSize="small" /></IconButton>
                          <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Leave Requests</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                      <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Dates</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Action</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {leaves.map((leave) => (
                          <TableRow key={leave.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{leave.employee_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{leave.employee_id}</Typography>
                              </TableCell>
                              <TableCell><Chip label={leave.leave_type} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                              <TableCell>
                                  {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{leave.reason}</TableCell>
                              <TableCell>
                                  <Chip 
                                      label={leave.status} 
                                      color={leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'error'}
                                      size="small" 
                                      sx={{ textTransform: 'capitalize' }}
                                  />
                              </TableCell>
                              <TableCell align="right">
                                  {leave.status === 'pending' ? (
                                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                          <Button size="small" variant="contained" color="success" onClick={() => handleApproveReject(leave.id, 'approved')}>Approve</Button>
                                          <Button size="small" variant="outlined" color="error" onClick={() => handleApproveReject(leave.id, 'rejected')}>Reject</Button>
                                      </Box>
                                  ) : (
                                      <Typography variant="caption" color="text.secondary">No Action Needed</Typography>
                                  )}
                              </TableCell>
                          </TableRow>
                      ))}
                      {leaves.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                  <Typography variant="body2" color="text.secondary">
                                      No pending leave requests found
                                  </Typography>
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Holidays</Typography>
                <TableContainer>
                <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Holiday Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidays.map((h) => (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{h.name}</TableCell>
                      <TableCell>{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell>
                        <Chip 
                          label={h.type} 
                          size="small" 
                          color={h.type === 'public' ? 'success' : h.type === 'company' ? 'primary' : 'secondary'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{h.description || 'No description'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleDeleteHoliday(h.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {holidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>No holidays configured</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TableContainer>
            </Box>
          )}

       {/* Departments Tab (Placeholder) */}
          {tabValue === 3 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Departments Overview</Typography>
              
              <Grid container spacing={3}>
                {Object.entries(
                    employees.reduce((acc, emp) => {
                        const dept = emp.department || 'Unassigned';
                        if (!acc[dept]) acc[dept] = { total: 0, active: 0 };
                        acc[dept].total++;
                        if (emp.is_active) acc[dept].active++;
                        return acc;
                    }, {})
                ).map(([dept, stats], index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ 
                            height: '100%',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: `hsl(${index * 137 % 360}, 70%, 50%)`, mr: 2, color: '#fff' }}>
                                        {dept.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                            {dept}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Total Staff</Typography>
                                        <Typography variant="subtitle2" fontWeight={700}>{stats.total}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">Active</Typography>
                                        <Typography variant="subtitle2" fontWeight={700} color="success.main">{stats.active}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {employees.length === 0 && (
                     <Grid item xs={12}>
                         <Typography align="center" color="text.secondary" sx={{ py: 5 }}>No employee data to derive departments.</Typography>
                     </Grid>
                )}
              </Grid>
            </Box>
          )}

          {tabValue === 4 && (
            <TableContainer sx={{ p: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Posted By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.map((ann) => (
                    <TableRow key={ann.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                          {ann.title}
                          <Typography variant="caption" display="block" color="text.secondary">
                              {ann.category}
                          </Typography>
                      </TableCell>
                      <TableCell>{ann.content}</TableCell>
                      <TableCell>
                        <Chip 
                          label={ann.priority} 
                          size="small" 
                          color={ann.priority === 'urgent' ? 'error' : ann.priority === 'high' ? 'warning' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{ann.posted_by}</TableCell>
                      <TableCell>{new Date(ann.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleDeleteAnnouncement(ann.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {announcements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>No active announcements</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

        {/* REQUESTS TAB */}
        {tabValue === 5 && (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.length === 0 ? (
                             <TableRow>
                                 <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                     <Typography color="text.secondary">No requests found</Typography>
                                 </TableCell>
                             </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell sx={{ fontWeight: 600 }}>{req.employee_name}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={req.request_type.replace('_', ' ')} 
                                            size="small" 
                                            color="info" 
                                            variant="outlined"
                                            sx={{ textTransform: 'capitalize' }} 
                                        />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>{req.reason}</TableCell>
                                    <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={req.status} 
                                            size="small"
                                            color={
                                                req.status === 'approved' ? 'success' : 
                                                req.status === 'rejected' ? 'error' : 'warning'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {req.status === 'pending' && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton 
                                                    size="small" 
                                                    color="success" 
                                                    onClick={() => handleRequestAction(req.id || req._id, 'approved')}
                                                    title="Approve"
                                                >
                                                    <Check />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="error" 
                                                    onClick={() => handleRequestAction(req.id || req._id, 'rejected')}
                                                    title="Reject"
                                                >
                                                    <Block />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        )}

        </Box>
      </Paper>
        {/* SETTINGS TAB */}
        {tabValue === 6 && (
            <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Company Settings</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={companySettings.name}
                            onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12}>
                         <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Company Address"
                            value={companySettings.address}
                            onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                            helperText="This address will appear on payslips"
                        />
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={companySettings.phone}
                            onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                        />
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            value={companySettings.email}
                            onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ border: '1px dashed #ccc', p: 3, borderRadius: 2, textAlign: 'center' }}>
                            {companySettings.logo_url && (
                                <Box sx={{ mb: 2 }}>
                                    <img src={companySettings.logo_url} alt="Current Logo" style={{ maxHeight: 80, maxWidth: '100%' }} />
                                    <Typography variant="caption" display="block" color="text.secondary">Current Logo</Typography>
                                </Box>
                            )}
                            
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUpload />}
                            >
                                {logoFile ? logoFile.name : "Upload New Logo"}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        if(e.target.files[0]) setLogoFile(e.target.files[0]);
                                    }}
                                />
                            </Button>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Recommended: PNG or JPG, transparent background
                            </Typography>
                        </Box>
                    </Grid>
                     <Grid item xs={12}>
                        <Button 
                            variant="contained" 
                            size="large" 
                            onClick={handleSaveSettings}
                            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                        >
                            Save Settings
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        )}

      {/* Add Employee Modal */}
      <Dialog 
        open={openAddModal} 
        onClose={() => setOpenAddModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>
          Add New Employee
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new employee profile. They will be able to log in with their email and the provided password.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee ID"
                placeholder="EMP001"
                value={newEmployee.employee_id}
                onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                placeholder="john.doe@company.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newEmployee.first_name}
                onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newEmployee.last_name}
                onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                placeholder="Engineering"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Designation"
                placeholder="Senior Developer"
                value={newEmployee.designation}
                onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="Default Password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={newEmployee.date_of_birth}
                onChange={(e) => setNewEmployee({...newEmployee, date_of_birth: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={newEmployee.gender}
                onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Address & Emergency Contact</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={newEmployee.address.city}
                onChange={(e) => setNewEmployee({...newEmployee, address: {...newEmployee.address, city: e.target.value}})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Name"
                value={newEmployee.emergency_contact.name}
                onChange={(e) => setNewEmployee({...newEmployee, emergency_contact: {...newEmployee.emergency_contact, name: e.target.value}})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={newEmployee.emergency_contact.phone}
                onChange={(e) => setNewEmployee({...newEmployee, emergency_contact: {...newEmployee.emergency_contact, phone: e.target.value}})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAddModal(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddEmployee}
            sx={{ borderRadius: 2, px: 4 }}
          >
            Create Employee
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Shift Modal */}
      <Dialog 
        open={openEditModal} 
        onClose={() => setOpenEditModal(false)}
        PaperProps={{ sx: { borderRadius: 3, width: '400px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Manage Schedule</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update working hours for <strong>{selectedEmployee?.name}</strong>. This will affect late/early login calculations.
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        type="time"
                        label="Shift Start Time"
                        InputLabelProps={{ shrink: true }}
                        value={editData.shift_start_time}
                        onChange={(e) => setEditData({...editData, shift_start_time: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        type="time"
                        label="Shift End Time"
                        InputLabelProps={{ shrink: true }}
                        value={editData.shift_end_time}
                        onChange={(e) => setEditData({...editData, shift_end_time: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Department"
                        value={editData.department}
                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateEmployee}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Holiday Modal */}
      <Dialog 
        open={openHolidayModal} 
        onClose={() => setOpenHolidayModal(false)}
        PaperProps={{ sx: { borderRadius: 3, width: '450px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Holiday</DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <TextField
                    fullWidth
                    label="Holiday Name"
                    placeholder="e.g. Diwali, Company Foundation Day"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                />
                <TextField
                    fullWidth
                    type="date"
                    label="Holiday Date"
                    InputLabelProps={{ shrink: true }}
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                />
                <TextField
                    fullWidth
                    select
                    label="Holiday Type"
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({...newHoliday, type: e.target.value})}
                    SelectProps={{ native: true }}
                >
                    <option value="public">Public Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="optional">Optional Holiday</option>
                </TextField>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description (Optional)"
                    value={newHoliday.description}
                    onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenHolidayModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddHoliday} disabled={!newHoliday.name || !newHoliday.date}>Add to Calendar</Button>
        </DialogActions>
      </Dialog>

      {/* Add Announcement Modal */}
      <Dialog 
        open={openAnnounceModal} 
        onClose={() => setOpenAnnounceModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Make Announcement</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Message"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Priority"
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                        SelectProps={{ native: true }}
                    >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label="Category"
                        value={newAnnouncement.category}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                        SelectProps={{ native: true }}
                    >
                        <option value="general">General</option>
                        <option value="policy">Policy Update</option>
                        <option value="holiday">Holiday/Event</option>
                        <option value="news">News</option>
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="date"
                        label="Expiration Date (Optional)"
                        InputLabelProps={{ shrink: true }}
                        value={newAnnouncement.expires_at}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})}
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAnnounceModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddAnnouncement}>Post Announcement</Button>
        </DialogActions>
      </Dialog>

      {/* Payroll Management Modal */}
      <Dialog 
        open={openPayrollModal} 
        onClose={() => setOpenPayrollModal(false)}
        maxWidth="md"
        fullWidth
        scroll="body"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>
            Payslip & Salary Management - {selectedEmployee?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
            <Tabs 
                value={payrollTab} 
                onChange={(e, v) => setPayrollTab(v)} 
                sx={{ px: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#f9f9f9' }}
            >
                <Tab label="Salary Structure" />
                <Tab label="Generate Payslip" />
            </Tabs>
            
            {payrollTab === 0 && (
                <Box sx={{ p: 3 }}>
                     {/* Template / Calculator */}
                     <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight={600} color="primary">Salary Template:</Typography>
                        <TextField 
                            size="small" 
                            placeholder="Enter Annual CTC" 
                            type="number"
                            sx={{ bgcolor: 'white' }}
                            id="ctc-input"
                        />
                        <Button 
                            variant="contained" 
                            size="small" 
                            onClick={() => {
                                const ctc = parseFloat(document.getElementById('ctc-input').value);
                                if (!ctc) return;
                                const monthlyCTC = ctc / 12;
                                const basic = Math.round(monthlyCTC * 0.5);
                                const hra = Math.round(basic * 0.5);
                                const special = Math.round(monthlyCTC - basic - hra - 1800 - 200 - 1500); // Rough calc
                                
                                setPayrollData({
                                    ...payrollData,
                                    salary_structure: {
                                        ...payrollData.salary_structure,
                                        basic: basic,
                                        hra: hra,
                                        conveyance: 1600,
                                        special_allowance: special > 0 ? special : 0,
                                        professional_allowance: 0,
                                        uniform_allowance: 0,
                                        shift_allowance: 0,
                                        medical_allowance: 1250,
                                        pf_employer: 1800,
                                        pf_employee: 1800,
                                        professional_tax: 200
                                    }
                                });
                            }}
                        >
                            Auto-Fill from CTC
                        </Button>
                     </Box>

                     <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>EARNINGS</Typography>
                     <Grid container spacing={2} sx={{ mb: 3 }}>
                         {Object.keys(payrollData.salary_structure).filter(k => !['pf_employer', 'pf_employee', 'professional_tax'].includes(k)).map((key) => (
                             <Grid item xs={12} md={4} key={key}>
                                 <TextField
                                     fullWidth
                                     size="small"
                                     label={key.replace(/_/g, ' ').toUpperCase()}
                                     type="number"
                                     value={payrollData.salary_structure[key]}
                                     onChange={(e) => setPayrollData({
                                         ...payrollData,
                                         salary_structure: { ...payrollData.salary_structure, [key]: parseFloat(e.target.value) || 0 }
                                     })}
                                 />
                             </Grid>
                         ))}
                     </Grid>

                     <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'error.main' }}>DEDUCTIONS & CONTRIBUTIONS</Typography>
                     <Grid container spacing={2} sx={{ mb: 3 }}>
                         {['pf_employee', 'pf_employer', 'professional_tax'].map((key) => (
                             <Grid item xs={12} md={4} key={key}>
                                 <TextField
                                     fullWidth
                                     size="small"
                                     label={key.replace(/_/g, ' ').toUpperCase()}
                                     type="number"
                                     value={payrollData.salary_structure[key]}
                                     onChange={(e) => setPayrollData({
                                         ...payrollData,
                                         salary_structure: { ...payrollData.salary_structure, [key]: parseFloat(e.target.value) || 0 }
                                     })}
                                 />
                             </Grid>
                         ))}
                     </Grid>


                     {/* Bank Details section removed as per user request */}

                     <Box sx={{ mt: 3, textAlign: 'right' }}>
                         <Button variant="contained" onClick={handleSaveSalary}>Update Salary Details</Button>
                     </Box>
                </Box>
            )}

            {payrollTab === 1 && (
                <Box sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        Generate a new payslip for <strong>{selectedEmployee?.name}</strong>. 
                        Ensure salary details are up to date before generation.
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                             <TextField
                                 fullWidth
                                 select
                                 label="Month"
                                 value={generateData.month}
                                 onChange={(e) => setGenerateData({ ...generateData, month: e.target.value })}
                                 SelectProps={{ native: true }}
                             >
                                 {[
                                     "January", "February", "March", "April", "May", "June", 
                                     "July", "August", "September", "October", "November", "December"
                                 ].map(m => <option key={m} value={m}>{m}</option>)}
                             </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                             <TextField
                                 fullWidth
                                 label="Year"
                                 type="number"
                                 value={generateData.year}
                                 onChange={(e) => setGenerateData({ ...generateData, year: parseInt(e.target.value) })}
                             />
                        </Grid>
                        <Grid item xs={12} md={6}>
                             <TextField
                                 fullWidth
                                 label="Total Working Days"
                                 type="number"
                                 value={generateData.working_days}
                                 onChange={(e) => setGenerateData({ ...generateData, working_days: parseInt(e.target.value) })}
                             />
                        </Grid>
                        <Grid item xs={12} md={6}>
                             <TextField
                                 fullWidth
                                 label="Loss of Pay (Days)"
                                 type="number"
                                 value={generateData.loss_of_pay_days}
                                 onChange={(e) => setGenerateData({ ...generateData, loss_of_pay_days: parseFloat(e.target.value) })}
                                 helperText="Leave 0 for auto-calculation in bulk"
                             />
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                size="large" 
                                startIcon={<CurrencyRupee />}
                                onClick={handleGeneratePayslip}
                                sx={{ mt: 2 }}
                            >
                                Generate Payslip
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Button onClick={() => setOpenPayrollModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%', borderRadius: 2 }}>
          {errorMsg}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          {successMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
