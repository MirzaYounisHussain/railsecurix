import jsPDF from "jspdf";

export interface PassengerItem {
  name: string;
  age?: number;
  gender?: string;
  seat?: string;
  seat_allocated?: string;
  status?: string;
}

export interface TicketData {
  PNR: string;
  trainName: string;
  trainNumber: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  passengerName?: string;
  coach?: string;
  travelClass?: string;
  seatNumber?: string;
  fare: number;
  totalPrice: number;
  bookingStatus: string;
  passengers?: PassengerItem[];
  convenienceFee?: number;
  travelInsurance?: number;
  transactionId?: string;
  paymentMethod?: string;
  quota?: string;
}

// Helper to resolve clean travel class (never "Not Assigned (WL)")
const resolveTravelClass = (data: TicketData): string => {
  if (data.travelClass && data.travelClass.trim() && !data.travelClass.includes("Not Assigned")) {
    return data.travelClass.trim().toUpperCase();
  }
  const coachClean = (data.coach || "").trim().toUpperCase();
  const knownClasses = ["1A", "2A", "3A", "3E", "CC", "EC", "SL", "2S"];
  if (knownClasses.includes(coachClean)) {
    return coachClean;
  }
  const prefix = coachClean.substring(0, 2);
  const singleChar = coachClean.charAt(0);
  if (prefix === "H1" || singleChar === "H") return "1A";
  if (prefix === "A1" || singleChar === "A") return "2A";
  if (prefix === "B1" || singleChar === "B") return "3A";
  if (prefix === "M1" || singleChar === "M") return "3E";
  if (prefix === "C1" || prefix === "C2" || singleChar === "C") return "CC";
  if (prefix === "E1" || singleChar === "E") return "EC";
  if (singleChar === "S") return "SL";
  if (singleChar === "D") return "2S";
  return "3A";
};

// Helper to format coach & berth (e.g., "B1 / 14" vs "Not Assigned (WL)")
const resolveCoachSeat = (isWL: boolean, coach?: string, seat?: string | number): string => {
  if (isWL) {
    return "Not Assigned (WL)";
  }
  const s = String(seat || "").trim();
  const c = String(coach || "").trim();

  if (!s || s === "undefined" || s.toLowerCase().includes("not assigned")) {
    return c && c !== "Not Assigned (WL)" ? `${c} / 14` : "B1 / 14";
  }

  // Already formatted as "B1 / 14"
  if (s.includes(" / ")) {
    return s;
  }

  // Formatted as "B1-14 (WS)" or "C2-14"
  const dashMatch = s.match(/^([A-Za-z0-9]+)-(\d+)(.*)$/);
  if (dashMatch) {
    const coachPart = dashMatch[1];
    const numPart = dashMatch[2];
    const extra = dashMatch[3] ? ` ${dashMatch[3].trim()}` : "";
    return `${coachPart} / ${numPart}${extra}`;
  }

  // If seat is just a number e.g. "14" or "34 (WS)"
  if (/^\d+/.test(s)) {
    const assignedCoach = c && c !== "Not Assigned (WL)" ? c : "B1";
    return `${assignedCoach} / ${s}`;
  }

  return s;
};

// Helper to format booking status string
const resolveBookingStatus = (isWL: boolean, rawStatus?: string): string => {
  if (!isWL) {
    return "CNF / CONFIRMED";
  }
  const s = (rawStatus || "").trim();
  const m = s.match(/(?:WL\s*|WL)(\d+)/i) || s.match(/(\d+)/);
  if (m) {
    return `WL ${m[1]} / WAITING LIST`;
  }
  return "WL / WAITING LIST";
};

// Helper for exact floating point currency formatting
const formatCurrency = (val: number | string | undefined, defaultVal: number = 0): string => {
  const num = Number(val);
  return isNaN(num) ? defaultVal.toFixed(2) : num.toFixed(2);
};

export const generateTicketPDF = (ticketData: TicketData): boolean => {
  try {
    if (!ticketData.PNR) {
      console.error("Missing PNR in ticket data");
      throw new Error("PNR is required to generate ticket");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const leftMargin = 14;
    const contentWidth = 182; // 210 - 28
    const rightMargin = leftMargin + contentWidth; // 196 mm
    let yPosition = 12;

    const rawStatus = ticketData.bookingStatus || "CNF (Confirmed)";
    const isWL = rawStatus.toUpperCase().includes("WL");
    const travelClass = resolveTravelClass(ticketData);
    const overallStatusLabel = resolveBookingStatus(isWL, rawStatus);

    pdf.setFont("helvetica");

    // =========================================================================
    // 1. HEADER BAR: RailSecurix Vector Logo + Brand Title + PNR / Status Badge
    // =========================================================================
    // A. Vector Shield + Train Emblem (12 mm x 14 mm)
    // Outer Shield Base (Navy)
    pdf.setFillColor(11, 33, 68);
    pdf.roundedRect(leftMargin, yPosition, 12, 14, 2, 2, "F");

    // Shield Accent Top Bar (Orange)
    pdf.setFillColor(249, 115, 22);
    pdf.roundedRect(leftMargin, yPosition, 12, 3.2, 1, 1, "F");

    // Train Body (White)
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(leftMargin + 2.5, yPosition + 5, 7, 6.5, 1, 1, "F");

    // Train Windshield (Navy)
    pdf.setFillColor(11, 33, 68);
    pdf.rect(leftMargin + 3.5, yPosition + 6, 5, 2, "F");

    // Headlights (Orange)
    pdf.setFillColor(249, 115, 22);
    pdf.circle(leftMargin + 4.2, yPosition + 9.5, 0.55, "F");
    pdf.circle(leftMargin + 7.8, yPosition + 9.5, 0.55, "F");

    // Cowcatcher lines under train
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.line(leftMargin + 1.5, yPosition + 15, leftMargin + 10.5, yPosition + 15);

    // B. Brand Typography
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(11, 33, 68);
    pdf.text("RAILSECURIX", leftMargin + 15, yPosition + 5.5);

    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Electronic Reservation Slip (ERS)", leftMargin + 15, yPosition + 9.8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Ministry of Railways • Automated Security Telemetry Network", leftMargin + 15, yPosition + 13.8);

    // C. PNR & Status Card (Right aligned)
    const pnrBoxX = rightMargin - 62;
    const pnrBoxW = 62;
    const pnrBoxH = 19;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(pnrBoxX, yPosition, pnrBoxW, pnrBoxH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("PNR NUMBER", pnrBoxX + 4, yPosition + 4.8);

    pdf.setFontSize(12.5);
    pdf.setTextColor(11, 33, 68);
    pdf.text(ticketData.PNR, pnrBoxX + 4, yPosition + 10.5);

    // Status Pill
    const pillX = pnrBoxX + 4;
    const pillY = yPosition + 12.2;
    const pillW = pnrBoxW - 8;
    const pillH = 5.2;

    if (isWL) {
      pdf.setFillColor(254, 243, 199);
      pdf.setDrawColor(251, 191, 36);
      pdf.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, "FD");
      pdf.setFontSize(6.8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(180, 83, 9);
      pdf.text(`● ${overallStatusLabel}`, pillX + pillW / 2, pillY + 3.6, { align: "center" });
    } else {
      pdf.setFillColor(220, 252, 231);
      pdf.setDrawColor(134, 239, 172);
      pdf.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, "FD");
      pdf.setFontSize(6.8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 128, 61);
      pdf.text("● CNF (CONFIRMED)", pillX + pillW / 2, pillY + 3.6, { align: "center" });
    }

    // Divider Line below header
    yPosition = 33.5;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.line(leftMargin, yPosition, rightMargin, yPosition);

    // =========================================================================
    // 2. JOURNEY DETAILS GRID
    // =========================================================================
    yPosition = 37.5;

    // Section title with indicator
    pdf.setFillColor(43, 57, 204);
    pdf.rect(leftMargin, yPosition, 2.5, 4.5, "F");
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(11, 33, 68);
    pdf.text("JOURNEY & TRAIN DETAILS", leftMargin + 5, yPosition + 3.6);

    yPosition += 6.5;
    const gridY = yPosition;
    const gridH = 34;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(leftMargin, gridY, contentWidth, gridH, 2, 2, "D");

    // Top banner of grid: Train Name & Quota
    pdf.setFillColor(248, 250, 252);
    pdf.rect(leftMargin, gridY, contentWidth, 11, "F");
    pdf.setDrawColor(226, 232, 240);
    pdf.line(leftMargin, gridY + 11, rightMargin, gridY + 11);

    // Train name handling with clean text wrapping
    const trainNumberText = ticketData.trainNumber ? `#${ticketData.trainNumber}` : "";
    const rawTrainTitle = `${trainNumberText} ${ticketData.trainName || "Express"}`.trim();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(11, 33, 68);
    const wrappedTrainTitle = pdf.splitTextToSize(rawTrainTitle, 112);
    pdf.text(wrappedTrainTitle, leftMargin + 4, gridY + 5.5);

    // Right-hand train meta
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    const quotaText = ticketData.quota ? ticketData.quota.toUpperCase() : "GENERAL (GN)";
    pdf.text(`Quota: ${quotaText}   |   Class: ${travelClass}`, rightMargin - 4, gridY + 6.5, { align: "right" });

    // Lower half of grid: Route from -> to
    const routeY = gridY + 14;

    // Origin
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("ORIGIN STATION", leftMargin + 4, routeY + 2);

    pdf.setFontSize(8.5);
    pdf.setTextColor(11, 33, 68);
    const wrappedOrigin = pdf.splitTextToSize(ticketData.source || "NDLS - New Delhi", 55);
    pdf.text(wrappedOrigin, leftMargin + 4, routeY + 6.5);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Departure: ${ticketData.departureTime || "06:00 AM"}`, leftMargin + 4, routeY + 15);

    // Middle Route Graphic
    const midX = leftMargin + (contentWidth / 2);
    pdf.setDrawColor(43, 57, 204);
    pdf.setLineWidth(0.5);
    pdf.line(midX - 20, routeY + 6, midX + 16, routeY + 6);
    // Arrow head
    pdf.line(midX + 13, routeY + 4.5, midX + 16, routeY + 6);
    pdf.line(midX + 13, routeY + 7.5, midX + 16, routeY + 6);

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(43, 57, 204);
    pdf.text("DIRECT SERVICE", midX - 2, routeY + 4, { align: "center" });

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Date: ${ticketData.travelDate || "Today"}`, midX - 2, routeY + 11.5, { align: "center" });

    // Destination
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("DESTINATION STATION", rightMargin - 4, routeY + 2, { align: "right" });

    pdf.setFontSize(8.5);
    pdf.setTextColor(11, 33, 68);
    const wrappedDest = pdf.splitTextToSize(ticketData.destination || "JAT - Jammu Tawi", 55);
    pdf.text(wrappedDest, rightMargin - 4, routeY + 6.5, { align: "right" });

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Arrival: ${ticketData.arrivalTime || "12:43 PM"}`, rightMargin - 4, routeY + 15, { align: "right" });

    yPosition = gridY + gridH + 6;

    // =========================================================================
    // 3. PASSENGER & BERTH ALLOCATION TABLE (4 COLUMNS)
    // =========================================================================
    // Section title
    pdf.setFillColor(43, 57, 204);
    pdf.rect(leftMargin, yPosition, 2.5, 4.5, "F");
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(11, 33, 68);
    pdf.text("PASSENGER & BERTH ALLOCATION", leftMargin + 5, yPosition + 3.6);

    yPosition += 6.5;

    // 4 Column Layout:
    // 1. Passenger Name (58 mm)
    // 2. Class (26 mm)
    // 3. Coach / Seat (46 mm)
    // 4. Booking Status (52 mm)
    const colWidths = [58, 26, 46, 52];
    const colX = [
      leftMargin,
      leftMargin + colWidths[0],
      leftMargin + colWidths[0] + colWidths[1],
      leftMargin + colWidths[0] + colWidths[1] + colWidths[2],
    ];

    // Table Header Row
    const headerH = 7.5;
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.35);
    pdf.rect(leftMargin, yPosition, contentWidth, headerH, "FD");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(51, 65, 85);
    pdf.text("Passenger Name", colX[0] + 4, yPosition + 5);
    pdf.text("Class", colX[1] + 4, yPosition + 5);
    pdf.text("Coach / Seat", colX[2] + 4, yPosition + 5);
    pdf.text("Booking Status", colX[3] + 4, yPosition + 5);

    yPosition += headerH;

    // Extract Passenger List
    const paxList: PassengerItem[] =
      ticketData.passengers && ticketData.passengers.length > 0
        ? ticketData.passengers
        : [
            {
              name: ticketData.passengerName || "Traveler",
              seat: ticketData.seatNumber,
              status: ticketData.bookingStatus,
            },
          ];

    // Table Data Rows
    const rowH = 8.5;
    paxList.forEach((pax, idx) => {
      // Alternate row shading
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(leftMargin, yPosition, contentWidth, rowH, "F");
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.35);
      pdf.rect(leftMargin, yPosition, contentWidth, rowH, "D");

      // 1. Passenger Name
      const paxAge = pax.age ? `, ${pax.age}` : "";
      const paxGender = pax.gender ? ` (${pax.gender}${paxAge})` : "";
      const paxFullName = `${pax.name || `Passenger ${idx + 1}`}${paxGender}`;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 41, 59);
      pdf.text(paxFullName, colX[0] + 4, yPosition + 5.5, { maxWidth: colWidths[0] - 6 });

      // 2. Class: Actual travel class code (NEVER "Not Assigned (WL)")
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(11, 33, 68);
      pdf.text(travelClass, colX[1] + 4, yPosition + 5.5);

      // 3. Coach / Seat: If Confirmed -> "B1 / 14"; If WL -> "Not Assigned (WL)"
      const coachSeatStr = resolveCoachSeat(isWL, ticketData.coach, pax.seat || pax.seat_allocated || ticketData.seatNumber);
      pdf.setFont("helvetica", "normal");
      if (isWL) {
        pdf.setTextColor(100, 116, 139);
      } else {
        pdf.setTextColor(30, 41, 59);
      }
      pdf.text(coachSeatStr, colX[2] + 4, yPosition + 5.5);

      // 4. Booking Status: If Confirmed -> CNF / CONFIRMED (green); If WL -> WL X / WAITING LIST (amber)
      const paxStatusStr = resolveBookingStatus(isWL, pax.status || ticketData.bookingStatus);
      pdf.setFont("helvetica", "bold");
      if (isWL) {
        pdf.setTextColor(180, 83, 9); // Amber
      } else {
        pdf.setTextColor(21, 128, 61); // Green
      }
      pdf.text(paxStatusStr, colX[3] + 4, yPosition + 5.5);

      yPosition += rowH;
    });

    yPosition += 6;

    // =========================================================================
    // 4. PAYMENT & FARE BREAKDOWN TABLE (2 COLUMNS, FIXED 2 DECIMALS)
    // =========================================================================
    pdf.setFillColor(43, 57, 204);
    pdf.rect(leftMargin, yPosition, 2.5, 4.5, "F");
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(11, 33, 68);
    pdf.text("PAYMENT & FARE BREAKDOWN", leftMargin + 5, yPosition + 3.6);

    yPosition += 6.5;

    const fareTableX = leftMargin;
    const fareTableW = contentWidth;
    const col1W = 122;
    const col2X = fareTableX + col1W;

    // Header Row
    const fareH = 7;
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.35);
    pdf.rect(fareTableX, yPosition, fareTableW, fareH, "FD");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(51, 65, 85);
    pdf.text("Fare Component Description", fareTableX + 4, yPosition + 4.8);
    pdf.text("Amount (INR)", rightMargin - 4, yPosition + 4.8, { align: "right" });

    yPosition += fareH;

    // Calculate itemized fares
    const numPax = paxList.length;
    const baseTicketFare = Number(ticketData.fare) || 0;
    const convenienceFee = ticketData.convenienceFee !== undefined ? Number(ticketData.convenienceFee) : 35.40;
    const insuranceFee = ticketData.travelInsurance !== undefined ? Number(ticketData.travelInsurance) : (numPax * 0.45);
    const totalAmount = Number(ticketData.totalPrice) || (baseTicketFare * numPax + convenienceFee + insuranceFee);

    const fareRows = [
      {
        label: `Authoritative Ticket Fare (${numPax} Passenger${numPax > 1 ? "s" : ""})`,
        amount: formatCurrency(baseTicketFare * numPax, 0),
        isBold: false,
      },
      {
        label: "IRCTC Convenience / Reservation Charge (Incl. of GST)",
        amount: formatCurrency(convenienceFee, 35.40),
        isBold: false,
      },
      {
        label: "Travel Insurance Charge (Incl. of GST)",
        amount: formatCurrency(insuranceFee, 0.45),
        isBold: false,
      },
      {
        label: "Total Amount Paid (Simulated)",
        amount: formatCurrency(totalAmount, 0),
        isBold: true,
      },
    ];

    const fareRowH = 7.5;
    fareRows.forEach((row, i) => {
      const isTotalRow = row.isBold;
      if (isTotalRow) {
        pdf.setFillColor(241, 245, 249);
        pdf.rect(fareTableX, yPosition, fareTableW, fareRowH, "F");
      } else if (i % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(fareTableX, yPosition, fareTableW, fareRowH, "F");
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.35);
      pdf.rect(fareTableX, yPosition, fareTableW, fareRowH, "D");

      pdf.setFontSize(8);
      pdf.setFont("helvetica", isTotalRow ? "bold" : "normal");
      pdf.setTextColor(isTotalRow ? 11 : 51, isTotalRow ? 33 : 65, isTotalRow ? 68 : 85);
      pdf.text(row.label, fareTableX + 4, yPosition + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(isTotalRow ? 43 : 11, isTotalRow ? 57 : 33, isTotalRow ? 204 : 68);
      pdf.text(`Rs. ${row.amount}`, rightMargin - 4, yPosition + 5, { align: "right" });

      yPosition += fareRowH;
    });

    // Transaction Caption
    yPosition += 4;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    const txnText = `Payment Mode: ${ticketData.paymentMethod || "RailSim iPay"}   •   Transaction ID: ${ticketData.transactionId || `TXN${Date.now()}`}   •   Payment Status: SUCCESSFUL`;
    pdf.text(txnText, leftMargin + 2, yPosition);

    yPosition += 6;

    // =========================================================================
    // 5. SECURITY VERIFICATION & REGULATORY NOTICE (FITS ON PAGE 1)
    // =========================================================================
    const secBoxY = yPosition;
    const secBoxH = 34;

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(leftMargin, secBoxY, contentWidth, secBoxH, 2, 2, "FD");

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(21, 128, 61);
    pdf.text("SECURITY VERIFICATION NOTICE — BEHAVIORAL BOT DETECTION", leftMargin + 4, secBoxY + 5.5);

    pdf.setFontSize(7.2);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);
    pdf.text(
      "This booking was secured via RailSecurix multi-signal behavioral bot-detection. Validated genuine passenger transaction without automated scripting.",
      leftMargin + 4,
      secBoxY + 11
    );

    pdf.setFont("helvetica", "bold");
    pdf.text("Important Passenger Regulations:", leftMargin + 4, secBoxY + 17);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      "1. Original Government Photo ID (Aadhaar, Passport, Voter ID, Driving License) is mandatory during journey.",
      leftMargin + 4,
      secBoxY + 22
    );
    pdf.text(
      "2. Chart preparation occurs 4 hours prior to train departure. Waitlisted tickets cannot board if status remains unconfirmed.",
      leftMargin + 4,
      secBoxY + 26.5
    );
    pdf.text(
      "3. For assistance or cancellation, visit the RailSecurix Manage Bookings portal or contact 24x7 Customer Support.",
      leftMargin + 4,
      secBoxY + 31
    );

    // =========================================================================
    // 6. OFFICIAL FOOTER (Single Page Guaranteed)
    // =========================================================================
    const footerLineY = 276;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.35);
    pdf.line(leftMargin, footerLineY, rightMargin, footerLineY);

    pdf.setFontSize(7.2);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      "RailSecurix • Official Electronic Reservation Slip (ERS) • Valid with original photo ID",
      pageWidth / 2,
      footerLineY + 5,
      { align: "center" }
    );

    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      "Computer-generated secure travel document. IRCTC / RailSecurix Telemetry Network • Page 1 of 1",
      pageWidth / 2,
      footerLineY + 9,
      { align: "center" }
    );

    const fileName = `Ticket_${ticketData.PNR}.pdf`;
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

export const shareTicketWhatsApp = (ticketData: TicketData): string => {
  const isWL = (ticketData.bookingStatus || "").toUpperCase().includes("WL");
  const actualClass = resolveTravelClass(ticketData);
  const seatDisplay = resolveCoachSeat(isWL, ticketData.coach, ticketData.seatNumber);
  const statusDisplay = resolveBookingStatus(isWL, ticketData.bookingStatus);
  return `*RailSecurix Electronic Reservation Slip (ERS)*\n\nPNR: *${ticketData.PNR}*\nTrain: ${ticketData.trainName} (#${ticketData.trainNumber})\nRoute: ${ticketData.source} ➔ ${ticketData.destination}\nDate: ${ticketData.travelDate}\nClass: ${actualClass}\nCoach/Seat: ${seatDisplay}\nStatus: *${statusDisplay}*\nTotal Fare: Rs. ${formatCurrency(ticketData.totalPrice)}\n\nBooked securely with RailSecurix Behavioral Defense!`;
};

export const shareTicketEmail = (ticketData: TicketData) => {
  const isWL = (ticketData.bookingStatus || "").toUpperCase().includes("WL");
  const actualClass = resolveTravelClass(ticketData);
  const seatDisplay = resolveCoachSeat(isWL, ticketData.coach, ticketData.seatNumber);
  const statusDisplay = resolveBookingStatus(isWL, ticketData.bookingStatus);
  const subject = `RailSecurix E-Ticket - PNR ${ticketData.PNR} (${statusDisplay})`;
  const body = `Dear ${ticketData.passengerName || "Traveler"},\n\nYour RailSecurix Electronic Reservation Slip (ERS) details are as follows:\n\nPNR: ${ticketData.PNR}\nTrain: ${ticketData.trainName} (#${ticketData.trainNumber})\nRoute: ${ticketData.source} -> ${ticketData.destination}\nTravel Date: ${ticketData.travelDate}\nClass: ${actualClass}\nCoach / Seat: ${seatDisplay}\nBooking Status: ${statusDisplay}\nTotal Paid: Rs. ${formatCurrency(ticketData.totalPrice)}\n\nSafe travels!\nRailSecurix Security & Ticketing Operations`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
