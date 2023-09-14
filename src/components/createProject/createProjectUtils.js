import { checkProjectNameAvailability } from '../../utils/utils.js'

// ----------------------------------------------
// Dynamically check if the project name is valid
// ----------------------------------------------
export async function checkProjectNameValidity(desiredProjectName, setProjectNameError, gateway, uid) {
    let error = true
    let errorMessage = ""

    // Error checking:
    if (desiredProjectName.length <= 2) {
        errorMessage = 'Project name must be at least 3 characters long'
    }
    else if (! /^([a-zA-Z0-9_\-]{1,170})$/.test(desiredProjectName)) {
        errorMessage = 'Project name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)'
    }
    else if (! await checkProjectNameAvailability(desiredProjectName, gateway, uid)) {
        errorMessage = 'Project name not available'
    }
    else {
        error = false
    }

    setProjectNameError(errorMessage)
    return error
}

// ---------------------------------------------------
// Dynamically check if the asset description is valid
// ---------------------------------------------------
export function checkAssetDescriptionValidity(desiredAssetDescription, setAssetError) {
    let error = true
    let errorMessage = ""

    // Error checking:
    if (desiredAssetDescription.length <= 2) {
        errorMessage = 'Asset description must be at least 3 characters long'
    }
    else if (! /^([a-zA-Z0-9_\ \-/=+@:.]{1,170})$/.test(desiredAssetDescription)) {
        errorMessage = `Asset description can have up to 128 characters. Valid characters are a-z, A-Z, 0-9, and the following ones: _.:/=+-@.`
    }
    else {
        error = false
    }

    setAssetError(errorMessage)
    return error
}