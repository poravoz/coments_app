import axios from "axios";

export const axiosInstanace = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    withCredentials: true,
})