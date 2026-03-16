/**
 * Employee Profile Page
 * View and update personal information
 */
import {
    AccountBalance,
    Business,
    ContactPhone,
    Email,
    Home,
    Person,
    Save,
    Schedule,
    Security
} from '@mui/icons-material';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Snackbar,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
// Removed MuiAlert import as Alert is now imported directly from @mui/material
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { employeeAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import { getErrorMessage } from '../utils/error';

const Profile = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await employeeAPI.getProfile();
            const data = response.data;
            
            setProfileData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                phone: data.phone || '',
                address: data.address || {
                    street: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'India'
                },
                emergency_contact: data.emergency_contact || {
                    name: '',
                    relationship: '',
                    phone: ''
                },
                bank_details: data.bank_details || {
                    account_number: '',
                    bank_name: '',
                    ifsc_code: '',
                    pan_number: '',
                    uan_number: '',
                    payment_mode: 'Bank Transfer'
                }
            });
            
            // Sync with auth slice if needed
            dispatch(setUser(data));
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            // Fallback to redux user if API fails
            if (user) {
                const names = (user.name || '').split(' ');
                setProfileData({
                    first_name: user.first_name || names[0] || 'User',
                    last_name: user.last_name || names.slice(1).join(' ') || '',
                    phone: user.phone || '',
                    address: user.address || { street: '', city: '', state: '', postal_code: '', country: 'India' },
                    address: user.address || { street: '', city: '', state: '', postal_code: '', country: 'India' },
                    emergency_contact: user.emergency_contact || { name: '', relationship: '', phone: '' },
                    bank_details: user.bank_details || { account_number: '', bank_name: '', ifsc_code: '', pan_number: '', uan_number: '', payment_mode: 'Bank Transfer' }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setSaving(true);
            const response = await employeeAPI.updateProfile(profileData);
            
            // Update Redux state with new user data
            dispatch(setUser(response.data.employee));
            
            setSnackbar({
                open: true,
                message: 'Profile updated successfully!',
                severity: 'success'
            });
            setEditMode(false);
        } catch (error) {
            setSnackbar({
                open: true,
                message: getErrorMessage(error),
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value, nestedField = null) => {
        if (nestedField) {
            setProfileData({
                ...profileData,
                [field]: {
                    ...profileData[field],
                    [nestedField]: value
                }
            });
        } else {
            setProfileData({
                ...profileData,
                [field]: value
            });
        }
    };

    if (loading || !profileData) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar 
                        sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'primary.main',
                            fontSize: '2.5rem',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}
                    >
                        {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                        {user?.last_name?.charAt(0) || ''}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.name || 'Employee'}
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {user?.designation} • {user?.department}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Chip label={user?.employee_id} size="small" variant="outlined" />
                            <Chip 
                                label={user?.role?.toUpperCase() || 'EMPLOYEE'} 
                                color="primary" 
                                size="small" 
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    </Box>
                </Box>
                <Button
                    variant={editMode ? "outlined" : "contained"}
                    startIcon={editMode ? null : <Save />}
                    onClick={() => editMode ? handleUpdate() : setEditMode(true)}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : editMode ? 'Save Profile' : 'Edit Profile'}
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column - Personal Information */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 3, height: '100%', boxShadow: theme.shadows[2] }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <Person color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Personal Details</Typography>
                            </Box>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        value={profileData.first_name}
                                        disabled={true}
                                        variant="filled"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        value={profileData.last_name}
                                        disabled={true}
                                        variant="filled"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={user?.email || ''}
                                        disabled={true}
                                        variant="filled"
                                        size="small"
                                        InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} /> }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={profileData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={!editMode}
                                        size="small"
                                        InputProps={{ startAdornment: <ContactPhone sx={{ mr: 1, color: editMode ? 'primary.main' : 'text.disabled', fontSize: 20 }} /> }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <Home color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Address</Typography>
                            </Box>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Street"
                                        value={profileData.address.street}
                                        onChange={(e) => handleInputChange('address', e.target.value, 'street')}
                                        disabled={!editMode}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="City"
                                        value={profileData.address.city}
                                        onChange={(e) => handleInputChange('address', e.target.value, 'city')}
                                        disabled={!editMode}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="State"
                                        value={profileData.address.state}
                                        onChange={(e) => handleInputChange('address', e.target.value, 'state')}
                                        disabled={!editMode}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="ZIP Code"
                                        value={profileData.address.postal_code}
                                        onChange={(e) => handleInputChange('address', e.target.value, 'postal_code')}
                                        disabled={!editMode}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Employment & Emergency Stack */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* 1. Employment Profile (Upper) */}
                        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                             <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Business color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Employment Profile</Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <InfoRow label="Joining Date" value={user?.joining_date ? new Date(user.joining_date).toLocaleDateString() : 'N/A'} />
                                    <InfoRow label="Employment Type" value={user?.employment_type || 'N/A'} />
                                    <InfoRow label="Department" value={user?.department || 'N/A'} />
                                    <InfoRow label="Designation" value={user?.designation || 'N/A'} />
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                                        <Schedule fontSize="small" />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Shift Timing</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ ml: 3 }}>
                                        {user?.shift_start_time || '09:00'} - {user?.shift_end_time || '18:00'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* 2. Emergency Contact (Lower) */}
                         <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                             <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Security color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Emergency Contact</Typography>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Contact Name"
                                            value={profileData.emergency_contact.name}
                                            onChange={(e) => handleInputChange('emergency_contact', e.target.value, 'name')}
                                            disabled={!editMode}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Relationship"
                                            value={profileData.emergency_contact.relationship}
                                            onChange={(e) => handleInputChange('emergency_contact', e.target.value, 'relationship')}
                                            disabled={!editMode}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={profileData.emergency_contact.phone}
                                            onChange={(e) => handleInputChange('emergency_contact', e.target.value, 'phone')}
                                            disabled={!editMode}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>

                {/* Bottom Row - Bank Details */}
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AccountBalance color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Bank & Statutory Details</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                (Locked after submission. Contact HR for changes.)
                            </Typography>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Account Number"
                                        value={profileData.bank_details.account_number}
                                        onChange={(e) => handleInputChange('bank_details', e.target.value, 'account_number')}
                                        disabled={!editMode || (user?.bank_details?.account_number && user.bank_details.account_number.length > 0)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Bank Name"
                                        value={profileData.bank_details.bank_name}
                                        onChange={(e) => handleInputChange('bank_details', e.target.value, 'bank_name')}
                                        disabled={!editMode || (user?.bank_details?.account_number && user.bank_details.account_number.length > 0)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="IFSC Code"
                                        value={profileData.bank_details.ifsc_code}
                                        onChange={(e) => handleInputChange('bank_details', e.target.value, 'ifsc_code')}
                                        disabled={!editMode || (user?.bank_details?.account_number && user.bank_details.account_number.length > 0)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="PAN Number"
                                        value={profileData.bank_details.pan_number}
                                        onChange={(e) => handleInputChange('bank_details', e.target.value, 'pan_number')}
                                        disabled={!editMode || (user?.bank_details?.account_number && user.bank_details.account_number.length > 0)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="UAN Number"
                                        value={profileData.bank_details.uan_number}
                                        onChange={(e) => handleInputChange('bank_details', e.target.value, 'uan_number')}
                                        disabled={!editMode || (user?.bank_details?.account_number && user.bank_details.account_number.length > 0)}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%', borderRadius: 2 }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{label}:</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{value}</Typography>
    </Box>
);

// Local Chip component removed as we import from @mui/material now

export default Profile;
