import path from "node:path";
import { access, mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

const DEFAULT_COPY_EMAIL = "weirdoguitars@gmail.com";
const MAX_IMAGE_LENGTH = 4_500_000;

type SummaryItem = { label: string; value: string };
type SubmissionRecord = {
  submittedAt: string;
  modelName: string;
  customer: {
    name: string;
    email: string;
  };
  selections: Record<string, string>;
  summary: SummaryItem[];
  image: {
    filename: string;
    pathname?: string;
    url?: string;
  };
};

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

function safeAttachmentName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function safeStorageName(value: string) {
  return safeAttachmentName(value).replace(/\.+$/g, "") || "Konfiguracja";
}

function todayFolder() {
  return new Date().toISOString().slice(0, 10);
}

async function nextAvailableSubmissionPath(basePath: string) {
  const existing = await list({
    prefix: basePath,
    limit: 1000
  });
  const names = new Set(existing.blobs.map(blob => blob.pathname));

  if (!names.has(`${basePath}.json`)) return basePath;

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${basePath} (${index})`;
    if (!names.has(`${candidate}.json`)) return candidate;
  }

  return `${basePath} (${Date.now()})`;
}

async function nextAvailableLocalPath(basePath: string) {
  for (let index = 1; index < 1000; index += 1) {
    const candidate = index === 1 ? basePath : `${basePath} (${index})`;
    try {
      await access(`${candidate}.json`);
    } catch {
      return candidate;
    }
  }

  return `${basePath} (${Date.now()})`;
}

async function saveLocalConfigurationSubmission({
  record,
  image,
  baseName
}: {
  record: SubmissionRecord;
  image: string;
  baseName: string;
}) {
  if (process.env.VERCEL) return null;

  const folder = path.join(process.cwd(), "data", "configurations", todayFolder());
  await mkdir(folder, { recursive: true });

  const basePath = await nextAvailableLocalPath(path.join(folder, baseName));
  const imagePath = `${basePath}.jpg`;
  const dataPath = `${basePath}.json`;
  const imageContent = image.replace("data:image/jpeg;base64,", "");
  const localRecord: SubmissionRecord = {
    ...record,
    image: {
      ...record.image,
      pathname: imagePath
    }
  };

  await writeFile(imagePath, Buffer.from(imageContent, "base64"));
  await writeFile(dataPath, JSON.stringify(localRecord, null, 2), "utf8");

  return {
    dataPath,
    imagePath
  };
}

async function saveConfigurationSubmission({
  record,
  image,
  baseName
}: {
  record: SubmissionRecord;
  image: string;
  baseName: string;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return saveLocalConfigurationSubmission({ record, image, baseName });
  }

  const folder = `configurations/${todayFolder()}`;
  const basePath = await nextAvailableSubmissionPath(`${folder}/${baseName}`);
  const imageContent = image.replace("data:image/jpeg;base64,", "");

  const imageBlob = await put(`${basePath}.jpg`, Buffer.from(imageContent, "base64"), {
    access: "private",
    contentType: "image/jpeg",
    addRandomSuffix: false
  });

  const dataBlob = await put(
    `${basePath}.json`,
    JSON.stringify(
      {
        ...record,
        image: {
          ...record.image,
          pathname: imageBlob.pathname,
          url: imageBlob.url
        }
      },
      null,
      2
    ),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false
    }
  );

  return {
    dataPath: dataBlob.pathname,
    imagePath: imageBlob.pathname
  };
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
    const rawSelections = body.selections && typeof body.selections === "object" ? body.selections : {};

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
    const cleanSelections = Object.fromEntries(
      Object.entries(rawSelections)
        .slice(0, 80)
        .map(([key, value]) => [
          String(key).trim().slice(0, 120),
          String(value ?? "").trim().slice(0, 1000)
        ])
        .filter(([key]) => key)
    );

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
    const attachmentName = safeAttachmentName(modelName || customerName) || "Konfiguracja";
    const storageTitle = safeStorageName(modelName || "Bez nazwy");
    const storageCustomer = safeStorageName(customerName || customerEmail);
    const storageBaseName = `WEIRDO - ${storageTitle} - ${storageCustomer}`;
    const imageFilename = `WEIRDO - ${attachmentName}.jpg`;
    const record: SubmissionRecord = {
      submittedAt: new Date().toISOString(),
      modelName: modelName || "Bez nazwy",
      customer: {
        name: customerName,
        email: customerEmail
      },
      selections: cleanSelections,
      summary: cleanSummary,
      image: {
        filename: imageFilename
      }
    };
    const recordJson = JSON.stringify(record, null, 2);
    const copyEmail = process.env.CONFIGURATOR_COPY_EMAIL || DEFAULT_COPY_EMAIL;
    const sendCustomerCopy = process.env.CONFIGURATOR_SEND_CUSTOMER_EMAIL === "true";
    const copyRecipients =
      copyEmail.toLowerCase() === customerEmail.toLowerCase() ? [] : [copyEmail];
    const recipients = sendCustomerCopy ? [customerEmail] : [copyEmail];
    const bccRecipients = sendCustomerCopy ? copyRecipients : [];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.CONFIGURATOR_FROM_EMAIL || "WEIRDO Configurator <onboarding@resend.dev>",
        to: recipients,
        bcc: bccRecipients.length ? bccRecipients : undefined,
        reply_to: sendCustomerCopy ? copyEmail : customerEmail,
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
            filename: imageFilename,
            content: image.replace("data:image/jpeg;base64,", "")
          },
          {
            filename: `WEIRDO - ${attachmentName}.json`,
            content: Buffer.from(recordJson, "utf8").toString("base64")
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

    let savedSubmission = null;
    try {
      savedSubmission = await saveConfigurationSubmission({
        record,
        image,
        baseName: storageBaseName
      });
    } catch (storageError) {
      console.error("Configuration storage error", storageError);
    }

    return NextResponse.json({ ok: true, saved: Boolean(savedSubmission) });
  } catch (error) {
    console.error("Configuration email error", error);
    return NextResponse.json(
      { error: "Nie udało się przetworzyć konfiguracji." },
      { status: 500 }
    );
  }
}
