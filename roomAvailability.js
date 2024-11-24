const readline = require('readline');

// Simulated room schedule data
const rooms = {
    RoomA: [{ start: "08:00", end: "10:00" }, { start: "14:00", end: "16:00" }],
    RoomB: [{ start: "09:00", end: "11:00" }],
    RoomC: [{ start: "12:00", end: "14:00" }]
};

// Check if a room is available within a specific time range
function isRoomAvailable(roomSchedule, userStart, userEnd) {
    return roomSchedule.every(schedule =>
        userEnd <= schedule.start || userStart >= schedule.end // User time range does not overlap with room schedule
    );
}

// Find available rooms within a specific time range
function findAvailableRooms(userStart, userEnd) {
    const availableRooms = [];
    for (const [room, schedule] of Object.entries(rooms)) {
        if (isRoomAvailable(schedule, userStart, userEnd)) {
            availableRooms.push(room);
        }
    }
    return availableRooms;
}

// Create user input interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main function
async function checkRoomAvailability() {
    console.log("=== Check room availability for a specific time period ===");
    rl.question("Enter the start time of the time period (HH:MM): ", (userStart) => {
        rl.question("Enter the end time of the time period (HH:MM): ", (userEnd) => {
            const availableRooms = findAvailableRooms(userStart, userEnd);
            if (availableRooms.length > 0) {
                console.log(`Rooms available from ${userStart} to ${userEnd}:`, availableRooms.join(", "));
            } else {
                console.log(`No rooms are available from ${userStart} to ${userEnd}.`);
            }
            rl.close();
        });
    });
}

// Export the function for CLI usage
module.exports = checkRoomAvailability;

// Example invocation
// checkRoomAvailability();
