import { createSlice } from '@reduxjs/toolkit';

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    leaves: [],
    balance: null,
    loading: false,
    error: null,
  },
  reducers: {
    setLeaves: (state, action) => {
      state.leaves = action.payload;
    },
    setLeaveBalance: (state, action) => {
      state.balance = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setLeaves, setLeaveBalance, setLoading, setError } = leaveSlice.actions;
export default leaveSlice.reducer;
