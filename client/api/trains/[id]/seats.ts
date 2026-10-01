export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  const travelDate = (req.query?.date || new Date().toISOString().slice(0, 10)).toString();
  const classCode = (req.query?.class || '3A').toString();

  const totalSeats = 72;
  const seats = [];
  const bookedSeats: string[] = [];
  const lockedSeats: string[] = [];

  for (let i = 1; i <= totalSeats; i++) {
    const isBooked = (i % 7 === 0 || i % 11 === 0);
    const isLocked = !isBooked && (i % 17 === 0);
    const seatNum = `${classCode}-${i.toString().padStart(2, '0')}`;

    if (isBooked) bookedSeats.push(seatNum);
    if (isLocked) lockedSeats.push(seatNum);

    seats.push({
      seatNumber: seatNum,
      berthType: i % 8 === 7 ? 'SL' : i % 8 === 0 ? 'SU' : ['LB', 'MB', 'UB', 'LB', 'MB', 'UB'][i % 6],
      isBooked,
      isLocked,
      isUserLocked: false
    });
  }

  return res.status(200).json({
    trainId: id,
    travelDate,
    classCode,
    seats,
    bookedSeats,
    lockedSeats,
    totalSeats
  });
}
