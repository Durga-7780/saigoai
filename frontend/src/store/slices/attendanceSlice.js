import { createSlice } from '@reduxjs/toolkit';

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    todayAttendance: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    setAttendanceRecords: (state, action) => {
      state.records = action.payload;
    },
    setTodayAttendance: (state, action) => {
      state.todayAttendance = action.payload;
    },
    setAttendanceStats: (state, action) => {
      state.stats = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAttendanceRecords,
  setTodayAttendance,
  setAttendanceStats,
  setLoading,
  setError,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
