import PDFDocument from "pdfkit";
import { SITE } from "@/lib/site";
import type { OrderDoc } from "@/types";
import { maskMobile } from "./format";

const GREEN = "#0B6B25";
const FOREST = "#064E20";
const MUTED = "#647067";
const LINE = "#E3EDE2";
const PALE = "#F3FCEB";

function inr(paise: number) {
  return `${SITE.currencySymbol}${(paise / 100).toFixed(2)}`;
}

export function buildReceiptPdf(order: OrderDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;

    // Header band
    doc.rect(0, 0, doc.page.width, 96).fill(FOREST);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(SITE.name, 50, 30);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#C9ECB4")
      .text(SITE.tagline, 50, 58);
    doc
      .fontSize(9)
      .fillColor("#FFFFFF")
      .text(`WhatsApp: ${SITE.whatsappDisplay}`, 50, 74, { width: pageWidth, align: "right" });
    doc.text(SITE.domain, 50, 74, { width: pageWidth, align: "left" });

    doc.fillColor(FOREST).font("Helvetica-Bold").fontSize(16).text("Order Receipt", 50, 120);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Order ID: ${order.orderId}`, 50, 144)
      .text(`Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`, 50, 160)
      .text(`Payment status: ${order.paymentStatus.toUpperCase()}`, 50, 176);
    if (order.razorpayPaymentId) {
      doc.text(`Transaction reference: ${order.razorpayPaymentId}`, 50, 192);
    }

    // Customer block
    const boxTop = order.razorpayPaymentId ? 216 : 200;
    doc.roundedRect(50, boxTop, pageWidth, 104, 8).fill(PALE);
    doc
      .fillColor(FOREST)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Deliver to", 62, boxTop + 12);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#17251B")
      .text(order.customer.name, 62, boxTop + 30)
      .text(maskMobile(order.customer.mobile), 62, boxTop + 46)
      .text(
        `${order.customer.address}, ${order.customer.area ? order.customer.area + (order.customer.landmark ? `, ${order.customer.landmark}` : "") : [order.customer.city, order.customer.state].filter(Boolean).join(", ") + (order.customer.pincode ? ` - ${order.customer.pincode}` : "")}`,
        62,
        boxTop + 62,
        { width: pageWidth - 24 }
      );

    // Items table
    let y = boxTop + 128;
    doc.fillColor(FOREST).font("Helvetica-Bold").fontSize(11).text("Items", 50, y);
    y += 20;
    doc
      .moveTo(50, y)
      .lineTo(50 + pageWidth, y)
      .strokeColor(LINE)
      .stroke();
    y += 8;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
    doc.text("Item", 50, y, { width: pageWidth - 220 });
    doc.text("Qty", 50 + pageWidth - 210, y, { width: 50, align: "right" });
    doc.text("Price", 50 + pageWidth - 150, y, { width: 70, align: "right" });
    doc.text("Amount", 50 + pageWidth - 70, y, { width: 70, align: "right" });
    y += 16;
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(LINE).stroke();
    y += 8;

    doc.font("Helvetica").fontSize(10).fillColor("#17251B");
    order.items.forEach((item) => {
      const startY = y;
      doc.text(item.name + (item.unit ? ` (${item.unit})` : ""), 50, y, {
        width: pageWidth - 220,
      });
      const rowHeight = Math.max(16, doc.heightOfString(item.name, { width: pageWidth - 220 }));
      doc.text(String(item.quantity), 50 + pageWidth - 210, startY, {
        width: 50,
        align: "right",
      });
      doc.text(inr(item.price), 50 + pageWidth - 150, startY, {
        width: 70,
        align: "right",
      });
      doc.text(inr(item.lineTotal), 50 + pageWidth - 70, startY, {
        width: 70,
        align: "right",
      });
      y = startY + rowHeight + 6;
    });

    y += 4;
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(LINE).stroke();
    y += 12;

    const totals: [string, string][] = [
      ["Subtotal", inr(order.subtotal)],
      ["Discount", `- ${inr(order.discount)}`],
      [
        `Delivery (${order.delivery.zoneName || "n/a"}${
          order.delivery.freeDeliveryApplied ? " - free" : ""
        })`,
        inr(order.delivery.deliveryCharge),
      ],
    ];

    totals.forEach(([label, value]) => {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(label, 50, y, {
        width: pageWidth - 120,
        align: "right",
      });
      doc.fillColor("#17251B").text(value, 50 + pageWidth - 110, y, {
        width: 110,
        align: "right",
      });
      y += 18;
    });

    y += 4;
    doc.roundedRect(50 + pageWidth - 260, y, 260, 40, 8).fill(GREEN);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Amount paid", 50 + pageWidth - 246, y + 13, { width: 140 });
    doc
      .fontSize(14)
      .text(inr(order.total), 50 + pageWidth - 150, y + 11, { width: 136, align: "right" });

    y += 62;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "This receipt is generated only for orders with a verified payment status. Friendly Basket is a local ordering and delivery assistance service. Medicine items are handled as enquiries and may require a valid prescription.",
        50,
        y,
        { width: pageWidth }
      );

    doc.end();
  });
}
