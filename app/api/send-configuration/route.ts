import { NextResponse } from "next/server";

const DEFAULT_COPY_EMAIL = "weirdoguitars@gmail.com";
const MAX_IMAGE_LENGTH = 4_500_000;

type SummaryItem = { label: string; value: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Wysyłka e-mail nie jest jeszcze skonfigurowana." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const modelName = String(body.modelName || "").trim().slice(0, 120);
    const customerName = String(body.customerName || "").trim().slice(0, 120);
    const customerEmail = String(body.customerEmail || "").trim().slice(0, 200);
    const website = String(body.website || "").trim();
    const image = String(body.image || "");
    const summary = Array.isArray(body.summary) ? body.summary : [];

    if (website) return NextResponse.json({ ok: true });

    if (!customerName || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: "Podaj imię i poprawny adres e-mail." },
        { status: 400 }
      );
    }

    if (!image.startsWith("data:image/jpeg;base64,") || image.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json(
        { error: "Nie udało się przygotować wizualizacji do wysyłki." },
        { status: 400 }
      );
    }

    const cleanSummary: SummaryItem[] = summary
      .slice(0, 40)
      .map((item: SummaryItem) => ({
        label: String(item?.label || "").trim().slice(0, 120),
        value: String(item?.value || "").trim().slice(0, 1000)
      }))
      .filter((item: SummaryItem) => item.label && item.value);

    const rows = cleanSummary
      .map(
        ({ label, value }) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e7e2d8;color:#746f66;vertical-align:top;width:38%">${escapeHtml(label)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e7e2d8;color:#171512;font-weight:600">${escapeHtml(value)}</td>
          </tr>`
      )
      .join("");
    const subjectName = modelName ? ` - ${modelName}` : "";
    const filenameName = safeFilename(modelName || customerName) || "konfiguracja";
    const copyEmail = process.env.CONFIGURATOR_COPY_EMAIL || DEFAULT_COPY_EMAIL;
    const copyRecipients =
      copyEmail.toLowerCase() === customerEmail.toLowerCase() ? [] : [copyEmail];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.CONFIGURATOR_FROM_EMAIL || "WEIRDO Configurator <onboarding@resend.dev>",
        to: [customerEmail],
        bcc: copyRecipients.length ? copyRecipients : undefined,
        reply_to: copyEmail,
        subject: `Nowa konfiguracja WEIRDO${subjectName} - ${customerName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#171512">
            <h1 style="margin-bottom:8px">Nowa konfiguracja gitary WEIRDO</h1>
            ${modelName ? `<h2 style="margin-top:0;color:#171512">${escapeHtml(modelName)}</h2>` : ""}
            <p style="margin-top:0;color:#746f66">Klient: <strong>${escapeHtml(customerName)}</strong><br>E-mail: <a href="mailto:${escapeHtml(customerEmail)}">${escapeHtml(customerEmail)}</a></p>
            <table style="width:100%;border-collapse:collapse;margin-top:24px">${rows}</table>
            <p style="margin-top:24px;color:#746f66">Wizualizacja konfiguracji znajduje się w załączniku.</p>
          </div>`,
        attachments: [
          {
            filename: `weirdo-${filenameName}-${Date.now()}.jpg`,
            content: image.replace("data:image/jpeg;base64,", "")
          }
        ]
      })
    });

    if (!response.ok) {
      console.error("Resend error", response.status, await response.text());
      return NextResponse.json(
        { error: "Nie udało się wysłać wiadomości. Spróbuj ponownie." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Configuration email error", error);
    return NextResponse.json(
      { error: "Nie udało się przetworzyć konfiguracji." },
      { status: 500 }
    );
  }
}
