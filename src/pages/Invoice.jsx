import { useEffect, useState } from "react";
import emailjs from 'emailjs-com';

const sendInvoiceEmail = async (formData, totalCost) => {
    const templateParams = {
        name: formData?.name || name,
        email: formData?.email || email, // Must match EmailJS template
        dates: `${formData?.startDate || "N/A"} to ${formData?.endDate || "N/A"}`,
        hotel: selectedHotel?.name || "Not selected",
        hotelCost: hotelCost || 0,
        flight: flightName,
        flightCost: flightCost || 0,
        itineraryCost:formData?.budget || 0,
        total: totalCost || 0,
    };

    try {
        await emailjs.send(

        );
        alert('Invoice sent successfully!');
    } catch (error) {
        console.error('Email sending failed:', error);
        alert('Failed to send invoice.');
    }
};

const Invoice = () => {
    const [data, setData] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [showInvoice, setShowInvoice] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("confirmedBooking");
        if (saved) {
            const parsed = JSON.parse(saved);
            setData(parsed);
            setName(parsed.formData?.name || "");
            setEmail(parsed.formData?.email || "");
        }
    }, []);

    const handleContinue = () => {
        const updated = {
            ...data,
            formData: {
                ...data.formData,
                name,
                email,
            },
        };
        setData(updated);
        localStorage.setItem("confirmedBooking", JSON.stringify(updated));
        setShowInvoice(true);
    };

    if (!data) return <div className="p-8 text-center">Loading invoice...</div>;

    const { itinerary, selectedHotel, formData } = data;

    const start = new Date(formData?.startDate);
    const end = new Date(formData?.endDate);
    const numDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const hotelCost = numDays * 2158;
    const flightName = "IndiGo (Round Trip)";
    const flightCost = 14096;
    const itineraryCost = parseInt(formData?.budget) || 0;
    const totalCost = hotelCost + flightCost + itineraryCost;

    const sendEmail = () => {
        const templateParams = {
            name: formData?.name,
            email: formData?.email,
            dates: `${formData?.startDate} to ${formData?.endDate}`,
            hotel: selectedHotel?.name || "Not selected",
            hotelCost,
            flight: "IndiGo (Round Trip)",
            flightCost,
            itineraryCost,
            total: totalCost,
        };

        emailjs.send(
            'service_1ilqe0i',
            'template_kogw569',
            templateParams,
            '0tZ5ObRYp7JFeH5Oj'
        )
            .then(() => {
                alert("📧 Invoice sent to your email!");
            })
            .catch((err) => {
                console.error("EmailJS Error:", err);
                alert("Failed to send invoice.");
            });
    };


    if (!showInvoice) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
                <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-center text-[#ff6b6b]">Enter your details</h2>
                    <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full p-3 border rounded mb-4"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Your Email"
                        className="w-full p-3 border rounded mb-4"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        className="w-full bg-[#ff6b6b] text-white py-3 rounded hover:bg-red-500"
                        onClick={handleContinue}
                        disabled={!name || !email}
                    >
                        Continue to Invoice
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen max-w-3xl mx-auto p-8 bg-white shadow-xl item-center rounded-lg mt-10 font-[Manrope]">
            <h1 className="text-4xl font-bold text-center mb-6 text-[#ff6b6b]">Trip Invoice</h1>

            <div className="mb-6">
                <p><span className="font-semibold">Name:</span> {formData?.name || name}</p>
                <p><span className="font-semibold">Email:</span> {formData?.email || email}</p>
                <p><span className="font-semibold">Trip Dates:</span> {formData?.startDate} to {formData?.endDate}</p>
                <p><span className="font-semibold">Duration:</span> {numDays} days</p>
            </div>

            <div className="border-t pt-4 mb-4">
                <p><span className="font-semibold">Hotel:</span> {selectedHotel?.name || 'N/A'}</p>
                <p><span className="font-semibold">Hotel Cost:</span> ₹{hotelCost} ({numDays} × ₹2000)</p>
            </div>

            <div className="border-t pt-4 mb-4">
                <p><span className="font-semibold">Flight:</span> {flightName}</p>
                <p><span className="font-semibold">Flight Cost:</span> ₹{flightCost}</p>
            </div>

            <div className="border-t pt-4 mb-4">
                <p><span className="font-semibold">Itinerary Cost:</span> ₹{formData?.budget || 0}</p>
            </div>

            <div className="border-t pt-4 text-xl font-bold">
                Total Budget: ₹{totalCost}
            </div>

            <button
                onClick={sendEmail}
                className="bg-green-500 text-white px-4 py-2 rounded mt-6 hover:bg-green-600"
            >
                Send Invoice to Email
            </button>
        </div>
    );
};

export default Invoice;
