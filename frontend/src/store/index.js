/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit';
import attendanceReducer from './slices/attendanceSlice';
import authReducer from './slices/authSlice';
import leaveReducer from './slices/leaveSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
  },
});

export default store;
