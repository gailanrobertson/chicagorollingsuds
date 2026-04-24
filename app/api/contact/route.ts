import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { firstName, lastName, email, phone, address, service, total, notes } = await req.json();

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'documents@gosuperclean.com',
      to: 'gailan.robertson@rollingsuds.com',
      subject: `New Quote Request — ${firstName} ${lastName}`,
      html: `
        <h2 style="color:#0D1B4B;">New Quote Request</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${firstName} ${lastName}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${phone}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Address</td><td style="padding:8px;">${address}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Services</td><td style="padding:8px;">${service}</td></tr>
          ${total ? `<tr style="background:#f5f5f5;"><td style="padding:8px;font-weight:bold;">Estimated Total</td><td style="padding:8px;font-weight:bold;color:#0D1B4B;">$${Number(total).toLocaleString()}</td></tr>` : ''}
          ${notes ? `<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Additional Notes</td><td style="padding:8px;">${notes}</td></tr>` : ''}
        </table>
        <p style="color:#888;font-size:12px;margin-top:20px;">Submitted via chicagorollingsuds.com</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
