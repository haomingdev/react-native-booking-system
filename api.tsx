import { BookingDates, Bookings } from "./screens/Types";

// api.js
const API_AUTH_URL = 'https://restful-booker.herokuapp.com';
const API_BOOKINGID_URL = 'https://restful-booker.herokuapp.com/booking';

//for auth api 
// arrow function: export const getAuthToken = async () => {
export async function getAuthToken() {
    try {
        const response = await fetch(`${API_AUTH_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'password123',
            }),
        });
        const json = await response.json();
        return json.token; // Returns the token
    } catch (error) {
        console.error('Error fetching auth token:', error);
    }
}

//get booking id, filter by user's name
export async function getBookingIds(firstName: string, lastName:string) {
    try {
        const response = await fetch(`${API_BOOKINGID_URL}?firstname=${encodeURIComponent(firstName)}&lastname=${encodeURIComponent(lastName)}`, {
            method: 'GET',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching Booking ID for ${firstName}:`, error);
    }
}

//get all booking id
export async function getBookingIdsAll() {
    try {
        const response = await fetch(`${API_BOOKINGID_URL}`, {
            method: 'GET',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Booking ID:', error);
    }
}

//create new booking
export async function createBooking(newBooking: Bookings) {
    try {
        const response = await fetch(`${API_BOOKINGID_URL}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            },
            body: JSON.stringify(newBooking),
        });
        if (!response.ok) {
            throw new Error('Something went wrong with the booking');
        }
        const responseData = await response.json();
        // Handle the response data as needed
        console.log("From createBooking api: ", responseData);
        return responseData;
    } catch (error) {
        console.error('Error creating new Booking:', error);
    }
}

// get booking details according to bookingID parameter accepted 
export async function getBookingDetail(id: string) {
    try {       
        const response = await fetch(`${API_BOOKINGID_URL}/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Something went wrong with the booking');
        }
        const responseData = await response.json();
        console.log("From getBookingDetail api: ", responseData);
        return responseData;
    } catch (error) {
        throw error;
        console.error(`Error getting booking detail for bookingID ${id}:`, error);
    }
}