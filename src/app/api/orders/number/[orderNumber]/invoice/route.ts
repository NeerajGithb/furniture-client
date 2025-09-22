import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    await connectDB();
    const { orderNumber } = await params;
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pdfDoc = await PDFDocument.create();

    const itemsCount = order.items.length;
    const baseHeight = 600;
    const itemHeight = 45;
    const dynamicHeight = baseHeight + itemsCount * itemHeight;

    const page = pdfDoc.addPage([800, Math.max(dynamicHeight, 800)]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;
    const safeText = (text: string, maxLength: number = 50) =>
      text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;

    const primaryColor = rgb(0.15, 0.39, 0.92);
    const darkColor = rgb(0.2, 0.2, 0.2);
    const grayColor = rgb(0.5, 0.5, 0.5);
    const lightGray = rgb(0.95, 0.95, 0.95);

    const margin = 50;
    const contentWidth = width - margin * 2;
    let yPosition = height - margin;

    page.drawRectangle({
      x: 0,
      y: yPosition - 80,
      width: width,
      height: 80,
      color: primaryColor,
    });

    page.drawText('vFurniture', {
      x: margin,
      y: yPosition - 30,
      size: 32,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText('ORDER SUMMARY', {
      x: width - margin - 200,
      y: yPosition - 30,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText('Premium Furniture & Home Decor', {
      x: margin,
      y: yPosition - 55,
      size: 12,
      font: font,
      color: rgb(0.9, 0.9, 0.9),
    });

    yPosition -= 110;

    page.drawRectangle({
      x: margin,
      y: yPosition - 120,
      width: contentWidth,
      height: 120,
      color: lightGray,
    });

    page.drawText('Order Information', {
      x: margin + 20,
      y: yPosition - 25,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });

    const leftColumn = [
      [`Order Number:`, order.orderNumber],
      [
        `Order Date:`,
        new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      ],
      [`Status:`, order.orderStatus.toUpperCase()],
    ];

    const rightColumn = [
      [`Payment Method:`, order.paymentMethod.toUpperCase()],
      [`Payment Status:`, order.paymentStatus.toUpperCase()],
      [`Total Items:`, `${order.items.length} item${order.items.length > 1 ? 's' : ''}`],
    ];

    let leftY = yPosition - 50;
    leftColumn.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin + 20,
        y: leftY,
        size: 11,
        font: boldFont,
        color: grayColor,
      });
      page.drawText(value, {
        x: margin + 150,
        y: leftY,
        size: 11,
        font: font,
        color: darkColor,
      });
      leftY -= 20;
    });

    let rightY = yPosition - 50;
    rightColumn.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin + 400,
        y: rightY,
        size: 11,
        font: boldFont,
        color: grayColor,
      });
      page.drawText(value, {
        x: margin + 530,
        y: rightY,
        size: 11,
        font: font,
        color: darkColor,
      });
      rightY -= 20;
    });

    yPosition -= 150;

    page.drawText('Shipping Address', {
      x: margin,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });

    yPosition -= 30;

    page.drawRectangle({
      x: margin,
      y: yPosition - 110,
      width: contentWidth,
      height: 110,
      color: lightGray,
    });

    const addressLines = [
      order.shippingAddress.fullName,
      order.shippingAddress.addressLine1,
      order.shippingAddress.addressLine2 || '',
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
      order.shippingAddress.country,
      `Phone: ${order.shippingAddress.phone}`,
    ].filter((line) => line && line.trim());

    let addressY = yPosition - 25;
    addressLines.forEach((line) => {
      page.drawText(safeText(line, 80), {
        x: margin + 20,
        y: addressY,
        size: 12,
        font: font,
        color: darkColor,
      });
      addressY -= 16;
    });

    yPosition -= 140;

    page.drawText('Order Items', {
      x: margin,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });

    yPosition -= 40;

    const tableHeaders = ['#', 'Product Name', 'Quantity', 'Unit Price', 'Total Price'];
    const columnWidths = [50, 350, 80, 120, 130];
    let xPosition = margin;

    page.drawRectangle({
      x: margin - 10,
      y: yPosition - 8,
      width: contentWidth + 20,
      height: 30,
      color: primaryColor,
    });

    tableHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: xPosition,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      xPosition += columnWidths[index];
    });

    yPosition -= 45;

    order.items.forEach((item: any, index: number) => {
      const itemTotal = item.price * item.quantity;

      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin - 10,
          y: yPosition - 8,
          width: contentWidth + 20,
          height: 35,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      xPosition = margin;

      const itemData = [
        String(index + 1),
        safeText(item.name, 45),
        String(item.quantity),
        formatCurrency(item.price),
        formatCurrency(itemTotal),
      ];

      itemData.forEach((data, colIndex) => {
        let textX = xPosition;

        if (colIndex >= 2) {
          const textWidth = font.widthOfTextAtSize(data, 11);
          textX = xPosition + columnWidths[colIndex] - textWidth - 10;
        }

        page.drawText(data, {
          x: textX,
          y: yPosition,
          size: 11,
          font: colIndex === 0 ? boldFont : font,
          color: darkColor,
        });
        xPosition += columnWidths[colIndex];
      });

      if (item.originalPrice && item.originalPrice > item.price) {
        const discountPercent = Math.round(
          ((item.originalPrice - item.price) / item.originalPrice) * 100,
        );
        page.drawText(`Original: ${formatCurrency(item.originalPrice)} (${discountPercent}% off)`, {
          x: margin + 50,
          y: yPosition - 18,
          size: 9,
          font: font,
          color: rgb(0.8, 0.2, 0.2),
        });
        yPosition -= 18;
      }

      yPosition -= 35;
    });

    yPosition -= 30;

    const totalsX = width - margin - 300;
    const totalsWidth = 280;

    const originalPriceTotal = order.items.reduce((total: number, item: any) => {
      const originalPrice = item.originalPrice || item.price;
      return total + originalPrice * item.quantity;
    }, 0);

    const totalDiscount = originalPriceTotal - order.subtotal;

    const hasDiscount = totalDiscount > 0;
    const hasInsurance = order.insuranceCost && order.insuranceCost > 0;
    const sectionHeight = 140 + (hasDiscount ? 22 : 0) + (hasInsurance ? 22 : 0);

    page.drawRectangle({
      x: totalsX,
      y: yPosition - sectionHeight,
      width: totalsWidth,
      height: sectionHeight,
      color: lightGray,
    });

    page.drawText('Price Details', {
      x: totalsX + 20,
      y: yPosition - 20,
      size: 14,
      font: boldFont,
      color: primaryColor,
    });

    let totalY = yPosition - 45;

    const priceDetails = [
      [
        `Price (${order.items.length} ${order.items.length === 1 ? 'item' : 'items'})`,
        formatCurrency(originalPriceTotal),
      ],
    ];

    if (hasDiscount) {
      priceDetails.push([`Discount`, `-${formatCurrency(totalDiscount)}`]);
    }

    if (hasInsurance) {
      priceDetails.push([`Protection Plan`, `+${formatCurrency(order.insuranceCost)}`]);
    }

    const isFreeShipping = order.shippingCost === 0;
    priceDetails.push([
      `Delivery Charges`,
      isFreeShipping ? 'FREE' : formatCurrency(order.shippingCost),
    ]);

    priceDetails.forEach(([label, amount]) => {
      const isDiscount = label.includes('Discount');
      const isFree = amount === 'FREE';
      const textColor = isDiscount ? rgb(0.2, 0.7, 0.2) : isFree ? rgb(0.2, 0.7, 0.2) : darkColor;

      page.drawText(label, {
        x: totalsX + 20,
        y: totalY,
        size: 11,
        font: font,
        color: grayColor,
      });

      const amountWidth = font.widthOfTextAtSize(amount, 11);
      page.drawText(amount, {
        x: totalsX + totalsWidth - 20 - amountWidth,
        y: totalY,
        size: 11,
        font: font,
        color: textColor,
      });
      totalY -= 22;
    });

    totalY -= 10;

    page.drawLine({
      start: { x: totalsX + 20, y: totalY + 5 },
      end: { x: totalsX + totalsWidth - 20, y: totalY + 5 },
      thickness: 2,
      color: primaryColor,
    });

    page.drawText('Amount Payable:', {
      x: totalsX + 20,
      y: totalY - 15,
      size: 14,
      font: boldFont,
      color: primaryColor,
    });

    const totalText = formatCurrency(order.totalAmount);
    const totalWidth = boldFont.widthOfTextAtSize(totalText, 16);
    page.drawText(totalText, {
      x: totalsX + totalsWidth - 20 - totalWidth,
      y: totalY - 15,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('Inclusive of all taxes and charges', {
      x: totalsX + 20,
      y: totalY - 35,
      size: 9,
      font: font,
      color: grayColor,
    });

    yPosition = 80;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: grayColor,
    });

    page.drawText('Thank you for choosing vFurniture!', {
      x: width / 2 - 120,
      y: yPosition - 30,
      size: 14,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText('For support, contact us at support@vfurniture.com', {
      x: width / 2 - 140,
      y: yPosition - 50,
      size: 10,
      font: font,
      color: grayColor,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Order-Details-${orderNumber}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Order details generation failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate order details',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
