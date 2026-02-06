import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
    try {
        const clientId = process.env.AIRPAY_CLIENT_ID;
        constclientSecret = process.env.AIRPAY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "Missing Airpay OAuth Credentials" }, { status: 500 });
        }

        // Endpoint for Token Generation
        // Using common v4 endpoint or standard oauth2 endpoint
        // Search result 1: https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2
        const tokenUrl = "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2";

        const formData = new URLSearchParams();
        formData.append('client_id', clientId);
        formData.append('client_secret', clientSecret);
        formData.append('grant_type', 'client_credentials');

        const response = await axios.post(tokenUrl, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data && response.data.access_token) {
            return NextResponse.json({
                success: true,
                access_token: response.data.access_token,
                expires_in: response.data.expires_in
            });
        } else {
            console.error("Airpay Token Response:", response.data);
            return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
        }

    } catch (error) {
        console.error("Airpay Token Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
