
const router = require("express").Router();
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Resale = require("../models/Resale");
const Seat = require("../models/SeatReservation");
const { requireAuth } = require("../middleware/auth");

// View all active resale listings.
router.get("/", async (req, res, next) => {
  try {
    const listings = await Resale.find({ status: "LISTED" })
      .populate("seller", "name")
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    next(error);
  }
});

// View the current user's resale listings.
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const listings = await Resale.find({
      seller: req.user.id
    }).sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    next(error);
  }
});

// List one seat from a confirmed booking for resale.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { bookingId, seat, askingPrice } = req.body;

    if (!bookingId || !seat || askingPrice === undefined) {
      return res.status(400).json({
        message: "Booking, seat and asking price are required."
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only confirmed tickets can be listed."
      });
    }

    const seatNumber = String(seat).toUpperCase();

    if (!/^[A-E][1-8]$/.test(seatNumber)) {
      return res.status(400).json({
        message: "Invalid seat number."
      });
    }

    if (!booking.seats.includes(seatNumber)) {
      return res.status(400).json({
        message: "This seat is not in your booking."
      });
    }

    const price = Number(askingPrice);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        message: "Enter a valid resale price."
      });
    }

    // A seat must still be booked against this booking.
    const reservation = await Seat.findOne({
      show: booking.show,
      seat: seatNumber,
      booking: booking._id,
      status: "BOOKED"
    });

    if (!reservation) {
      return res.status(409).json({
        message: "This seat is no longer available for resale."
      });
    }

    const existingListing = await Resale.findOne({
      booking: booking._id,
      seat: seatNumber,
      status: "LISTED"
    });

    if (existingListing) {
      return res.status(409).json({
        message: "This seat is already listed for resale."
      });
    }

    const listing = await Resale.create({
      booking: booking._id,
      seller: req.user.id,
      seat: seatNumber,
      movieTitle: booking.movieTitle,
      showDate: booking.showDate,
      showTime: booking.showTime,
      askingPrice: price
    });

    res.status(201).json({
      message: "Ticket listed successfully.",
      listing
    });
  } catch (error) {
    next(error);
  }
});

// Buy a listed ticket.
// IMPORTANT: This demo records a transfer but does not collect resale payment.
router.post("/:id/buy", requireAuth, async (req, res, next) => {
  let listing;
  let originalBooking;
  let transferredBooking;
  let seatPulled = false;
  let reservationMoved = false;

  try {
    // Atomically claim the listing so two buyers cannot both buy it.
    listing = await Resale.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "LISTED",
        seller: { $ne: req.user.id }
      },
      {
        $set: {
          status: "SOLD",
          buyer: req.user.id
        }
      },
      { new: true }
    );

    if (!listing) {
      return res.status(409).json({
        message: "Listing unavailable or you cannot buy your own ticket."
      });
    }

    originalBooking = await Booking.findOne({
      _id: listing.booking,
      user: listing.seller,
      status: "CONFIRMED",
      seats: listing.seat
    });

    if (!originalBooking) {
      await Resale.updateOne(
        { _id: listing._id, status: "SOLD" },
        { $set: { status: "LISTED", buyer: null } }
      );

      return res.status(409).json({
        message: "The original ticket is no longer eligible for transfer."
      });
    }

    // Verify the unique reservation still belongs to the seller's booking.
    const reservation = await Seat.findOne({
      show: originalBooking.show,
      seat: listing.seat,
      booking: originalBooking._id,
      status: "BOOKED"
    });

    if (!reservation) {
      await Resale.updateOne(
        { _id: listing._id, status: "SOLD" },
        { $set: { status: "LISTED", buyer: null } }
      );

      return res.status(409).json({
        message: "Seat reservation could not be verified."
      });
    }

    // Remove only this seat; other seats in the original booking remain intact.
    const updatedOriginal = await Booking.findOneAndUpdate(
      {
        _id: originalBooking._id,
        user: listing.seller,
        status: "CONFIRMED",
        seats: listing.seat
      },
      {
        $pull: { seats: listing.seat }
      },
      { new: true }
    );

    if (!updatedOriginal) {
      await Resale.updateOne(
        { _id: listing._id, status: "SOLD" },
        { $set: { status: "LISTED", buyer: null } }
      );

      return res.status(409).json({
        message: "Ticket changed before transfer. Please try again."
      });
    }

    seatPulled = true;

    if (updatedOriginal.seats.length === 0) {
      updatedOriginal.status = "CANCELLED";
      await updatedOriginal.save();
    }

    // Record the transferred ticket. No resale payment is collected here.
    transferredBooking = await Booking.create({
      user: req.user.id,
      show: originalBooking.show,
      movieTitle: listing.movieTitle,
      showDate: originalBooking.showDate,
      showTime: originalBooking.showTime,
      seats: [listing.seat],
      total: listing.askingPrice,
      status: "CONFIRMED",
      ticketCode:
        "CW-R-" +
        crypto.randomBytes(4).toString("hex").toUpperCase()
    });

    // Move the existing unique seat reservation to the new booking.
    const movedSeat = await Seat.findOneAndUpdate(
      {
        show: originalBooking.show,
        seat: listing.seat,
        booking: originalBooking._id,
        status: "BOOKED"
      },
      {
        $set: { booking: transferredBooking._id }
      },
      { new: true }
    );

    if (!movedSeat) {
      throw new Error("Seat reservation transfer failed.");
    }

    reservationMoved = true;

    res.json({
      message:
        "Demo ticket transfer recorded. No resale payment was collected.",
      paymentCollected: false,
      listing,
      booking: transferredBooking
    });
  } catch (error) {
    // Best-effort rollback if a step fails partway through.
    try {
      if (reservationMoved && originalBooking && transferredBooking) {
        await Seat.updateOne(
          {
            show: originalBooking.show,
            seat: listing.seat,
            booking: transferredBooking._id
          },
          {
            $set: { booking: originalBooking._id }
          }
        );
      }

      if (transferredBooking) {
        await Booking.deleteOne({ _id: transferredBooking._id });
      }

      if (seatPulled && originalBooking) {
        await Booking.updateOne(
          { _id: originalBooking._id },
          {
            $addToSet: { seats: listing.seat },
            $set: { status: "CONFIRMED" }
          }
        );
      }

      if (listing) {
        await Resale.updateOne(
          { _id: listing._id, status: "SOLD" },
          { $set: { status: "LISTED", buyer: null } }
        );
      }
    } catch (rollbackError) {
      console.error("Resale rollback failed:", rollbackError);
    }

    next(error);
  }
});

// Withdraw an active listing.
router.post("/:id/withdraw", requireAuth, async (req, res, next) => {
  try {
    const listing = await Resale.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user.id,
        status: "LISTED"
      },
      {
        $set: { status: "WITHDRAWN" }
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({
        message: "Active listing not found."
      });
    }

    res.json({
      message: "Listing withdrawn successfully.",
      listing
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
