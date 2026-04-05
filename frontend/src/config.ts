// Central Configuration for ISAES Intelligence Core
// Automatically detects environment and switches from Localhost to Production URLs

const isProd = import.meta.env.PROD;

// Replace these placeholders with your actual deployed URLs once they are live!
const PROD_API = "https://isaes-backend.onrender.com"; 
const PROD_WS = "ws://isaes-backend.onrender.com";

export const API_BASE_URL = isProd ? PROD_API : "http://localhost:8000";
export const WS_BASE_URL = isProd ? PROD_WS : "ws://localhost:8000";

console.log(`[ISAES] Internal Config: Running in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode.`);
console.log(`[ISAES] API Target: ${API_BASE_URL}`);
