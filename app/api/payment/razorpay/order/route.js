import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request) {
    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
        }

        const instance = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: 100, // amount in the smallest currency unit (paise) -> 100 paise = 1 INR
            currency: "INR",
            receipt: `order_rcptid_${studentId}`,
        };

        const order = await instance.orders.create(options);

        // Update student with order_id (optional, for tracking initiation)
        await pool.query(
            `UPDATE students SET order_id = $1 WHERE id = $2`,
            [order.id, studentId]
        );

        return NextResponse.json({
            success: true,
            order: order,
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
