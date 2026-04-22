import { createSlice } from "@reduxjs/toolkit";

const user = createSlice({
  name: "user",
  initialState: null, // start with no user
  reducers: {
    setUser: (state, action) => {
      return action.payload; // payload will be full user object
    },
    clearUser: () => {
      return null; // helpful when logging out
    }
  }
});

export const { setUser, clearUser } = user.actions;
export default user.reducer;
