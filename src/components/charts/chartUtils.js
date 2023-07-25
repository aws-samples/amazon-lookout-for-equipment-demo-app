// ------------------------------------
// Validate the range of a date picker:
// ------------------------------------
export function validateRange(range, x) {
    if (range.type === "absolute") {
        const [startDateWithoutTime] = range.startDate.split("T");
        const [endDateWithoutTime] = range.endDate.split("T");
        if (!startDateWithoutTime || !endDateWithoutTime) {
            return {
                valid: false,
                errorMessage:
                    "The selected date range is incomplete. Select a start and end date for the date range."
                }
        }
        if (
            new Date(range.startDate) - new Date(range.endDate) > 0) {
            return {
                valid: false,
                errorMessage:
                    "The selected date range is invalid. The start date must be before the end date."
            }
        }
        if (
            new Date(range.startDate) < new Date(x[0]) ||
            new Date(range.startDate) > new Date(x[x.length - 1])
        ) {
            return {
                valid: false,
                errorMessage:
                    `The selected date range is invalid. The start date must be between ${x[0]} and ${x[x.length-1]}.`
            }
        }
        if (
            new Date(range.endDate) < new Date(x[0]) ||
            new Date(range.endDate) >= new Date(x[x.length - 1])
        ) {
            return {
                valid: false,
                errorMessage:
                    `The selected date range is invalid. The end date must be greater than ${x[0]} and strictly lesser than ${x[x.length-1]}.`
            }
        }
    }
    return { valid: true }
}