/**
 * Leave Management Page
 * Handles leave applications, balance tracking, and approvals
 */
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    ChevronLeft,
    ChevronRight,
    Event as EventIcon,
    History as HistoryIcon,
    Info as InfoIcon,
    Laptop as LaptopIcon
} from '@mui/icons-material';
import {
    Autocomplete,
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
    MenuItem,
    Paper,
    Snackbar,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { employeeAPI, holidayAPI, leaveAPI, requestAPI } from '../services/api';
import { getErrorMessage } from '../utils/error';

const LeaveManagement = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const isManagement = ['admin', 'hr', 'manager'].includes(user?.role);

  const [tabValue, setTabValue] = useState(0);
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]); // Store WFH requests
  
  // Modal states
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [openWFHModal, setOpenWFHModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  // Pagination & Month Navigation
  const [viewDate, setViewDate] = useState(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [wfhData, setWfhData] = useState({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: '',
      target_employee: null,
  });
  const [newLeave, setNewLeave] = useState({
    leave_type: 'casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    is_half_day: false
  });

  // Approval Dialog states
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');

  // Snackbar states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, myLeavesRes, holidayRes, requestsRes] = await Promise.all([
        leaveAPI.getBalance(),
        leaveAPI.getMyLeaves(),
        holidayAPI.getAll(),
        requestAPI.getAll()
      ]);
      setBalance(balanceRes.data);
      setMyLeaves(Array.isArray(myLeavesRes.data?.leaves) ? myLeavesRes.data.leaves : []);
      setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : []);
      setMyRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);

      if (isManagement) {
        const allLeavesRes = await leaveAPI.getAllLeaves();
        setAllLeaves(Array.isArray(allLeavesRes.data?.leaves) ? allLeavesRes.data.leaves : []);
      }
    } catch (error) {
      showSnackbar(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isManagement]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getHolidayOnDate = (dateStr) => {
    if (!dateStr || !Array.isArray(holidays)) return null;
    return holidays.find(h => new Date(h.date).toISOString().split('T')[0] === dateStr);
  };

  const handleApplyLeave = async () => {
    setApplyLoading(true);
    try {
      await leaveAPI.applyLeave({
        ...newLeave,
        employee_id: user?.employee_id
      });
      showSnackbar('Leave applied successfully!', 'success');
      setOpenApplyModal(false);
      fetchData();
    } catch (error) {
      showSnackbar(getErrorMessage(error), 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleOpenWFH = async () => {
      try {
          if (employees.length === 0) {
              const res = await employeeAPI.getAllEmployees();
              const allEmployees = res.data.employees || [];
              setEmployees((Array.isArray(allEmployees) ? allEmployees : []).filter(emp => emp.employee_id !== user?.employee_id));
          }
          setOpenWFHModal(true);
      } catch (error) {
          showSnackbar("Failed to fetch employee list", "error");
      }
  };

  const handleWFHSubmit = async () => {
      if (!wfhData.target_employee) {
          showSnackbar("Please select an employee", "error");
          return;
      }
      if (!wfhData.reason) {
          showSnackbar("Please provide a reason", "error");
          return;
      }

      setApplyLoading(true);
      try {
          const empName = wfhData.target_employee.name;
          const formattedReason = `Work From Home Request\nFrom: ${wfhData.start_date}\nTo: ${wfhData.end_date}\nNotify: ${empName} (${wfhData.target_employee.employee_id})\nReason: ${wfhData.reason}`;
          
          await requestAPI.create({
              request_type: 'work_from_home',
              reason: formattedReason,
              approver_id: wfhData.target_employee.employee_id
          });

          showSnackbar(`Work From Home request sent successfully!`, 'success');
          setOpenWFHModal(false);
          // Reset form
          setWfhData({
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date().toISOString().split('T')[0],
              reason: '',
              target_employee: null
          });
      } catch (error) {
          showSnackbar(getErrorMessage(error), 'error');
      } finally {
          setApplyLoading(false);
      }
  };

  const handleApproveReject = async (status) => {
    try {
      await leaveAPI.approveLeave({
        leave_id: selectedLeave.id,
        approver_id: user?.employee_id,
        status,
        comments: approvalComments
      });
      showSnackbar(`Leave ${status} successfully!`, 'success');
      setOpenApprovalModal(false);
      setSelectedLeave(null);
      setApprovalComments('');
      fetchData();
    } catch (error) {
      showSnackbar(getErrorMessage(error), 'error');
    }
  };

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default'
  };

  const BalanceCard = ({ title, value, color, icon: Icon }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.lighter`, color: `${color}.main`, mr: 2 }}>
            <Icon />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value} <Typography component="span" variant="body2" color="text.secondary">days</Typography>
        </Typography>
      </CardContent>
    </Card>
  );

  // Combine Leaves and WFH Requests for display
  const getCombinedApplications = () => {
      const wfhApplications = (Array.isArray(myRequests) ? myRequests : [])
          .filter(req => req.request_type === 'work_from_home' && req.employee_id === user?.employee_id)
          .map(req => {
              let startDate = req.created_at; // Fallback
              let endDate = req.created_at;   // Fallback
              
              try {
                  const lines = req.reason.split('\n');
                  const fromLine = lines.find(l => l.startsWith('From: '));
                  const toLine = lines.find(l => l.startsWith('To: '));
                  
                  if (fromLine) startDate = fromLine.replace('From: ', '');
                  if (toLine) endDate = toLine.replace('To: ', '');
              } catch (e) {
                  console.error("Error parsing WFH dates", e);
              }

              // Calculate duration roughly
              let durationDays = 1;
              if (startDate && endDate) {
                   const d1 = new Date(startDate);
                   const d2 = new Date(endDate);
                   const diffTime = Math.abs(d2 - d1);
                   durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
              }

              return {
                  id: req._id || req.id,
                  leave_type: 'Work From Home',
                  start_date: startDate,
                  end_date: endDate,
                  total_days: durationDays,
                  status: req.status,
                  applied_at: req.created_at,
                  is_wfh: true // Flag to distinguish
              };
          });
      
      return [...(Array.isArray(myLeaves) ? myLeaves : []), ...wfhApplications].sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
  };

  const combinedApplications = getCombinedApplications();
  
  // Filter by Month
  const filteredApplications = combinedApplications.filter(app => {
      const appDate = new Date(app.start_date);
      return appDate.getMonth() === viewDate.getMonth() && 
             appDate.getFullYear() === viewDate.getFullYear();
  });

  // Handle Month Change
  const handleMonthChange = (direction) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + direction);
      setViewDate(newDate);
      setPage(0); // Reset to first page on month change
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Leave Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LaptopIcon />}
              onClick={handleOpenWFH}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                borderWidth: 2,
                '&:hover': { borderWidth: 2, bgcolor: 'primary.lighter' }
              }}
            >
              Work From Home
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenApplyModal(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              }}
            >
              Apply New Leave
            </Button>
        </Box>
      </Box>

      {/* Balance Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <BalanceCard title="Casual Leaves" value={balance?.casual_leave || 0} color="primary" icon={EventIcon} />
        </Grid>
        <Grid item xs={12} md={3}>
          <BalanceCard title="Sick Leaves" value={balance?.sick_leave || 0} color="error" icon={InfoIcon} />
        </Grid>
        <Grid item xs={12} md={3}>
          <BalanceCard title="Annual Leaves" value={balance?.annual_leave || 0} color="success" icon={HistoryIcon} />
        </Grid>
        <Grid item xs={12} md={3}>
          <BalanceCard title="Total Available" value={balance?.total_available || 0} color="info" icon={CheckCircleIcon} />
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': { fontWeight: 600, py: 2 }
          }}
        >
          <Tab label="My Applications" />
          {isManagement && <Tab label="Pending Approvals" />}
        </Tabs>

        <Box sx={{ p: 0 }}>
          {tabValue === 0 && (
            <>
            {/* Month Navigator */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <IconButton onClick={() => handleMonthChange(-1)}>
                    <ChevronLeft />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center', fontWeight: 'bold' }}>
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Typography>
                <IconButton onClick={() => handleMonthChange(1)}>
                    <ChevronRight />
                </IconButton>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'background.neutral' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Applied On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave) => (
                    <TableRow key={leave.id} hover>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                          {leave.leave_type}
                          {leave.is_wfh && <LaptopIcon sx={{ ml: 1, fontSize: 16, color: 'primary.main', verticalAlign: 'text-bottom' }} />}
                      </TableCell>
                      <TableCell>
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{leave.total_days}</TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={statusColors[leave.status]}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize', borderRadius: 1.5 }}
                        />
                      </TableCell>
                      <TableCell>{new Date(leave.applied_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No leave or WFH applications found for this month.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredApplications.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            </>
          )}

          {tabValue === 1 && isManagement && (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'background.neutral' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(allLeaves) ? allLeaves : []).map((leave) => (
                    <TableRow key={leave.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{leave.employee_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{leave.employee_id}</Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{leave.leave_type}</TableCell>
                      <TableCell>
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {leave.total_days} days
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={statusColors[leave.status]}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize', borderRadius: 1.5 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {leave.status === 'pending' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => { setSelectedLeave(leave); setOpenApprovalModal(true); }}
                            sx={{ borderRadius: 1.5 }}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Apply Leave Modal */}
      <Dialog open={openApplyModal} onClose={() => setOpenApplyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Leave</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Leave Type"
                value={newLeave.leave_type}
                onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
              >
                <MenuItem value="casual">Casual Leave</MenuItem>
                <MenuItem value="sick">Sick Leave</MenuItem>
                <MenuItem value="annual">Annual Leave</MenuItem>
                <MenuItem value="maternity">Maternity Leave</MenuItem>
                <MenuItem value="paternity">Paternity Leave</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={newLeave.start_date}
                onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={newLeave.end_date}
                onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
              />
            </Grid>
            { (getHolidayOnDate(newLeave.start_date) || getHolidayOnDate(newLeave.end_date)) && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'warning.lighter', color: 'warning.dark', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InfoIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Note: {getHolidayOnDate(newLeave.start_date)?.name || getHolidayOnDate(newLeave.end_date)?.name} is a holiday. You might not need to apply for leave!
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Leave"
                placeholder="Briefly explain the reason for your leave application..."
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenApplyModal(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApplyLeave}
            disabled={applyLoading}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {applyLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Work From Home Modal */}
      <Dialog open={openWFHModal} onClose={() => setOpenWFHModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LaptopIcon color="primary" />
            Request Work From Home
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0 }}>
             <Grid item xs={12}>
                <Autocomplete
                    options={employees}
                    getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
                    value={wfhData.target_employee}
                    onChange={(event, newValue) => {
                        setWfhData({ ...wfhData, target_employee: newValue });
                    }}
                    renderInput={(params) => <TextField {...params} label="Select Employee to Notify" placeholder="Search by name..." fullWidth />}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Request will be sent to this employee and all HRs.
                </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={wfhData.start_date}
                onChange={(e) => setWfhData({ ...wfhData, start_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={wfhData.end_date}
                onChange={(e) => setWfhData({ ...wfhData, end_date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason"
                placeholder="Reason for WFH..."
                value={wfhData.reason}
                onChange={(e) => setWfhData({ ...wfhData, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenWFHModal(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleWFHSubmit}
            disabled={applyLoading}
            startIcon={<LaptopIcon />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {applyLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={openApprovalModal} onClose={() => setOpenApprovalModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Review Leave Application</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedLeave?.employee_name}</Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
            <Typography variant="body2">{selectedLeave?.reason || 'No reason provided'}</Typography>
          </Box>
          <TextField
            fullWidth
            label="Approver Comments"
            multiline
            rows={2}
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleApproveReject('rejected')}
            sx={{ borderRadius: 2 }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleApproveReject('approved')}
            sx={{ borderRadius: 2 }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default LeaveManagement;
