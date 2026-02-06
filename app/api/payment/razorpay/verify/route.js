import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";

export async function POST(request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            studentId
        } = await request.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Database update
            await pool.query(
                `UPDATE students SET payment_status = 'SUCCESS', payment_id = $1 WHERE id = $2`,
                [razorpay_payment_id, studentId]
            );

            return NextResponse.json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            await pool.query(
                `UPDATE students SET payment_status = 'FAILED' WHERE id = $1`,
                [studentId]
            );
            return NextResponse.json({
                success: false,
                message: "Invalid signature"
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
