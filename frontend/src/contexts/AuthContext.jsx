import React, { createContext, useState, useEffect } from 'react';
// import jwtDecode from 'jwt-decode';


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(() => {
const raw = localStorage.getItem('user');
return raw ? JSON.parse(raw) : null;
});


useEffect(() => {
if (user) localStorage.setItem('user', JSON.stringify(user));
else localStorage.removeItem('user');
}, [user]);


const login = (token, userData) => {
localStorage.setItem('token', token);
setUser(userData);
};


const logout = () => {
localStorage.removeItem('token');
localStorage.removeItem('user');
setUser(null);
};


return (
<AuthContext.Provider value={{ user, setUser, login, logout }}>
{children}
</AuthContext.Provider>
);
};