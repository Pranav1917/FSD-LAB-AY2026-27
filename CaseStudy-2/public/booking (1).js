
let movies = [];
let shows = [];
let selectedSeats = [];
let chosenShow = null;
let price = 0;

const $ = (id) => document.getElementById(id);

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

function showMessage(message, isError = true) {
    const element = $("bookingMessage");
    element.textContent = message;
    element.style.color = isError ? "#c0392b" : "#16804a";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

async function loadMovies() {
    const data = await apiRequest("/api/movies?status=now-showing");
    movies = data.movies || [];

    const movieSelect = $("movie");
    movieSelect.innerHTML = '<option value="">Select a movie</option>';

    movies.forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie._id;
        option.textContent = `${movie.title} - ₹${movie.price}`;
        movieSelect.appendChild(option);
    });

    // Support links such as booking.html?movieId=...
    const params = new URLSearchParams(window.location.search);
    const requestedMovie = params.get("movieId");

    if (requestedMovie && movies.some(m => m._id === requestedMovie)) {
        movieSelect.value = requestedMovie;
    } else {
        const requestedTitle = params.get("movie");
        const match = movies.find(m =>
            m.title.toLowerCase() === (requestedTitle || "").toLowerCase()
        );

        if (match) movieSelect.value = match._id;
    }
}

function clearShowSelection() {
    chosenShow = null;
    selectedSeats = [];
    price = 0;
    $("show").textContent = "No show selected";
    $("seats").replaceChildren();
    $("times").replaceChildren();
    updateTotal();
}

async function loadShows() {
    clearShowSelection();
    showMessage("");

    const movieId = $("movie").value;
    const date = $("date").value;

    if (!movieId || !date) {
        $("times").textContent = "Select a movie and date first.";
        $("seats").textContent = "Available seats will appear after you select a show.";
        return;
    }

    try {
        const url = `/api/movies/shows?movieId=${encodeURIComponent(movieId)}&date=${encodeURIComponent(date)}`;
        const data = await apiRequest(url);
        shows = data.shows || [];

        if (shows.length === 0) {
            $("times").textContent =
                "No shows are available for this date. Try another date.";
            $("seats").textContent = "";
            return;
        }

        shows.forEach((show) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = show.time;

            button.addEventListener("click", () => {
                chooseShow(show._id).catch(error => showMessage(error.message));
            });

            $("times").appendChild(button);
        });
    } catch (error) {
        showMessage(error.message);
        $("times").textContent = "Could not load showtimes.";
    }
}

async function chooseShow(showId) {
    chosenShow = shows.find(show => show._id === showId);

    if (!chosenShow) {
        showMessage("Please select a valid showtime.");
        return;
    }

    selectedSeats = [];
    price = Number(chosenShow.movie?.price || 0);

    $("times").querySelectorAll("button").forEach(button => {
        button.classList.toggle(
            "active",
            button.textContent === chosenShow.time
        );
    });

    $("show").textContent =
        `Selected: ${chosenShow.time} · ${chosenShow.date}`;

    $("seats").textContent = "Loading seat availability...";
    updateTotal();

    const data = await apiRequest(
        `/api/movies/shows/${encodeURIComponent(showId)}/seats`
    );

    const bookedSeats = new Set(data.bookedSeats || []);
    $("seats").replaceChildren();

    for (const row of ["A", "B", "C", "D", "E"]) {
        for (let number = 1; number <= 8; number++) {
            const seatName = `${row}${number}`;
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = seatName;
            button.className = "seat";

            if (bookedSeats.has(seatName)) {
                button.classList.add("booked");
                button.disabled = true;
                button.title = "Already booked";
            } else {
                button.setAttribute("aria-pressed", "false");

                button.addEventListener("click", () => {
                    toggleSeat(seatName, button);
                });
            }

            $("seats").appendChild(button);
        }
    }
}

function toggleSeat(seatName, button) {
    if (selectedSeats.includes(seatName)) {
        selectedSeats = selectedSeats.filter(seat => seat !== seatName);
        button.classList.remove("selected");
        button.setAttribute("aria-pressed", "false");
    } else {
        selectedSeats.push(seatName);
        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
    }

    updateTotal();
}

function updateTotal() {
    $("selected").textContent =
        selectedSeats.length ? selectedSeats.join(", ") : "None";

    $("total").textContent =
        `₹${selectedSeats.length * price}`;

    $("totalHint").textContent = selectedSeats.length
        ? `${selectedSeats.length} seat(s) × ₹${price}`
        : "Choose a movie, date and showtime.";
}

async function book() {
    showMessage("");

    if (!chosenShow) {
        showMessage("Please select a movie, date and showtime.");
        return;
    }

    if (selectedSeats.length === 0) {
        showMessage("Please select at least one seat.");
        return;
    }

    if (!$("name").value.trim()) {
        showMessage("Please enter your name.");
        $("name").focus();
        return;
    }

    const email = $("email").value.trim();

    if (!email || !$("email").checkValidity()) {
        showMessage("Please enter a valid email address.");
        $("email").focus();
        return;
    }

    const phone = $("phone").value.trim();

    if (!/^\d{10}$/.test(phone)) {
        showMessage("Enter a valid 10-digit mobile number.");
        $("phone").focus();
        return;
    }

    try {
        const meResponse = await fetch("/api/auth/me");

        if (meResponse.status === 401 || meResponse.status === 403) {
            showMessage("Please log in before booking.");
            return;
        }

        if (!meResponse.ok) {
            throw new Error("Unable to verify login. Please try again.");
        }

        const bookingData = await apiRequest("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                movieId: $("movie").value,
                date: $("date").value,
                time: chosenShow.time,
                seats: selectedSeats
            })
        });

        const booking = bookingData.booking;

        const orderData = await apiRequest("/api/payments/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: booking._id })
        });

        if (!window.Razorpay) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = resolve;
                script.onerror = () =>
                    reject(new Error("Unable to load the payment window."));
                document.head.appendChild(script);
            });
        }

        const checkout = new Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            name: "CineWorld",
            description: `${chosenShow.movie.title} tickets`,
            order_id: orderData.orderId,
            prefill: {
                name: $("name").value.trim(),
                email,
                contact: phone
            },
            handler: async function (payment) {
                try {
                    const result = await apiRequest("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...payment,
                            bookingId: booking._id
                        })
                    });

                    showMessage(
                        result.message || "Payment verification completed.",
                        true
                    );

                    if (result) {
                        window.location.href = "account.html";
                    }
                } catch (error) {
                    showMessage(
                        "Payment verification failed: " + error.message
                    );
                }
            },
            modal: {
                ondismiss: function () {
                    showMessage(
                        "Payment was not completed. Check My Bookings before trying again."
                    );
                }
            }
        });

        checkout.open();
    } catch (error) {
        showMessage(error.message);
    }
}

$("movie").addEventListener("change", () => {
    loadShows();
});

$("date").addEventListener("change", () => {
    loadShows();
});

$("confirmBooking").addEventListener("click", book);

const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

$("date").min = localToday;
$("date").value = localToday;

(async function initializeBookingPage() {
    try {
        await loadMovies();
        await loadShows();
    } catch (error) {
        showMessage("Unable to initialize booking page: " + error.message);
    }
})();
