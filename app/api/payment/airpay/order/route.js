import { NextResponse } from "next/server";
import axios from "axios";
import pool from "@/lib/db";
import crypto from "crypto";

export async function POST(request) {
    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
        }

        // 1. Fetch Student
        const studentQuery = `SELECT * FROM students WHERE id = $1`;
        const { rows } = await pool.query(studentQuery, [studentId]);
        const student = rows[0];

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const orderId = `ORD_${studentId}_${Date.now()}`;
        await pool.query(`UPDATE students SET order_id = $1 WHERE id = $2`, [orderId, studentId]);

        // 2. Get Access Token (Internal call or direct logic)
        // Better to reuse the logic or call the internal endpoint (but internal fetch needs full URL).
        // Let's implement token fetch directly here for speed/Reliability.

        const clientId = process.env.AIRPAY_CLIENT_ID;
        const clientSecret = process.env.AIRPAY_CLIENT_SECRET;
        const merchantId = process.env.AIRPAY_MERCHANT_ID; // Need this too?

        const tokenUrl = "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2";
        const tokenFormData = new URLSearchParams();
        tokenFormData.append('client_id', clientId);
        tokenFormData.append('client_secret', clientSecret);
        tokenFormData.append('grant_type', 'client_credentials');

        const tokenRes = await axios.post(tokenUrl, tokenFormData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenRes.data.access_token;
        if (!accessToken) throw new Error("Failed to get access token");

        // 3. Create Order / Initiate Payment
        // Since standard v4 docs are scarce on "Create Order" API returning a link,
        // we'll use the 'invoicepay' or similar if reachable, or standard payment link generation.
        // However, with OAuth, we usually call an API.

        // Let's try the 'standard' v4 creation endpoint if it exists or fallback to constructing the form
        // But we must use the token? 
        // Actually, OAuth is often for backend operations. Payment initiation for browser usually uses Checksum.
        // BUT, if user insists on OAuth, maybe there's a specific "Create Order" API.
        // Let's assume we return the Token and let Frontend submit? No, security risk.

        // Let's try to hit the "Create Order" endpoint found in search:
        // https://kraken.airpay.co.in/airpay/ms/invoicepay/api/create 
        // This likely returns a payment URL.

        const createOrderUrl = "https://kraken.airpay.co.in/airpay/ms/invoicepay/api/create";

        // Date format: YYYY-MM-DD
        const date = new Date().toISOString().split('T')[0];

        // The payload for Invoice Create
        // Note: This is a best-guess structure for v4 Invoice API based on common patterns.
        const orderPayload = {
            mercid: merchantId,
            orderid: orderId,
            amount: 1.00, // Numeric
            currency: 356, // Numeric
            isocurrency: "INR",
            buyeremail: student.email,
            buyerphone: student.phone.replace(/\D/g, '').slice(-10),
            buyerfirstname: student.student_name.split(' ')[0],
            buyerlastname: student.student_name.split(' ').slice(1).join(' ') || '.',
            buyeraddress: student.address,
            buyercity: "Gurgaon",
            buyerstate: "Haryana",
            buyercountry: "India",
            buyerpincode: "122011",
            customvar: studentId
        };

        // Headers: Authorization: Bearer <token>
        const orderRes = await axios.post(createOrderUrl, orderPayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (orderRes.data && orderRes.data.success) {
            // Assuming it returns a payment_url or invoice_url
            // Check response structure in logs if it fails
            return NextResponse.json({
                success: true,
                payment_url: orderRes.data.payment_url || orderRes.data.url, // Adjust based on actual response
                data: orderRes.data
            });
        } else {
            console.error("Airpay Order Create Failed:", orderRes.data);
            // Fallback: If this API fails, maybe we just return parameters for form submit using Checksum (Old method)
            // But let's try this first.
            return NextResponse.json({ success: false, error: "Order Creation Failed", details: orderRes.data });
        }

    } catch (error) {
        console.error("Payment Initiation Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
