import jsPDF from "jspdf";

interface TicketData {
  PNR: string;
  trainName: string;
  trainNumber: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  passengerName: string;
  coach: string;
  seatNumber: string;
  fare: number;
  totalPrice: number;
  bookingStatus: string;
}

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

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 16;

    pdf.setFont("helvetica");

    // Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 46, 90); // Deep Railway Navy
    pdf.text("RAILSECURIX", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text("Electronic Reservation Slip (ERS) • Secure Railway Portal", pageWidth / 2, yPosition, { align: "center" });

    // Divider
    yPosition += 6;
    pdf.setDrawColor(15, 46, 90);
    pdf.setLineWidth(0.5);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);

    // PNR Banner Box
    yPosition += 10;
    pdf.setFillColor(240, 246, 255);
    pdf.rect(15, yPosition - 6, pageWidth - 30, 14, "F");
    pdf.setDrawColor(0, 102, 204);
    pdf.rect(15, yPosition - 6, pageWidth - 30, 14);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 100);
    pdf.text("PNR NUMBER:", 20, yPosition + 3);

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 102, 204);
    pdf.text(ticketData.PNR, pageWidth / 2, yPosition + 4, { align: "center" });

    pdf.setFontSize(9);
    pdf.setTextColor(5, 150, 105);
    pdf.text("STATUS: " + (ticketData.bookingStatus || "CONFIRMED"), pageWidth - 45, yPosition + 3);

    // Journey Details
    yPosition += 18;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 46, 90);
    pdf.text("JOURNEY DETAILS", 15, yPosition);

    yPosition += 6;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(50, 50, 50);

    const journeyDetails = [
      { label: "Train Name:", value: ticketData.trainName || "Express" },
      { label: "Train Number:", value: ticketData.trainNumber || "N/A" },
      { label: "Origin Station:", value: ticketData.source || "N/A" },
      { label: "Destination Station:", value: ticketData.destination || "N/A" },
      { label: "Travel Date:", value: ticketData.travelDate || "N/A" },
      { label: "Departure:", value: ticketData.departureTime || "N/A" },
      { label: "Arrival:", value: ticketData.arrivalTime || "N/A" },
    ];

    journeyDetails.forEach((detail) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(detail.label, 20, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(detail.value), 65, yPosition);
      yPosition += 6;
    });

    // Passenger & Berth Details
    yPosition += 6;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 46, 90);
    pdf.text("PASSENGER & BERTH ALLOCATION", 15, yPosition);

    yPosition += 6;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(15, yPosition - 4, pageWidth - 30, 8, "F");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(70, 70, 70);
    pdf.text("Passenger Name", 20, yPosition + 1);
    pdf.text("Class", 85, yPosition + 1);
    pdf.text("Coach / Seat", 125, yPosition + 1);
    pdf.text("Booking Status", 165, yPosition + 1);

    yPosition += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(ticketData.passengerName || "Traveler", 20, yPosition);
    pdf.text(ticketData.coach || "3A", 85, yPosition);
    pdf.text(String(ticketData.seatNumber || "B1-12 (LOWER)"), 125, yPosition);
    pdf.setTextColor(5, 150, 105);
    pdf.text("CNF / CONFIRMED", 165, yPosition);

    // Fare Summary
    yPosition += 16;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(15, yPosition, pageWidth - 15, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 46, 90);
    pdf.text("PAYMENT & FARE BREAKDOWN", 15, yPosition);

    yPosition += 6;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(50, 50, 50);
    pdf.text("Authoritative Ticket Fare:", 20, yPosition);
    pdf.text(`Rs. ${ticketData.fare || ticketData.totalPrice}`, pageWidth - 45, yPosition);

    yPosition += 6;
    pdf.text("IRCTC Convenience / Reservation Charge:", 20, yPosition);
    pdf.text("Rs. 40.00", pageWidth - 45, yPosition);

    yPosition += 6;
    pdf.setFont("helvetica", "bold");
    pdf.text("Total Amount Paid (Simulated):", 20, yPosition);
    pdf.text(`Rs. ${ticketData.totalPrice || ticketData.fare}`, pageWidth - 45, yPosition);

    // Security Notice Box
    yPosition += 14;
    pdf.setFillColor(240, 253, 244);
    pdf.rect(15, yPosition - 4, pageWidth - 30, 18, "F");
    pdf.setDrawColor(34, 197, 94);
    pdf.rect(15, yPosition - 4, pageWidth - 30, 18);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(21, 128, 61);
    pdf.text("SECURITY VERIFICATION NOTICE", 20, yPosition + 1);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(50, 50, 50);
    pdf.text("This booking was secured via RailSecurix multi-signal behavioral bot-detection.", 20, yPosition + 6);
    pdf.text("Validated transaction without automated scripting. Authentic passenger ID required during journey.", 20, yPosition + 11);

    // Footer
    yPosition = pageHeight - 16;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(150, 150, 150);
    pdf.text("RailSecurix • Secure Booking. Smarter Protection. • Computer-generated electronic ticket.", pageWidth / 2, yPosition, {
      align: "center",
    });

    const fileName = `Ticket_${ticketData.PNR}.pdf`;
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};

export const shareTicketWhatsApp = (ticketData: TicketData): string => {
  return `*RailSecurix E-Ticket*\n\nPNR: *${ticketData.PNR}*\nTrain: ${ticketData.trainName} (${ticketData.trainNumber})\nRoute: ${ticketData.source} -> ${ticketData.destination}\nDate: ${ticketData.travelDate}\nSeat: ${ticketData.seatNumber} (${ticketData.coach})\nFare: Rs. ${ticketData.totalPrice}\n\nBook securely on RailSecurix!`;
};

export const shareTicketEmail = (ticketData: TicketData) => {
  const subject = `RailSecurix E-Ticket - PNR ${ticketData.PNR}`;
  const body = `Dear ${ticketData.passengerName},\n\nYour RailSecurix reservation is confirmed.\n\nPNR: ${ticketData.PNR}\nTrain: ${ticketData.trainName} (${ticketData.trainNumber})\nRoute: ${ticketData.source} -> ${ticketData.destination}\nDate: ${ticketData.travelDate}\nSeat: ${ticketData.seatNumber} (${ticketData.coach})\nTotal Fare: Rs. ${ticketData.totalPrice}\n\nSafe travels!\nRailSecurix Team`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
