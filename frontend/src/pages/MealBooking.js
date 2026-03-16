/**
 * Meal Booking Page
 * Employees can book meals for upcoming working days
 */
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    Close,
    FactCheck,
    LocalDining,
    QrCode,
    Restaurant,
    RestaurantMenu
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Snackbar,
    Stack,
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
import { useEffect, useState } from 'react';
import QRCode from "react-qr-code";
import { useSelector } from 'react-redux';
import { holidayAPI, mealAPI } from '../services/api';
import { getErrorMessage } from '../utils/error';

const MealBooking = () => {
    const theme = useTheme();
    const { user } = useSelector((state) => state.auth);
    
    const [tabValue, setTabValue] = useState(0);
    const [myMeals, setMyMeals] = useState([]);
    const mealsList = Array.isArray(myMeals) ? myMeals : [];
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Date Generation
    const [workingDays, setWorkingDays] = useState([]);

    // Booking Modal
    const [openBookModal, setOpenBookModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [bookingData, setBookingData] = useState({
        meal_type: 'lunch',
        category: 'veg',
        items: '',
        special_request: ''
    });
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedQrMeal, setSelectedQrMeal] = useState(null);
    
    const [dailyMenu, setDailyMenu] = useState(null);
    const [menuLoading, setMenuLoading] = useState(false);
    
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (holidays.length >= 0) {
            generateWorkingDays();
        }
    }, [holidays]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mealsRes, holidaysRes] = await Promise.all([
                mealAPI.getMyMeals(),
                holidayAPI.getAll()
            ]);
            setMyMeals(Array.isArray(mealsRes.data) ? mealsRes.data : []);
            setHolidays(Array.isArray(holidaysRes.data) ? holidaysRes.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateWorkingDays = () => {
        const days = [];
        let currentDate = new Date();
        currentDate.setHours(0,0,0,0);
        
        // Generate next 14 days and filter
        for(let i=0; i<14; i++) {
            const tempDate = new Date(currentDate);
            tempDate.setDate(currentDate.getDate() + i);
            // Fix: Use local date string components to avoid timezone shift
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, '0');
            const day = String(tempDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            // Check Weekend
            if (tempDate.getDay() === 0 || tempDate.getDay() === 6) continue;
            
            // Check Holiday
            if (holidays.some(h => h.date.startsWith(dateStr))) continue;

            days.push({
                date: dateStr,
                display: tempDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
                fullDate: tempDate
            });
        }
        setWorkingDays(days.slice(0, 5)); // Show next 5 available working days
    };

    const handleDateClick = async (day) => {
        // Check if already booked
        const existing = mealsList.find(m => m.booking_date === day.date && ['booked', 'consumed'].includes(m.status));
        if (existing) {
            setSnackbar({ open: true, message: 'You have already booked/consumed a meal for this date', severity: 'warning' });
            return;
        }

        setSelectedDate(day);
        setBookingData({
            meal_type: 'lunch',
            category: 'veg',
            items: '',
            special_request: ''
        });
        
        // Fetch Menu
        setMenuLoading(true);
        setDailyMenu(null);
        try {
            const res = await mealAPI.getMenu(day.date);
            setDailyMenu(res.data);
        } catch (error) {
            // If 404, it means no menu is set
            console.log("No menu found");
        } finally {
            setMenuLoading(false);
        }
        
        setOpenBookModal(true);
    };

    const handleBookMeal = async () => {
        if (!bookingData.items.trim()) {
            setSnackbar({ open: true, message: 'Please specify meal items', severity: 'error' });
            return;
        }

        try {
            await mealAPI.book({
                ...bookingData,
                booking_date: selectedDate.date
            });
            setSnackbar({ open: true, message: 'Meal booked successfully!', severity: 'success' });
            setOpenBookModal(false);
            fetchData();
        } catch (error) {
            setSnackbar({ open: true, message: getErrorMessage(error), severity: 'error' });
        }
    };

    const handleCancelMeal = async (id) => {
        if(!window.confirm("Are you sure you want to cancel this meal?")) return;
        try {
            await mealAPI.cancel(id);
            setSnackbar({ open: true, message: 'Booking cancelled.', severity: 'info' });
            fetchData();
        } catch (error) {
             setSnackbar({ open: true, message: getErrorMessage(error), severity: 'error' });
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Meal Booking
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Select a date to book your meal
                    </Typography>
                </Box>
            </Box>

            {/* working Days Grid */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Upcoming Working Days</Typography>
            <Grid container spacing={2} sx={{ mb: 6 }}>
                {workingDays.map((day) => {
                     const existingMeal = mealsList.find(m => m.booking_date === day.date && ['booked', 'consumed'].includes(m.status));
                     const isBooked = !!existingMeal;
                     const statusLabel = existingMeal?.status === 'consumed' ? 'Consumed' : 'Booked';
                     
                     return (
                        <Grid item xs={6} sm={4} md={2} key={day.date}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    border: isBooked ? (existingMeal?.status === 'consumed' ? '2px solid #9e9e9e' : '2px solid #4caf50') : '1px solid rgba(0,0,0,0.1)',
                                    bgcolor: isBooked ? (existingMeal?.status === 'consumed' ? 'rgba(0,0,0,0.05)' : 'rgba(76, 175, 80, 0.05)') : 'white'
                                }}
                            >
                                <CardActionArea onClick={() => handleDateClick(day)} disabled={isBooked} sx={{ height: '100%', p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        {day.fullDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                                        {day.fullDate.getDate()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {day.fullDate.toLocaleDateString('en-US', { month: 'short' })}
                                    </Typography>
                                    {isBooked && (
                                        <Chip 
                                            label={statusLabel} 
                                            size="small" 
                                            color={existingMeal?.status === 'consumed' ? 'default' : 'success'} 
                                            sx={{ mt: 1, height: 20, fontSize: '0.65rem' }} 
                                        />
                                    )}
                                </CardActionArea>
                            </Card>
                        </Grid>
                     );
                })}
            </Grid>

            {/* My Bookings List */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="My Upcoming Meals" />
                    <Tab label="History" />
                </Tabs>
                <Box sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.neutral' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>QR Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mealsList
                                    .filter(m => {
                                        const isUpcoming = new Date(m.booking_date) >= new Date().setHours(0,0,0,0);
                                        return tabValue === 0 ? isUpcoming : !isUpcoming;
                                    })
                                    .map((meal) => (
                                    <TableRow key={meal.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {new Date(meal.booking_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                            <Chip 
                                                label={meal.meal_type} 
                                                variant="outlined"
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                            <Chip 
                                                label={meal.category || 'veg'}
                                                color={meal.category === 'non-veg' ? 'error' : 'success'}
                                                size="small"
                                                icon={meal.category === 'non-veg' ? <RestaurantMenu sx={{fontSize:'12px !important'}}/> : <LocalDining sx={{fontSize:'12px !important'}}/>}
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{meal.items || '-'}</TableCell>
                                        <TableCell>
                                            {meal.status === 'booked' && (
                                                <Button 
                                                    startIcon={<QrCode />} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    onClick={() => { setSelectedQrMeal(meal); setQrModalOpen(true); }}
                                                >
                                                    Show QR
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={meal.status} 
                                                color={meal.status === 'booked' ? 'success' : 'default'} 
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {meal.status === 'booked' && new Date(meal.booking_date) >= new Date().setHours(0,0,0,0) && (
                                                <IconButton color="error" size="small" onClick={() => handleCancelMeal(meal.id || meal._id)}>
                                                    <CancelIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {mealsList.filter(m => {
                                        const isUpcoming = new Date(m.booking_date) >= new Date().setHours(0,0,0,0);
                                        return tabValue === 0 ? isUpcoming : !isUpcoming;
                                    }).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                            No meals found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>

            {/* QR Code Modal */}
            <Dialog 
                open={qrModalOpen} 
                onClose={() => setQrModalOpen(false)} 
                maxWidth="xs" 
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Meal QR Code</Typography>
                    <IconButton onClick={() => setQrModalOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4 }}>
                    {selectedQrMeal && (
                        <>
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #eee' }}>
                                <QRCode 
                                    value={JSON.stringify({
                                        meal_id: selectedQrMeal.id || selectedQrMeal._id,
                                        employee_id: user.employee_id
                                    })} 
                                    size={200}
                                />
                            </Box>
                            <Typography sx={{ mt: 2, fontWeight: 600 }}>
                                {new Date(selectedQrMeal.booking_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedQrMeal.meal_type.toUpperCase()} - {selectedQrMeal.category.toUpperCase()}
                            </Typography>
                            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                                Show this QR code to the admin to redeem your meal.
                            </Alert>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Book Box Modal */}
            <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Restaurant />
                    Reserve Meal for {selectedDate?.display}
                </DialogTitle>
                <DialogContent dividers>
                    {!menuLoading && !dailyMenu ? (
                        <Alert severity="warning">
                            Menu has not been decided for this date yet. Please check back later or contact admin.
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl>
                                    <FormLabel id="meal-type-group">Meal Type</FormLabel>
                                    <RadioGroup
                                        row
                                        aria-labelledby="meal-type-group"
                                        value={bookingData.meal_type}
                                        onChange={(e) => setBookingData({...bookingData, meal_type: e.target.value})}
                                    >
                                        <FormControlLabel value="lunch" control={<Radio />} label="Lunch" />
                                        <FormControlLabel value="dinner" control={<Radio />} label="Dinner" />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                            
                            {/* <Grid item xs={12}>
                                    <FormControl>
                                    <FormLabel id="category-group">Category</FormLabel>
                                    <RadioGroup
                                        row
                                        aria-labelledby="category-group"
                                        value={bookingData.category}
                                        onChange={(e) => setBookingData({...bookingData, category: e.target.value})}
                                    >
                                        <FormControlLabel value="veg" control={<Radio color="success"/>} label="Veg" />
                                        <FormControlLabel value="non-veg" control={<Radio color="error"/>} label="Non-Veg" />
                                    </RadioGroup>
                                </FormControl>
                            </Grid> */}

                            <Grid item xs={12}>
                                <Alert severity="info" icon={<FactCheck fontSize="inherit" />} sx={{mb: 2}}>
                                    Please select your meal option from today's menu.
                                </Alert>
                                <FormControl fullWidth required>
                                    {/* <FormLabel>Menu Option</FormLabel> */}
                                    <TextField
                                        select
                                        label="Select Meal Option"
                                        value={bookingData.items}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setBookingData({
                                                ...bookingData, 
                                                items: val,
                                                category: val.toLowerCase().includes('non-veg') ? 'non-veg' : 'veg'
                                            });
                                        }}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="" disabled>Select an option</option>
                                        {dailyMenu && Array.isArray(dailyMenu.options) && dailyMenu.options.map((opt, idx) => (
                                            <option key={idx} value={opt}>{opt}</option>
                                        ))}
                                    </TextField>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                    <TextField
                                    label="Special Request (Optional)"
                                    fullWidth
                                    value={bookingData.special_request}
                                    onChange={(e) => setBookingData({...bookingData, special_request: e.target.value})}
                                    placeholder="E.g. Less spicy..."
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenBookModal(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleBookMeal}
                        startIcon={<AddIcon />}
                        disabled={!dailyMenu || !bookingData.items}
                        sx={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        }}
                    >
                        Checkout & Book
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

export default MealBooking;
