import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, addresses, services, total, packageName } = body;

    if (!email || !phone) return NextResponse.json({ ok: false });

    const resend = new Resend(process.env.RESEND_API_KEY);

    const addressRows = (addresses as string[] ?? [])
      .map((addr, i) => `<li style="margin-bottom:4px;">${i + 1}. ${addr}</li>`)
      .join('');

    const serviceRows = (services as { name: string; price: number }[] ?? [])
      .map(s => `<li style="margin-bottom:4px;">${s.name} — <strong>$${s.price.toLocaleString()}</strong></li>`)
      .join('');

    const totalLine = total > 0
      ? packageName
        ? `<p style="margin:10px 0 0;font-size:13px;color:#b8860b;"><strong>${packageName}</strong> — Total quoted: <strong>$${total.toLocaleString()}</strong></p>`
        : `<p style="margin:10px 0 0;font-size:13px;color:#555;">Total quoted: <strong>$${total.toLocaleString()}</strong></p>`
      : '';

    const addrLabel = (addresses as string[] ?? []).length > 1 ? 'Addresses Looked Up' : 'Address Looked Up';

    await resend.emails.send({
      from: 'Rolling Suds of Schaumburg <estimates@rollingsudsofschaumburgrosemont.com>',
      to: 'gailan.robertson@rollingsuds.com',
      subject: `Interested lead — ${firstName} ${lastName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#0D1B4B;padding:20px 28px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">New Interested Lead</h2>
            <p style="color:#aab4d4;margin:6px 0 0;font-size:13px;">Browsed the quote tool but didn't submit — worth a follow-up</p>
          </div>
          <div style="background:#f9f9f9;padding:24px 28px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">

            <h3 style="margin:0 0 10px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Contact</h3>
            <p style="margin:0 0 4px;font-size:15px;color:#111;"><strong>${firstName} ${lastName}</strong></p>
            <p style="margin:0 0 4px;font-size:14px;color:#555;">${phone}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;">${email}</p>

            <h3 style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.06em;">${addrLabel}</h3>
            <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;color:#333;">${addressRows || '<li>Not recorded</li>'}</ul>

            <h3 style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Services They Selected</h3>
            <ul style="margin:0;padding-left:18px;font-size:14px;color:#333;">${serviceRows || '<li>None selected</li>'}</ul>
            ${totalLine}

          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Lead capture error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
