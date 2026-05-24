import { Request } from 'express';
import { CorsOptions, CorsOptionsDelegate } from 'cors';
import AppError from '../../shared/utils/appError.js';



const clients: Record<string, string> = process.env.CORS_CLIENTS 
    ? JSON.parse(process.env.CORS_CLIENTS) 
    : {};

const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
    const origin = req.header('Origin');
    const clientType = origin ? clients[origin] : null;
    
    // --- 1. Origin Check ---
    // If there is an origin, but it's not in our list, return an error
    if (origin && !clientType) {
        return callback(new AppError('Not allowed by CORS', 403));
    }

    // --- 2. Dynamic Methods Logic ---
    let allowedMethods = ['GET', 'POST']; // Default (Mobile/No Origin)

    if (clientType === 'storefront' || clientType === 'crm') {
        allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    }

    // --- 3. Credentials Logic ---
    const isCredentialsAllowed = clientType === 'storefront' || clientType === 'crm';

    // --- 4. Final Construction ---
    const corsOptions: CorsOptions = {
        origin: true, // Mirrors the request origin back to the client
        methods: allowedMethods.join(','),
        credentials: isCredentialsAllowed,
        optionsSuccessStatus: 200
    };

    callback(null, corsOptions);
};

export default corsOptionsDelegate;