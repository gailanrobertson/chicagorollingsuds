import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateEstimatePdf, EstimateData } from '@/lib/generate-estimate';

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const { firstName, lastName, email, phone, address, services, baseTotal, total, savings, packageName, notes } = body;

    const estimateData: EstimateData = {
      firstName, lastName, email, phone, address,
      services: services || [],
      baseTotal: baseTotal || total,
      total,
      savings: savings || 0,
      packageName,
      notes,
    };

    const pdfBytes = await generateEstimatePdf(estimateData);
    const pdfBuffer = Buffer.from(pdfBytes);

    const serviceList = (services || []).map((s: { name: string; price: number }) => `<li>${s.name} — $${s.price.toLocaleString()}</li>`).join('');
    const discountLine = savings > 0 && packageName ? `<li style="color:#b8860b;">${packageName} Discount — -$${savings.toLocaleString()}</li>` : '';

    // Email to customer (CC Gailan)
    await resend.emails.send({
      from: 'Rolling Suds of Schaumburg <estimates@rollingsudsofschaumburgrosemont.com>',
      to: email,
      cc: ['gailan.robertson@rollingsuds.com'],
      replyTo: 'gailan.robertson@rollingsuds.com',
      subject: 'Your Estimate from Rolling Suds of Schaumburg – Rosemont',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#0D1B4B;padding:24px 32px;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Your Estimate Is Ready</h1>
            <p style="color:#aab4d4;margin:6px 0 0;font-size:14px;">Rolling Suds of Schaumburg – Rosemont</p>
          </div>
          <div style="background:#f9f9f9;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">
            <p style="color:#333;font-size:15px;">Hi ${firstName},</p>
            <p style="color:#555;font-size:14px;line-height:1.6;">
              Thank you for reaching out! Please find your personalized estimate attached to this email. Here's a summary of what's included:
            </p>
            <ul style="color:#333;font-size:14px;line-height:2;">
              ${serviceList}
              ${discountLine}
            </ul>
            <div style="background:#0D1B4B;color:#fff;padding:14px 20px;border-radius:6px;margin:20px 0;display:inline-block;">
              <span style="font-size:13px;opacity:0.8;">Estimated Total</span><br>
              <span style="font-size:24px;font-weight:bold;">$${total.toLocaleString()}.00</span>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;">
              We'll be in touch shortly to schedule your service. In the meantime, feel free to reply to this email or call us at <strong>(630) 912-9662</strong> with any questions.
            </p>
            <p style="color:#333;font-size:14px;margin-top:24px;">
              – The Rolling Suds Team<br>
              <span style="color:#888;font-size:12px;">gailan.robertson@rollingsuds.com · (630) 912-9662</span>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Estimate-${firstName}-${lastName}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
