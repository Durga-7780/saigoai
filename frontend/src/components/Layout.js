/**
 * Layout Component
 * Main layout with sidebar navigation
 */
import {
    AdminPanelSettings,
    Assessment,
    Chat,
    Circle as CircleIcon,
    Dashboard as DashboardIcon,
    Description,
    EventNote,
    Fingerprint,
    Logout,
    Menu as MenuIcon,
    Mic,
    Notifications as NotificationsIcon,
    Person,
    Receipt,
    RestaurantMenu,
    Settings
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { logout } from '../store/slices/authSlice';

const drawerWidth = 280;

// Menu items configuration moved inside component to access user role

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
        fetchNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
        const response = await notificationAPI.getMyNotifications();
        setNotifications(response.data);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkRead = async (id) => {
    try {
        await notificationAPI.markAsRead(id);
        fetchNotifications();
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.is_read).length;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          Saigo Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {(() => {
            let menuItems = [];
            if (user?.role === 'admin') {
                // Customized Admin View
                menuItems = [
                    { text: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin' },
                    { text: 'AI Reports', icon: <Assessment />, path: '/reports' },
                    { text: 'AI Assistance', icon: <Chat />, path: '/chatbot' },
                    { text: 'Voice Bot', icon: <Mic />, path: '/voicebot' },
                    { text: 'Profile', icon: <Person />, path: '/profile' }
                ];
            } else if (user?.role === 'hr') {
                // Customized HR View (Specific Order)
                menuItems = [
                    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
                    { text: 'Attendance', icon: <Fingerprint />, path: '/attendance' },
                    { text: 'Leave Management', icon: <EventNote />, path: '/leaves' },
                    { text: 'Meal Booking', icon: <RestaurantMenu />, path: '/meals' },
                    { text: 'My Salary', icon: <Receipt />, path: '/salary' },
                    { text: 'AI Assistant', icon: <Chat />, path: '/chatbot' },
                    { text: 'Voice Bot', icon: <Mic />, path: '/voicebot' },
                    { text: 'AI Reports', icon: <Assessment />, path: '/reports' },
                    { text: 'Documents & Compliance', icon: <Description />, path: '/documents' },
                    { text: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin' },
                    { text: 'Profile', icon: <Person />, path: '/profile' }
                ];
            } else {
                // Standard Employee View
                menuItems = [
                    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
                    { text: 'Attendance', icon: <Fingerprint />, path: '/attendance' },
                    { text: 'Leave Management', icon: <EventNote />, path: '/leaves' },
                    { text: 'Meal Booking', icon: <RestaurantMenu />, path: '/meals' },
                    { text: 'My Salary', icon: <Receipt />, path: '/salary' },
                    { text: 'Documents & Compliance', icon: <Description />, path: '/documents' },
                    { text: 'AI Assistant', icon: <Chat />, path: '/chatbot' },
                    { text: 'Voice Bot', icon: <Mic />, path: '/voicebot' },
                    { text: 'Profile', icon: <Person />, path: '/profile' }
                ];
            }

            return menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'white' : 'text.primary',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            });
        })()}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleNotifOpen} sx={{ mr: 1 }}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon color="action" />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
                sx: { width: 450, maxHeight: 400, borderRadius: 2, mt: 1.5 }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {unreadCount > 0 && (
                        <Typography 
                            variant="caption" 
                            color="primary" 
                            sx={{ cursor: 'pointer', fontWeight: 600 }}
                            onClick={async () => { await notificationAPI.markAllAsRead(); fetchNotifications(); }}
                        >
                            Mark all read
                        </Typography>
                    )}
                    {notifications.length > 0 && (
                        <Typography 
                            variant="caption" 
                            color="error" 
                            sx={{ cursor: 'pointer', fontWeight: 600 }}
                            onClick={async () => { await notificationAPI.clearAll(); fetchNotifications(); }}
                        >
                            Clear all
                        </Typography>
                    )}
                </Box>
            </Box>
            <Divider />
            {(notifications || []).length > 0 ? (
                (Array.isArray(notifications) ? notifications : []).map((n) => (
                    <MenuItem 
                        key={n.id} 
                        onClick={() => { if(n.link) navigate(n.link); handleMarkRead(n.id); handleNotifClose(); }}
                        sx={{ 
                            py: 1.5,
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            bgcolor: n.is_read ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}
                    >
                        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700 }}>{n.title}</Typography>
                            {!n.is_read && <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {n.message}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </MenuItem>
                ))
            ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                </Box>
            )}
          </Menu>

          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon><Person /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
              <ListItemIcon><Settings /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
